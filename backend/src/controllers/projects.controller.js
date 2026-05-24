const mongoose = require('mongoose');
const { Projet, Tache, Utilisateur, Club, Competence } = require('../models');

const PROJECT_STATUTS = ['en_cours', 'termine', 'annule', 'en_attente'];
const TACHE_STATUTS = ['a_faire', 'en_cours', 'terminee'];

const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  TACHE_NOT_FOUND: 'TACHE_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  ALREADY_MEMBER: 'ALREADY_MEMBER',
  MEMBER_NOT_FOUND: 'MEMBER_NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
};

// ─── Helpers réponse ────────────────────────────────────────────────────────

function sendSuccess(res, status, data) {
  return res.status(status).json({ success: true, data });
}

function sendError(res, status, code, message) {
  return res.status(status).json({ success: false, error: { code, message } });
}

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed;
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// ─── Helpers rôle ───────────────────────────────────────────────────────────

function isRequesterClub(req) {
  return req.user && req.user.role === 'club' && req.user.clubId;
}

function isRequesterAdmin(req) {
  return req.user && req.user.role === 'admin';
}

function isRequesterEnseignant(req) {
  return req.user && req.user.role === 'enseignant';
}

function isProjectOwnedByRequesterClub(projet, req) {
  if (!projet || !req.user?.clubId) {
    console.log('[isProjectOwnedByRequesterClub] Missing project or user clubId');
    return false;
  }

  // Normaliser les deux IDs en string pour la comparaison
  // Le projectClubId peut être un objet avec _id (après populate) ou directement un ObjectId/string
  const projectClubId = projet.clubId?._id 
    ? String(projet.clubId._id) 
    : String(projet.clubId);
  
  // Le userClubId peut aussi être un objet ou un ObjectId
  const userClubId = req.user.clubId?._id
    ? String(req.user.clubId._id)
    : String(req.user.clubId);

  console.log('[isProjectOwnedByRequesterClub] Comparing:', {
    projectClubId,
    userClubId,
    match: projectClubId === userClubId,
    projectClubIdType: typeof projet.clubId,
    userClubIdType: typeof req.user.clubId,
  });

  return projectClubId === userClubId;
}



// ─── Normalizers ────────────────────────────────────────────────────────────

