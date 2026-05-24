import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Users, FolderOpen, Calendar, CheckCircle, TrendingUp } from 'lucide-react';
import api from '@/services/api';
import { Badge } from '@/components/ui/badge';

interface DashboardStats {
  users: {
    total: number;
    students: number;
    teachers: number;
    clubs: number;
    admins: number;
  };
  projects: {
    total: number;
    active: number;
    pending: number;
    completed: number;
    cancelled: number;
    averageProgress: number;
  };
  events: {
    total: number;
    upcoming: number;
    past: number;
  };
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
  };
  recentProjects: Array<{
    _id: string;
    titre: string;
    statut: string;
    progression: number;
    deadline: string;
enseignantId: { nom: string; prenom: string } | null;  }>;
  upcomingEvents: Array<{
    _id: string;
    titre: string;
    date: string;
    lieu: string;
    participantsCount: number;
    capacite: number;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/dashboard/stats');
      setStats(response.data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des statistiques');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Chargement des statistiques...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center py-12">{error}</div>;
  }

  if (!stats) {
    return null;
  }

  const StatCard = ({
    icon: Icon,
    label,
    value,
    subtext,
    color,
  }: {
    icon: any;
    label: string;
    value: number | string;
    subtext?: string;
    color: string;
  }) => (
    <Card className="p-6 bg-white border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
        </div>
        <div className="p-3 rounded-lg" style={{ backgroundColor: `${color}20` }}>
          <Icon size={24} style={{ color }} />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Aperçu</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Users}
            label="Utilisateurs Totaux"
            value={stats.users.total}
            subtext={`${stats.users.students} étudiants, ${stats.users.teachers} enseignants`}
            color="#3B82F6"
          />
          <StatCard
            icon={FolderOpen}
            label="Projets Actifs"
            value={stats.projects.active}
            subtext={`${stats.projects.total} total`}
            color="#10B981"
          />
          <StatCard
            icon={Calendar}
            label="Événements à Venir"
            value={stats.events.upcoming}
            subtext={`${stats.events.total} total`}
            color="#F59E0B"
          />
          <StatCard
            icon={TrendingUp}
            label="Progression Moyenne"
            value={`${stats.projects.averageProgress}%`}
            subtext="des projets"
            color="#8B5CF6"
          />
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Distribution des Utilisateurs</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Étudiants</span>
              <Badge variant="outline">{stats.users.students}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Enseignants</span>
              <Badge variant="outline">{stats.users.teachers}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Clubs</span>
              <Badge variant="outline">{stats.users.clubs}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Administrateurs</span>
              <Badge variant="outline">{stats.users.admins}</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">État des Projets</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">En cours</span>
              <Badge className="bg-blue-100 text-blue-800">{stats.projects.active}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">En attente</span>
              <Badge className="bg-yellow-100 text-yellow-800">{stats.projects.pending}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Terminés</span>
              <Badge className="bg-green-100 text-green-800">{stats.projects.completed}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Annulés</span>
              <Badge className="bg-red-100 text-red-800">{stats.projects.cancelled}</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">État des Tâches</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total</span>
              <Badge variant="outline">{stats.tasks.total}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Terminées</span>
              <Badge className="bg-green-100 text-green-800">{stats.tasks.completed}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">En cours</span>
              <Badge className="bg-blue-100 text-blue-800">{stats.tasks.inProgress}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">À faire</span>
              <Badge className="bg-gray-100 text-gray-800">{stats.tasks.pending}</Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Projets Récents</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold">Titre</th>
                <th className="text-left py-3 px-4 font-semibold">Encadrant</th>
                <th className="text-left py-3 px-4 font-semibold">Progression</th>
                <th className="text-left py-3 px-4 font-semibold">Statut</th>
                <th className="text-left py-3 px-4 font-semibold">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentProjects.map((project) => (
                <tr key={project._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{project.titre}</td>
                  <td className="py-3 px-4">
  {project.enseignantId
    ? `${project.enseignantId.prenom} ${project.enseignantId.nom}`
    : 'Aucun encadrant'}
</td>
                  <td className="py-3 px-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${project.progression}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">{project.progression}%</span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      className={
                        project.statut === 'en_cours'
                          ? 'bg-blue-100 text-blue-800'
                          : project.statut === 'termine'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {project.statut}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(project.deadline).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Upcoming Events */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Prochains Événements</h3>
        <div className="space-y-3">
          {stats.upcomingEvents.map((event) => (
            <div key={event._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">{event.titre}</p>
                <p className="text-sm text-gray-600">
                  {new Date(event.date).toLocaleDateString('fr-FR')} • {event.lieu}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{event.participantsCount}/{event.capacite}</p>
                <p className="text-xs text-gray-600">inscrits</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
