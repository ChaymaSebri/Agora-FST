import api from './api.js';

const unwrap = (response: any) => response?.data?.data ?? response?.data;

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'blocked';

export interface ProjectTaskUser {
  id: string;
  nom?: string;
  prenom?: string;
  email?: string;
  niveau?: string;
  filiere?: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  role?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  assignedTo?: ProjectTaskUser | null;
  assignedBy?: ProjectTaskUser | null;
  project?: {
    id: string;
    titre: string;
    description?: string;
    deadline?: string;
    statut?: string;
    progression?: number;
  } | null;
}

export interface ProjectProgressStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  todoTasks: number;
  remainingTasks: number;
  progressPercentage: number;
}

export interface ProjectTasksResponse {
  project: {
    id: string;
    titre: string;
    description?: string;
    deadline?: string;
    statut?: string;
    progression?: number;
  };
  participants: ProjectTaskUser[];
  stats: ProjectProgressStats;
  tasks: ProjectTask[];
}

export interface StudentProject {
  id: string;
  titre: string;
  description?: string;
  deadline?: string;
  statut?: string;
  progression?: number;
  stats: ProjectProgressStats;
  tasks: ProjectTask[];
  club?: { id: string; nom: string } | null;
}

export interface TaskPayload {
  projectId: string;
  assignedTo: string;
  title: string;
  description?: string;
  role?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string | null;
}

export async function createProjectTask(payload: TaskPayload) {
  const response = await api.post(`/project-tasks/project/${payload.projectId}`, payload);
  return unwrap(response).task as ProjectTask;
}

export async function getProjectTasks(projectId: string, filters?: { status?: TaskStatus; priority?: TaskPriority }) {
  const response = await api.get(`/project-tasks/project/${projectId}`, { params: filters });
  return unwrap(response) as ProjectTasksResponse;
}

export async function updateProjectTask(taskId: string, payload: Partial<TaskPayload>) {
  const response = await api.patch(`/project-tasks/${taskId}`, payload);
  return unwrap(response).task as ProjectTask;
}

export async function deleteProjectTask(taskId: string) {
  const response = await api.delete(`/project-tasks/${taskId}`);
  return unwrap(response);
}

export async function updateProjectTaskStatus(taskId: string, status: TaskStatus) {
  const response = await api.patch(`/project-tasks/${taskId}/status`, { status });
  return unwrap(response).task as ProjectTask;
}

export async function getMyProjectTasks() {
  const response = await api.get('/project-tasks/me');
  return unwrap(response).tasks as ProjectTask[];
}

export async function getMyParticipatingProjects() {
  const response = await api.get('/projects/my-participations');
  return unwrap(response).projects as StudentProject[];
}

export async function getProjectProgress(projectId: string) {
  const response = await api.get(`/projects/${projectId}/progress`);
  return unwrap(response) as { project: ProjectTasksResponse['project']; stats: ProjectProgressStats };
}