function normalizeProjet(doc) {
  const s = typeof doc.toObject === 'function' ? doc.toObject() : doc;

  const normalizeUser = (u) => {
    if (!u) return null;
    if (typeof u === 'object' && u._id) {
      return { id: u._id.toString(), nom: u.nom, prenom: u.prenom, email: u.email };
    }
    return u.toString();
  };

  const clubSource = s.clubId;
  const clubId = clubSource?._id ? clubSource._id.toString() : (clubSource ? String(clubSource) : null);
  const clubNom = clubSource?.nom || null;

  return {
    id: s._id.toString(),
    titre: s.titre,
    description: s.description,
    objectif: s.objectif,
    dateDebut: s.dateDebut,
    deadline: s.deadline,
    statut: s.statut,
    progression: s.progression,
    enseignant: normalizeUser(s.enseignantId),
    etudiants: Array.isArray(s.etudiantIds) ? s.etudiantIds.map(normalizeUser).filter(Boolean) : [],
    clubId,
    clubNom,
    competenceIds: Array.isArray(s.competenceIds)
      ? s.competenceIds.map((c) => (c?._id ? c._id.toString() : String(c)))
      : [],
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

function normalizeTache(doc) {
  const s = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    id: s._id.toString(),
    titre: s.titre,
    description: s.description,
    deadline: s.deadline,
    statut: s.statut,
    projetId: s.projetId?.toString(),
    etudiantIds: Array.isArray(s.etudiantIds) ? s.etudiantIds.map((e) => e?.toString()) : [],
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

// ─── Validation ─────────────────────────────────────────────────────────────

function validateProjetPayload(payload, { partial = false } = {}) {
  const errors = [];

  if (!partial) {
    if (!payload.titre?.trim()) errors.push('titre est obligatoire');
    if (!payload.deadline) errors.push('deadline est obligatoire');
  }

  if (payload.titre !== undefined && !payload.titre?.trim()) {
    errors.push('titre doit être une chaîne non vide');
  }

  if (payload.deadline !== undefined && !parseDate(payload.deadline)) {
    errors.push('deadline doit être une date valide');
  }

  if (payload.dateDebut !== undefined && payload.dateDebut && !parseDate(payload.dateDebut)) {
    errors.push('dateDebut doit être une date valide');
  }

  if (payload.statut !== undefined && !PROJECT_STATUTS.includes(payload.statut)) {
    errors.push(`statut doit être parmi : ${PROJECT_STATUTS.join(', ')}`);
  }

  if (payload.progression !== undefined) {
    const p = Number(payload.progression);
    if (!Number.isFinite(p) || p < 0 || p > 100) {
      errors.push('progression doit être un nombre entre 0 et 100');
    }
  }

  if (payload.competenceIds !== undefined) {
    if (!Array.isArray(payload.competenceIds)) {
      errors.push('competenceIds doit être un tableau');
    } else {
      const invalid = payload.competenceIds.find((id) => !mongoose.Types.ObjectId.isValid(id));
      if (invalid) errors.push('competenceIds contient un ObjectId invalide');
    }
  }

  if (payload.etudiantIds !== undefined) {
    if (!Array.isArray(payload.etudiantIds)) {
      errors.push('etudiantIds doit être un tableau');
    } else {
      const invalid = payload.etudiantIds.find((id) => !mongoose.Types.ObjectId.isValid(id));
      if (invalid) errors.push('etudiantIds contient un ObjectId invalide');
    }
  }

  return errors;
}

function validateTachePayload(payload, { partial = false } = {}) {
  const errors = [];

  if (!partial) {
    if (!payload.titre?.trim()) errors.push('titre est obligatoire');
    if (!payload.deadline) errors.push('deadline est obligatoire');
  }

  if (payload.titre !== undefined && !payload.titre?.trim()) {
    errors.push('titre doit être une chaîne non vide');
  }

  if (payload.deadline !== undefined && !parseDate(payload.deadline)) {
    errors.push('deadline doit être une date valide');
  }

  if (payload.statut !== undefined && !TACHE_STATUTS.includes(payload.statut)) {
    errors.push(`statut doit être parmi : ${TACHE_STATUTS.join(', ')}`);
  }

  if (payload.etudiantIds !== undefined) {
    if (!Array.isArray(payload.etudiantIds)) {
      errors.push('etudiantIds doit être un tableau');
    } else {
      const invalid = payload.etudiantIds.find((id) => !mongoose.Types.ObjectId.isValid(id));
      if (invalid) errors.push('etudiantIds contient un ObjectId invalide');
    }
  }

  return errors;
}

// ════════════════════════════════════════════════════════════════════════════
// PROJETS
// ════════════════════════════════════════════════════════════════════════════

async function listProjects(req, res) {
  try {
    const page = toPositiveInt(req.query.page, 1);
    const limit = toPositiveInt(req.query.limit, 10);
    const sortBy = ['createdAt', 'deadline', 'titre'].includes(req.query.sortBy)
      ? req.query.sortBy : 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    if (req.query.statut && !PROJECT_STATUTS.includes(req.query.statut)) {
      return sendError(res, 400, ERROR_CODES.VALIDATION_ERROR, 'Filtre statut invalide');
    }

    const filter = {};
    if (req.query.statut) filter.statut = req.query.statut;
    if (req.query.clubId && mongoose.Types.ObjectId.isValid(req.query.clubId)) {
      filter.clubId = req.query.clubId;
    }
    if (req.query.enseignantId && mongoose.Types.ObjectId.isValid(req.query.enseignantId)) {
      filter.enseignantId = req.query.enseignantId;
    }

    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    if (search) {
      filter.$or = [
        { titre: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { objectif: { $regex: search, $options: 'i' } },
      ];
    }

    const [items, totalItems] = await Promise.all([
      Projet.find(filter)
        .populate('enseignantId', 'nom prenom email')
        .populate('etudiantIds', 'nom prenom email')
        .populate('clubId', 'nom')
        .populate('competenceIds', 'nom slug')
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit),
      Projet.countDocuments(filter),
    ]);

    return sendSuccess(res, 200, {
      items: items.map(normalizeProjet),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit) || 1,
      },
    });
  } catch (err) {
    console.error(err);
    return sendError(res, 500, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Erreur lors de la récupération des projets');
  }
}

async function getProjectById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 404, ERROR_CODES.PROJECT_NOT_FOUND, 'Projet non trouvé');
    }

    const projet = await Projet.findById(id)
      .populate('enseignantId', 'nom prenom email grade')
      .populate('etudiantIds', 'nom prenom email niveau filiere')
      .populate('clubId', 'nom description specialite')
      .populate('competenceIds', 'nom slug');

    if (!projet) {
      return sendError(res, 404, ERROR_CODES.PROJECT_NOT_FOUND, 'Projet non trouvé');
    }

    // Récupérer les tâches liées
    const taches = await Tache.find({ projetId: id })
      .populate('etudiantIds', 'nom prenom email')
      .sort({ deadline: 1 });

    const data = {
      ...normalizeProjet(projet),
      taches: taches.map(normalizeTache),
    };

    return sendSuccess(res, 200, data);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Erreur lors de la récupération du projet');
  }
}

