const mongoose = require('mongoose');
const { Evenement, ParticipationEvenement, Utilisateur, Club, Competence } = require('../models');

const EVENT_TYPES = ['conference', 'atelier', 'hackathon', 'sortie', 'autre'];
const ACTIVE_PARTICIPATION_STATUSES = ['inscrit', 'confirme', 'present'];
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  EVENT_NOT_FOUND: 'EVENT_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  ALREADY_REGISTERED: 'ALREADY_REGISTERED',
  EVENT_FULL: 'EVENT_FULL',
  PARTICIPATION_NOT_FOUND: 'PARTICIPATION_NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
};

function sendSuccess(res, status, data) {
  return res.status(status).json({
    success: true,
    data,
  });
}

function sendError(res, status, code, message) {
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed;
}

function isValidDateString(value) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function normalizeEvent(doc, participantsCount = 0) {
  const source = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const clubSource = source.clubId;
  const coOrganizerSources = Array.isArray(source.coOrganizerClubIds) ? source.coOrganizerClubIds : [];
  const clubId = clubSource && typeof clubSource === 'object' && clubSource._id
    ? clubSource._id.toString()
    : (clubSource ? clubSource.toString() : null);
  const clubName = clubSource && typeof clubSource === 'object' ? (clubSource.nom || null) : null;
  const coOrganizerClubIds = coOrganizerSources
    .map((club) => {
      if (!club) return null;
      if (typeof club === 'object' && club._id) {
        return club._id.toString();
      }
      return String(club);
    })
    .filter(Boolean);
  const coOrganizerClubNames = coOrganizerSources
    .map((club) => (club && typeof club === 'object' ? club.nom : null))
    .filter(Boolean);

  return {
    id: source._id.toString(),
    titre: source.titre,
    description: source.description,
    date: source.date,
    lieu: source.lieu,
    capacite: source.capacite,
    attendees: participantsCount,
    participantsCount,
    type: source.type,
    organisateurId: source.organisateurId,
    clubId,
    clubName,
    competenceIds: Array.isArray(source.competenceIds)
      ? source.competenceIds.map((competenceId) => (competenceId && competenceId._id ? competenceId._id.toString() : String(competenceId)))
      : [],
    coOrganizerClubIds,
    coOrganizerClubNames,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
}

function normalizeParticipation(doc) {
  const source = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    id: source._id.toString(),
    utilisateurId: source.utilisateurId,
    dateInscription: source.dateInscription,
    statut: source.statut,
    commentaire: source.commentaire,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
}

async function countActiveParticipations(eventId) {
  return ParticipationEvenement.countDocuments({
    evenementId: eventId,
    statut: { $in: ACTIVE_PARTICIPATION_STATUSES },
  });
}

function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function canRequesterParticipate(req) {
  return req.user && ['etudiant', 'enseignant'].includes(req.user.role);
}

function isRequesterClub(req) {
  return req.user && req.user.role === 'club' && req.user.clubId;
}

function isEventOwnedByRequesterClub(event, req) {
  if (!event || !req.user || !req.user.clubId) {
    return false;
  }

  const requesterClubId = String(req.user.clubId);

  if (event.clubId) {
    const mainClubId = event.clubId._id ? String(event.clubId._id) : String(event.clubId);
    if (mainClubId === requesterClubId) {
      return true;
    }
  }

  const coOrganizerClubIds = Array.isArray(event.coOrganizerClubIds)
    ? event.coOrganizerClubIds.map((club) => (club && club._id ? String(club._id) : String(club)))
    : [];

  if (coOrganizerClubIds.includes(requesterClubId)) {
    return true;
  }

  return String(event.organisateurId) === String(req.user._id);
}

function normalizeCoOrganizerClubIds(rawClubIds, ownerClubId) {
  if (!Array.isArray(rawClubIds)) {
    return [];
  }

  const ownerId = String(ownerClubId);
  const unique = new Set();

  rawClubIds.forEach((clubId) => {
    if (!clubId) return;
    const normalized = String(clubId).trim();
    if (!normalized || normalized === ownerId) return;
    unique.add(normalized);
  });

  return Array.from(unique);
}

function normalizeCompetenceIds(rawCompetenceIds) {
  if (!Array.isArray(rawCompetenceIds)) {
    return [];
  }

  const unique = new Set();

  rawCompetenceIds.forEach((competenceId) => {
    if (!competenceId) return;
    const normalized = String(competenceId).trim();
    if (!normalized) return;
    unique.add(normalized);
  });

  return Array.from(unique);
}

function isTransactionSupportError(error) {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('transaction numbers are only allowed on a replica set member or mongos')
    || message.includes('replica set')
    || message.includes('mongos')
    || message.includes('transaction not supported')
  );
}

