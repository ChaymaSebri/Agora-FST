import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useStudentParticipationRequests } from "@/hooks/useParticipationRequests";
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

/* ================= TYPES ================= */

interface Project {
  id: string;
  titre: string;
  description?: string;
  objectif?: string;
  imageUrl?: string | null;
  statut: "en_cours" | "termine" | "annule" | "en_attente";
  progression: number;
  deadline: string;
  dateDebut?: string;
  enseignant?: { id: string; nom: string; prenom: string; email: string };
  etudiants?: { id: string; nom: string; prenom: string }[];
  clubNom?: string;
}

/* ================= STATUT UI ================= */

const statutConfig = {
  en_attente: {
    label: "En attente",
    icon: CircleDashed,
    className: "bg-amber-50 text-amber-700 border-amber-200",
    bar: "bg-amber-400",
  },
  en_cours: {
    label: "En cours",
    icon: CirclePlay,
    className: "bg-blue-50 text-blue-700 border-blue-200",
    bar: "bg-blue-500",
  },
  termine: {
    label: "Terminé",
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    bar: "bg-emerald-500",
  },
  annule: {
    label: "Annulé",
    icon: CircleX,
    className: "bg-red-50 text-red-700 border-red-200",
    bar: "bg-red-400",
  },
};

/* ================= HELPERS ================= */

function daysLeft(deadline?: string) {
  if (!deadline) return null;
  return Math.ceil(
    (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
}

/* ================= CARD ================= */

const ProjectCard = ({
  project,
  onClick,
  onRejoindre,
  userRole,
}: any) => {
  const cfg = statutConfig[project.statut];
  const days = daysLeft(project.deadline);

  const isOverdue = days !== null && days < 0;
  const isUrgent = days !== null && days >= 0 && days <= 7;

  const Icon = cfg.icon;

  return (
    <div
      onClick={onClick}
      className="group bg-white dark:bg-gray-900 rounded-2xl border hover:shadow-xl transition cursor-pointer overflow-hidden flex flex-col"
    >
      {/* TOP BAR */}
      <div className={`h-1 w-full ${cfg.bar}`} />

      <div className="p-5 flex flex-col gap-4">
        {/* HEADER */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold group-hover:text-blue-600">
              {project.titre}
            </h3>

            {project.clubNom && (
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {project.clubNom}
              </div>
            )}
          </div>

          <span className={`text-xs px-2 py-1 rounded border ${cfg.className}`}>
            <Icon className="w-3 h-3 inline mr-1" />
            {cfg.label}
          </span>
        </div>

        {/* DESCRIPTION */}
        {project.description && (
          <p className="text-sm text-gray-500 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* PROGRESS */}
        <div>
          <div className="flex justify-between text-xs">
            <span>Progression</span>
            <span>{project.progression}%</span>
          </div>
          <div className="h-1 bg-gray-200 rounded">
            <div
              className={`h-1 ${cfg.bar}`}
              style={{ width: `${project.progression}%` }}
            />
          </div>
        </div>

        {/* META */}
        <div className="flex justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {project.etudiants?.length || 0}
          </div>

          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {isOverdue
              ? "En retard"
              : isUrgent
              ? `${days}j restants`
              : "OK"}
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-center border-t pt-2">
          {project.enseignant ? (
            <div className="text-xs text-gray-500 flex gap-2 items-center">
              <GraduationCap className="w-4 h-4" />
              {project.enseignant.prenom} {project.enseignant.nom}
            </div>
          ) : (
            <span className="text-xs text-gray-400">
              Sans encadrant
            </span>
          )}

          {userRole === "etudiant" && onRejoindre && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRejoindre(e);
              }}
              className="text-xs text-blue-600 hover:underline"
            >
              Rejoindre
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ================= PAGE ================= */

const Projects = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const { requests, fetchMyRequests, requestParticipation } =
    useStudentParticipationRequests();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("tous");

  const [requestProjectId, setRequestProjectId] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState("");

  /* LOAD */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/projets");
        setProjects(res.data?.items || []);
      } catch {
        toast({ title: "Erreur chargement projets", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (user?.role === "etudiant") fetchMyRequests();
  }, [user]);

  /* FILTER */
  const filtered = projects.filter((p) => {
    const matchSearch =
      p.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus =
      statusFilter === "tous" || p.statut === statusFilter;

    return matchSearch && matchStatus;
  });

  /* REQUEST */
  const sendRequest = async (id: string) => {
    const ok = await requestParticipation(id, requestMessage || undefined);

    if (ok) {
      toast({ title: "Demande envoyée" });
      setRequestProjectId(null);
      setRequestMessage("");
    } else {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  /* UI */
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Projets</h1>

        {(user?.role === "club" || user?.role === "admin") && (
          <Button onClick={() => navigate("/projects/new")}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau
          </Button>
        )}
      </div>

      {/* FILTERS */}
      <div className="flex gap-3 mb-6">
        <Input
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous</SelectItem>
            <SelectItem value="en_attente">En attente</SelectItem>
            <SelectItem value="en_cours">En cours</SelectItem>
            <SelectItem value="termine">Terminé</SelectItem>
            <SelectItem value="annule">Annulé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* CONTENT */}
      {loading ? (
        <Loader2 className="animate-spin" />
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              userRole={user?.role}
              onClick={() => navigate(`/projects/${p.id}`)}
              onRejoindre={() => sendRequest(p.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;