async function createProject(req, res) {
  try {
    if (!isRequesterClub(req) && !isRequesterAdmin(req)) {
      return sendError(res, 403, ERROR_CODES.FORBIDDEN, 'Seuls les clubs peuvent créer un projet');
    }

    const payload = req.body || {};
    const errors = validateProjetPayload(payload, { partial: false });
    if (errors.length > 0) {
      return sendError(res, 400, ERROR_CODES.VALIDATION_ERROR, errors.join('; '));
    }
// Vérifier l'encadrant si fourni
const enseignantId = payload.enseignantId || null;

if (enseignantId) {
  const enseignant = await Utilisateur.findOne({
    _id: enseignantId,
    role: 'enseignant'
  });

  if (!enseignant) {
    return sendError(
      res,
      400,
      ERROR_CODES.VALIDATION_ERROR,
      "L'encadrant n'existe pas"
    );
  }
}
    // Vérifier les compétences si fournies
    const competenceIds = Array.isArray(payload.competenceIds) ? payload.competenceIds : [];
    if (competenceIds.length > 0) {
      const count = await Competence.countDocuments({ _id: { $in: competenceIds }, isActive: true });
      if (count !== competenceIds.length) {
        return sendError(res, 400, ERROR_CODES.VALIDATION_ERROR, 'Certaines compétences n\'existent pas');
      }
    }

    // Vérifier les étudiants si fournis
    const etudiantIds = Array.isArray(payload.etudiantIds) ? payload.etudiantIds : [];
    if (etudiantIds.length > 0) {
      const count = await Utilisateur.countDocuments({ _id: { $in: etudiantIds }, role: 'etudiant' });
      if (count !== etudiantIds.length) {
        return sendError(res, 400, ERROR_CODES.VALIDATION_ERROR, 'Certains étudiants n\'existent pas');
      }
    }

    const created = await Projet.create({
  titre: payload.titre.trim(),
  description: payload.description || '',
  objectif: payload.objectif || '',
  dateDebut: parseDate(payload.dateDebut) || new Date(),
  deadline: parseDate(payload.deadline),
  statut: payload.statut || 'en_attente',
  progression: 0,
  clubId: req.user.clubId || null,
  competenceIds,
  etudiantIds,
  enseignantId: enseignantId || null, // 👈 AJOUT ICI
});

    return sendSuccess(res, 201, { id: created._id.toString() });
  } catch (err) {
    console.error(err);
    return sendError(res, 500, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Erreur lors de la création du projet');
  }
}

async function updateProject(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 404, ERROR_CODES.PROJECT_NOT_FOUND, 'Projet non trouvé');
    }

    const projet = await Projet.findById(id);
    if (!projet) {
      return sendError(res, 404, ERROR_CODES.PROJECT_NOT_FOUND, 'Projet non trouvé');
    }

 

    const payload = req.body || {};
    const errors = validateProjetPayload(payload, { partial: true });
    if (errors.length > 0) {
      return sendError(res, 400, ERROR_CODES.VALIDATION_ERROR, errors.join('; '));
    }

    const updatableFields = ['titre', 'description', 'objectif', 'deadline', 'dateDebut', 'statut', 'progression', 'competenceIds', 'etudiantIds'];
    const update = {};
    updatableFields.forEach((field) => {
      if (payload[field] !== undefined) update[field] = payload[field];
    });

    if (update.titre) update.titre = update.titre.trim();
    if (update.deadline) update.deadline = parseDate(update.deadline);
    if (update.dateDebut) update.dateDebut = parseDate(update.dateDebut);
    if (update.progression !== undefined) update.progression = Math.min(100, Math.max(0, Number(update.progression)));

    if (update.competenceIds) {
      const count = await Competence.countDocuments({ _id: { $in: update.competenceIds }, isActive: true });
      if (count !== update.competenceIds.length) {
        return sendError(res, 400, ERROR_CODES.VALIDATION_ERROR, 'Certaines compétences n\'existent pas');
      }
    }

    if (update.etudiantIds) {
      const count = await Utilisateur.countDocuments({ _id: { $in: update.etudiantIds }, role: 'etudiant' });
      if (count !== update.etudiantIds.length) {
        return sendError(res, 400, ERROR_CODES.VALIDATION_ERROR, 'Certains étudiants n\'existent pas');
      }
    }

    if (Object.keys(update).length === 0) {
      return sendError(res, 400, ERROR_CODES.VALIDATION_ERROR, 'Aucun champ valide fourni pour la mise à jour');
    }

    const updated = await Projet.findByIdAndUpdate(id, update, { new: true })
      .populate('enseignantId', 'nom prenom email')
      .populate('etudiantIds', 'nom prenom email')
      .populate('clubId', 'nom');

    return sendSuccess(res, 200, { id: updated._id.toString() });
  } catch (err) {
    console.error(err);
    return sendError(res, 500, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Erreur lors de la mise à jour du projet');
  }
}