async function runWithOptionalTransaction(transactionWork, fallbackWork) {
  let session;

  try {
    session = await mongoose.startSession();
    await session.withTransaction(async () => {
      await transactionWork(session);
    });
    return;
  } catch (error) {
    if (isTransactionSupportError(error)) {
      await fallbackWork();
      return;
    }
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
}

async function createParticipationWithoutTransaction({ eventId, utilisateurId, commentaire }) {
  const existing = await ParticipationEvenement.findOne({ evenementId: eventId, utilisateurId });
  if (existing) {
    throw new Error('ALREADY_REGISTERED');
  }

  const lockedEvent = await Evenement.findOneAndUpdate(
    {
      _id: eventId,
      $expr: { $lt: ['$participantsCount', '$capacite'] },
    },
    { $inc: { participantsCount: 1 } },
    { new: true },
  );

  if (!lockedEvent) {
    throw new Error('EVENT_FULL');
  }

  try {
    return await ParticipationEvenement.create({
      evenementId: eventId,
      utilisateurId,
      commentaire,
      statut: 'inscrit',
    });
  } catch (error) {
    await Evenement.updateOne(
      { _id: eventId, participantsCount: { $gt: 0 } },
      { $inc: { participantsCount: -1 } },
    );

    if (error?.code === 11000) {
      throw new Error('ALREADY_REGISTERED');
    }

    throw error;
  }
}

async function deleteParticipationWithoutTransaction({ eventId, utilisateurId }) {
  const deleted = await ParticipationEvenement.findOneAndDelete({
    evenementId: eventId,
    utilisateurId,
  });

  if (!deleted) {
    throw new Error('PARTICIPATION_NOT_FOUND');
  }

  await Evenement.updateOne(
    { _id: eventId, participantsCount: { $gt: 0 } },
    { $inc: { participantsCount: -1 } },
  );

  return deleted;
}

async function deleteEventWithCascadeWithoutTransaction(eventId) {
  const deleted = await Evenement.findByIdAndDelete(eventId);
  if (!deleted) {
    throw new Error('EVENT_NOT_FOUND');
  }

  await ParticipationEvenement.deleteMany({ evenementId: eventId });
  return deleted;
}

function validateEventPayload(payload, { partial = false } = {}) {
  const errors = [];

  const requiredFields = ['titre', 'date', 'type', 'capacite', 'lieu'];
  if (!partial) {
    requiredFields.forEach((field) => {
      if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
        errors.push(`${field} is required`);
      }
    });
  }

  if (payload.titre !== undefined) {
    if (typeof payload.titre !== 'string' || !payload.titre.trim()) {
      errors.push('titre must be a non-empty string');
    }
  }

  if (payload.description !== undefined && payload.description !== null && typeof payload.description !== 'string') {
    errors.push('description must be a string');
  }

  if (payload.lieu !== undefined) {
    if (payload.lieu === null || typeof payload.lieu !== 'string' || !payload.lieu.trim()) {
      errors.push('lieu must be a non-empty string');
    }
  }

  if (payload.date !== undefined) {
    if (!parseDate(payload.date)) {
      errors.push('date must be a valid date');
    }
  }

  if (payload.capacite !== undefined && payload.capacite !== null) {
    const capacite = Number(payload.capacite);
    if (!Number.isFinite(capacite) || capacite < 1) {
      errors.push('capacite must be a number >= 1');
    }
  }

  if (payload.type !== undefined) {
    if (!EVENT_TYPES.includes(payload.type)) {
      errors.push(`type must be one of: ${EVENT_TYPES.join(', ')}`);
    }
  }

  if (payload.coOrganizerClubIds !== undefined) {
    if (!Array.isArray(payload.coOrganizerClubIds)) {
      errors.push('coOrganizerClubIds must be an array of ObjectId');
    } else {
      const invalidClubId = payload.coOrganizerClubIds.find((clubId) => !mongoose.Types.ObjectId.isValid(clubId));
      if (invalidClubId) {
        errors.push('coOrganizerClubIds contains invalid ObjectId');
      }
    }
  }

  if (payload.competenceIds !== undefined) {
    if (!Array.isArray(payload.competenceIds)) {
      errors.push('competenceIds must be an array of ObjectId');
    } else {
      const invalidCompetenceId = payload.competenceIds.find((competenceId) => !mongoose.Types.ObjectId.isValid(competenceId));
      if (invalidCompetenceId) {
        errors.push('competenceIds contains invalid ObjectId');
      }
    }
  }

  return errors;
}

