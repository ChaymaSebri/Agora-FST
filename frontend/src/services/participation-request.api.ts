import api from './api.js';

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
  const response = await api.post(
    `/student/projects/${projectId}/participation-request`,
    { message }
  );
  return response.data;
};

/**
 * Récupérer les demandes de participation de l'étudiant
 */
export const getMyParticipationRequests = async (): Promise<any> => {
  const response = await api.get('/student/participation-requests');
  return response.data;
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
  const response = await api.get(
    `/club-dashboard/projects/${projectId}/participation-requests`
  );
  return response.data;
};

/**
 * Accepter/refuser une demande de participation
 */
export const respondToParticipationRequest = async (
  projectId: string,
  requestId: string,
  statut: 'accepte' | 'refuse'
): Promise<any> => {
  const response = await api.patch(
    `/club-dashboard/projects/${projectId}/participation-requests/${requestId}/respond`,
    { statut }
  );
  return response.data;
};

/**
 * Annuler une demande de participation (club)
 */
export const cancelParticipationRequest = async (
  projectId: string,
  requestId: string
): Promise<any> => {
  const response = await api.delete(
    `/club-dashboard/projects/${projectId}/participation-requests/${requestId}`
  );
  return response.data;
};