async function deleteProject(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 404, ERROR_CODES.PROJECT_NOT_FOUND, 'Projet non trouvé');
    }

    const projet = await Projet.findById(id);
    if (!projet) {
      return sendError(res, 404, ERROR_CODES.PROJECT_NOT_FOUND, 'Projet non trouvé');
    }


    // Cascade : supprimer les tâches liées
    await Tache.deleteMany({ projetId: id });
    await Projet.findByIdAndDelete(id);

    return sendSuccess(res, 200, { id, deleted: true });
  } catch (err) {
    console.error(err);
    return sendError(res, 500, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Erreur lors de la suppression du projet');
  }
}

// ════════════════════════════════════════════════════════════════════════════
// MEMBRES
// ════════════════════════════════════════════════════════════════════════════

async function addMember(req, res) {
  try {
    const { id, etudiantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 404, ERROR_CODES.PROJECT_NOT_FOUND, 'Projet non trouvé');
    }
    if (!mongoose.Types.ObjectId.isValid(etudiantId)) {
      return sendError(res, 400, ERROR_CODES.VALIDATION_ERROR, 'etudiantId invalide');
    }

    const projet = await Projet.findById(id);
    if (!projet) {
      return sendError(res, 404, ERROR_CODES.PROJECT_NOT_FOUND, 'Projet non trouvé');
    }


    const etudiant = await Utilisateur.findOne({ _id: etudiantId, role: 'etudiant' });
    if (!etudiant) {
      return sendError(res, 404, ERROR_CODES.USER_NOT_FOUND, 'Étudiant non trouvé');
    }

    const alreadyMember = projet.etudiantIds.some((e) => e.toString() === etudiantId);
    if (alreadyMember) {
      return sendError(res, 409, ERROR_CODES.ALREADY_MEMBER, 'Cet étudiant est déjà membre du projet');
    }

    await Projet.findByIdAndUpdate(id, { $addToSet: { etudiantIds: etudiantId } });

    return sendSuccess(res, 200, { added: true, etudiantId });
  } catch (err) {
    console.error(err);
    return sendError(res, 500, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Erreur lors de l\'ajout du membre');
  }
}

