import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClubProfileCard } from '@/components/Admin/ClubProfileCard';
import { ClubEventManagement } from '@/components/Admin/ClubEventManagement';
import { ClubEventParticipations } from '@/components/Admin/ClubEventParticipations';
import { ClubProjectManagement } from '@/components/Admin/ClubProjectManagement';
import { ClubProjectParticipantsManagement } from '@/components/Admin/ClubProjectParticipantsManagement';
import { ClubProjectParticipationRequests } from '@/components/Admin/ClubProjectParticipationRequests';
import { ClubProjectTasksManagement } from '@/components/Admin/ClubProjectTasksManagement';
import * as clubDashboardApi from '@/services/club-dashboard.api';
import { useToast } from '@/hooks/use-toast';

interface Stats {
  eventsCount: number;
  projectsCount: number;
  activeParticipations: number;
  totalProjectParticipants: number;
  validationRate: number;
}

export function ClubDashboard() {
  const [activeTab, setActiveTab] = useState('profile');
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await clubDashboardApi.getClubStats();
      setStats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
      // Ne pas afficher de toast d'erreur pour les stats (non-critique)
    } finally {
      setStatsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-20">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Dashboard du Club
          </h1>
          <p className="text-gray-600">
            Gérez votre club, vos événements et vos projets
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Événements Actifs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '-' : stats?.eventsCount ?? 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Total des événements
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Projets en Cours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '-' : stats?.projectsCount ?? 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Total des projets
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Participants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '-' : (stats?.activeParticipations ?? 0) + (stats?.totalProjectParticipants ?? 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Total des participants
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Taux de Validation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '-' : (stats?.validationRate ?? 0)}%
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Inscriptions validées
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 gap-1 bg-white shadow-md rounded-lg p-1 md:grid-cols-7">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="events">Événements</TabsTrigger>
            <TabsTrigger value="participations">Validations</TabsTrigger>
            <TabsTrigger value="projects">Projets</TabsTrigger>
            <TabsTrigger value="project-requests">Demandes projets</TabsTrigger>
            <TabsTrigger value="project-participants">Participants</TabsTrigger>
            <TabsTrigger value="project-tasks">Tâches</TabsTrigger>
          </TabsList>

          {/* Profil Tab */}
          <TabsContent value="profile" className="space-y-4">
            <ClubProfileCard />
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4">
            <ClubEventManagement />
          </TabsContent>

          {/* Event Participations Tab */}
          <TabsContent value="participations" className="space-y-4">
            <ClubEventParticipations />
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            <ClubProjectManagement />
          </TabsContent>

          {/* Project Participation Requests Tab */}
          <TabsContent value="project-requests" className="space-y-4">
            <ClubProjectParticipationRequests />
          </TabsContent>

          {/* Project Participants Tab */}
          <TabsContent value="project-participants" className="space-y-4">
            <ClubProjectParticipantsManagement />
          </TabsContent>

          <TabsContent value="project-tasks" className="space-y-4">
            <ClubProjectTasksManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
