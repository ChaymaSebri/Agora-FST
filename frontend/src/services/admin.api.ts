// Admin API service
import { api } from './api';

/**
 * Dashboard Statistics
 */
export const adminAPI = {
  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard/stats'),

  // Users
  getAllUsers: (page = 1, limit = 10, role = '', search = '') => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(role && { role }),
      ...(search && { search }),
    });
    return api.get(`/admin/users?${params}`);
  },

  getUserById: (id: string) => api.get(`/admin/users/${id}`),

  updateUserRole: (id: string, role: string) =>
    api.put(`/admin/users/${id}/role`, { role }),

  disableUser: (id: string) => api.put(`/admin/users/${id}/disable`),

  enableUser: (id: string) => api.put(`/admin/users/${id}/enable`),

  // Projects
  getAllProjects: (page = 1, limit = 10, statut = '', search = '') => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(statut && { statut }),
      ...(search && { search }),
    });
    return api.get(`/admin/projects?${params}`);
  },

  getProjectById: (id: string) => api.get(`/admin/projects/${id}`),

  updateProject: (id: string, data: { statut?: string; progression?: number }) =>
    api.put(`/admin/projects/${id}`, data),

  // Tasks
  getTasksByProject: (projectId: string) =>
    api.get(`/admin/projects/${projectId}/tasks`),

  updateTask: (id: string, statut: string) =>
    api.put(`/admin/tasks/${id}`, { statut }),

  // Events
  getAllEvents: (page = 1, limit = 10, type = '', search = '') => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(type && { type }),
      ...(search && { search }),
    });
    return api.get(`/admin/events?${params}`);
  },

  getEventById: (id: string) => api.get(`/admin/events/${id}`),

  updateEvent: (id: string, data: any) => api.put(`/admin/events/${id}`, data),

  getEventParticipantStats: (id: string) =>
    api.get(`/admin/events/${id}/participants-stats`),
};
