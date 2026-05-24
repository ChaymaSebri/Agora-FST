import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getProjectTasks, type ProjectTask, type ProjectProgressStats, type TaskPriority, type TaskStatus } from '@/services/project-tasks.api';

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

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: string | null;
  priority: TaskPriority;
  assignedTo?: { id: string; nom?: string; prenom?: string; email?: string } | null;
}

interface ProjectDetailModalProps {
  project: any;
  onClose: () => void;
}

export default function ProjectDetailModal({ project, onClose }: ProjectDetailModalProps) {
  const [tasks, setTasks] = useState<Task[]>(project.tasks || []);
  const [stats, setStats] = useState<ProjectProgressStats | null>(project.stats || null);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');

  useEffect(() => {
    const loadTasks = async () => {
      if (!project?._id) return;

      try {
        setLoadingTasks(true);
        const data = await getProjectTasks(project._id, {
          ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
          ...(priorityFilter !== 'all' ? { priority: priorityFilter } : {}),
        });
        setTasks((data.tasks || []) as Task[]);
        setStats(data.stats || null);
      } catch {
        setTasks(project.tasks || []);
      } finally {
        setLoadingTasks(false);
      }
    };

    void loadTasks();
  }, [project?._id, statusFilter, priorityFilter]);

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'en_cours':
        return 'bg-blue-100 text-blue-800';
      case 'terminee':
        return 'bg-green-100 text-green-800';
      case 'a_faire':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'en_cours':
        return 'bg-blue-100 text-blue-800';
      case 'termine':
        return 'bg-green-100 text-green-800';
      case 'en_attente':
        return 'bg-yellow-100 text-yellow-800';
      case 'annule':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">{project.titre}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Project Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Statut</label>
              <Badge className={getProjectStatusColor(project.statut)}>
                {project.statut}
              </Badge>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Progression
              </label>
              <div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className="bg-blue-600 h-3 rounded-full"
                    style={{ width: `${project.progression}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{project.progression}%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tâches</label>
              <p className="text-gray-600">
                {stats?.totalTasks ?? tasks.length} tâches au total
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Encadrant
              </label>
              <p className="text-gray-600">
                {project.enseignantId?.prenom} {project.enseignantId?.nom}
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Deadline</label>
              <p className="text-gray-600">
                {new Date(project.deadline).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>

          {/* Description */}
          {project.description && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <p className="text-gray-600">{project.description}</p>
            </div>
          )}

          {/* Objective */}
          {project.objectif && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Objectif</label>
              <p className="text-gray-600">{project.objectif}</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <label className="block text-sm font-semibold text-gray-700">Tâches du projet</label>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TaskStatus | 'all')}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Statut" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as TaskPriority | 'all')}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Priorité" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes priorités</SelectItem>
                    {Object.entries(priorityLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card><div className="p-3"><div className="text-xl font-bold">{stats?.completedTasks ?? 0}</div><p className="text-xs text-muted-foreground">Terminées</p></div></Card>
              <Card><div className="p-3"><div className="text-xl font-bold">{stats?.inProgressTasks ?? 0}</div><p className="text-xs text-muted-foreground">En cours</p></div></Card>
              <Card><div className="p-3"><div className="text-xl font-bold">{stats?.todoTasks ?? 0}</div><p className="text-xs text-muted-foreground">À faire</p></div></Card>
              <Card><div className="p-3"><div className="text-xl font-bold">{stats?.progressPercentage ?? project.progression ?? 0}%</div><p className="text-xs text-muted-foreground">Avancement</p></div></Card>
            </div>

            <Progress value={stats?.progressPercentage ?? project.progression ?? 0} />

            {loadingTasks ? (
              <div className="text-sm text-gray-500">Chargement des tâches...</div>
            ) : tasks.length === 0 ? (
              <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-500">Aucune tâche liée à ce projet.</div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="rounded-lg border bg-gray-50 p-4">
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <div>
                        <h4 className="font-medium">{task.title}</h4>
                        <p className="text-sm text-gray-600">{task.description || 'Sans description'}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={statusVariants[task.status]}>{statusLabels[task.status]}</Badge>
                        <Badge variant={priorityVariants[task.priority]}>{priorityLabels[task.priority]}</Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Assignée à: {task.assignedTo ? `${task.assignedTo.prenom || ''} ${task.assignedTo.nom || ''}`.trim() : 'Non assignée'}</span>
                      {task.dueDate && <span>Deadline: {new Date(task.dueDate).toLocaleDateString('fr-FR')}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Students */}
          {project.etudiantIds && project.etudiantIds.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Étudiants ({project.etudiantIds.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {project.etudiantIds.map((student: any) => (
                  <Badge key={student._id} variant="outline">
                    {student.prenom} {student.nom}
                  </Badge>
                ))}
              </div>
            </div>
          )}

        </div>
      </Card>
    </div>
  );
}
