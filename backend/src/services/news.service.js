const {
  Projet,
  Evenement,
  ProjectParticipationRequest,
  EventParticipationRequest,
} = require('../models');

const ALLOWED_TYPES = new Set(['project', 'event', 'update']);

function parseLimit(rawLimit) {
  const parsed = Number.parseInt(rawLimit, 10);
  if (Number.isNaN(parsed)) return 6;
  return Math.max(1, Math.min(parsed, 20));
}

function parseTypes(rawType) {
  if (!rawType) {
    return ['project', 'event', 'update'];
  }

  const values = String(rawType)
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .filter((value) => ALLOWED_TYPES.has(value));

  if (values.length === 0) {
    return ['project', 'event', 'update'];
  }

  return Array.from(new Set(values));
}

function shortDescription(text, fallback = '') {
  const source = String(text || fallback || '').trim();
  if (source.length <= 140) return source;
  return `${source.slice(0, 137)}...`;
}

function normalizeAuthor(source) {
  if (!source) {
    return {
      id: null,
      name: 'Inconnu',
      role: null,
    };
  }

  if (source.nom && !source.prenom) {
    return {
      id: source._id ? source._id.toString() : null,
      name: source.nom,
      role: 'club',
    };
  }

  const fullName = [source.prenom, source.nom].filter(Boolean).join(' ').trim();

  return {
    id: source._id ? source._id.toString() : null,
    name: fullName || source.email || 'Utilisateur',
    role: source.role || 'utilisateur',
  };
}

async function fetchProjectItems(limit) {
  const projects = await Projet.find({})
    .populate('clubId', 'nom')
    .populate('enseignantId', 'nom prenom email role')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return projects.map((project) => ({
    id: `project-${project._id}`,
    type: 'project',
    title: project.titre,
    description: shortDescription(project.description, project.objectif || 'Nouveau projet étudiant'),
    createdAt: project.createdAt,
    relatedEntityId: project._id.toString(),
    author: normalizeAuthor(project.clubId || project.enseignantId),
  }));
}

async function fetchEventItems(limit) {
  const events = await Evenement.find({})
    .populate('clubId', 'nom')
    .populate('organisateurId', 'nom prenom email role')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return events.map((event) => ({
    id: `event-${event._id}`,
    type: 'event',
    title: event.titre,
    description: shortDescription(event.description, 'Nouvelle activite club'),
    createdAt: event.createdAt,
    relatedEntityId: event._id.toString(),
    author: normalizeAuthor(event.clubId || event.organisateurId),
  }));
}

function toUpdateTitleFromProjectRequest(request) {
  const statusToLabel = {
    accepted: 'Participation acceptee',
    rejected: 'Participation refusee',
    cancelled: 'Participation annulee',
  };

  const label = statusToLabel[request.status] || 'Mise a jour participation';
  const projectTitle = request.projectId?.titre || 'projet';
  return `${label} - ${projectTitle}`;
}

function toUpdateDescriptionFromProjectRequest(request) {
  const studentName = [request.studentId?.prenom, request.studentId?.nom].filter(Boolean).join(' ').trim();
  const projectTitle = request.projectId?.titre || 'un projet';
  const base = studentName
    ? `${studentName} a recu une mise a jour de participation pour ${projectTitle}.`
    : `Nouvelle mise a jour de participation pour ${projectTitle}.`;

  return shortDescription(request.message, base);
}

function toUpdateDescriptionFromEventRequest(request) {
  const userName = [request.utilisateurId?.prenom, request.utilisateurId?.nom].filter(Boolean).join(' ').trim();
  const eventTitle = request.evenementId?.titre || 'un evenement';
  const base = userName
    ? `${userName} a une mise a jour de participation pour ${eventTitle}.`
    : `Nouvelle mise a jour de participation pour ${eventTitle}.`;

  return shortDescription(request.message, base);
}

async function fetchUpdateItems(limit) {
  const [projectRequests, eventRequests] = await Promise.all([
    ProjectParticipationRequest.find({ status: { $in: ['accepted', 'rejected', 'cancelled'] } })
      .populate('projectId', 'titre')
      .populate('studentId', 'nom prenom email role')
      .populate('clubId', 'nom')
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean(),
    EventParticipationRequest.find({ statut: { $in: ['confirme', 'annule'] } })
      .populate('evenementId', 'titre')
      .populate('utilisateurId', 'nom prenom email role')
      .populate('clubId', 'nom')
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean(),
  ]);

  const projectUpdates = projectRequests.map((request) => ({
    id: `update-project-${request._id}`,
    type: 'update',
    title: toUpdateTitleFromProjectRequest(request),
    description: toUpdateDescriptionFromProjectRequest(request),
    createdAt: request.updatedAt || request.createdAt,
    relatedEntityId: request.projectId?._id ? request.projectId._id.toString() : null,
    author: normalizeAuthor(request.clubId || request.studentId),
  }));

  const eventUpdates = eventRequests.map((request) => ({
    id: `update-event-${request._id}`,
    type: 'update',
    title: `Participation evenement ${request.statut === 'confirme' ? 'confirmee' : 'annulee'}`,
    description: toUpdateDescriptionFromEventRequest(request),
    createdAt: request.updatedAt || request.createdAt,
    relatedEntityId: request.evenementId?._id ? request.evenementId._id.toString() : null,
    author: normalizeAuthor(request.clubId || request.utilisateurId),
  }));

  return [...projectUpdates, ...eventUpdates];
}

async function getLatestNews({ type, limit }) {
  const safeLimit = parseLimit(limit);
  const selectedTypes = parseTypes(type);

  const tasks = [];
  if (selectedTypes.includes('project')) {
    tasks.push(fetchProjectItems(safeLimit));
  }
  if (selectedTypes.includes('event')) {
    tasks.push(fetchEventItems(safeLimit));
  }
  if (selectedTypes.includes('update')) {
    tasks.push(fetchUpdateItems(safeLimit));
  }

  const lists = await Promise.all(tasks);
  const items = lists
    .flat()
    .filter((item) => item && item.createdAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, safeLimit);

  return {
    items,
    filters: {
      type: selectedTypes,
      limit: safeLimit,
    },
  };
}

module.exports = {
  getLatestNews,
};
