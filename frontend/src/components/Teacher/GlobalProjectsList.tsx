import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { useToast } from '@/hooks/use-toast';
import * as teacherDashboardApi from '@/services/teacher-dashboard.api';
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
  clubId: string;
  clubName: string;
  createdAt: string;
}

export function GlobalProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAllProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, statusFilter]);

  const loadAllProjects = async () => {
    try {
      const data = await teacherDashboardApi.getAllProjects();
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

  const filterProjects = () => {
    const filtered = projects.filter((project) => {
      const matchesSearch =
        project.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.clubName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.enseignant.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !statusFilter || project.statut === statusFilter;

      return matchesSearch && matchesStatus;
    });
    setFilteredProjects(filtered);
  };

  const handleViewDetails = (project: Project) => {
    setSelectedProject(project);
    setShowDetailsDialog(true);
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

  const getStatutBadge = (statut: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      en_attente: 'outline',
      en_cours: 'default',
      termine: 'secondary',
      annule: 'destructive',
    };

    return <Badge variant={variants[statut]}>{getStatutLabel(statut)}</Badge>;
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tous les Projets</CardTitle>
        <CardDescription>
          Vue globale de tous les projets disponibles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-4">
          <Input
            placeholder="Rechercher par titre, club ou encadrant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          <div>
            <label className="text-sm font-medium">Filtrer par statut</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border rounded mt-1"
            >
              <option value="">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminé</option>
              <option value="annule">Annulé</option>
            </select>
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <p className="text-gray-500">
            {searchTerm || statusFilter
              ? 'Aucun projet ne correspond à votre recherche'
              : 'Aucun projet disponible'}
          </p>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{project.titre}</h3>
                    <p className="text-sm text-gray-600">
                      Club: {project.clubName} | Encadrant: {project.enseignant}
                    </p>
                  </div>
                  {getStatutBadge(project.statut)}
                </div>

                <p className="text-sm text-gray-700 mb-3">{project.description}</p>

                <div className="space-y-2 mb-4">
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

                <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-600">Démarrage</p>
                    <p className="font-medium">
                      {format(new Date(project.dateDebut), 'dd MMM yyyy', {
                        locale: fr,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Deadline</p>
                    <p className="font-medium">
                      {format(new Date(project.deadline), 'dd MMM yyyy', {
                        locale: fr,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Participants</p>
                    <p className="font-medium">{project.etudiantsCount} étudiants</p>
                  </div>
                </div>

                <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(project)}
                    >
                      Voir Détails
                    </Button>
                  </DialogTrigger>
                  {selectedProject?.id === project.id && (
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{selectedProject.titre}</DialogTitle>
                        <DialogDescription>
                          {selectedProject.clubName} - Encadré par {selectedProject.enseignant}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Description</h4>
                          <p className="text-sm text-gray-600">{selectedProject.description}</p>
                        </div>
                        {selectedProject.objectif && (
                          <div>
                            <h4 className="font-semibold mb-2">Objectif</h4>
                            <p className="text-sm text-gray-600">{selectedProject.objectif}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Statut</h4>
                            <p className="text-sm">{getStatutLabel(selectedProject.statut)}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Progression</h4>
                            <p className="text-sm">{selectedProject.progression}%</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Démarrage</h4>
                            <p className="text-sm">
                              {format(new Date(selectedProject.dateDebut), 'dd MMMM yyyy', {
                                locale: fr,
                              })}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm mb-1">Deadline</h4>
                            <p className="text-sm">
                              {format(new Date(selectedProject.deadline), 'dd MMMM yyyy', {
                                locale: fr,
                              })}
                            </p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Participants</h4>
                          <p className="text-sm">{selectedProject.etudiantsCount} étudiants</p>
                        </div>
                      </div>
                    </DialogContent>
                  )}
                </Dialog>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
