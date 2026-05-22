import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import * as clubDashboardApi from '@/services/club-dashboard.api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Project {
  id: string;
  titre: string;
  description?: string;
  objectif?: string;
  dateDebut: string;
  deadline: string;
  statut: string;
  progression: number;
  enseignantId: string;
  enseignant: string;
  etudiantsCount: number;
  etudiants: Array<{
    id: string;
    nom: string;
    prenom: string;
    email: string;
  }>;
  createdAt: string;
}

export function ClubProjectManagement() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    objectif: '',
    dateDebut: '',
    deadline: '',
    enseignantId: '',
    statut: 'en_attente',
    progression: '0',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await clubDashboardApi.listClubProjects();
      setProjects(data);
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

  const resetForm = () => {
    setFormData({
      titre: '',
      description: '',
      objectif: '',
      dateDebut: '',
      deadline: '',
      enseignantId: '',
      statut: 'en_attente',
      progression: '0',
    });
    setEditingProject(null);
  };

  const handleOpenDialog = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        titre: project.titre,
        description: project.description || '',
        objectif: project.objectif || '',
        dateDebut: project.dateDebut,
        deadline: project.deadline,
        enseignantId: project.enseignantId,
        statut: project.statut,
        progression: project.progression.toString(),
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.titre || !formData.deadline) {
      toast({
        title: 'Erreur',
        description: 'Le titre et la deadline sont obligatoires',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingProject) {
        await clubDashboardApi.updateClubProject(editingProject.id, {
          ...formData,
          progression: parseInt(formData.progression),
        });
        toast({
          title: 'Succès',
          description: 'Projet mis à jour',
        });
      } else {
        await clubDashboardApi.createClubProject({
          ...formData,
        });
        toast({
          title: 'Succès',
          description: 'Projet créé',
        });
      }
      setIsDialogOpen(false);
      await loadProjects();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder le projet',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (projectId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce projet?')) {
      try {
        await clubDashboardApi.deleteClubProject(projectId);
        toast({
          title: 'Succès',
          description: 'Projet supprimé',
        });
        await loadProjects();
      } catch (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de supprimer le projet',
          variant: 'destructive',
        });
      }
    }
  };

  const getStatutLabel = (statut: string) => {
    const labels: Record<string, string> = {
      en_attente: 'En attente',
      en_cours: 'En cours',
      termine: 'Terminé',
      annule: 'Annulé',
    };
    return labels[statut] || statut;
  };

  const getProgressionColor = (progression: number) => {
    if (progression < 33) return 'bg-red-500';
    if (progression < 66) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Gestion des Projets</CardTitle>
            <CardDescription>Créer et gérer les projets du club</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>+ Nouveau Projet</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProject ? 'Modifier' : 'Créer'} un projet
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Titre *</label>
                  <Input
                    value={formData.titre}
                    onChange={(e) =>
                      setFormData({ ...formData, titre: e.target.value })
                    }
                    placeholder="Titre du projet"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Description du projet"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Objectif</label>
                  <Textarea
                    value={formData.objectif}
                    onChange={(e) =>
                      setFormData({ ...formData, objectif: e.target.value })
                    }
                    placeholder="Objectif du projet"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Date de début</label>
                    <Input
                      type="date"
                      value={formData.dateDebut}
                      onChange={(e) =>
                        setFormData({ ...formData, dateDebut: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Deadline *</label>
                    <Input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) =>
                        setFormData({ ...formData, deadline: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Statut</label>
                    <Select
                      value={formData.statut}
                      onValueChange={(value) =>
                        setFormData({ ...formData, statut: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en_attente">En attente</SelectItem>
                        <SelectItem value="en_cours">En cours</SelectItem>
                        <SelectItem value="termine">Terminé</SelectItem>
                        <SelectItem value="annule">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Progression (%)</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.progression}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          progression: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Enseignant (ID)</label>
                  <Input
                    value={formData.enseignantId}
                    onChange={(e) =>
                      setFormData({ ...formData, enseignantId: e.target.value })
                    }
                    placeholder="ID de l'enseignant"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave}>Enregistrer</Button>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.length === 0 ? (
            <p className="text-gray-500">Aucun projet créé</p>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{project.titre}</h3>
                    <p className="text-sm text-gray-600">{project.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(project)}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(project.id)}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progression</span>
                    <span className="font-medium">{project.progression}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressionColor(
                        project.progression
                      )}`}
                      style={{ width: `${project.progression}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                  <div>
                    <p className="text-gray-600">Statut</p>
                    <p className="font-medium">{getStatutLabel(project.statut)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Encadrant</p>
                    <p className="font-medium">{project.enseignant}</p>
                  </div>
                </div>

                <div className="mt-3 text-sm">
                  <p className="text-gray-600">Deadline</p>
                  <p className="font-medium">
                    {format(new Date(project.deadline), 'dd MMMM yyyy', {
                      locale: fr,
                    })}
                  </p>
                </div>

                <div className="mt-3 p-2 bg-blue-50 rounded">
                  <p className="text-sm font-medium text-blue-900">
                    👥 {project.etudiantsCount} participants
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