async function listEvents(req, res, next) {
  try {
    const page = toPositiveInt(req.query.page, 1);
    const limit = toPositiveInt(req.query.limit, 10);
    const sortBy = ['date', 'createdAt'].includes(req.query.sortBy) ? req.query.sortBy : 'date';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

    if (req.query.type && !EVENT_TYPES.includes(req.query.type)) {
      return sendError(res, 400, ERROR_CODES.VALIDATION_ERROR, 'Invalid type filter');
    }

    if (req.query.dateFrom && !isValidDateString(req.query.dateFrom)) {
      return sendError(res, 400, ERROR_CODES.VALIDATION_ERROR, 'Invalid dateFrom value');
    }

    if (req.query.dateTo && !isValidDateString(req.query.dateTo)) {
      return sendError(res, 400, ERROR_CODES.VALIDATION_ERROR, 'Invalid dateTo value');
    }

    const filter = {};

    if (req.query.type) {
      filter.type = req.query.type;
    }

    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    if (search) {
      filter.$or = [
        { titre: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { lieu: { $regex: search, $options: 'i' } },
      ];
    }

    if (req.query.dateFrom || req.query.dateTo) {
      filter.date = {};
      if (req.query.dateFrom) filter.date.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) filter.date.$lte = new Date(req.query.dateTo);
    }

    const [items, totalItems] = await Promise.all([
      Evenement.find(filter)
        .populate('clubId', 'nom')
        .populate('coOrganizerClubIds', 'nom')
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit),
      Evenement.countDocuments(filter),
    ]);

    const eventIds = items.map((event) => event._id);
    const participationCounts = await ParticipationEvenement.aggregate([
      {
        $match: {
          evenementId: { $in: eventIds },
          statut: { $in: ACTIVE_PARTICIPATION_STATUSES },
        },
      },
      {
        $group: {
          _id: '$evenementId',
          count: { $sum: 1 },
        },
      },
    ]);

    const countMap = new Map(
      participationCounts.map((entry) => [entry._id.toString(), entry.count]),
    );

    return sendSuccess(res, 200, {
      items: items.map((event) => normalizeEvent(event, countMap.get(event._id.toString()) || 0)),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit) || 1,
      },
    });
  } catch (error) {
    console.error(error);
    return sendError(
      res,
      500,
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      'Unexpected error while listing events',
    );
  }
}

