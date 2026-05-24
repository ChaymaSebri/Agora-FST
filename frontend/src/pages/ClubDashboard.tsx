import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { CalendarDays, ChartColumn, CircleUserRound, FolderKanban, Sparkles, Users } from 'lucide-react';

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_35%),linear-gradient(180deg,_#eff6ff_0%,_#f8fafc_55%,_#ffffff_100%)] pt-20">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mx-auto mb-8 max-w-6xl rounded-3xl border border-white/70 bg-white/75 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                <Sparkles className="h-3.5 w-3.5" />
                Dashboard Club
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
                Pilotez votre club depuis un seul espace
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 md:text-base">
                Gérez le profil du club, les événements, les projets et les demandes dans une vue claire, structurée et rapide.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 md:min-w-[280px]">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-3">
                <p className="text-xs uppercase tracking-wide text-blue-600">Vue globale</p>
                <p className="mt-1 font-semibold text-gray-900">Profil, événements, projets</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Actions rapides</p>
                <p className="mt-1 font-semibold text-gray-900">Tout au même endroit</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mx-auto mb-8 grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="overflow-hidden border-blue-100/80 bg-white/80 shadow-lg shadow-blue-100/40 backdrop-blur transition-transform duration-200 hover:-translate-y-0.5">
            <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Événements Actifs</CardTitle>
              <CalendarDays className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {statsLoading ? '-' : stats?.eventsCount ?? 0}
              </div>
              <p className="mt-1 text-xs text-gray-500">Total des événements</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-emerald-100/80 bg-white/80 shadow-lg shadow-emerald-100/40 backdrop-blur transition-transform duration-200 hover:-translate-y-0.5">
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-lime-400" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Projets en Cours</CardTitle>
              <FolderKanban className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {statsLoading ? '-' : stats?.projectsCount ?? 0}
              </div>
              <p className="mt-1 text-xs text-gray-500">Total des projets</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-violet-100/80 bg-white/80 shadow-lg shadow-violet-100/40 backdrop-blur transition-transform duration-200 hover:-translate-y-0.5">
            <div className="h-1 bg-gradient-to-r from-violet-500 to-fuchsia-400" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Participants</CardTitle>
              <Users className="h-5 w-5 text-violet-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {statsLoading ? '-' : (stats?.activeParticipations ?? 0) + (stats?.totalProjectParticipants ?? 0)}
              </div>
              <p className="mt-1 text-xs text-gray-500">Total des participants</p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-amber-100/80 bg-white/80 shadow-lg shadow-amber-100/40 backdrop-blur transition-transform duration-200 hover:-translate-y-0.5">
            <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-400" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Taux de Validation</CardTitle>
              <ChartColumn className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {statsLoading ? '-' : (stats?.validationRate ?? 0)}%
              </div>
              <p className="mt-1 text-xs text-gray-500">Inscriptions validées</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-2 rounded-2xl border border-white/80 bg-white/90 p-2 shadow-lg shadow-slate-200/60 backdrop-blur md:grid-cols-3 lg:grid-cols-7">
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
