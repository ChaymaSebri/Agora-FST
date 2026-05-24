import { useEffect, useMemo, useState } from 'react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import * as clubDashboardApi from '@/services/club-dashboard.api';
import {
  createProjectTask,
  deleteProjectTask,
  getProjectTasks,
  updateProjectTask,
  type ProjectProgressStats,
  type ProjectTask,
  type ProjectTaskUser,
  type TaskPriority,
  type TaskStatus,
} from '@/services/project-tasks.api';

interface Project {
  id: string;
  titre: string;
  description?: string;
  deadline?: string;
  progression?: number;
}

interface TaskForm {
  title: string;
  description: string;
  assignedTo: string;
  role: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
}

interface ProjectBundle {
  participants: ProjectTaskUser[];
  tasks: ProjectTask[];
  stats: ProjectProgressStats;
  loading: boolean;
}

interface ProjectFilterState {
  status: TaskStatus | 'all';
  priority: TaskPriority | 'all';
}

const emptyStats: ProjectProgressStats = {
  totalTasks: 0,
  completedTasks: 0,
  inProgressTasks: 0,
  blockedTasks: 0,
  todoTasks: 0,
  remainingTasks: 0,
  progressPercentage: 0,
};

const defaultForm: TaskForm = {
  title: '',
  description: '',
  assignedTo: '',
  role: '',
  priority: 'medium',
  status: 'todo',
  dueDate: '',
};

const defaultFilters: ProjectFilterState = {
  status: 'all',
  priority: 'all',
};

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

function userName(user?: ProjectTaskUser | null) {
  return [user?.prenom, user?.nom].filter(Boolean).join(' ') || user?.email || 'Participant';
}