async function getEventById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 404, ERROR_CODES.EVENT_NOT_FOUND, 'Event not found');
    }

    const event = await Evenement.findById(id)
      .populate('clubId', 'nom')
      .populate('coOrganizerClubIds', 'nom');

    if (!event) {
      return sendError(res, 404, ERROR_CODES.EVENT_NOT_FOUND, 'Event not found');
    }

    const attendees = await countActiveParticipations(event._id);

    return sendSuccess(res, 200, normalizeEvent(event, attendees));
  } catch (error) {
    console.error(error);
    return sendError(
      res,
      500,
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      'Unexpected error while getting event',
    );
  }
}

async function createEvent(req, res, next) {
  try {
    if (!isRequesterClub(req)) {
      return sendError(
        res,
        403,
        ERROR_CODES.FORBIDDEN,
        'Only club accounts can create events',
      );
    }

    const payload = req.body || {};
    const errors = validateEventPayload(payload, { partial: false });

    if (errors.length > 0) {
      return sendError(res, 400, ERROR_CODES.VALIDATION_ERROR, errors.join('; '));
    }

    const coOrganizerClubIds = normalizeCoOrganizerClubIds(payload.coOrganizerClubIds, req.user.clubId);
    if (coOrganizerClubIds.length > 0) {
      const existingClubsCount = await Club.countDocuments({ _id: { $in: coOrganizerClubIds } });
      if (existingClubsCount !== coOrganizerClubIds.length) {
        return sendError(
          res,
          400,
          ERROR_CODES.VALIDATION_ERROR,
          'Some coOrganizerClubIds do not exist',
        );
      }
    }

    const competenceIds = normalizeCompetenceIds(payload.competenceIds);
    if (competenceIds.length > 0) {
      const existingCompetencesCount = await Competence.countDocuments({
        _id: { $in: competenceIds },
        isActive: true,
      });

      if (existingCompetencesCount !== competenceIds.length) {
        return sendError(
          res,
          400,
          ERROR_CODES.VALIDATION_ERROR,
          'Some competenceIds do not exist',
        );
      }
    }

    const created = await Evenement.create({
      titre: payload.titre.trim(),
      description: payload.description,
      date: parseDate(payload.date),
      lieu: payload.lieu.trim(),
      capacite: Number(payload.capacite),
      participantsCount: 0,
      type: payload.type,
      organisateurId: req.user._id,
      clubId: req.user.clubId,
      competenceIds,
      coOrganizerClubIds,
    });

    return sendSuccess(res, 201, {
      id: created._id.toString(),
    });
  } catch (error) {
    console.error(error);
    return sendError(
      res,
      500,
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      'Unexpected error while creating event',
    );
  }
}