async function removeMember(req, res) {
  try {
    const { id, etudiantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 404, ERROR_CODES.PROJECT_NOT_FOUND, 'Projet non trouvé');
    }
    if (!mongoose.Types.ObjectId.isValid(etudiantId)) {
      return sendError(res, 400, ERROR_CODES.VALIDATION_ERROR, 'etudiantId invalide');
    }

    const projet = await Projet.findById(id);
    if (!projet) {
      return sendError(res, 404, ERROR_CODES.PROJECT_NOT_FOUND, 'Projet non trouvé');
    }


    const isMember = projet.etudiantIds.some((e) => e.toString() === etudiantId);
    if (!isMember) {
      return sendError(res, 404, ERROR_CODES.MEMBER_NOT_FOUND, 'Cet étudiant n\'est pas membre du projet');
    }

    await Projet.findByIdAndUpdate(id, { $pull: { etudiantIds: etudiantId } });

    return sendSuccess(res, 200, { removed: true, etudiantId });
  } catch (err) {
    console.error(err);
    return sendError(res, 500, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Erreur lors du retrait du membre');
  }
}

async function assignEnseignant(req, res) {
  try {
    const { id } = req.params;
    const { enseignantId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 404, ERROR_CODES.PROJECT_NOT_FOUND, 'Projet non trouvé');
    }
    if (!enseignantId || !mongoose.Types.ObjectId.isValid(enseignantId)) {
      return sendError(res, 400, ERROR_CODES.VALIDATION_ERROR, 'enseignantId invalide');
    }

    // ⚠️ IMPORTANT: Charger le projet avec populate pour avoir la bonne structure
    const projet = await Projet.findById(id).populate('clubId', '_id nom');
    if (!projet) {
      return sendError(res, 404, ERROR_CODES.PROJECT_NOT_FOUND, 'Projet non trouvé');
    }

    // Logs détaillés pour debug
    console.log('\n=== [assignEnseignant] DEBUG ===');
    console.log('User info:', {
      userId: req.user?._id?.toString(),
      userRole: req.user?.role,
      userClubId: req.user?.clubId?.toString?.() || String(req.user?.clubId),
      hasClubId: !!req.user?.clubId,
    });
    console.log('Project info:', {
      projetId: projet._id.toString(),
      projectClubId: projet.clubId?._id?.toString() || String(projet.clubId),
      projectClubName: projet.clubId?.nom,
    });
    
    // Check chaque condition séparément
    const isAdmin = isRequesterAdmin(req);
    const isClub = isRequesterClub(req);
    const ownProject = isProjectOwnedByRequesterClub(projet, req);
    
    console.log('Permission checks:', {
      isAdmin,
      isClub,
      ownProject,
    });
    console.log('=== End Debug ===\n');

   

    const enseignant = await Utilisateur.findOne({ _id: enseignantId, role: 'enseignant' });
    if (!enseignant) {
      return sendError(res, 404, ERROR_CODES.USER_NOT_FOUND, 'Enseignant non trouvé');
    }

    await Projet.findByIdAndUpdate(id, { enseignantId });

    return sendSuccess(res, 200, { assigned: true, enseignantId });
  } catch (err) {
    console.error('[assignEnseignant] Error:', err);
    return sendError(res, 500, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Erreur lors de l\'affectation de l\'encadrant');
  }
}

// ════════════════════════════════════════════════════════════════════════════
// TÂCHES
// ════════════════════════════════════════════════════════════════════════════

