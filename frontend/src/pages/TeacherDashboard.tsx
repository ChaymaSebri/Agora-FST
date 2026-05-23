import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeacherEventInvitations } from '@/components/Teacher/TeacherEventInvitations';
import { TeacherProjectEncadrement } from '@/components/Teacher/TeacherProjectEncadrement';
import { TeacherPendingEventInvitations } from '@/components/Teacher/TeacherPendingEventInvitations';
import { TeacherPendingProjectInvitations } from '@/components/Teacher/TeacherPendingProjectInvitations';
import { GlobalEventsList } from '@/components/Teacher/GlobalEventsList';
import { GlobalProjectsList } from '@/components/Teacher/GlobalProjectsList';
import * as teacherDashboardApi from '@/services/teacher-dashboard.api';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Calendar, Briefcase, Eye, Bell } from 'lucide-react';

interface DashboardStats {
  pendingEventInvitationsCount: number;
  pendingProjectInvitationsCount: number;
  projectsEncaderedCount: number;
  eventsCount: number;
  projectsCount: number;
}

export function TeacherDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    pendingEventInvitationsCount: 0,
    pendingProjectInvitationsCount: 0,
    projectsEncaderedCount: 0,
    eventsCount: 0,
    projectsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending-invitations');
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [pendingEvents, pendingProjects, projects, allEvents, allProjects] = await Promise.all([
        teacherDashboardApi.getPendingEventInvitations(),
        teacherDashboardApi.getPendingProjectInvitations(),
        teacherDashboardApi.getTeacherProjectEncadrement(),
        teacherDashboardApi.getAllEvents(),
        teacherDashboardApi.getAllProjects(),
      ]);

      setStats({
        pendingEventInvitationsCount: pendingEvents.length,
        pendingProjectInvitationsCount: pendingProjects.length,
        projectsEncaderedCount: projects.length,
        eventsCount: allEvents.length,
        projectsCount: allProjects.length,
      });
    } catch (error) {
      console.error('Erreur:', error);
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

  const totalPendingInvitations = stats.pendingEventInvitationsCount + stats.pendingProjectInvitationsCount;

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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className={totalPendingInvitations > 0 ? 'bg-blue-50 border-blue-200' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Invitations Événements</CardTitle>
              <Bell className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingEventInvitationsCount}</div>
              <p className="text-xs text-gray-600">En attente</p>
            </CardContent>
          </Card>

          <Card className={stats.pendingProjectInvitationsCount > 0 ? 'bg-blue-50 border-blue-200' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Invitations Projets</CardTitle>
              <Bell className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingProjectInvitationsCount}</div>
              <p className="text-xs text-gray-600">En attente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projets Encadrés</CardTitle>
              <Briefcase className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.projectsEncaderedCount}</div>
              <p className="text-xs text-gray-600">Actifs</p>
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="pending-invitations" className="flex items-center gap-2 text-xs sm:text-base">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Invitations</span>
            </TabsTrigger>
            <TabsTrigger value="pending-event-invitations" className="flex items-center gap-2 text-xs sm:text-base">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Événements</span>
            </TabsTrigger>
            <TabsTrigger value="pending-project-invitations" className="flex items-center gap-2 text-xs sm:text-base">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Projets</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2 text-xs sm:text-base">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Encadrement</span>
            </TabsTrigger>
            <TabsTrigger value="all-events" className="flex items-center gap-2 text-xs sm:text-base">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Tous Événements</span>
            </TabsTrigger>
            <TabsTrigger value="all-projects" className="flex items-center gap-2 text-xs sm:text-base">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Tous Projets</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending-invitations" className="space-y-4">
            <div className="grid gap-4">
              <TeacherPendingEventInvitations />
              <TeacherPendingProjectInvitations />
            </div>
          </TabsContent>

          <TabsContent value="pending-event-invitations" className="space-y-4">
            <TeacherPendingEventInvitations />
          </TabsContent>

          <TabsContent value="pending-project-invitations" className="space-y-4">
            <TeacherPendingProjectInvitations />
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