async function updateEvent(req, res, next) {
  try {
    if (!isRequesterClub(req)) {
      return sendError(
        res,
        403,
        ERROR_CODES.FORBIDDEN,
        'Only club accounts can update events',
      );
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 404, ERROR_CODES.EVENT_NOT_FOUND, 'Event not found');
    }

    const existingEvent = await Evenement.findById(id);
    if (!existingEvent) {
      return sendError(res, 404, ERROR_CODES.EVENT_NOT_FOUND, 'Event not found');
    }

    if (!isEventOwnedByRequesterClub(existingEvent, req)) {
      return sendError(
        res,
        403,
        ERROR_CODES.FORBIDDEN,
        'You can only update events created by your club',
      );
    }

    const payload = req.body || {};
    const errors = validateEventPayload(payload, { partial: true });
    if (errors.length > 0) {
      return sendError(res, 400, ERROR_CODES.VALIDATION_ERROR, errors.join('; '));
    }

    const updatableFields = ['titre', 'description', 'date', 'lieu', 'capacite', 'type', 'coOrganizerClubIds', 'competenceIds'];
    const update = {};
    updatableFields.forEach((field) => {
      if (payload[field] !== undefined) {
        update[field] = payload[field];
      }
    });

    if (update.titre && typeof update.titre === 'string') {
      update.titre = update.titre.trim();
    }

    if (update.lieu && typeof update.lieu === 'string') {
      update.lieu = update.lieu.trim();
    }

    if (update.date) {
      update.date = parseDate(update.date);
    }

    if (update.capacite !== undefined) {
      update.capacite = Number(update.capacite);
    }

    if (update.coOrganizerClubIds !== undefined) {
      update.coOrganizerClubIds = normalizeCoOrganizerClubIds(update.coOrganizerClubIds, existingEvent.clubId);

      if (update.coOrganizerClubIds.length > 0) {
        const existingClubsCount = await Club.countDocuments({ _id: { $in: update.coOrganizerClubIds } });
        if (existingClubsCount !== update.coOrganizerClubIds.length) {
          return sendError(
            res,
            400,
            ERROR_CODES.VALIDATION_ERROR,
            'Some coOrganizerClubIds do not exist',
          );
        }
      }
    }

    if (update.competenceIds !== undefined) {
      update.competenceIds = normalizeCompetenceIds(update.competenceIds);

      if (update.competenceIds.length > 0) {
        const existingCompetencesCount = await Competence.countDocuments({
          _id: { $in: update.competenceIds },
          isActive: true,
        });

        if (existingCompetencesCount !== update.competenceIds.length) {
          return sendError(
            res,
            400,
            ERROR_CODES.VALIDATION_ERROR,
            'Some competenceIds do not exist',
          );
        }
      }
    }

    if (Object.keys(update).length === 0) {
      return sendError(
        res,
        400,
        ERROR_CODES.VALIDATION_ERROR,
        'No valid fields provided for update',
      );
    }

    if (update.capacite !== undefined) {
      const currentActiveParticipants = await countActiveParticipations(id);
      if (update.capacite < currentActiveParticipants) {
        return sendError(
          res,
          400,
          ERROR_CODES.VALIDATION_ERROR,
          'capacite cannot be lower than the current number of active participants',
        );
      }
    }

    const updated = await Evenement.findByIdAndUpdate(id, update, { new: true });

    if (!updated) {
      return sendError(res, 404, ERROR_CODES.EVENT_NOT_FOUND, 'Event not found');
    }

    return sendSuccess(res, 200, {
      id: updated._id.toString(),
    });
  } catch (error) {
    console.error(error);
    return sendError(
      res,
      500,
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      'Unexpected error while updating event',
    );
  }
}

async function deleteEvent(req, res, next) {
  try {
    if (!isRequesterClub(req)) {
      return sendError(
        res,
        403,
        ERROR_CODES.FORBIDDEN,
        'Only club accounts can delete events',
      );
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 404, ERROR_CODES.EVENT_NOT_FOUND, 'Event not found');
    }

    const existingEvent = await Evenement.findById(id);
    if (!existingEvent) {
      return sendError(res, 404, ERROR_CODES.EVENT_NOT_FOUND, 'Event not found');
    }

    if (!isEventOwnedByRequesterClub(existingEvent, req)) {
      return sendError(
        res,
        403,
        ERROR_CODES.FORBIDDEN,
        'You can only delete events created by your club',
      );
    }

    let deleted;

    try {
      await runWithOptionalTransaction(
        async (session) => {
          await ParticipationEvenement.deleteMany({ evenementId: id }).session(session);
          deleted = await Evenement.findByIdAndDelete(id).session(session);

          if (!deleted) {
            throw new Error('EVENT_NOT_FOUND');
          }
        },
        async () => {
          deleted = await deleteEventWithCascadeWithoutTransaction(id);
        },
      );
    } catch (error) {
      if (error.message === 'EVENT_NOT_FOUND') {
        return sendError(res, 404, ERROR_CODES.EVENT_NOT_FOUND, 'Event not found');
      }

      throw error;
    }

    return sendSuccess(res, 200, {
      id,
      deleted: true,
    });
  } catch (error) {
    console.error(error);
    return sendError(
      res,
      500,
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      'Unexpected error while deleting event',
    );
  }
}