async function listTaches(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 404, ERROR_CODES.PROJECT_NOT_FOUND, 'Projet non trouvé');
    }

    const projet = await Projet.findById(id);
    if (!projet) {
      return sendError(res, 404, ERROR_CODES.PROJECT_NOT_FOUND, 'Projet non trouvé');
    }

    const filter = { projetId: id };
    if (req.query.statut && TACHE_STATUTS.includes(req.query.statut)) {
      filter.statut = req.query.statut;
    }

    const taches = await Tache.find(filter)
      .populate('etudiantIds', 'nom prenom email')
      .sort({ deadline: 1 });

    return sendSuccess(res, 200, {
      projetId: id,
      count: taches.length,
      items: taches.map(normalizeTache),
    });
  } catch (err) {
    console.error(err);
    return sendError(res, 500, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Erreur lors de la récupération des tâches');
  }
}


async function rejoindreProjet(req, res) {
  try {
    const { id } = req.params;

    // Vérifier id projet
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(
        res,
        404,
        ERROR_CODES.PROJECT_NOT_FOUND,
        "Projet non trouvé"
      );
    }

    // Vérifier utilisateur connecté
    const utilisateur = req.user;

    if (!utilisateur) {
      return sendError(
        res,
        401,
        ERROR_CODES.UNAUTHORIZED,
        "Non autorisé"
      );
    }

    // Vérifier rôle étudiant
    if (utilisateur.role !== "etudiant") {
      return sendError(
        res,
        403,
        ERROR_CODES.FORBIDDEN,
        "Seuls les étudiants peuvent rejoindre un projet"
      );
    }

    // Chercher projet
    const projet = await Projet.findById(id);

    if (!projet) {
      return sendError(
        res,
        404,
        ERROR_CODES.PROJECT_NOT_FOUND,
        "Projet non trouvé"
      );
    }

    // Vérifier si déjà membre
    const dejaMembre = projet.etudiantIds?.some(
      (etudiantId) =>
        etudiantId.toString() === utilisateur._id.toString()
    );

    if (dejaMembre) {
      return sendError(
        res,
        400,
        ERROR_CODES.VALIDATION_ERROR,
        "Vous avez déjà rejoint ce projet"
      );
    }

    // Ajouter étudiant
    projet.etudiantIds.push(utilisateur._id);

    await projet.save();

    return sendSuccess(res, 200, {
      joined: true,
      projetId: projet._id,
    });

  } catch (err) {
    console.error(err);

    return sendError(
      res,
      500,
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      "Erreur lors de la demande de rejoindre le projet"
    );
  }
}

async function createTache(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 404, ERROR_CODES.PROJECT_NOT_FOUND, 'Projet non trouvé');
    }

    const projet = await Projet.findById(id);
    if (!projet) {
      return sendError(res, 404, ERROR_CODES.PROJECT_NOT_FOUND, 'Projet non trouvé');
    }

  

    const payload = req.body || {};
    const errors = validateTachePayload(payload, { partial: false });
    if (errors.length > 0) {
      return sendError(res, 400, ERROR_CODES.VALIDATION_ERROR, errors.join('; '));
    }

    // Vérifier que les étudiants assignés sont membres du projet
    const etudiantIds = Array.isArray(payload.etudiantIds) ? payload.etudiantIds : [];
    if (etudiantIds.length > 0) {
      const nonMembers = etudiantIds.filter(
        (eId) => !projet.etudiantIds.some((m) => m.toString() === eId)
      );
      if (nonMembers.length > 0) {
        return sendError(res, 400, ERROR_CODES.VALIDATION_ERROR, 'Certains étudiants ne sont pas membres du projet');
      }
    }

    const tache = await Tache.create({
      titre: payload.titre.trim(),
      description: payload.description || '',
      deadline: parseDate(payload.deadline),
      statut: payload.statut || 'a_faire',
      projetId: id,
      etudiantIds,
    });

    return sendSuccess(res, 201, { id: tache._id.toString() });
  } catch (err) {
    console.error(err);
    return sendError(res, 500, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Erreur lors de la création de la tâche');
  }
}

