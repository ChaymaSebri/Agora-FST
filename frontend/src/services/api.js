import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export class ApiError extends Error {
  constructor(message, { status, code, data } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

const UI_TO_API_TYPE = {
  conference: 'conference',
  atelier: 'atelier',
  hackathon: 'hackathon',
  sortie: 'sortie',
  autre: 'autre',
};

export function toUiClub(item) {
  return {
    id: item.id,
    nom: item.nom || '',
    description: item.description || '',
    specialite: item.specialite || '',
    statut: item.statut || 'actif',
  };
}

function toUiEvent(item) {
  const rawDate = item?.date ? new Date(item.date) : null;
  const isValidDate = rawDate && !Number.isNaN(rawDate.getTime());
  const participantsCount = Number(item?.participantsCount ?? item?.attendees ?? 0);

  return {
    id: item.id,
    title: item.titre || '',
    description: item.description || '',
    date: isValidDate ? rawDate.toISOString().slice(0, 10) : '',
    time: isValidDate ? rawDate.toISOString().slice(11, 16) : '00:00',
    location: item.lieu || '',
    attendees: participantsCount,
    participantsCount,
    maxAttendees: Number(item.capacite || 0),
    type: item.type || 'autre',
    organisateurId: item.organisateurId,
    clubId: item.clubId,
    clubName: item.clubName || null,
    coOrganizerClubIds: Array.isArray(item.coOrganizerClubIds) ? item.coOrganizerClubIds : [],
    coOrganizerClubNames: Array.isArray(item.coOrganizerClubNames) ? item.coOrganizerClubNames : [],
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

function normalizeApiError(error) {
  if (error instanceof ApiError) {
    return error;
  }

  const response = error?.response;
  const payload = response?.data;
  if (payload?.success === false) {
    return new ApiError(payload?.error?.message || 'Unexpected API error', {
      status: response?.status,
      code: payload?.error?.code,
      data: payload?.error,
    });
  }

  return new ApiError(error?.message || 'Network error', {
    status: response?.status,
    data: payload,
  });
}

function rethrowApiError(error) {
  throw normalizeApiError(error);
}

export async function fetchEvents(params = {}) {
  try {
    const response = await api.get('/events', { params });
    const data = extractResponse(response);
    return {
      items: (data.items || []).map(toUiEvent),
      pagination: data.pagination,
    };
  } catch (error) {
    rethrowApiError(error);
  }
}

export async function fetchEventById(id) {
  try {
    const response = await api.get(`/events/${id}`);
    const data = extractResponse(response);
    return toUiEvent(data);
  } catch (error) {
    rethrowApiError(error);
  }
}

export async function fetchClubs() {
  try {
    const response = await api.get('/clubs');
    const data = extractResponse(response);
    return (data.items || []).map(toUiClub);
  } catch (error) {
    rethrowApiError(error);
  }
}

export async function createEvent(payload) {
  const body = {
    titre: payload.title,
    description: payload.description,
    date: toApiDate(payload.date, payload.time),
    lieu: payload.location,
    capacite: Number(payload.maxAttendees),
    type: UI_TO_API_TYPE[payload.type] || 'autre',
    coOrganizerClubIds: payload.coOrganizerClubIds || [],
  };

  try {
    const response = await api.post('/events', body);
    return extractResponse(response);
  } catch (error) {
    rethrowApiError(error);
  }
}

export async function updateEvent(id, payload) {
  const body = {
    titre: payload.title,
    description: payload.description,
    date: toApiDate(payload.date, payload.time),
    lieu: payload.location,
    capacite: Number(payload.maxAttendees),
    type: UI_TO_API_TYPE[payload.type] || 'autre',
    coOrganizerClubIds: payload.coOrganizerClubIds || [],
  };

  try {
    const response = await api.patch(`/events/${id}`, body);
    return extractResponse(response);
  } catch (error) {
    rethrowApiError(error);
  }
}

export async function deleteEvent(id) {
  try {
    const response = await api.delete(`/events/${id}`);
    return extractResponse(response);
  } catch (error) {
    rethrowApiError(error);
  }
}

export async function registerToEvent(eventId, payload = {}) {
  try {
    const response = await api.post(`/events/${eventId}/participations`, {
      commentaire: payload.commentaire,
    });
    return extractResponse(response);
  } catch (error) {
    rethrowApiError(error);
  }
}

export async function listEventParticipations(eventId) {
  try {
    const response = await api.get(`/events/${eventId}/participations`);
    return extractResponse(response);
  } catch (error) {
    rethrowApiError(error);
  }
}

export async function cancelEventParticipation(eventId, utilisateurId) {
  try {
    const response = await api.delete(`/events/${eventId}/participations/${utilisateurId}`);
    return extractResponse(response);
  } catch (error) {
    rethrowApiError(error);
  }
}

export default api;
