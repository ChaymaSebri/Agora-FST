import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

const UI_TO_API_TYPE = {
  conference: 'conference',
  atelier: 'atelier',
  hackathon: 'hackathon',
  sortie: 'sortie',
  autre: 'autre',
};

function toUiEvent(item) {
  const rawDate = item?.date ? new Date(item.date) : null;
  const isValidDate = rawDate && !Number.isNaN(rawDate.getTime());

  return {
    id: item.id,
    title: item.titre || '',
    description: item.description || '',
    date: isValidDate ? rawDate.toISOString().slice(0, 10) : '',
    time: isValidDate ? rawDate.toISOString().slice(11, 16) : '00:00',
    location: item.lieu || '',
    attendees: Number(item.attendees || 0),
    maxAttendees: Number(item.capacite || 0),
    type: item.type || 'autre',
  };
}

function toApiDate(date, time) {
  if (!date) return null;
  const safeTime = time && /^\d{2}:\d{2}$/.test(time) ? time : '00:00';
  return `${date}T${safeTime}:00.000Z`;
}

function extractResponse(response) {
  if (response?.data?.success) return response.data.data;
  throw new Error(response?.data?.error?.message || 'Unexpected API response');
}

export async function fetchEvents(params = {}) {
  const response = await api.get('/events', { params });
  const data = extractResponse(response);
  return {
    items: (data.items || []).map(toUiEvent),
    pagination: data.pagination,
  };
}

export async function fetchEventById(id) {
  const response = await api.get(`/events/${id}`);
  const data = extractResponse(response);
  return toUiEvent(data);
}

export async function createEvent(payload) {
  const body = {
    titre: payload.title,
    description: payload.description,
    date: toApiDate(payload.date, payload.time),
    lieu: payload.location,
    capacite: Number(payload.maxAttendees),
    type: UI_TO_API_TYPE[payload.type] || 'autre',
    organisateurId: payload.organisateurId,
  };

  const response = await api.post('/events', body);
  return extractResponse(response);
}

export async function updateEvent(id, payload) {
  const body = {
    titre: payload.title,
    description: payload.description,
    date: toApiDate(payload.date, payload.time),
    lieu: payload.location,
    capacite: Number(payload.maxAttendees),
    type: UI_TO_API_TYPE[payload.type] || 'autre',
    organisateurId: payload.organisateurId,
  };

  const response = await api.patch(`/events/${id}`, body);
  return extractResponse(response);
}

export async function deleteEvent(id) {
  const response = await api.delete(`/events/${id}`);
  return extractResponse(response);
}

export async function registerToEvent(eventId, payload) {
  const response = await api.post(`/events/${eventId}/participations`, {
    utilisateurId: payload.utilisateurId,
    commentaire: payload.commentaire,
  });
  return extractResponse(response);
}

export async function listEventParticipations(eventId) {
  const response = await api.get(`/events/${eventId}/participations`);
  return extractResponse(response);
}

export async function cancelEventParticipation(eventId, utilisateurId) {
  const response = await api.delete(`/events/${eventId}/participations/${utilisateurId}`);
  return extractResponse(response);
}

export default api;
