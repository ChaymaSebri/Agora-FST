import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, FolderKanban, Calendar, Award, Loader2 } from "lucide-react";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface StatsData {
  totalProjects: number;
  totalUsers: number;
  totalEvents: number;
  completedProjects: number;
}

const Stats = () => {
  const [stats, setStats] = useState<StatsData>({
    totalProjects: 0,
    totalUsers: 0,
    totalEvents: 0,
    completedProjects: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const projectsRes = await api.get("/projets?limit=1000");
        const eventsRes = await api.get("/events?limit=1000");

        const projects = projectsRes.data.projets || [];
        const events = (eventsRes.data.data?.items || eventsRes.data.items) || [];

        setStats({
          totalProjects: projects.length,
          totalUsers: 0, // Users endpoint requires authentication
          totalEvents: events.length,
          completedProjects: projects.filter((p: any) => p.statut === "termine").length,
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les statistiques",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statsCards = [
    {
      icon: FolderKanban,
      label: "Projets actifs",
      value: stats.totalProjects,
    },
    {
      icon: Users,
      label: "Utilisateurs",
      value: stats.totalUsers,
    },
    {
      icon: Calendar,
      label: "Événements",
      value: stats.totalEvents,
    },
    {
      icon: Award,
      label: "Projets terminés",
      value: stats.completedProjects,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 pt-20">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Statistiques</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de l'activité de la plateforme
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Stats;
