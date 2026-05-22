import api from './api';

// ============================================================================
// CLUB STATS
// ============================================================================

export const getClubStats = async () => {
  try {
    const response = await api.get('/club-dashboard/stats');
    return response.data.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    throw error;
  }
};

// ============================================================================
// CLUB PROFILE & INFO
// ============================================================================

export const getClubProfile = async () => {
  try {
    const response = await api.get('/club-dashboard/profile');
    return response.data.data;
  } catch (error) {
    console.error('Erreur lors de la récupération du profil du club:', error);
    throw error;
  }
};

export const updateClubProfile = async (clubData: {
  nom?: string;
  description?: string;
  specialite?: string;
}) => {
  try {
    const response = await api.patch('/club-dashboard/profile', clubData);
    return response.data.data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil du club:', error);
    throw error;
  }
};

// ============================================================================
// EVENTS MANAGEMENT
// ============================================================================

export const listClubEvents = async () => {
  try {
    const response = await api.get('/club-dashboard/events');
    return response.data.data.items;
  } catch (error) {
    console.error('Erreur lors de la récupération des événements:', error);
    throw error;
  }
};

export const createClubEvent = async (eventData: {
  titre: string;
  description?: string;
  date: string;
  lieu?: string;
  capacite?: number;
  type?: 'conference' | 'atelier' | 'hackathon' | 'sortie' | 'autre';
}) => {
  try {
    const response = await api.post('/club-dashboard/events', eventData);
    return response.data.data;
  } catch (error) {
    console.error('Erreur lors de la création de l\'événement:', error);
    throw error;
  }
};

export const updateClubEvent = async (
  eventId: string,
  eventData: {
    titre?: string;
    description?: string;
    date?: string;
    lieu?: string;
    capacite?: number;
    type?: string;
  }
) => {
  try {
    const response = await api.patch(`/club-dashboard/events/${eventId}`, eventData);
    return response.data.data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'événement:', error);
    throw error;
  }
};

export const deleteClubEvent = async (eventId: string) => {
  try {
    const response = await api.delete(`/club-dashboard/events/${eventId}`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'événement:', error);
    throw error;
  }
};

// ============================================================================
// EVENT PARTICIPATIONS & VALIDATIONS
// ============================================================================

export const listEventParticipations = async (eventId: string) => {
  try {
    const response = await api.get(`/club-dashboard/events/${eventId}/participations`);
    return response.data.data.items;
  } catch (error) {
    console.error('Erreur lors de la récupération des participations:', error);
    throw error;
  }
};

export const validateEventParticipation = async (
  eventId: string,
  participationId: string,
  statut: 'confirme' | 'annule'
) => {
  try {
    const response = await api.patch(
      `/club-dashboard/events/${eventId}/participations/${participationId}`,
      { statut }
    );
    return response.data.data;
  } catch (error) {
    console.error('Erreur lors de la validation de la participation:', error);
    throw error;
  }
};

export const inviteTeacherToEvent = async (eventId: string, teacherId: string) => {
  try {
    const response = await api.post(`/club-dashboard/events/${eventId}/invite-teacher`, {
      teacherId,
    });
    return response.data.data;
  } catch (error) {
    console.error('Erreur lors de l\'invitation de l\'enseignant:', error);
    throw error;
  }
};

// ============================================================================
// PROJECTS MANAGEMENT
// ============================================================================

export const listClubProjects = async () => {
  try {
    const response = await api.get('/club-dashboard/projects');
    return response.data.data.items;
  } catch (error) {
    console.error('Erreur lors de la récupération des projets:', error);
    throw error;
  }
};

export const createClubProject = async (projectData: {
  titre: string;
  description?: string;
  objectif?: string;
  dateDebut?: string;
  deadline: string;
  enseignantId?: string;
}) => {
  try {
    const response = await api.post('/club-dashboard/projects', projectData);
    return response.data.data;
  } catch (error) {
    console.error('Erreur lors de la création du projet:', error);
    throw error;
  }
};

export const updateClubProject = async (
  projectId: string,
  projectData: {
    titre?: string;
    description?: string;
    objectif?: string;
    dateDebut?: string;
    deadline?: string;
    statut?: string;
    progression?: number;
  }
) => {
  try {
    const response = await api.patch(`/club-dashboard/projects/${projectId}`, projectData);
    return response.data.data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du projet:', error);
    throw error;
  }
};

export const deleteClubProject = async (projectId: string) => {
  try {
    const response = await api.delete(`/club-dashboard/projects/${projectId}`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la suppression du projet:', error);
    throw error;
  }
};

// ============================================================================
// PROJECT PARTICIPANTS & ROLES
// ============================================================================

export const getProjectParticipants = async (projectId: string) => {
  try {
    const response = await api.get(`/club-dashboard/projects/${projectId}/participants`);
    return response.data.data.items;
  } catch (error) {
    console.error('Erreur lors de la récupération des participants:', error);
    throw error;
  }
};

export const addProjectParticipant = async (projectId: string, utilisateurId: string) => {
  try {
    const response = await api.post(`/club-dashboard/projects/${projectId}/participants`, {
      utilisateurId,
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du participant:', error);
    throw error;
  }
};

export const removeProjectParticipant = async (projectId: string, utilisateurId: string) => {
  try {
    const response = await api.delete(
      `/club-dashboard/projects/${projectId}/participants/${utilisateurId}`
    );
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la suppression du participant:', error);
    throw error;
  }
};

export const inviteTeacherToProject = async (projectId: string, teacherId: string) => {
  try {
    const response = await api.post(`/club-dashboard/projects/${projectId}/invite-teacher`, {
      teacherId,
    });
    return response.data.data;
  } catch (error) {
    console.error('Erreur lors de l\'invitation de l\'enseignant:', error);
    throw error;
  }
};
