const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { Utilisateur, Club } = require('../models');
const ApiError = require('../utils/apiError');

const SALT_ROUNDS = 12;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const ROLES = ['etudiant', 'enseignant', 'club'];

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

  normalized.email = String(payload.email || '').trim().toLowerCase();
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
  normalized.specialite = payload.specialite;
  normalized.clubId = payload.clubId;
  normalized.clubName = String(payload.clubName || '').trim();
  normalized.clubDescription = String(payload.clubDescription || '').trim();
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
    specialite: userDocument.specialite,
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

async function register(payload) {
  const userInput = normalizeRegistrationPayload(payload);

  if (!userInput.email || !userInput.password) {
    throw new ApiError(400, 'email et password sont obligatoires');
  }

  if (userInput.role !== 'club' && (!userInput.nom || !userInput.prenom)) {
    throw new ApiError(400, 'nom et prenom sont obligatoires pour ce role');
  }

  if (String(userInput.password).length < 6) {
    throw new ApiError(400, 'Le mot de passe doit contenir au moins 6 caracteres');
  }

  validateRoleSpecificFields(userInput);

  const existingUser = await Utilisateur.findOne({ email: userInput.email });
  if (existingUser) {
    throw new ApiError(409, 'Un compte avec cet email existe deja');
  }

  if (userInput.role === 'club') {
    const existingClub = await Club.findOne({ nom: userInput.clubName });
    if (existingClub) {
      throw new ApiError(409, 'Un club avec ce nom existe deja');
    }

    userInput.nom = undefined;
    userInput.prenom = undefined;
  }

  const passwordHash = await bcrypt.hash(userInput.password, SALT_ROUNDS);

  let createdClub = null;
  if (userInput.role === 'club') {
    createdClub = await Club.create({
      nom: userInput.clubName,
      description: userInput.clubDescription || undefined,
    });
    userInput.clubId = createdClub._id;
  }

  let createdUser;

  try {
    createdUser = await Utilisateur.create({
      nom: userInput.nom,
      prenom: userInput.prenom,
      email: userInput.email,
      motDePasse: passwordHash,
      role: userInput.role,
      niveau: userInput.niveau,
      filiere: userInput.filiere,
      grade: userInput.grade,
      specialite: userInput.specialite,
      clubId: userInput.clubId,
      competenceIds: userInput.competenceIds,
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

  return {
    token: signToken(createdUser),
    user: sanitizeUser(createdUser),
  };
}

async function login(payload) {
  const email = String(payload.email || '')
    .trim()
    .toLowerCase();
  const password = payload.password || '';

  if (!email || !password) {
    throw new ApiError(400, 'email et password sont obligatoires');
  }

  const user = await Utilisateur.findOne({ email });
  if (!user) {
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

module.exports = {
  register,
  login,
};
