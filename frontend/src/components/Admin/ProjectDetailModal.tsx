import { X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Task {
  _id: string;
  titre: string;
  description: string;
  statut: string;
  deadline: string;
  etudiantIds: Array<{ nom: string; prenom: string }>;
}

interface ProjectDetailModalProps {
  project: any;
  onClose: () => void;
}

export default function ProjectDetailModal({ project, onClose }: ProjectDetailModalProps) {
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
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
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

          {/* Tasks */}
          {project.tasks && project.tasks.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Tâches ({project.tasks.length})
              </label>
              <div className="space-y-3">
                {project.tasks.map((task: Task) => (
                  <div
                    key={task._id}
                    className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{task.titre}</h4>
                      <Badge className={getTaskStatusColor(task.statut)}>
                        {task.statut}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                    )}
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>
                        Deadline: {new Date(task.deadline).toLocaleDateString('fr-FR')}
                      </span>
                      {task.etudiantIds && task.etudiantIds.length > 0 && (
                        <span>
                          Assignés: {task.etudiantIds.map((s) => s.prenom).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
