import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeacherEventInvitations } from '@/components/Teacher/TeacherEventInvitations';
import { TeacherProjectEncadrement } from '@/components/Teacher/TeacherProjectEncadrement';
import { GlobalEventsList } from '@/components/Teacher/GlobalEventsList';
import { GlobalProjectsList } from '@/components/Teacher/GlobalProjectsList';
import * as teacherDashboardApi from '@/services/teacher-dashboard.api';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Calendar, Briefcase, Eye } from 'lucide-react';

interface DashboardStats {
  invitationsCount: number;
  projectsEncaderedCount: number;
  eventsCount: number;
  projectsCount: number;
}

export function TeacherDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    invitationsCount: 0,
    projectsEncaderedCount: 0,
    eventsCount: 0,
    projectsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('invitations');
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [invitations, projects, allEvents, allProjects] = await Promise.all([
        teacherDashboardApi.getTeacherEventInvitations(),
        teacherDashboardApi.getTeacherProjectEncadrement(),
        teacherDashboardApi.getAllEvents(),
        teacherDashboardApi.getAllProjects(),
      ]);

      setStats({
        invitationsCount: invitations.length,
        projectsEncaderedCount: projects.length,
        eventsCount: allEvents.length,
        projectsCount: allProjects.length,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les statistiques',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-xl text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Dashboard Enseignant</h1>
          <p className="text-gray-600">
            Gérez vos invitations d'événements et les projets que vous encadrez
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Invitations</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.invitationsCount}</div>
              <p className="text-xs text-gray-600">Événements en attente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projets Encadrés</CardTitle>
              <Briefcase className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.projectsEncaderedCount}</div>
              <p className="text-xs text-gray-600">Projets actifs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tous les Événements</CardTitle>
              <Calendar className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.eventsCount}</div>
              <p className="text-xs text-gray-600">Disponibles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tous les Projets</CardTitle>
              <Briefcase className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.projectsCount}</div>
              <p className="text-xs text-gray-600">Disponibles</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="invitations" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Invitations</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Projets</span>
            </TabsTrigger>
            <TabsTrigger value="all-events" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Événements</span>
            </TabsTrigger>
            <TabsTrigger value="all-projects" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Projets</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invitations" className="space-y-4">
            <TeacherEventInvitations />
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            <TeacherProjectEncadrement />
          </TabsContent>

          <TabsContent value="all-events" className="space-y-4">
            <GlobalEventsList />
          </TabsContent>

          <TabsContent value="all-projects" className="space-y-4">
            <GlobalProjectsList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
