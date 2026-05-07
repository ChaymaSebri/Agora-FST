const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const { Utilisateur, PendingRegistration, PasswordResetToken, Club, Competence } = require('../models');
const ApiError = require('../utils/apiError');
const { isStrongPassword, getPasswordPolicyMessage } = require('../utils/passwordValidator');
const { EmailDeliveryRejectedError, sendVerificationCodeEmail, sendPasswordResetEmail } = require('./email.service');

const SALT_ROUNDS = 12;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const ROLES = ['etudiant', 'enseignant', 'club'];
const VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 15 * 60 * 1000;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeCompetenceIds(competenceIds) {
  if (!Array.isArray(competenceIds)) {
    return [];
  }

  return Array.from(
    new Set(
      competenceIds
        .map((competenceId) => String(competenceId || '').trim())
        .filter(Boolean),
    ),
  );
}

async function assertCompetenceIdsExist(competenceIds) {
  const normalizedCompetenceIds = normalizeCompetenceIds(competenceIds);

  if (normalizedCompetenceIds.length === 0) {
    return [];
  }

  const invalidCompetenceId = normalizedCompetenceIds.find(
    (competenceId) => !mongoose.Types.ObjectId.isValid(competenceId),
  );

  if (invalidCompetenceId) {
    throw new ApiError(400, 'competenceIds contient un ObjectId invalide');
  }

  const existingCount = await Competence.countDocuments({
    _id: { $in: normalizedCompetenceIds },
    isActive: true,
  });

  if (existingCount !== normalizedCompetenceIds.length) {
    throw new ApiError(400, 'Certaines competences selectionnees n existent pas');
  }

  return normalizedCompetenceIds;
}

function createVerificationCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

function createPasswordResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function createVerificationCodePair() {
  const verificationCode = createVerificationCode();
  const verificationCodeHash = await bcrypt.hash(verificationCode, SALT_ROUNDS);

  return {
    verificationCode,
    verificationCodeHash,
  };
}

async function sendVerificationCodeEmailForRecord(record, verificationCode) {
  await sendVerificationCodeEmail({
    to: record.email,
    code: verificationCode,
    displayName: [record.prenom, record.nom].filter(Boolean).join(' ').trim(),
  }).catch((error) => {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof EmailDeliveryRejectedError || error?.code === 'EMAIL_REJECTED') {
      throw new ApiError(400, 'Adresse email invalide ou inaccessible');
    }

    throw new ApiError(502, 'Impossible d envoyer le code de verification pour le moment');
  });
}

async function updateVerificationCode(record) {
  const { verificationCode, verificationCodeHash } = await createVerificationCodePair();

  record.emailVerificationCodeHash = verificationCodeHash;
  record.emailVerificationCodeExpiresAt = new Date(Date.now() + VERIFICATION_CODE_TTL_MS);
  record.emailVerificationRequestedAt = new Date();
  await record.save();

  await sendVerificationCodeEmailForRecord(record, verificationCode);

  return verificationCode;
}

async function createPasswordResetTokenRecord(email) {
  console.log('[DEBUG createPasswordResetTokenRecord] Creating token for email:', email);
  const token = createPasswordResetToken();
  const tokenHash = await bcrypt.hash(token, SALT_ROUNDS);

  const deleteResult = await PasswordResetToken.deleteMany({
    email,
    $or: [{ usedAt: null }, { usedAt: { $exists: false } }],
  });
  console.log('[DEBUG createPasswordResetTokenRecord] Deleted old records:', deleteResult.deletedCount);

  const record = await PasswordResetToken.create({
    email,
    tokenHash,
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
    requestedAt: new Date(),
  });
  console.log('[DEBUG createPasswordResetTokenRecord] Created record:', record._id, 'email:', record.email);

  // Verify the record was actually saved
  const verification = await PasswordResetToken.findById(record._id);
  console.log('[DEBUG createPasswordResetTokenRecord] Verification findById:', !!verification);

  return { token, record };
}

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new ApiError(500, 'JWT_SECRET manquant dans les variables d environnement');
  }

  return process.env.JWT_SECRET;
}

function splitFullName(fullName) {
  const chunks = String(fullName)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (chunks.length === 0) {
    return { nom: '', prenom: '' };
  }

  if (chunks.length === 1) {
    return { nom: chunks[0], prenom: chunks[0] };
  }

  return {
    prenom: chunks[0],
    nom: chunks.slice(1).join(' '),
  };
}

