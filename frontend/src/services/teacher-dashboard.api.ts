import api from './api';

// ============================================================================
// EVENTS - Global View (Read Only)
// ============================================================================

export const getAllEvents = async () => {
  try {
    const response = await api.get('/teacher-dashboard/events');
    return response.data.items;
  } catch (error) {
    console.error('Erreur lors de la récupération des événements:', error);
    throw error;
  }
};

export const getEventById = async (eventId: string) => {
  try {
    const response = await api.get(`/teacher-dashboard/events/${eventId}`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'événement:', error);
    throw error;
  }
};

// ============================================================================
// PROJECTS - Global View (Read Only)
// ============================================================================

export const getAllProjects = async () => {
  try {
    const response = await api.get('/teacher-dashboard/projects');
    return response.data.items;
  } catch (error) {
    console.error('Erreur lors de la récupération des projets:', error);
    throw error;
  }
};

export const getProjectById = async (projectId: string) => {
  try {
    const response = await api.get(`/teacher-dashboard/projects/${projectId}`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération du projet:', error);
    throw error;
  }
};

// ============================================================================
// TEACHER - Event Invitations
// ============================================================================

export const getTeacherEventInvitations = async () => {
  try {
    const response = await api.get('/teacher-dashboard/teacher/event-invitations');
    return response.data.items;
  } catch (error) {
    console.error('Erreur lors de la récupération des invitations:', error);
    throw error;
  }
};

export const respondToEventInvitation = async (
  invitationId: string,
  statut: 'confirme' | 'annule'
) => {
  try {
    const response = await api.patch(
      `/teacher-dashboard/teacher/event-invitations/${invitationId}`,
      { statut }
    );
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la réponse à l\'invitation:', error);
    throw error;
  }
};

// ============================================================================
// TEACHER - Project Encadrement
// ============================================================================

export const getTeacherProjectEncadrement = async () => {
  try {
    const response = await api.get('/teacher-dashboard/teacher/projects');
    return response.data.items;
  } catch (error) {
    console.error('Erreur lors de la récupération des projets encadrés:', error);
    throw error;
  }
};

export const getTeacherProjectInvitations = async () => {
  try {
    const response = await api.get('/teacher-dashboard/teacher/project-invitations');
    return response.data.items;
  } catch (error) {
    console.error('Erreur lors de la récupération des invitations de projet:', error);
    throw error;
  }
};

// ============================================================================
// TEACHER - Event Encadrement
// ============================================================================

export const getTeacherEventEncadrement = async () => {
  try {
    const response = await api.get('/teacher-dashboard/teacher/events');
    return response.data.items;
  } catch (error) {
    console.error('Erreur lors de la récupération des événements encadrés:', error);
    throw error;
  }
};

// ============================================================================
// TEACHER - Pending Event Invitations (New System)
// ============================================================================

export const getPendingEventInvitations = async () => {
  try {
    const response = await api.get('/teacher-dashboard/teacher/event-invitations/pending');
    return response.data.items;
  } catch (error) {
    console.error('Erreur lors de la récupération des invitations en attente:', error);
    throw error;
  }
};

export const respondToEventInvitationPending = async (
  invitationId: string,
  statut: 'accepte' | 'refuse',
  message?: string
) => {
  try {
    const response = await api.patch(
      `/teacher-dashboard/teacher/event-invitations/${invitationId}/respond`,
      { statut, message }
    );
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la réponse à l\'invitation:', error);
    throw error;
  }
};

// ============================================================================
// TEACHER - Pending Project Invitations (New System)
// ============================================================================

export const getPendingProjectInvitations = async () => {
  try {
    const response = await api.get('/teacher-dashboard/teacher/project-invitations/pending');
    return response.data.items;
  } catch (error) {
    console.error('Erreur lors de la récupération des invitations de projet en attente:', error);
    throw error;
  }
};

export const respondToProjectInvitation = async (
  invitationId: string,
  statut: 'accepte' | 'refuse',
  message?: string
) => {
  try {
    const response = await api.patch(
      `/teacher-dashboard/teacher/project-invitations/${invitationId}/respond`,
      { statut, message }
    );
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la réponse à l\'invitation de projet:', error);
    throw error;
  }
};
