const bcrypt = require('bcryptjs');
const { Utilisateur, Club } = require('../models');
const ApiError = require('../utils/apiError');
const { isStrongPassword, getPasswordPolicyMessage } = require('../utils/passwordValidator');

const SALT_ROUNDS = 12;

function buildFullName(user) {
  return [user.prenom, user.nom].filter(Boolean).join(' ').trim();
}

function parseFullName(fullName) {
  const normalized = String(fullName || '').trim();
  if (!normalized) {
    return { prenom: undefined, nom: undefined };
  }

  const parts = normalized.split(/\s+/);
  const prenom = parts.shift();
  const nom = parts.join(' ') || prenom;

  return { prenom, nom };
}

function ensureOptionalString(value, fieldName) {
  if (typeof value === 'undefined') {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new ApiError(400, `${fieldName} doit etre une chaine`);
  }

  return value.trim();
}

function ensureOptionalDate(value, fieldName) {
  if (typeof value === 'undefined' || value === null || value === '') {
    return undefined;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new ApiError(400, `${fieldName} doit etre une date valide`);
  }

  return parsedDate;
}

function sanitizeUserProfile(user) {
  const profile = {
    id: user._id,
    email: user.email,
    role: user.role,
    full_name: buildFullName(user),
    avatar_url: user.avatarUrl || '',
  };

  if (user.role === 'etudiant') {
    profile.niveau = user.niveau || '';
    profile.filiere = user.filiere || '';
    profile.specialite = user.specialite || '';
  }

  if (user.role === 'enseignant') {
    profile.grade = user.grade || '';
    profile.specialite = user.specialite || '';
  }

  if (user.role === 'admin') {
    profile.specialite = user.specialite || '';
  }

  if (user.role === 'club') {
    profile.club_name = user.clubId?.nom || '';
    profile.club_description = user.clubId?.description || '';
    profile.club_specialite = user.clubId?.specialite || '';
    profile.club_creation_date = user.clubId?.dateCreation || user.clubId?.createdAt || null;
  }

  return profile;
}

async function listUsers(req, res) {
  const users = await Utilisateur.find().select('email role nom prenom createdAt').limit(100);
  res.json({
    items: users.map((user) => ({
      id: user._id,
      email: user.email,
      role: user.role,
      full_name: buildFullName(user),
      created_at: user.createdAt,
    })),
  });
}

async function getMyProfile(req, res, next) {
  try {
    const user = await Utilisateur.findById(req.user._id).populate('clubId', 'nom description specialite dateCreation createdAt');
    if (!user) {
      throw new ApiError(404, 'Utilisateur introuvable');
    }

    return res.status(200).json(sanitizeUserProfile(user));
  } catch (error) {
    return next(error);
  }
}

async function updateMyProfile(req, res, next) {
  try {
    const user = await Utilisateur.findById(req.user._id);

    if (!user) {
      throw new ApiError(404, 'Utilisateur introuvable');
    }

    const fullName = ensureOptionalString(req.body.full_name, 'full_name');
    const avatarUrl = ensureOptionalString(req.body.avatar_url, 'avatar_url');
    const niveau = ensureOptionalString(req.body.niveau, 'niveau');
    const filiere = ensureOptionalString(req.body.filiere, 'filiere');
    const grade = ensureOptionalString(req.body.grade, 'grade');
    const specialite = ensureOptionalString(req.body.specialite, 'specialite');
    const clubName = ensureOptionalString(req.body.club_name, 'club_name');
    const clubDescription = ensureOptionalString(req.body.club_description, 'club_description');
    const clubSpecialite = ensureOptionalString(req.body.club_specialite, 'club_specialite');
    const clubCreationDate = ensureOptionalDate(req.body.club_creation_date, 'club_creation_date');
    const currentPassword = ensureOptionalString(req.body.current_password, 'current_password');
    const newPassword = ensureOptionalString(req.body.new_password, 'new_password');

    const setFields = {};

    if (typeof avatarUrl !== 'undefined') {
      setFields.avatarUrl = avatarUrl || undefined;
    }

    if (user.role !== 'club' && typeof fullName !== 'undefined') {
      if (!fullName || fullName.length > 100) {
        throw new ApiError(400, 'Le nom complet doit contenir entre 1 et 100 caracteres');
      }
      const parsed = parseFullName(fullName);
      setFields.prenom = parsed.prenom;
      setFields.nom = parsed.nom;
    }

    if (user.role === 'etudiant') {
      if (typeof niveau !== 'undefined') setFields.niveau = niveau || undefined;
      if (typeof filiere !== 'undefined') setFields.filiere = filiere || undefined;
      if (typeof specialite !== 'undefined') setFields.specialite = specialite || undefined;
    }

    if (user.role === 'enseignant') {
      if (typeof grade !== 'undefined') setFields.grade = grade || undefined;
      if (typeof specialite !== 'undefined') setFields.specialite = specialite || undefined;
    }

    if (user.role === 'admin') {
      if (typeof specialite !== 'undefined') setFields.specialite = specialite || undefined;
    }

    if (typeof currentPassword !== 'undefined' || typeof newPassword !== 'undefined') {
      if (!currentPassword || !newPassword) {
        throw new ApiError(400, 'current_password et new_password sont obligatoires pour changer le mot de passe');
      }

      if (!isStrongPassword(newPassword)) {
        throw new ApiError(400, getPasswordPolicyMessage());
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.motDePasse);
      if (!isCurrentPasswordValid) {
        throw new ApiError(400, 'Mot de passe actuel incorrect');
      }

      setFields.motDePasse = await bcrypt.hash(newPassword, SALT_ROUNDS);
    }

    if (Object.keys(setFields).length > 0) {
      await Utilisateur.findByIdAndUpdate(user._id, { $set: setFields }, { runValidators: true });
    }

    if (user.role === 'club' && user.clubId) {
      const clubSet = {};
      if (typeof clubName !== 'undefined') clubSet.nom = clubName || undefined;
      if (typeof clubDescription !== 'undefined') clubSet.description = clubDescription || undefined;
      if (typeof clubSpecialite !== 'undefined') clubSet.specialite = clubSpecialite || undefined;
      if (typeof clubCreationDate !== 'undefined') clubSet.dateCreation = clubCreationDate;

      if (Object.keys(clubSet).length > 0) {
        await Club.findByIdAndUpdate(user.clubId, { $set: clubSet }, { runValidators: true });
      }
    }

    const updatedUser = await Utilisateur.findById(user._id).populate('clubId', 'nom description specialite dateCreation createdAt');

    return res.status(200).json(sanitizeUserProfile(updatedUser));
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listUsers,
  getMyProfile,
  updateMyProfile,
};
