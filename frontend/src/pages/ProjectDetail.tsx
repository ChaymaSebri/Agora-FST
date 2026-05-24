import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import api from "@/services/api";
import {
  ArrowLeft, Calendar, Users, GraduationCap, Building2,
  Clock, CheckCircle2, CircleDashed, CirclePlay, CircleX,
  Target, Loader2, BookOpen, ChevronRight,
} from "lucide-react";

interface Tache {
  id: string;
  titre: string;
  description?: string;
  deadline: string;
  statut: "a_faire" | "en_cours" | "terminee";
  etudiantIds: string[];
}

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
  etudiants?: { id: string; nom: string; prenom: string; email: string }[];
  clubId?: string;
  clubNom?: string;
  competenceIds?: string[];
  taches?: Tache[];
}

const statutConfig = {
  en_attente: { label: "En attente", icon: CircleDashed, bar: "bg-amber-400", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  en_cours:   { label: "En cours",   icon: CirclePlay,   bar: "bg-blue-500",  badge: "bg-blue-50 text-blue-700 border-blue-200" },
  termine:    { label: "Terminé",    icon: CheckCircle2, bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  annule:     { label: "Annulé",     icon: CircleX,      bar: "bg-red-400",   badge: "bg-red-50 text-red-700 border-red-200" },
};

const tacheStatutConfig = {
  a_faire:   { label: "À faire",    className: "bg-gray-100 text-gray-600" },
  en_cours:  { label: "En cours",   className: "bg-blue-100 text-blue-700" },
  terminee:  { label: "Terminée",   className: "bg-emerald-100 text-emerald-700" },
};

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function daysLeft(deadline?: string) {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
}

function getInitials(nom?: string, prenom?: string) {
  return `${(prenom?.[0] || "").toUpperCase()}${(nom?.[0] || "").toUpperCase()}`;
}

const avatarColors = [
  "from-indigo-400 to-purple-500",
  "from-blue-400 to-cyan-500",
  "from-emerald-400 to-teal-500",
  "from-orange-400 to-red-500",
  "from-pink-400 to-rose-500",
];

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [enseignants, setEnseignants] = useState([]);
  const [selectedEnseignant, setSelectedEnseignant] = useState("");
  const [open, setOpen] = useState(false);
  const [loadingEnseignants, setLoadingEnseignants] = useState(false);
    
  // ✅ Tous les hooks doivent être appelés AVANT les returns conditionnels
  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        const res = await api.get(`/projets/${id}`);
        setProject(res.data);
      } catch {
        toast({ title: "Erreur", description: "Projet introuvable", variant: "destructive" });
        navigate("/projects");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, navigate, toast]);

  useEffect(() => {
    const fetchEnseignants = async () => {
      setLoadingEnseignants(true);
      try {
        const res = await api.get("/projets/enseignants");
        console.log("Enseignants reçus:", res.data);
        // La réponse est enveloppée dans { success, data }
        const data = res.data.data || (Array.isArray(res.data) ? res.data : []);
        setEnseignants(data);
      } catch (err: any) {
        console.error("Erreur lors du chargement des enseignants:", err);
        toast({
          title: "Erreur",
          description: "Impossible de charger les encadrants",
          variant: "destructive",
        });
      } finally {
        setLoadingEnseignants(false);
      }
    };

    fetchEnseignants();
  }, [toast]);

  // ✅ Maintenant on peut faire les retours conditionnels
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm text-gray-400">Chargement du projet...</p>
        </div>
      </div>
    );
  }

  if (!project) return null;