async function createParticipation(req, res, next) {
  try {
    const { id } = req.params;
    const { commentaire } = req.body || {};

    if (!canRequesterParticipate(req)) {
      return sendError(
        res,
        403,
        ERROR_CODES.FORBIDDEN,
        'Only etudiant and enseignant can register to an event',
      );
    }

    const utilisateurId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 404, ERROR_CODES.EVENT_NOT_FOUND, 'Event not found');
    }

    const [event, user] = await Promise.all([
      Evenement.findById(id),
      Utilisateur.findById(utilisateurId),
    ]);

    if (!event) {
      return sendError(res, 404, ERROR_CODES.EVENT_NOT_FOUND, 'Event not found');
    }

    if (!user) {
      return sendError(res, 404, ERROR_CODES.USER_NOT_FOUND, 'User not found');
    }

    let created;

    try {
      await runWithOptionalTransaction(
        async (session) => {
          const lockedEvent = await Evenement.findOneAndUpdate(
            {
              _id: event._id,
              $expr: { $lt: ['$participantsCount', '$capacite'] },
            },
            { $inc: { participantsCount: 1 } },
            { new: true, session },
          );

          if (!lockedEvent) {
            throw new Error('EVENT_FULL');
          }

          const existing = await ParticipationEvenement.findOne({
            evenementId: id,
            utilisateurId,
          }).session(session);

          if (existing) {
            throw new Error('ALREADY_REGISTERED');
          }

          const [participation] = await ParticipationEvenement.create([
            {
              evenementId: id,
              utilisateurId,
              commentaire,
              statut: 'inscrit',
            },
          ], { session });

          created = participation;
        },
        async () => {
          created = await createParticipationWithoutTransaction({
            eventId: event._id,
            utilisateurId,
            commentaire,
          });
        },
      );
    } catch (error) {
      if (error.message === 'EVENT_FULL') {
        return sendError(res, 409, ERROR_CODES.EVENT_FULL, 'Event capacity reached');
      }

      if (error.message === 'ALREADY_REGISTERED') {
        return sendError(
          res,
          409,
          ERROR_CODES.ALREADY_REGISTERED,
          'User is already registered for this event',
        );
      }
      throw error;
    }

    return sendSuccess(res, 201, {
      id: created._id.toString(),
    });
  } catch (error) {
    console.error(error);
    return sendError(
      res,
      500,
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      'Unexpected error while creating participation',
    );
  }
}

async function deleteParticipation(req, res, next) {
  try {
    const { id, utilisateurId } = req.params;

    if (!canRequesterParticipate(req)) {
      return sendError(
        res,
        403,
        ERROR_CODES.FORBIDDEN,
        'Only etudiant and enseignant can cancel an event registration',
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 404, ERROR_CODES.EVENT_NOT_FOUND, 'Event not found');
    }

    if (!mongoose.Types.ObjectId.isValid(utilisateurId)) {
      return sendError(
        res,
        400,
        ERROR_CODES.VALIDATION_ERROR,
        'utilisateurId must be a valid ObjectId',
      );
    }

    if (String(utilisateurId) !== String(req.user._id)) {
      return sendError(
        res,
        403,
        ERROR_CODES.FORBIDDEN,
        'You can only cancel your own registration',
      );
    }

    const event = await Evenement.findById(id);
    if (!event) {
      return sendError(res, 404, ERROR_CODES.EVENT_NOT_FOUND, 'Event not found');
    }

    let deleted;

    try {
      await runWithOptionalTransaction(
        async (session) => {
          deleted = await ParticipationEvenement.findOneAndDelete({
            evenementId: id,
            utilisateurId,
          }).session(session);

          if (!deleted) {
            throw new Error('PARTICIPATION_NOT_FOUND');
          }

          await Evenement.updateOne(
            { _id: event._id, participantsCount: { $gt: 0 } },
            { $inc: { participantsCount: -1 } },
            { session },
          );
        },
        async () => {
          deleted = await deleteParticipationWithoutTransaction({
            eventId: event._id,
            utilisateurId,
          });
        },
      );
    } catch (error) {
      if (error.message === 'PARTICIPATION_NOT_FOUND') {
        return sendError(
          res,
          404,
          ERROR_CODES.PARTICIPATION_NOT_FOUND,
          'Participation not found',
        );
      }

      throw error;
    }

    return sendSuccess(res, 200, {
      deleted: true,
    });
  } catch (error) {
    console.error(error);
    return sendError(
      res,
      500,
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      'Unexpected error while deleting participation',
    );
  }
}