async function updateTache(req, res) {
  try {
    const { id, tacheId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(tacheId)) {
      return sendError(res, 404, ERROR_CODES.TACHE_NOT_FOUND, 'Tâche non trouvée');
    }

    const [projet, tache] = await Promise.all([
      Projet.findById(id),
      Tache.findOne({ _id: tacheId, projetId: id }),
    ]);

    if (!projet) return sendError(res, 404, ERROR_CODES.PROJECT_NOT_FOUND, 'Projet non trouvé');
    if (!tache) return sendError(res, 404, ERROR_CODES.TACHE_NOT_FOUND, 'Tâche non trouvée');

 

    const payload = req.body || {};
    const errors = validateTachePayload(payload, { partial: true });
    if (errors.length > 0) {
      return sendError(res, 400, ERROR_CODES.VALIDATION_ERROR, errors.join('; '));
    }

    const update = {};
    ['titre', 'description', 'deadline', 'statut', 'etudiantIds'].forEach((f) => {
      if (payload[f] !== undefined) update[f] = payload[f];
    });

    if (update.titre) update.titre = update.titre.trim();
    if (update.deadline) update.deadline = parseDate(update.deadline);

    if (update.etudiantIds) {
      const nonMembers = update.etudiantIds.filter(
        (eId) => !projet.etudiantIds.some((m) => m.toString() === eId)
      );
      if (nonMembers.length > 0) {
        return sendError(res, 400, ERROR_CODES.VALIDATION_ERROR, 'Certains étudiants ne sont pas membres du projet');
      }
    }

    if (Object.keys(update).length === 0) {
      return sendError(res, 400, ERROR_CODES.VALIDATION_ERROR, 'Aucun champ valide fourni');
    }

    // Si la tâche passe à "terminee", recalculer la progression du projet
    if (update.statut === 'terminee' || tache.statut === 'terminee') {
      const allTaches = await Tache.find({ projetId: id });
      const simulated = allTaches.map((t) =>
        t._id.toString() === tacheId ? { ...t.toObject(), statut: update.statut || t.statut } : t
      );
      const terminees = simulated.filter((t) => t.statut === 'terminee').length;
      const progression = Math.round((terminees / simulated.length) * 100);
      await Projet.findByIdAndUpdate(id, { progression });
    }

    const updated = await Tache.findByIdAndUpdate(tacheId, update, { new: true });

    return sendSuccess(res, 200, { id: updated._id.toString() });
  } catch (err) {
    console.error(err);
    return sendError(res, 500, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Erreur lors de la mise à jour de la tâche');
  }
}

async function deleteTache(req, res) {
  try {
    const { id, tacheId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(tacheId)) {
      return sendError(res, 404, ERROR_CODES.TACHE_NOT_FOUND, 'Tâche non trouvée');
    }

    const [projet, tache] = await Promise.all([
      Projet.findById(id),
      Tache.findOne({ _id: tacheId, projetId: id }),
    ]);

    if (!projet) return sendError(res, 404, ERROR_CODES.PROJECT_NOT_FOUND, 'Projet non trouvé');
    if (!tache) return sendError(res, 404, ERROR_CODES.TACHE_NOT_FOUND, 'Tâche non trouvée');


    await Tache.findByIdAndDelete(tacheId);

    // Recalculer progression après suppression
    const remaining = await Tache.find({ projetId: id });
    if (remaining.length > 0) {
      const terminees = remaining.filter((t) => t.statut === 'terminee').length;
      const progression = Math.round((terminees / remaining.length) * 100);
      await Projet.findByIdAndUpdate(id, { progression });
    }

    return sendSuccess(res, 200, { id: tacheId, deleted: true });
  } catch (err) {
    console.error(err);
    return sendError(res, 500, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Erreur lors de la suppression de la tâche');
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ENSEIGNANTS
// ════════════════════════════════════════════════════════════════════════════

async function listEnseignants(req, res) {
  try {
    const enseignants = await Utilisateur.find({ role: 'enseignant' })
      .select('_id nom prenom email specialite grade')
      .sort({ prenom: 1, nom: 1 });
    
    return sendSuccess(res, 200, enseignants);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Erreur lors du chargement des enseignants');
  }
}

module.exports = {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  assignEnseignant,
  listEnseignants,
  listTaches,
  rejoindreProjet,
  createTache,
  updateTache,
  deleteTache,
};