function normalizeRegistrationPayload(payload) {
  const normalized = { ...payload };

  normalized.email = normalizeEmail(payload.email);
  normalized.password = payload.password || payload.motDePasse || '';
  normalized.role = String(payload.role || '').trim();

  if ((!payload.nom || !payload.prenom) && payload.fullName) {
    const parsed = splitFullName(payload.fullName);
    normalized.nom = payload.nom || parsed.nom;
    normalized.prenom = payload.prenom || parsed.prenom;
  } else {
    normalized.nom = payload.nom;
    normalized.prenom = payload.prenom;
  }

  normalized.nom = String(normalized.nom || '').trim();
  normalized.prenom = String(normalized.prenom || '').trim();
  normalized.niveau = payload.niveau;
  normalized.filiere = payload.filiere;
  normalized.grade = payload.grade;
  normalized.avatarUrl = String(payload.avatarUrl || payload.avatar_url || '').trim();
  normalized.clubId = payload.clubId;
  normalized.clubName = String(payload.clubName || '').trim();
  normalized.clubDescription = String(payload.clubDescription || '').trim();
  normalized.clubSpecialite = String(payload.clubSpecialite || '').trim();
  normalized.competenceIds = Array.isArray(payload.competenceIds)
    ? payload.competenceIds
    : [];

  return normalized;
}

function validateRoleSpecificFields(userInput) {
  if (!userInput.role) {
    throw new ApiError(400, 'role est obligatoire');
  }

  if (!ROLES.includes(userInput.role)) {
    throw new ApiError(400, 'Role invalide');
  }

  if (userInput.role === 'etudiant') {
    if (!userInput.niveau || !userInput.filiere) {
      throw new ApiError(400, 'niveau et filiere sont requis pour un etudiant');
    }
  }

  if (userInput.role === 'enseignant') {
    if (!userInput.grade) {
      throw new ApiError(400, 'grade est requis pour un enseignant');
    }
  }

  if (userInput.role === 'club') {
    if (!userInput.clubName) {
      throw new ApiError(400, 'clubName est requis pour un compte club');
    }
  }
}

function sanitizeUser(userDocument) {
  return {
    id: userDocument._id,
    nom: userDocument.nom,
    prenom: userDocument.prenom,
    email: userDocument.email,
    role: userDocument.role,
    niveau: userDocument.niveau,
    filiere: userDocument.filiere,
    grade: userDocument.grade,
    avatar_url: userDocument.avatarUrl || '',
    clubId: userDocument.clubId,
    competenceIds: userDocument.competenceIds,
    createdAt: userDocument.createdAt,
    updatedAt: userDocument.updatedAt,
  };
}

function signToken(user) {
  const secret = getJwtSecret();

  return jwt.sign(
    {
      role: user.role,
      email: user.email,
    },
    secret,
    {
      subject: String(user._id),
      expiresIn: JWT_EXPIRES_IN,
    }
  );
}

function buildPendingRegistrationData(userInput, passwordHash, verificationCodeHash) {
  return {
    email: userInput.email,
    passwordHash,
    nom: userInput.role === 'club' ? undefined : userInput.nom,
    prenom: userInput.role === 'club' ? undefined : userInput.prenom,
    role: userInput.role,
    niveau: userInput.niveau,
    filiere: userInput.filiere,
    grade: userInput.grade,
    avatarUrl: userInput.avatarUrl || undefined,
    clubName: userInput.role === 'club' ? userInput.clubName || undefined : undefined,
    clubDescription: userInput.role === 'club' ? userInput.clubDescription || undefined : undefined,
    clubSpecialite: userInput.role === 'club' ? userInput.clubSpecialite || undefined : undefined,
    competenceIds: userInput.competenceIds,
    emailVerificationCodeHash: verificationCodeHash,
    emailVerificationCodeExpiresAt: new Date(Date.now() + VERIFICATION_CODE_TTL_MS),
    emailVerificationRequestedAt: new Date(),
  };
}

