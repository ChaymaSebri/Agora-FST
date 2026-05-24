import api from './api.js';

const unwrap = (response: any) => response?.data?.data ?? response?.data;

// ============================================================================
// STUDENT PARTICIPATION REQUESTS
// ============================================================================

/**
 * Demander de participer à un projet
 */
export const requestProjectParticipation = async (
  projectId: string,
  message?: string
): Promise<any> => {
  const response = await api.post('/project-participation-requests', {
    projectId,
    message,
  });
  return unwrap(response);
};

/**
 * Récupérer les demandes de participation de l'étudiant
 */
export const getMyParticipationRequests = async (): Promise<any> => {
  const response = await api.get('/project-participation-requests/me');
  return unwrap(response);
};

// ============================================================================
// CLUB PARTICIPATION REQUESTS MANAGEMENT
// ============================================================================

/**
 * Récupérer les demandes de participation pour un projet (pour le club)
 */
export const getProjectParticipationRequests = async (
  projectId: string
): Promise<any> => {
  const response = await api.get(`/project-participation-requests/project/${projectId}`);
  return unwrap(response);
};

/**
 * Accepter/refuser une demande de participation
 */
export const respondToParticipationRequest = async (
  requestId: string,
  action: 'accept' | 'reject'
): Promise<any> => {
  const response = await api.patch(`/project-participation-requests/${requestId}/${action}`);
  return unwrap(response);
};

/**
 * Annuler une demande de participation (club)
 */
export const cancelParticipationRequest = async (
  requestId: string
): Promise<any> => {
  const response = await api.patch(`/project-participation-requests/${requestId}/cancel`);
  return unwrap(response);
};