async function listMyParticipations(req, res, next) {
  try {
    if (!canRequesterParticipate(req)) {
      return sendError(
        res,
        403,
        ERROR_CODES.FORBIDDEN,
        'Only etudiant and enseignant can access personal participation state',
      );
    }

    const rawEventIds = req.query.eventIds;
    const parsedEventIds = Array.isArray(rawEventIds)
      ? rawEventIds
      : (typeof rawEventIds === 'string' ? rawEventIds.split(',') : []);

    const eventIds = Array.from(
      new Set(
        parsedEventIds
          .map((value) => String(value || '').trim())
          .filter(Boolean),
      ),
    );

    if (eventIds.length > 0) {
      const hasInvalidEventId = eventIds.some((eventId) => !mongoose.Types.ObjectId.isValid(eventId));
      if (hasInvalidEventId) {
        return sendError(
          res,
          400,
          ERROR_CODES.VALIDATION_ERROR,
          'eventIds must contain only valid ObjectId values',
        );
      }
    }

    if (eventIds.length === 0) {
      return sendSuccess(res, 200, { eventIds: [] });
    }

    const registeredEventIds = await ParticipationEvenement.find({
      utilisateurId: req.user._id,
      evenementId: { $in: eventIds },
      statut: { $in: ACTIVE_PARTICIPATION_STATUSES },
    }).distinct('evenementId');

    return sendSuccess(res, 200, {
      eventIds: registeredEventIds.map((eventId) => String(eventId)),
    });
  } catch (error) {
    console.error(error);
    return sendError(
      res,
      500,
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      'Unexpected error while listing personal participations',
    );
  }
}

async function listParticipations(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 404, ERROR_CODES.EVENT_NOT_FOUND, 'Event not found');
    }

    const event = await Evenement.findById(id);
    if (!event) {
      return sendError(res, 404, ERROR_CODES.EVENT_NOT_FOUND, 'Event not found');
    }

    const requesterRole = req.user?.role;
    const isRequesterParticipant = ['etudiant', 'enseignant'].includes(requesterRole);
    const isRequesterAdmin = requesterRole === 'admin';
    const isRequesterOwnerClub = requesterRole === 'club' && isEventOwnedByRequesterClub(event, req);

    if (!isRequesterParticipant && !isRequesterAdmin && !isRequesterOwnerClub) {
      return sendError(
        res,
        403,
        ERROR_CODES.FORBIDDEN,
        'You are not allowed to view this event participation list',
      );
    }

    const participationFilter = { evenementId: id };

    // Data minimization: participants can only read their own registration rows.
    if (isRequesterParticipant) {
      participationFilter.utilisateurId = req.user._id;
    }

    const participations = await ParticipationEvenement.find(participationFilter).sort({ dateInscription: -1 });

    return sendSuccess(res, 200, {
      eventId: id,
      count: participations.length,
      items: participations.map(normalizeParticipation),
    });
  } catch (error) {
    console.error(error);
    return sendError(
      res,
      500,
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      'Unexpected error while listing participations',
    );
  }
}

module.exports = {
  listEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  createParticipation,
  deleteParticipation,
  listMyParticipations,
  listParticipations,
};