async function createVerifiedUserFromPendingRegistration(pendingRegistration) {
  let createdClub = null;

  if (pendingRegistration.role === 'club') {
    const existingClub = await Club.findOne({ nom: pendingRegistration.clubName });
    if (existingClub) {
      throw new ApiError(409, 'Un club avec ce nom existe deja');
    }

    createdClub = await Club.create({
      nom: pendingRegistration.clubName,
      description: pendingRegistration.clubDescription || undefined,
      specialite: pendingRegistration.clubSpecialite || undefined,
    });
  }

  let createdUser;

  try {
    createdUser = await Utilisateur.create({
      nom: pendingRegistration.role === 'club' ? undefined : pendingRegistration.nom,
      prenom: pendingRegistration.role === 'club' ? undefined : pendingRegistration.prenom,
      email: pendingRegistration.email,
      motDePasse: pendingRegistration.passwordHash,
      role: pendingRegistration.role,
      niveau: pendingRegistration.niveau,
      filiere: pendingRegistration.filiere,
      grade: pendingRegistration.grade,
      avatarUrl: pendingRegistration.avatarUrl || undefined,
      clubId: createdClub ? createdClub._id : undefined,
      competenceIds: pendingRegistration.competenceIds,
    });
  } catch (error) {
    if (createdClub) {
      await Club.findByIdAndDelete(createdClub._id);
    }

    throw error;
  }

  if (createdClub) {
    await Club.findByIdAndUpdate(createdClub._id, {
      bureauExecutifId: createdUser._id,
    });
  }

  return createdUser;
}