function toInputDate(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

export function ClubProjectTasksManagement() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectBundles, setProjectBundles] = useState<Record<string, ProjectBundle>>({});
  const [projectFilters, setProjectFilters] = useState<Record<string, ProjectFilterState>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [form, setForm] = useState<TaskForm>(defaultForm);
  const { toast } = useToast();

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const getBundle = (projectId: string): ProjectBundle =>
    projectBundles[projectId] || {
      participants: [],
      tasks: [],
      stats: emptyStats,
      loading: false,
    };

  const getFilters = (projectId: string): ProjectFilterState => projectFilters[projectId] || defaultFilters;

  const setFilters = (projectId: string, patch: Partial<ProjectFilterState>) => {
    setProjectFilters((previous) => ({
      ...previous,
      [projectId]: {
        ...defaultFilters,
        ...(previous[projectId] || {}),
        ...patch,
      },
    }));
  };

  const loadProjectBundle = async (projectId: string) => {
    setProjectBundles((previous) => ({
      ...previous,
      [projectId]: {
        ...(previous[projectId] || {
          participants: [],
          tasks: [],
          stats: emptyStats,
          loading: false,
        }),
        loading: true,
      },
    }));

    try {
      const data = await getProjectTasks(projectId);
      setProjectBundles((previous) => ({
        ...previous,
        [projectId]: {
          participants: data.participants || [],
          tasks: data.tasks || [],
          stats: data.stats || emptyStats,
          loading: false,
        },
      }));
    } catch (error) {
      console.error('Erreur lors du chargement des tâches du projet', error);
      setProjectBundles((previous) => ({
        ...previous,
        [projectId]: {
          participants: [],
          tasks: [],
          stats: emptyStats,
          loading: false,
        },
      }));
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const data = await clubDashboardApi.listClubProjects();
        const nextProjects = data || [];
        setProjects(nextProjects);

        if (nextProjects.length === 0) {
          setProjectBundles({});
          return;
        }

        const bundles = await Promise.all(
          nextProjects.map(async (project) => {
            try {
              const projectTasks = await getProjectTasks(project.id);
              return [project.id, {
                participants: projectTasks.participants || [],
                tasks: projectTasks.tasks || [],
                stats: projectTasks.stats || emptyStats,
                loading: false,
              }] as const;
            } catch (error) {
              console.error(`Erreur lors du chargement du projet ${project.id}`, error);
              return [project.id, {
                participants: [],
                tasks: [],
                stats: emptyStats,
                loading: false,
              }] as const;
            }
          })
        );

        setProjectBundles(Object.fromEntries(bundles));
        setSelectedProjectId(nextProjects[0].id);
      } catch (error) {
        console.error('Erreur lors du chargement des projets:', error);
        toast({ title: 'Erreur', description: 'Impossible de charger les projets', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, [toast]);

  const openCreateDialog = (project: Project) => {
    const bundle = getBundle(project.id);
    setSelectedProjectId(project.id);
    setEditingTask(null);
    setForm({
      ...defaultForm,
      assignedTo: bundle.participants[0]?.id || '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (task: ProjectTask) => {
    const projectId = task.projectId;
    const project = projects.find((item) => item.id === projectId) || null;
    const bundle = getBundle(projectId);

    setSelectedProjectId(projectId);
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      assignedTo: task.assignedTo?.id || bundle.participants[0]?.id || '',
      role: task.role || '',
      priority: task.priority,
      status: task.status,
      dueDate: toInputDate(task.dueDate),
    });

    if (!project && task.project?.id) {
      setSelectedProjectId(task.project.id);
    }

    setDialogOpen(true);
  };

  const saveTask = async () => {
    if (!selectedProject) return;

    if (!form.title.trim() || !form.assignedTo) {
      toast({ title: 'Erreur', description: 'Titre et participant sont obligatoires', variant: 'destructive' });
      return;
    }

    const bundle = getBundle(selectedProject.id);
    const participantIds = new Set(bundle.participants.map((participant) => participant.id));

    if (!participantIds.has(form.assignedTo)) {
      toast({ title: 'Erreur', description: 'Le participant doit appartenir au projet', variant: 'destructive' });
      return;
    }

    try {
      const payload = {
        projectId: selectedProject.id,
        title: form.title.trim(),
        description: form.description.trim(),
        assignedTo: form.assignedTo,
        role: form.role.trim(),
        priority: form.priority,
        status: form.status,
        dueDate: form.dueDate || null,
      };

      if (editingTask) {
        await updateProjectTask(editingTask.id, payload);
        toast({ title: 'Tâche modifiée', description: 'La tâche a été mise à jour.' });
      } else {
        await createProjectTask(payload);
        toast({ title: 'Tâche créée', description: 'La tâche a été assignée au participant.' });
      }

      setDialogOpen(false);
      await loadProjectBundle(selectedProject.id);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error?.response?.data?.error?.message || 'Impossible d’enregistrer la tâche',
        variant: 'destructive',
      });
    }
  };

  const removeTask = async (task: ProjectTask) => {
    try {
      await deleteProjectTask(task.id);
      toast({ title: 'Tâche supprimée', description: 'La tâche a été retirée du projet.' });
      await loadProjectBundle(task.projectId);
    } catch {
      toast({ title: 'Erreur', description: 'Impossible de supprimer la tâche', variant: 'destructive' });
    }
  };

  const visibleTasksForProject = (projectId: string) => {
    const bundle = getBundle(projectId);
    const filters = getFilters(projectId);

    return bundle.tasks.filter((task) => {
      const matchesStatus = filters.status === 'all' || task.status === filters.status;
      const matchesPriority = filters.priority === 'all' || task.priority === filters.priority;
      return matchesStatus && matchesPriority;
    });
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold">Gestion des tâches par projet</h2>
          <p className="text-sm text-muted-foreground">Chaque projet dispose de ses tâches, participants et indicateurs.</p>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">Aucun projet créé</CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {projects.map((project) => {
            const bundle = getBundle(project.id);
            const filters = getFilters(project.id);
            const visibleTasks = visibleTasksForProject(project.id);
            const participantsPreview = bundle.participants.slice(0, 6);
            const moreParticipants = Math.max(bundle.participants.length - participantsPreview.length, 0);

            return (
              <Card key={project.id} className="border shadow-sm">
                <CardHeader className="space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{project.titre}</CardTitle>
                      <CardDescription>
                        {project.description || 'Aucune description'}
                        {project.deadline ? ` · Deadline ${new Date(project.deadline).toLocaleDateString('fr-FR')}` : ''}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => loadProjectBundle(project.id)} disabled={bundle.loading}>
                        Rafraîchir
                      </Button>
                      <Button onClick={() => openCreateDialog(project)} disabled={bundle.participants.length === 0}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nouvelle tâche
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                    <Card><CardContent className="p-4"><div className="text-2xl font-bold">{bundle.stats.totalTasks}</div><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
                    <Card><CardContent className="p-4"><div className="text-2xl font-bold">{bundle.stats.completedTasks}</div><p className="text-xs text-muted-foreground">Terminées</p></CardContent></Card>
                    <Card><CardContent className="p-4"><div className="text-2xl font-bold">{bundle.stats.inProgressTasks}</div><p className="text-xs text-muted-foreground">En cours</p></CardContent></Card>
                    <Card><CardContent className="p-4"><div className="text-2xl font-bold">{bundle.stats.blockedTasks}</div><p className="text-xs text-muted-foreground">Bloquées</p></CardContent></Card>
                    <Card><CardContent className="p-4"><div className="text-2xl font-bold">{bundle.stats.remainingTasks}</div><p className="text-xs text-muted-foreground">Restantes</p></CardContent></Card>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Progression du projet</span>
                      <span>{bundle.stats.progressPercentage}%</span>
                    </div>
                    <Progress value={bundle.stats.progressPercentage} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Participants</span>
                      <span className="text-xs text-muted-foreground">{bundle.participants.length} membre{bundle.participants.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {participantsPreview.map((participant) => (
                        <Badge key={participant.id} variant="outline">{userName(participant)}</Badge>
                      ))}
                      {moreParticipants > 0 && <Badge variant="secondary">+{moreParticipants}</Badge>}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[180px_180px]">
                    <Select value={filters.status} onValueChange={(value) => setFilters(project.id, { status: value as ProjectFilterState['status'] })}>
                      <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filters.priority} onValueChange={(value) => setFilters(project.id, { priority: value as ProjectFilterState['priority'] })}>
                      <SelectTrigger><SelectValue placeholder="Priorité" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes priorités</SelectItem>
                        {Object.entries(priorityLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {bundle.loading ? (
                    <div className="rounded-lg border bg-muted/40 p-6 text-sm text-muted-foreground">Chargement des tâches...</div>
                  ) : visibleTasks.length === 0 ? (
                    <div className="rounded-lg border bg-muted/40 p-6 text-sm text-muted-foreground">Aucune tâche à afficher pour ce projet.</div>
                  ) : (
                    visibleTasks.map((task) => (
                      <div key={task.id} className="rounded-lg border bg-white p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-semibold">{task.title}</h4>
                              <Badge variant={statusVariants[task.status]}>{statusLabels[task.status]}</Badge>
                              <Badge variant={priorityVariants[task.priority]}>{priorityLabels[task.priority]}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{task.description || 'Sans description'}</p>
                            <div className="flex flex-wrap gap-3 text-sm">
                              <span><span className="text-muted-foreground">Assignée à:</span> {userName(task.assignedTo)}</span>
                              {task.role && <span><span className="text-muted-foreground">Rôle:</span> {task.role}</span>}
                              {task.dueDate && <span><span className="text-muted-foreground">Deadline:</span> {new Date(task.dueDate).toLocaleDateString('fr-FR')}</span>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="icon" variant="outline" onClick={() => openEditDialog(task)} title="Modifier">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="destructive" onClick={() => removeTask(task)} title="Supprimer">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Modifier la tâche' : 'Créer une tâche'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Projet</Label>
              <Input value={selectedProject?.titre || ''} disabled />
            </div>
            <div className="grid gap-2">
              <Label>Titre</Label>
              <Input value={form.title} onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Participant</Label>
                <Select value={form.assignedTo} onValueChange={(value) => setForm((previous) => ({ ...previous, assignedTo: value }))}>
                  <SelectTrigger><SelectValue placeholder="Choisir un participant" /></SelectTrigger>
                  <SelectContent>
                    {(selectedProjectId ? getBundle(selectedProjectId).participants : []).map((participant) => (
                      <SelectItem key={participant.id} value={participant.id}>{userName(participant)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Rôle</Label>
                <Input value={form.role} onChange={(event) => setForm((previous) => ({ ...previous, role: event.target.value }))} placeholder="Frontend, rapport, test..." />
              </div>
              <div className="grid gap-2">
                <Label>Priorité</Label>
                <Select value={form.priority} onValueChange={(value) => setForm((previous) => ({ ...previous, priority: value as TaskPriority }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Statut</Label>
                <Select value={form.status} onValueChange={(value) => setForm((previous) => ({ ...previous, status: value as TaskStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Deadline</Label>
                <Input type="date" value={form.dueDate} onChange={(event) => setForm((previous) => ({ ...previous, dueDate: event.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button onClick={saveTask}>{editingTask ? 'Enregistrer' : 'Créer'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
