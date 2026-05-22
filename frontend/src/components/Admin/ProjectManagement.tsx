import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronLeft, ChevronRight, Eye, Edit2 } from 'lucide-react';
import api from '@/services/api';
import ProjectDetailModal from './ProjectDetailModal';

interface Project {
  _id: string;
  titre: string;
  description: string;
  statut: string;
  progression: number;
  deadline: string;
  enseignantId: {
    nom: string;
    prenom: string;
  };
  tasksCount?: number;
  completedTasks?: number;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function ProjectManagement() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingProgression, setEditingProgression] = useState('');

  useEffect(() => {
    fetchProjects();
  }, [pagination.page, search, statusFilter]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(statusFilter && statusFilter !== 'all' && { statut: statusFilter }),
      });

      const response = await api.get(`/admin/projects?${params}`);
      setProjects(response.data.projects);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProject = async (projectId: string) => {
    if (!editingProject || editingProgression === '') return;

    try {
      await api.put(`/admin/projects/${projectId}`, {
        progression: parseInt(editingProgression),
      });
      setEditingProject(null);
      setEditingProgression('');
      fetchProjects();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const handleViewDetails = async (project: Project) => {
    try {
      const response = await api.get(`/admin/projects/${project._id}`);
      setSelectedProject(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
    }
  };

  const getStatusColor = (status: string) => {
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
    <div className="space-y-6">
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Rechercher par titre..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => {
          setStatusFilter(value);
          setPagination({ ...pagination, page: 1 });
        }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filtre par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="en_cours">En cours</SelectItem>
            <SelectItem value="en_attente">En attente</SelectItem>
            <SelectItem value="termine">Terminé</SelectItem>
            <SelectItem value="annule">Annulé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-6 font-semibold">Titre</th>
                <th className="text-left py-3 px-6 font-semibold">Encadrant</th>
                <th className="text-left py-3 px-6 font-semibold">Progression</th>
                <th className="text-left py-3 px-6 font-semibold">Statut</th>
                <th className="text-left py-3 px-6 font-semibold">Tâches</th>
                <th className="text-left py-3 px-6 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    Chargement...
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    Aucun projet trouvé
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project._id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium">{project.titre}</td>
                    <td className="py-4 px-6 text-gray-600">
                      {project.enseignantId?.prenom} {project.enseignantId?.nom}
                    </td>
                    <td className="py-4 px-6">
                      {editingProject?._id === project._id ? (
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editingProgression}
                            onChange={(e) => setEditingProgression(e.target.value)}
                            className="w-16 px-2 py-1 border rounded"
                          />
                          <span>%</span>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateProject(project._id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            ✓
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${project.progression}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">{project.progression}%</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <Badge className={getStatusColor(project.statut)}>
                        {project.statut}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {project.completedTasks}/{project.tasksCount}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(project)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Voir les détails"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingProject(project);
                            setEditingProgression(project.progression.toString());
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                          title="Modifier la progression"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            Affichage {(pagination.page - 1) * pagination.limit + 1} à{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPagination({
                  ...pagination,
                  page: Math.max(1, pagination.page - 1),
                })
              }
              disabled={pagination.page === 1}
            >
              <ChevronLeft size={16} />
            </Button>
            <div className="flex items-center gap-2">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setPagination({ ...pagination, page })}
                  className={`w-8 h-8 rounded ${
                    pagination.page === page
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPagination({
                  ...pagination,
                  page: Math.min(pagination.pages, pagination.page + 1),
                })
              }
              disabled={pagination.page === pagination.pages}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Detail Modal */}
      {showDetailModal && selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedProject(null);
          }}
        />
      )}
    </div>
  );
}
