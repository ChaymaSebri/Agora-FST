import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import * as clubDashboardApi from '@/services/club-dashboard.api';

interface Project {
  id: string;
  titre: string;
  enseignant: string;
  etudiantsCount: number;
}

interface Participant {
  id: string;
  nom: string;
  prenom: string;
  email: string;
}

export function ClubProjectParticipantsManagement() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [addParticipantDialog, setAddParticipantDialog] = useState(false);
  const [teacherDialog, setTeacherDialog] = useState(false);
  const [userId, setUserId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await clubDashboardApi.listClubProjects();
      setProjects(data);
      if (data.length > 0) {
        setSelectedProject(data[0]);
        await loadParticipants(data[0].id);
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

  const loadParticipants = async (projectId: string) => {
    try {
      setParticipantsLoading(true);
      const data = await clubDashboardApi.getProjectParticipants(projectId);
      setParticipants(data);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les participants',
        variant: 'destructive',
      });
    } finally {
      setParticipantsLoading(false);
    }
  };

  const handleProjectSelect = async (project: Project) => {
    setSelectedProject(project);
    await loadParticipants(project.id);
  };

  const handleAddParticipant = async () => {
    if (!selectedProject || !userId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un utilisateur',
        variant: 'destructive',
      });
      return;
    }

    try {
      await clubDashboardApi.addProjectParticipant(selectedProject.id, userId);
      toast({
        title: 'Succès',
        description: 'Participant ajouté',
      });
      setAddParticipantDialog(false);
      setUserId('');
      await loadParticipants(selectedProject.id);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ajouter le participant',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    if (!selectedProject) return;

    if (confirm('Êtes-vous sûr de vouloir supprimer ce participant?')) {
      try {
        await clubDashboardApi.removeProjectParticipant(
          selectedProject.id,
          participantId
        );
        toast({
          title: 'Succès',
          description: 'Participant supprimé',
        });
        await loadParticipants(selectedProject.id);
      } catch (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de supprimer le participant',
          variant: 'destructive',
        });
      }
    }
  };

  const handleInviteTeacher = async () => {
    if (!selectedProject || !teacherId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un enseignant',
        variant: 'destructive',
      });
      return;
    }

    try {
      await clubDashboardApi.inviteTeacherToProject(selectedProject.id, teacherId);
      toast({
        title: 'Succès',
        description: 'Enseignant invité',
      });
      setTeacherDialog(false);
      setTeacherId('');
      await loadProjects();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'inviter l\'enseignant',
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
          <CardTitle>Gestion des Participants et Rôles</CardTitle>
          <CardDescription>
            Gérez les participants et les encadrants de vos projets
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
                    variant={
                      selectedProject?.id === project.id ? 'default' : 'outline'
                    }
                    onClick={() => handleProjectSelect(project)}
                  >
                    {project.titre}
                  </Button>
                ))}
              </div>

              {selectedProject && (
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h3 className="font-semibold text-purple-900">
                      {selectedProject.titre}
                    </h3>
                    <p className="text-sm text-purple-700">
                      Encadrant: {selectedProject.enseignant}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Dialog open={addParticipantDialog} onOpenChange={setAddParticipantDialog}>
                      <DialogTrigger asChild>
                        <Button variant="secondary">+ Ajouter un participant</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Ajouter un participant</DialogTitle>
                          <DialogDescription>
                            Entrez l'ID de l'étudiant à ajouter
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            placeholder="ID de l'étudiant"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                          />
                          <Button onClick={handleAddParticipant}>Ajouter</Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={teacherDialog} onOpenChange={setTeacherDialog}>
                      <DialogTrigger asChild>
                        <Button variant="secondary">Inviter un encadrant</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Inviter un encadrant</DialogTitle>
                          <DialogDescription>
                            Entrez l'ID de l'enseignant à inviter
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            placeholder="ID de l'enseignant"
                            value={teacherId}
                            onChange={(e) => setTeacherId(e.target.value)}
                          />
                          <Button onClick={handleInviteTeacher}>Inviter</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {participantsLoading ? (
                    <div>Chargement des participants...</div>
                  ) : participants.length === 0 ? (
                    <div className="text-center p-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">Aucun participant ajouté</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="font-semibold">
                        Participants ({participants.length})
                      </h4>
                      {participants.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-3 border rounded-lg bg-white"
                        >
                          <div className="flex-1">
                            <p className="font-medium">
                              {p.nom} {p.prenom}
                            </p>
                            <p className="text-sm text-gray-600">{p.email}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline">Participant</Badge>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveParticipant(p.id)}
                            >
                              Supprimer
                            </Button>
                          </div>
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
