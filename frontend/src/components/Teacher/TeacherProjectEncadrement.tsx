import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  etudiantsCount: number;
  etudiants: Array<{
    id: string;
    nom: string;
    prenom: string;
    email: string;
  }>;
  clubName: string;
  createdAt: string;
}

export function TeacherProjectEncadrement() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await teacherDashboardApi.getTeacherProjectEncadrement();
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
        <CardTitle>Projets que j'Encadre</CardTitle>
        <CardDescription>
          Liste des projets dont vous êtes l'encadrant
        </CardDescription>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <p className="text-gray-500">Aucun projet encadré pour le moment</p>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{project.titre}</h3>
                    <p className="text-sm text-gray-600">
                      Club: {project.clubName}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {getStatutBadge(project.statut)}
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-2">{project.description}</p>

                {project.objectif && (
                  <p className="text-sm text-gray-600 mb-3">
                    <strong>Objectif:</strong> {project.objectif}
                  </p>
                )}

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

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-600">Deadline</p>
                    <p className="font-medium">
                      {format(new Date(project.deadline), 'dd MMMM yyyy', {
                        locale: fr,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Participants</p>
                    <p className="font-medium">{project.etudiantsCount} étudiants</p>
                  </div>
                </div>

                {project.etudiantsCount > 0 && (
                  <div className="p-3 bg-blue-50 rounded">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      Participants:
                    </p>
                    <div className="space-y-1">
                      {project.etudiants.map((etudiant) => (
                        <div key={etudiant.id} className="text-sm text-blue-700">
                          {etudiant.nom} {etudiant.prenom} ({etudiant.email})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