const handleAssign = async () => {
  if (!selectedEnseignant) return;

  try {
    await api.patch(`/projets/${project.id}/encadrant`, {
      enseignantId: selectedEnseignant,
    });

    toast({
      title: "Succès",
      description: "Encadrant assigné",
    });

    const res = await api.get(`/projets/${project.id}`);
    setProject(res.data);

    setOpen(false);
  } catch (err: any) {
    toast({
      title: "Erreur",
      description: err?.response?.data?.message,
      variant: "destructive",
    });
  }
};
    
  const cfg = statutConfig[project.statut] || statutConfig.en_attente;
  const StatutIcon = cfg.icon;
  const days = daysLeft(project.deadline);
  const isOverdue = days !== null && days < 0 && project.statut !== "termine";
  const canManage = user?.role === "club" || user?.role === "admin";
  const tachesTerminees = project.taches?.filter(t => t.statut === "terminee").length ?? 0;
  const totalTaches = project.taches?.length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Back */}
        <button
          onClick={() => navigate("/projects")}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux projets
        </button>

        {/* Hero card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-6">
          <div className={`h-1.5 w-full ${cfg.bar}`} />
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {project.clubNom && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                      <Building2 className="w-3 h-3" />
                      {project.clubNom}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                  {project.titre}
                </h1>
                {project.description && (
                  <p className="mt-3 text-gray-500 dark:text-gray-400 leading-relaxed">
                    {project.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${cfg.badge}`}>
                  <StatutIcon className="w-4 h-4" />
                  {cfg.label}
                </span>
                {canManage && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/projects/${project.id}/edit`)}
                    className="text-xs"
                  >
                    Modifier
                  </Button>
                )}
              </div>
            </div>

            {/* Objectif */}
            {project.objectif && (
              <div className="mt-5 flex gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-100 dark:border-blue-900">
                <Target className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Objectif</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">{project.objectif}</p>
                </div>
              </div>
            )}

            {/* Progression */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Progression globale</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{project.progression}%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-700 ${cfg.bar}`}
                  style={{ width: `${project.progression}%` }}
                />
              </div>
              {totalTaches > 0 && (
                <p className="text-xs text-gray-400 mt-1.5">
                  {tachesTerminees} / {totalTaches} tâche{totalTaches > 1 ? "s" : ""} terminée{tachesTerminees > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Tâches */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Tâches
                  {totalTaches > 0 && (
                    <span className="ml-2 text-xs font-normal text-gray-400">({totalTaches})</span>
                  )}
                </h2>
                {canManage && (
                  <Button size="sm" variant="outline" className="text-xs h-7">
                    + Ajouter
                  </Button>
                )}
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {!project.taches || project.taches.length === 0 ? (
                  <div className="px-6 py-10 text-center">
                    <BookOpen className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Aucune tâche pour ce projet</p>
                  </div>
                ) : (
                  project.taches.map((tache) => {
                    const tCfg = tacheStatutConfig[tache.statut];
                    const tDays = daysLeft(tache.deadline);
                    const tOverdue = tDays !== null && tDays < 0 && tache.statut !== "terminee";
                    return (
                      <div key={tache.id} className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className={`mt-0.5 shrink-0 w-2 h-2 rounded-full mt-2 ${
                          tache.statut === "terminee" ? "bg-emerald-500" :
                          tache.statut === "en_cours" ? "bg-blue-500" : "bg-gray-300"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium ${tache.statut === "terminee" ? "line-through text-gray-400" : "text-gray-900 dark:text-white"}`}>
                              {tache.titre}
                            </p>
                            <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${tCfg.className}`}>
                              {tCfg.label}
                            </span>
                          </div>
                          {tache.description && (
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{tache.description}</p>
                          )}
                          <div className={`flex items-center gap-1 mt-1 text-xs ${tOverdue ? "text-red-500" : "text-gray-400"}`}>
                            <Clock className="w-3 h-3" />
                            {tOverdue ? `En retard de ${Math.abs(tDays!)}j` : formatDate(tache.deadline)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right: Meta */}
          <div className="space-y-4">

            {/* Dates */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Calendrier</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Début</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{formatDate(project.dateDebut)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isOverdue ? "bg-red-50 dark:bg-red-950" : "bg-gray-50 dark:bg-gray-800"}`}>
                    <Clock className={`w-4 h-4 ${isOverdue ? "text-red-500" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Deadline</p>
                    <p className={`text-sm font-medium ${isOverdue ? "text-red-600" : "text-gray-700 dark:text-gray-200"}`}>
                      {formatDate(project.deadline)}
                      {days !== null && project.statut !== "termine" && (
                        <span className={`ml-1 text-xs ${isOverdue ? "text-red-500" : days <= 7 ? "text-orange-500" : "text-gray-400"}`}>
                          {isOverdue ? `(${Math.abs(days)}j dépassé)` : `(${days}j restants)`}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Encadrant */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Encadrant</h3>
              {project.enseignant ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {getInitials(project.enseignant.nom, project.enseignant.prenom)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {project.enseignant.prenom} {project.enseignant.nom}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{project.enseignant.email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-3 gap-2">
                  <GraduationCap className="w-8 h-8 text-gray-200" />
                  <p className="text-xs text-gray-400 text-center">Aucun encadrant assigné</p>
                  {canManage && (
                    <Button
  size="sm"
  variant="outline"
  className="text-xs h-7 mt-1"
  onClick={() => setOpen(true)}
>
  Inviter un encadrant
</Button>
                  )}
                </div>
              )}
            </div>
{open && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl w-96 shadow-xl">
      <h2 className="font-bold mb-4 text-gray-900 dark:text-white">Choisir un encadrant</h2>

      {loadingEnseignants ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
        </div>
      ) : enseignants.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-400">Aucun encadrant disponible</p>
        </div>
      ) : (
        <select
          className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white p-2.5 rounded-lg mb-4"
          value={selectedEnseignant}
          onChange={(e) => setSelectedEnseignant(e.target.value)}
        >
          <option value="">-- Sélectionner un encadrant --</option>
          {enseignants.map((e: any) => (
            <option key={e._id} value={e._id}>
              {e.prenom} {e.nom}
            </option>
          ))}
        </select>
      )}

      <div className="flex justify-end gap-2 mt-6">
        <Button 
          variant="outline" 
          onClick={() => {
            setOpen(false);
            setSelectedEnseignant("");
          }}
        >
          Annuler
        </Button>

        <Button 
          onClick={handleAssign}
          disabled={!selectedEnseignant || loadingEnseignants}
        >
          Assigner
        </Button>
      </div>
    </div>
  </div>
)}
            {/* Membres */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Membres
                  <span className="ml-1.5 text-xs font-normal text-gray-400">
                    ({project.etudiants?.length ?? 0})
                  </span>
                </h3>
              </div>
              {!project.etudiants || project.etudiants.length === 0 ? (
                <div className="flex flex-col items-center py-3 gap-2">
                  <Users className="w-8 h-8 text-gray-200" />
                  <p className="text-xs text-gray-400">Aucun membre</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {project.etudiants.map((e, i) => (
                    <div key={e.id} className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                        {getInitials(e.nom, e.prenom)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">
                          {e.prenom} {e.nom}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">{e.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;