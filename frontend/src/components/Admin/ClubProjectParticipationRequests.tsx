import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import * as clubDashboardApi from '@/services/club-dashboard.api';
import {
  getProjectParticipationRequests,
  respondToParticipationRequest,
} from '@/services/participation-request.api';

interface Project {
  id: string;
  titre: string;
}

interface RequestItem {
  id: string;
  project?: {
    id: string;
    titre: string;
  };
  student?: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    niveau?: string;
    filiere?: string;
  };
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  dateRequete: string;
  dateReponse?: string;
}

const statusLabels: Record<RequestItem['status'], string> = {
  pending: 'En attente',
  accepted: 'Acceptée',
  rejected: 'Refusée',
  cancelled: 'Annulée',
};

const statusVariants: Record<RequestItem['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  accepted: 'default',
  rejected: 'destructive',
  cancelled: 'secondary',
};

export function ClubProjectParticipationRequests() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      try {
        const data = await clubDashboardApi.listClubProjects();
        setProjects(data || []);
        if (data?.length > 0) {
          setSelectedProject(data[0]);
          await loadRequests(data[0].id);
        }
      } catch (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les projets',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, []);

  const loadRequests = async (projectId: string) => {
    try {
      setRequestsLoading(true);
      const data = await getProjectParticipationRequests(projectId);
      setRequests(data.requests || []);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les demandes',
        variant: 'destructive',
      });
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleSelectProject = async (project: Project) => {
    setSelectedProject(project);
    await loadRequests(project.id);
  };

  const handleRespond = async (requestId: string, action: 'accept' | 'reject') => {
    if (!selectedProject) return;

    try {
      await respondToParticipationRequest(requestId, action);
      toast({
        title: 'Succès',
        description: action === 'accept' ? 'Demande acceptée' : 'Demande refusée',
      });
      await loadRequests(selectedProject.id);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de traiter la demande',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Demandes de participation aux projets</CardTitle>
          <CardDescription>
            Consultez et validez les demandes envoyées par les étudiants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {projects.length === 0 ? (
            <p className="text-gray-500">Aucun projet créé</p>
          ) : (
            <>
              <div className="flex gap-2 flex-wrap">
                {projects.map((project) => (
                  <Button
                    key={project.id}
                    variant={selectedProject?.id === project.id ? 'default' : 'outline'}
                    onClick={() => handleSelectProject(project)}
                  >
                    {project.titre}
                  </Button>
                ))}
              </div>

              {selectedProject && (
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <h3 className="font-semibold text-indigo-900">{selectedProject.titre}</h3>
                    <p className="text-sm text-indigo-700">
                      Demandes de participation reçues pour ce projet
                    </p>
                  </div>

                  {requestsLoading ? (
                    <div>Chargement des demandes...</div>
                  ) : requests.length === 0 ? (
                    <div className="text-center p-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">Aucune demande reçue</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="font-semibold">Demandes ({requests.length})</h4>
                      {requests.map((request) => (
                        <div
                          key={request.id}
                          className="p-4 border rounded-lg bg-white space-y-3"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium">
                                {request.student?.prenom} {request.student?.nom}
                              </p>
                              <p className="text-sm text-gray-600">{request.student?.email}</p>
                              {request.student?.niveau && (
                                <p className="text-xs text-gray-500">
                                  {request.student?.niveau}
                                  {request.student?.filiere ? ` - ${request.student?.filiere}` : ''}
                                </p>
                              )}
                            </div>
                            <Badge variant={statusVariants[request.status]}>
                              {statusLabels[request.status]}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-500">Projet:</span>{' '}
                              <span className="font-medium">{request.project?.titre || selectedProject.titre}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Date:</span>{' '}
                              <span className="font-medium">
                                {format(new Date(request.dateRequete), 'dd MMMM yyyy HH:mm', { locale: fr })}
                              </span>
                            </div>
                          </div>

                          {request.message && (
                            <div className="p-3 bg-gray-50 rounded text-sm text-gray-700">
                              {request.message}
                            </div>
                          )}

                          {request.status === 'pending' && (
                            <div className="flex flex-wrap gap-2">
                              <Button onClick={() => handleRespond(request.id, 'accept')}>
                                Accepter
                              </Button>
                              <Button variant="destructive" onClick={() => handleRespond(request.id, 'reject')}>
                                Refuser
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
