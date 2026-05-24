import { useEffect, useMemo, useState } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import * as clubDashboardApi from '@/services/club-dashboard.api';
import { TeacherSelect } from '@/components/TeacherSelect';

interface Project {
  id: string;
  titre: string;
  enseignant: string;
  etudiantsCount: number;
  clubId: string;
}

interface Participant {
  id: string;
  nom: string;
  prenom: string;
  email: string;
}

interface ClubStudent extends Participant {
  avatar?: string | null;
  filiere?: string | null;
  niveau?: string | null;
}

export function ClubProjectParticipantsManagement() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [clubStudents, setClubStudents] = useState<ClubStudent[]>([]);
  const [resolvedClubId, setResolvedClubId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [addParticipantDialog, setAddParticipantDialog] = useState(false);
  const [teacherDialog, setTeacherDialog] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();
  }, []);

  const resolveClubId = async (project?: Project | null) => {
    if (project?.clubId) {
      return project.clubId;
    }

    if (resolvedClubId) {
      return resolvedClubId;
    }

    try {
      const profile = await clubDashboardApi.getClubProfile();
      const fallbackClubId = profile?.id || profile?._id || null;
      if (fallbackClubId) {
        setResolvedClubId(fallbackClubId);
      }
      return fallbackClubId;
    } catch {
      return null;
    }
  };

  const loadProjects = async () => {
    try {
      const data = await clubDashboardApi.listClubProjects();
      setProjects(data);
      if (data.length > 0) {
        setSelectedProject(data[0]);
        await loadParticipants(data[0].id);
        const clubId = await resolveClubId(data[0]);
        await loadClubStudents(clubId);
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

  const loadClubStudents = async (clubId?: string | null) => {
    if (!clubId) {
      setClubStudents([]);
      return;
    }

    try {
      setStudentsLoading(true);
      const data = await clubDashboardApi.getClubStudents(clubId);
      setClubStudents(data || []);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les étudiants du club',
        variant: 'destructive',
      });
      setClubStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleProjectSelect = async (project: Project) => {
    setSelectedProject(project);
    setStudentId('');
    setStudentSearch('');
    await loadParticipants(project.id);
    const clubId = await resolveClubId(project);
    await loadClubStudents(clubId);
  };

  const selectableStudents = useMemo(() => {
    const participantIds = new Set(participants.map((participant) => participant.id));
    const term = studentSearch.trim().toLowerCase();

    return clubStudents.filter((student) => {
      const isParticipant = participantIds.has(student.id);
      const matchesSearch = !term
        || [student.nom, student.prenom, student.email, student.filiere, student.niveau]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(term);

      return !isParticipant && matchesSearch;
    });
  }, [clubStudents, participants, studentSearch]);

  const studentInitials = (student: { nom?: string; prenom?: string }) => {
    const first = student.prenom?.[0] || '';
    const last = student.nom?.[0] || '';
    return `${first}${last}`.toUpperCase() || 'ET';
  };

  const handleAddParticipant = async () => {
    if (!selectedProject || !studentId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un étudiant',
        variant: 'destructive',
      });
      return;
    }

    try {
      await clubDashboardApi.addProjectParticipant(selectedProject.id, studentId);
      toast({
        title: 'Succès',
        description: 'Participant ajouté',
      });
      setAddParticipantDialog(false);
      setStudentId('');
      setStudentSearch('');
      await loadParticipants(selectedProject.id);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error?.response?.data?.error?.message || "Impossible d'ajouter le participant",
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
      <div className="grid gap-6">
        {projects.length === 0 ? (
          <div className="rounded-lg border bg-white p-8 text-center text-gray-500">Aucun projet créé</div>
        ) : (
          projects.map((project) => {
            const isSelected = selectedProject?.id === project.id;
            const projectParticipants = isSelected ? participants : [];
            const studentOptions = isSelected ? selectableStudents : [];

            return (
              <Card key={project.id} className={isSelected ? 'ring-2 ring-primary/30' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>{project.titre}</CardTitle>
                      <CardDescription>
                        Encadrant: {project.enseignant} · Participants: {project.etudiantsCount}
                      </CardDescription>
                    </div>
                    <Button variant={isSelected ? 'default' : 'outline'} onClick={() => void handleProjectSelect(project)}>
                      Voir
                    </Button>
                  </div>
                </CardHeader>
                {isSelected && (
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <h3 className="font-semibold text-purple-900">{selectedProject.titre}</h3>
                      <p className="text-sm text-purple-700">Encadrant: {selectedProject.enseignant}</p>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Dialog open={addParticipantDialog} onOpenChange={setAddParticipantDialog}>
                        <DialogTrigger asChild>
                          <Button variant="secondary">+ Ajouter un participant</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Ajouter un participant</DialogTitle>
                            <DialogDescription>
                              Sélectionnez un étudiant appartenant au club créateur du projet
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Input
                              placeholder="Rechercher un étudiant"
                              value={studentSearch}
                              onChange={(e) => setStudentSearch(e.target.value)}
                            />
                            <Select value={studentId} onValueChange={setStudentId} disabled={studentsLoading}>
                              <SelectTrigger>
                                <SelectValue placeholder={studentsLoading ? 'Chargement...' : 'Choisir un étudiant'} />
                              </SelectTrigger>
                              <SelectContent>
                                {studentsLoading ? (
                                  <SelectItem value="__loading" disabled>Chargement des étudiants...</SelectItem>
                                ) : studentOptions.length === 0 ? (
                                  <SelectItem value="__empty" disabled>Aucun étudiant disponible</SelectItem>
                                ) : (
                                  studentOptions.map((student) => (
                                    <SelectItem key={student.id} value={student.id}>
                                      <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                          <AvatarImage src={student.avatar || undefined} alt={`${student.prenom} ${student.nom}`} />
                                          <AvatarFallback>{studentInitials(student)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col text-left">
                                          <span className="text-sm font-medium">
                                            {student.prenom} {student.nom}
                                          </span>
                                          <span className="text-xs text-gray-500">{student.email}</span>
                                          <span className="text-[11px] text-gray-400">
                                            {[student.filiere, student.niveau].filter(Boolean).join(' · ')}
                                          </span>
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <Button onClick={handleAddParticipant} className="w-full">
                              Ajouter
                            </Button>
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
                              Sélectionnez un enseignant à inviter à encadrer ce projet
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <TeacherSelect
                              value={teacherId}
                              onValueChange={setTeacherId}
                              placeholder="Choisir un enseignant..."
                            />
                            <Button onClick={handleInviteTeacher} className="w-full">
                              Inviter
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {participantsLoading ? (
                      <div>Chargement des participants...</div>
                    ) : projectParticipants.length === 0 ? (
                      <div className="text-center p-8 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">Aucun participant ajouté</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <h4 className="font-semibold">Participants ({projectParticipants.length})</h4>
                        {projectParticipants.map((participant) => (
                          <div
                            key={participant.id}
                            className="flex items-center justify-between p-3 border rounded-lg bg-white"
                          >
                            <div className="flex-1">
                              <p className="font-medium">
                                {participant.nom} {participant.prenom}
                              </p>
                              <p className="text-sm text-gray-600">{participant.email}</p>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="outline">Participant</Badge>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRemoveParticipant(participant.id)}
                              >
                                Supprimer
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}