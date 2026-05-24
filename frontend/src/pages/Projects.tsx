import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Loader2,
  Calendar,
  Users,
  BookOpen,
  Clock,
  ChevronRight,
  GraduationCap,
  Building2,
  CheckCircle2,
  CircleDashed,
  CirclePlay,
  CircleX,
} from "lucide-react";

interface Project {
  id: string;
  titre: string;
  description?: string;
  objectif?: string;
  statut: "en_cours" | "termine" | "annule" | "en_attente";
  progression: number;
  deadline: string;
  dateDebut?: string;
  enseignant?: { id: string; nom: string; prenom: string; email: string };
  etudiants?: { id: string; nom: string; prenom: string }[];
  clubId?: string;
  clubNom?: string;
  competenceIds?: string[];
}

const statutConfig = {
  en_attente: {
    label: "En attente",
    icon: CircleDashed,
    className: "bg-amber-50 text-amber-700 border-amber-200",
    bar: "bg-amber-400",
    dot: "bg-amber-400",
  },
  en_cours: {
    label: "En cours",
    icon: CirclePlay,
    className: "bg-blue-50 text-blue-700 border-blue-200",
    bar: "bg-blue-500",
    dot: "bg-blue-500",
  },
  termine: {
    label: "Terminé",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
  },
  annule: {
    label: "Annulé",
    icon: CircleX,
    className: "bg-red-50 text-red-700 border-red-200",
    bar: "bg-red-400",
    dot: "bg-red-400",
  },
};

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysLeft(deadline?: string) {
  if (!deadline) return null;
  const diff = Math.ceil(
    (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  return diff;
}

function getInitials(nom?: string, prenom?: string) {
  return `${(prenom?.[0] || "").toUpperCase()}${(nom?.[0] || "").toUpperCase()}`;
}

const ProjectCard = ({
  project,
  onClick,
  onRejoindre,
  userRole,
}: {
  project: Project;
  onClick: () => void;
  onRejoindre?: (e: React.MouseEvent) => void;
  userRole?: string;
}) => {

  const config = statutConfig[project.statut] || statutConfig.en_attente;
  const StatutIcon = config.icon;
  const days = daysLeft(project.deadline);
  const isOverdue = days !== null && days < 0 && project.statut !== "termine";
  const isUrgent = days !== null && days >= 0 && days <= 7 && project.statut === "en_cours";

  return (
    <div
      onClick={onClick}
      className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
    >
      {/* Top accent bar */}
      <div className={`h-1 w-full ${config.bar}`} />

      <div className="p-5 flex flex-col flex-1 gap-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {project.titre}
            </h3>
            {project.clubNom && (
              <div className="flex items-center gap-1 mt-1">
                <Building2 className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400 truncate">{project.clubNom}</span>
              </div>
            )}
          </div>

          <span
            className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}
          >
            <StatutIcon className="w-3 h-3" />
            {config.label}
          </span>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
            {project.description}
          </p>
        )}

        {/* Progression */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400 font-medium">Progression</span>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
              {project.progression}%
            </span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${config.bar}`}
              style={{ width: `${project.progression}%` }}
            />
          </div>
        </div>

        {/* Meta info */}
        <div className="grid grid-cols-2 gap-2">
          {/* Deadline */}
          <div
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 ${
              isOverdue
                ? "bg-red-50 dark:bg-red-950"
                : isUrgent
                ? "bg-orange-50 dark:bg-orange-950"
                : "bg-gray-50 dark:bg-gray-800"
            }`}
          >
            <Clock
              className={`w-3.5 h-3.5 shrink-0 ${
                isOverdue
                  ? "text-red-500"
                  : isUrgent
                  ? "text-orange-500"
                  : "text-gray-400"
              }`}
            />
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide leading-none">
                {isOverdue ? "En retard" : "Deadline"}
              </p>
              <p
                className={`text-xs font-medium truncate ${
                  isOverdue
                    ? "text-red-600"
                    : isUrgent
                    ? "text-orange-600"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                {isOverdue
                  ? `${Math.abs(days!)}j dépassé`
                  : days === 0
                  ? "Aujourd'hui"
                  : days !== null && days <= 7
                  ? `${days}j restants`
                  : formatDate(project.deadline)}
              </p>
            </div>
          </div>

          {/* Étudiants */}
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg px-2.5 py-1.5">
            <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide leading-none">
                Membres
              </p>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {project.etudiants?.length ?? 0} étudiant
                {(project.etudiants?.length ?? 0) !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-50 dark:border-gray-800 mt-auto">
          {/* Enseignant avatar */}
          {project.enseignant ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                {getInitials(project.enseignant.nom, project.enseignant.prenom)}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[110px]">
                {project.enseignant.prenom} {project.enseignant.nom}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-gray-300" />
              <span className="text-xs text-gray-300 italic">Sans encadrant</span>
            </div>
          )}
{userRole === "etudiant" && onRejoindre && (
  <button
    onClick={onRejoindre}
    className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors"
  >
    Rejoindre
  </button>
)}
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all duration-200" />
        </div>
      </div>
    </div>
  );
};

const Projects = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("tous");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await api.get("/projets");
        setProjects(response.data?.items || []);
      } catch {
        toast({
          title: "Erreur",
          description: "Impossible de charger les projets",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.enseignant?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clubNom?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "tous" || p.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    tous: projects.length,
    en_attente: projects.filter((p) => p.statut === "en_attente").length,
    en_cours: projects.filter((p) => p.statut === "en_cours").length,
    termine: projects.filter((p) => p.statut === "termine").length,
    annule: projects.filter((p) => p.statut === "annule").length,
  };

  const statuses = [
    { value: "tous", label: "Tous les statuts" },
    { value: "en_attente", label: "En attente" },
    { value: "en_cours", label: "En cours" },
    { value: "termine", label: "Terminé" },
    { value: "annule", label: "Annulé" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-blue-500 uppercase tracking-widest">
                Académique
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Projets
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {projects.length} projet{projects.length !== 1 ? "s" : ""} au total
            </p>
          </div>

          {(user?.role === "club" || user?.role === "admin") && (
            <Button
              onClick={() => navigate("/projects/new")}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouveau projet
            </Button>
          )}
        </div>

        {/* Stats strip */}
        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {(["en_attente", "en_cours", "termine", "annule"] as const).map((s) => {
              const cfg = statutConfig[s];
              const Icon = cfg.icon;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(statusFilter === s ? "tous" : s)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    statusFilter === s
                      ? `${cfg.className} shadow-sm`
                      : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-200"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 truncate">{cfg.label}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                      {counts[s]}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Rechercher par titre, club, enseignant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                  {s.value !== "tous" && (
                    <span className="ml-2 text-gray-400">
                      ({counts[s.value as keyof typeof counts]})
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm text-gray-400">Chargement des projets...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">Aucun projet trouvé</p>
            <p className="text-sm text-gray-400">
              {searchTerm || statusFilter !== "tous"
                ? "Essayez d'autres filtres"
                : "Les projets apparaîtront ici"}
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-4">
              {filteredProjects.length} résultat
              {filteredProjects.length !== 1 ? "s" : ""}
              {searchTerm && ` pour "${searchTerm}"`}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => (
                <ProjectCard
  key={project.id}
  project={project}
  onClick={() => navigate(`/projects/${project.id}`)}
  userRole={user?.role}
  onRejoindre={user?.role === "etudiant" ? async (e) => {
    e.stopPropagation();
    try {
      await api.post(`/projets/${project.id}/rejoindre`);
      toast({ title: "Demande envoyée !", description: "Le club examinera votre demande." });
    } catch {
      toast({ title: "Erreur", description: "Impossible d'envoyer la demande", variant: "destructive" });
    }
  } : undefined}
/>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Projects;