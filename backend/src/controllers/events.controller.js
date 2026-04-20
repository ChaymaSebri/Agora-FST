const mongoose = require('mongoose');
const { Evenement, ParticipationEvenement, Utilisateur } = require('../models');

const EVENT_TYPES = ['conference', 'atelier', 'hackathon', 'sortie', 'autre'];
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  EVENT_NOT_FOUND: 'EVENT_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  ALREADY_REGISTERED: 'ALREADY_REGISTERED',
  EVENT_FULL: 'EVENT_FULL',
  PARTICIPATION_NOT_FOUND: 'PARTICIPATION_NOT_FOUND',
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
  return {
    id: source._id.toString(),
    titre: source.titre,
    description: source.description,
    date: source.date,
    lieu: source.lieu,
    capacite: source.capacite,
    attendees: participantsCount,
    type: source.type,
    organisateurId: source.organisateurId,
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

function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function validateEventPayload(payload, { partial = false } = {}) {
  const errors = [];

  const requiredFields = ['titre', 'date', 'organisateurId'];
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

  if (payload.lieu !== undefined && payload.lieu !== null && typeof payload.lieu !== 'string') {
    errors.push('lieu must be a string');
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

  if (payload.organisateurId !== undefined) {
    if (!mongoose.Types.ObjectId.isValid(payload.organisateurId)) {
      errors.push('organisateurId must be a valid ObjectId');
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

    if (req.query.search) {
      filter.$or = [
        { titre: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { lieu: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    if (req.query.dateFrom || req.query.dateTo) {
      filter.date = {};
      if (req.query.dateFrom) filter.date.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) filter.date.$lte = new Date(req.query.dateTo);
    }

    const [items, totalItems] = await Promise.all([
      Evenement.find(filter)
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
          statut: { $ne: 'annule' },
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

    const event = await Evenement.findById(id);

    if (!event) {
      return sendError(res, 404, ERROR_CODES.EVENT_NOT_FOUND, 'Event not found');
    }

    const attendees = await ParticipationEvenement.countDocuments({
      evenementId: event._id,
      statut: { $ne: 'annule' },
    });

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
    const payload = req.body || {};
    const errors = validateEventPayload(payload, { partial: false });

    if (errors.length > 0) {
      return sendError(res, 400, ERROR_CODES.VALIDATION_ERROR, errors.join('; '));
    }

    const created = await Evenement.create({
      titre: payload.titre.trim(),
      description: payload.description,
      date: parseDate(payload.date),
      lieu: payload.lieu,
      capacite: payload.capacite,
      type: payload.type || 'autre',
      organisateurId: payload.organisateurId,
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
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 404, ERROR_CODES.EVENT_NOT_FOUND, 'Event not found');
    }

    const payload = req.body || {};
    const errors = validateEventPayload(payload, { partial: true });
    if (errors.length > 0) {
      return sendError(res, 400, ERROR_CODES.VALIDATION_ERROR, errors.join('; '));
    }

    const updatableFields = ['titre', 'description', 'date', 'lieu', 'capacite', 'type', 'organisateurId'];
    const update = {};
    updatableFields.forEach((field) => {
      if (payload[field] !== undefined) {
        update[field] = payload[field];
      }
    });

    if (update.titre && typeof update.titre === 'string') {
      update.titre = update.titre.trim();
    }

    if (update.date) {
      update.date = parseDate(update.date);
    }

    if (Object.keys(update).length === 0) {
      return sendError(
        res,
        400,
        ERROR_CODES.VALIDATION_ERROR,
        'No valid fields provided for update',
      );
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
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 404, ERROR_CODES.EVENT_NOT_FOUND, 'Event not found');
    }

    const deleted = await Evenement.findByIdAndDelete(id);
    if (!deleted) {
      return sendError(res, 404, ERROR_CODES.EVENT_NOT_FOUND, 'Event not found');
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
    const { utilisateurId, commentaire } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 404, ERROR_CODES.EVENT_NOT_FOUND, 'Event not found');
    }

    if (!utilisateurId || !mongoose.Types.ObjectId.isValid(utilisateurId)) {
      return sendError(
        res,
        400,
        ERROR_CODES.VALIDATION_ERROR,
        'utilisateurId must be a valid ObjectId',
      );
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

    const existing = await ParticipationEvenement.findOne({ evenementId: id, utilisateurId });
    if (existing) {
      return sendError(
        res,
        409,
        ERROR_CODES.ALREADY_REGISTERED,
        'User is already registered for this event',
      );
    }

    if (event.capacite) {
      const registrationsCount = await ParticipationEvenement.countDocuments({
        evenementId: id,
        statut: { $ne: 'annule' },
      });

      if (registrationsCount >= event.capacite) {
        return sendError(res, 409, ERROR_CODES.EVENT_FULL, 'Event capacity reached');
      }
    }

    const created = await ParticipationEvenement.create({
      evenementId: id,
      utilisateurId,
      commentaire,
      statut: 'inscrit',
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
      'Unexpected error while creating participation',
    );
  }
}

async function deleteParticipation(req, res, next) {
  try {
    const { id, utilisateurId } = req.params;

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

    const event = await Evenement.findById(id);
    if (!event) {
      return sendError(res, 404, ERROR_CODES.EVENT_NOT_FOUND, 'Event not found');
    }

    const deleted = await ParticipationEvenement.findOneAndDelete({
      evenementId: id,
      utilisateurId,
    });

    if (!deleted) {
      return sendError(
        res,
        404,
        ERROR_CODES.PARTICIPATION_NOT_FOUND,
        'Participation not found',
      );
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

    const participations = await ParticipationEvenement.find({ evenementId: id }).sort({ dateInscription: -1 });

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
  listParticipations,
};