async function register(payload) {
  const userInput = normalizeRegistrationPayload(payload);
  userInput.competenceIds = await assertCompetenceIdsExist(userInput.competenceIds);

  if (!userInput.email || !userInput.password) {
    throw new ApiError(400, 'email et password sont obligatoires');
  }

  if (userInput.role !== 'club' && (!userInput.nom || !userInput.prenom)) {
    throw new ApiError(400, 'nom et prenom sont obligatoires pour ce role');
  }

  if (!isStrongPassword(userInput.password)) {
    throw new ApiError(400, getPasswordPolicyMessage());
  }

  validateRoleSpecificFields(userInput);

  const existingUser = await Utilisateur.findOne({ email: userInput.email });
  if (existingUser) {
    throw new ApiError(409, 'Un compte avec cet email existe deja');
  }

  if (userInput.role === 'club') {
    const existingClub = await Club.findOne({ nom: userInput.clubName });
    const pendingClub = await PendingRegistration.findOne({
      role: 'club',
      clubName: userInput.clubName,
      email: { $ne: userInput.email },
    });

    if (existingClub || pendingClub) {
      throw new ApiError(409, 'Un club avec ce nom existe deja');
    }
  }

  const passwordHash = await bcrypt.hash(userInput.password, SALT_ROUNDS);

  const { verificationCode, verificationCodeHash } = await createVerificationCodePair();
  const pendingRegistration = await PendingRegistration.findOneAndUpdate(
    { email: userInput.email },
    {
      $set: buildPendingRegistrationData(userInput, passwordHash, verificationCodeHash),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await sendVerificationCodeEmailForRecord(pendingRegistration, verificationCode);

  return {
    needsVerification: true,
    email: pendingRegistration.email,
    message: 'Un code de verification a ete envoye a votre adresse email.',
  };
}

async function login(payload) {
  const email = normalizeEmail(payload.email);
  const password = payload.password || '';

  if (!email || !password) {
    throw new ApiError(400, 'email et password sont obligatoires');
  }

  const user = await Utilisateur.findOne({ email });
  if (!user) {
    const pendingRegistration = await PendingRegistration.findOne({ email });
    if (pendingRegistration) {
      throw new ApiError(403, 'Veuillez verifier votre adresse email avant de vous connecter');
    }

    throw new ApiError(401, 'Email ou mot de passe incorrect');
  }

  const isPasswordValid = await bcrypt.compare(password, user.motDePasse);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Email ou mot de passe incorrect');
  }

  return {
    token: signToken(user),
    user: sanitizeUser(user),
  };
}

async function verifyEmail(payload) {
  const email = normalizeEmail(payload.email);
  const code = String(payload.code || '').trim();

  if (!email || !code) {
    throw new ApiError(400, 'email et code sont obligatoires');
  }

  const pendingRegistration = await PendingRegistration.findOne({ email });
  if (!pendingRegistration) {
    const user = await Utilisateur.findOne({ email });
    if (!user) {
      throw new ApiError(404, 'Compte introuvable');
    }

    return {
      token: signToken(user),
      user: sanitizeUser(user),
      alreadyVerified: true,
    };
  }

  if (!pendingRegistration.emailVerificationCodeHash || !pendingRegistration.emailVerificationCodeExpiresAt) {
    throw new ApiError(400, 'Aucun code de verification actif. Demandez un nouveau code.');
  }

  if (pendingRegistration.emailVerificationCodeExpiresAt.getTime() < Date.now()) {
    throw new ApiError(400, 'Le code de verification a expire. Demandez un nouveau code.');
  }

  const isCodeValid = await bcrypt.compare(code, pendingRegistration.emailVerificationCodeHash);
  if (!isCodeValid) {
    throw new ApiError(400, 'Code de verification invalide');
  }

  const existingUser = await Utilisateur.findOne({ email });
  if (existingUser) {
    await PendingRegistration.findOneAndDelete({ email });
    return {
      token: signToken(existingUser),
      user: sanitizeUser(existingUser),
      alreadyVerified: true,
    };
  }

  const createdUser = await createVerifiedUserFromPendingRegistration(pendingRegistration);
  await PendingRegistration.findOneAndDelete({ email });

  return {
    token: signToken(createdUser),
    user: sanitizeUser(createdUser),
  };
}

async function resendVerificationCode(payload) {
  const email = normalizeEmail(payload.email);

  if (!email) {
    throw new ApiError(400, 'email est obligatoire');
  }

  const pendingRegistration = await PendingRegistration.findOne({ email });
  if (!pendingRegistration) {
    const user = await Utilisateur.findOne({ email });
    if (!user) {
      throw new ApiError(404, 'Compte introuvable');
    }

    throw new ApiError(400, 'Adresse email deja verifiee');
  }

  await updateVerificationCode(pendingRegistration);

  return {
    message: 'Un nouveau code de verification a ete envoye.',
  };
}

async function requestPasswordReset(payload) {
  const email = normalizeEmail(payload.email);

  if (!email) {
    throw new ApiError(400, 'email est obligatoire');
  }

  const user = await Utilisateur.findOne({ email });

  if (user) {
    const { token } = await createPasswordResetTokenRecord(email);
    const frontendBaseUrl = String(process.env.FRONTEND_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
    const resetUrl = `${frontendBaseUrl}/auth?mode=reset-password&email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;

    await sendPasswordResetEmail({
      to: email,
      resetUrl,
      displayName: [user.prenom, user.nom].filter(Boolean).join(' ').trim(),
    });
  }

  return {
    message: 'Si un compte existe pour cet email, un lien de reinitialisation a ete envoye.',
  };
}

async function resetPassword(payload) {
  const email = normalizeEmail(payload.email);
  const token = String(payload.token || '').trim();
  const newPassword = String(payload.newPassword || payload.password || '').trim();

  if (!email || !token || !newPassword) {
    throw new ApiError(400, 'email, token et newPassword sont obligatoires');
  }

  if (!isStrongPassword(newPassword)) {
    throw new ApiError(400, getPasswordPolicyMessage());
  }

  console.log('[DEBUG resetPassword] email:', email);
  console.log('[DEBUG resetPassword] token length:', token.length);
  console.log('[DEBUG resetPassword] token first 20 chars:', token.substring(0, 20));

  const resetRecord = await PasswordResetToken.findOne({ email, usedAt: null }).sort({ createdAt: -1 });

  console.log('[DEBUG resetPassword] resetRecord found:', !!resetRecord);
  if (resetRecord) {
    console.log('[DEBUG resetPassword] resetRecord.email:', resetRecord.email);
    console.log('[DEBUG resetPassword] resetRecord.expiresAt:', resetRecord.expiresAt);
    console.log('[DEBUG resetPassword] now:', new Date());
    console.log('[DEBUG resetPassword] expired?:', resetRecord.expiresAt.getTime() < Date.now());
  }

  if (!resetRecord) {
    console.log('[DEBUG resetPassword] ERROR: No reset record found for email:', email);
    throw new ApiError(400, 'Lien de reinitialisation invalide ou expire');
  }

  if (resetRecord.expiresAt.getTime() < Date.now()) {
    console.log('[DEBUG resetPassword] ERROR: Token expired');
    throw new ApiError(400, 'Lien de reinitialisation invalide ou expire');
  }

  const isTokenValid = await bcrypt.compare(token, resetRecord.tokenHash);
  console.log('[DEBUG resetPassword] isTokenValid:', isTokenValid);
  if (!isTokenValid) {
    console.log('[DEBUG resetPassword] ERROR: Token hash comparison failed');
    throw new ApiError(400, 'Lien de reinitialisation invalide ou expire');
  }

  const user = await Utilisateur.findOne({ email });
  if (!user) {
    throw new ApiError(404, 'Compte introuvable');
  }

  user.motDePasse = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.save();

  resetRecord.usedAt = new Date();
  await resetRecord.save();

  await PasswordResetToken.deleteMany({
    email,
    _id: { $ne: resetRecord._id },
  });

  return {
    message: 'Mot de passe reinitialise avec succes',
  };
}

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerificationCode,
  requestPasswordReset,
  resetPassword,
};
