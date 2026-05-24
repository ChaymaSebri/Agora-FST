import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  getMyParticipatingProjects,
  updateProjectTaskStatus,
  type StudentProject,
  type TaskPriority,
  type TaskStatus,
} from '@/services/project-tasks.api';

const statusLabels: Record<TaskStatus, string> = {
  todo: 'À faire',
  in_progress: 'En cours',
  completed: 'Terminée',
  blocked: 'Bloquée',
};

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
};

const statusVariants: Record<TaskStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  todo: 'outline',
  in_progress: 'secondary',
  completed: 'default',
  blocked: 'destructive',
};

const priorityVariants: Record<TaskPriority, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  low: 'secondary',
  medium: 'outline',
  high: 'destructive',
};

export default function MyProjects() {
  const [projects, setProjects] = useState<StudentProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const { toast } = useToast();

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await getMyParticipatingProjects();
      setProjects(data || []);
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de charger vos projets', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    const term = query.trim().toLowerCase();
    return projects
      .map((project) => ({
        ...project,
        tasks: project.tasks.filter((task) => {
          const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
          const matchesQuery = !term
            || project.titre.toLowerCase().includes(term)
            || task.title.toLowerCase().includes(term)
            || (task.role || '').toLowerCase().includes(term);
          return matchesStatus && matchesQuery;
        }),
      }))
      .filter((project) => !term || project.titre.toLowerCase().includes(term) || project.tasks.length > 0);
  }, [projects, query, statusFilter]);

  const changeStatus = async (taskId: string, status: TaskStatus) => {
    try {
      await updateProjectTaskStatus(taskId, status);
      toast({ title: 'Statut mis à jour', description: 'Votre tâche a été mise à jour.' });
      await loadProjects();
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de modifier le statut', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto space-y-6 px-4 py-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-foreground">Mes Projets</h1>
          <p className="text-muted-foreground">Suivez vos projets, vos rôles et l’état de vos tâches.</p>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Rechercher un projet, une tâche ou un rôle"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TaskStatus | 'all')}>
            <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div>Chargement...</div>
        ) : filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              Aucun projet participant à afficher.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            {filteredProjects.map((project) => (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <CardTitle>{project.titre}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">{project.description || 'Sans description'}</p>
                    </div>
                    <Badge variant="outline">{project.club?.nom || 'Club'}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="rounded-md border p-3">
                      <div className="text-xl font-bold">{project.stats.completedTasks}</div>
                      <div className="text-xs text-muted-foreground">Terminées</div>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-xl font-bold">{project.stats.inProgressTasks}</div>
                      <div className="text-xs text-muted-foreground">En cours</div>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-xl font-bold">{project.stats.blockedTasks}</div>
                      <div className="text-xs text-muted-foreground">Bloquées</div>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-xl font-bold">{project.stats.remainingTasks}</div>
                      <div className="text-xs text-muted-foreground">Restantes</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Progression projet</span>
                      <span>{project.stats.progressPercentage}%</span>
                    </div>
                    <Progress value={project.stats.progressPercentage} />
                  </div>

                  {project.tasks.length === 0 ? (
                    <div className="rounded-lg bg-muted p-6 text-center text-muted-foreground">
                      Aucune tâche assignée dans ce projet.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {project.tasks.map((task) => (
                        <div key={task.id} className="rounded-lg border p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold">{task.title}</h3>
                                <Badge variant={statusVariants[task.status]}>{statusLabels[task.status]}</Badge>
                                <Badge variant={priorityVariants[task.priority]}>{priorityLabels[task.priority]}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{task.description || 'Sans description'}</p>
                              <div className="flex flex-wrap gap-3 text-sm">
                                {task.role && <span><CheckCircle2 className="mr-1 inline h-4 w-4" />{task.role}</span>}
                                {task.dueDate && (
                                  <span><CalendarDays className="mr-1 inline h-4 w-4" />{new Date(task.dueDate).toLocaleDateString('fr-FR')}</span>
                                )}
                              </div>
                            </div>
                            <Select value={task.status} onValueChange={(value) => changeStatus(task.id, value as TaskStatus)}>
                              <SelectTrigger className="w-full md:w-44"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Object.entries(statusLabels).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
