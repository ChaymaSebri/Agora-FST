import { useCallback, useState } from 'react';
import {
  requestProjectParticipation,
  getMyParticipationRequests,
  getProjectParticipationRequests,
  respondToParticipationRequest,
  cancelParticipationRequest,
} from '../services/participation-request.api';

export interface ParticipationRequest {
  id: string;
  projet?: {
    id: string;
    titre: string;
    description: string;
    deadline: string;
    statut: string;
  };
  etudiant?: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    niveau: string;
    filiere: string;
  };
  club?: {
    id: string;
    nom: string;
  };
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  statut?: 'en_attente' | 'confirme' | 'annule';
  message?: string;
  dateRequete: string;
  dateReponse?: string;
  student?: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    niveau?: string;
    filiere?: string;
  };
  project?: {
    id: string;
    titre: string;
    description?: string;
    deadline?: string;
    statut?: string;
  };
}

/**
 * Hook pour les demandes de participation des étudiants
 */
export function useStudentParticipationRequests() {
  const [requests, setRequests] = useState<ParticipationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMyRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getMyParticipationRequests();
      setRequests(response.requests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestParticipation = useCallback(
    async (projectId: string, message?: string) => {
      try {
        setError(null);
        await requestProjectParticipation(projectId, message);
        await fetchMyRequests();
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la demande';
        setError(errorMessage);
        return false;
      }
    },
    [fetchMyRequests]
  );

  return {
    requests,
    isLoading,
    error,
    fetchMyRequests,
    requestParticipation,
  };
}

/**
 * Hook pour la gestion des demandes de participation pour les clubs
 */
export function useClubParticipationRequests() {
  const [requests, setRequests] = useState<ParticipationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjectRequests = useCallback(async (projectId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getProjectParticipationRequests(projectId);
      setRequests(response.requests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const respond = useCallback(
    async (projectId: string, requestId: string, action: 'accept' | 'reject') => {
      try {
        setError(null);
        await respondToParticipationRequest(requestId, action);
        await fetchProjectRequests(projectId);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la réponse';
        setError(errorMessage);
        return false;
      }
    },
    [fetchProjectRequests]
  );

  const cancel = useCallback(
    async (projectId: string, requestId: string) => {
      try {
        setError(null);
        await cancelParticipationRequest(requestId);
        await fetchProjectRequests(projectId);
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'annulation';
        setError(errorMessage);
        return false;
      }
    },
    [fetchProjectRequests]
  );

  return {
    requests,
    isLoading,
    error,
    fetchProjectRequests,
    respond,
    cancel,
  };
}
