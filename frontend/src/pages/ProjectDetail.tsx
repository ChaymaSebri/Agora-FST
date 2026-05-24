import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import api from "@/services/api";
import {
  ArrowLeft, Calendar, Users, GraduationCap, Building2,
  Clock, CheckCircle2, CircleDashed, CirclePlay, CircleX,
  Target, Loader2, BookOpen, Plus, Pencil, Trash2, X, Check,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Etudiant {
  id: string;
  nom: string;
  prenom: string;
  email: string;
}

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
  etudiants?: Etudiant[];
  clubId?: string;
  clubNom?: string;
  competenceIds?: string[];
  taches?: Tache[];
}

interface TacheForm {
  titre: string;
  description: string;
  deadline: string;
  statut: "a_faire" | "en_cours" | "terminee";
  etudiantIds: string[];
}

// ─── Configs ─────────────────────────────────────────────────────────────────

const statutConfig = {
  en_attente: { label: "En attente", icon: CircleDashed, bar: "bg-amber-400", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  en_cours:   { label: "En cours",   icon: CirclePlay,   bar: "bg-blue-500",  badge: "bg-blue-50 text-blue-700 border-blue-200" },
  termine:    { label: "Terminé",    icon: CheckCircle2, bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  annule:     { label: "Annulé",     icon: CircleX,      bar: "bg-red-400",   badge: "bg-red-50 text-red-700 border-red-200" },
};

const tacheStatutOptions = [
  { value: "a_faire",  label: "À faire",  dot: "bg-gray-400",    badge: "bg-gray-100 text-gray-600" },
  { value: "en_cours", label: "En cours", dot: "bg-blue-500",    badge: "bg-blue-100 text-blue-700" },
  { value: "terminee", label: "Terminée", dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function toInputDate(d?: string) {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
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

const emptyForm = (): TacheForm => ({
  titre: "", description: "", deadline: "",
  statut: "a_faire", etudiantIds: [],
});

// ─── Tache Modal ─────────────────────────────────────────────────────────────

const TacheModal = ({
  tache,
  membres,
  onClose,
  onSave,
}: {
  tache?: Tache;
  membres: Etudiant[];
  onClose: () => void;
  onSave: (form: TacheForm) => Promise<void>;
}) => {
  const [form, setForm] = useState<TacheForm>(
    tache
      ? {
          titre: tache.titre,
          description: tache.description || "",
          deadline: toInputDate(tache.deadline),
          statut: tache.statut,
          etudiantIds: tache.etudiantIds || [],
        }
      : emptyForm()
  );
  const [saving, setSaving] = useState(false);

  const toggleMembre = (id: string) => {
    setForm((f) => ({
      ...f,
      etudiantIds: f.etudiantIds.includes(id)
        ? f.etudiantIds.filter((e) => e !== id)
        : [...f.etudiantIds, id],
    }));
  };

  const handleSave = async () => {
    if (!form.titre.trim() || !form.deadline) return;
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {tache ? "Modifier la tâche" : "Nouvelle tâche"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Titre */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Titre <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.titre}
              onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
              placeholder="Ex: Rédiger le rapport..."
              className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Détails de la tâche..."
              rows={3}
              className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 resize-none"
            />
          </div>

          {/* Deadline + Statut */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Deadline <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">Statut</Label>
              <select
                value={form.statut}
                onChange={(e) => setForm((f) => ({ ...f, statut: e.target.value as TacheForm["statut"] }))}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                {tacheStatutOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Assigner membres */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Assigner à des membres
              <span className="ml-1 text-xs font-normal text-gray-400">({form.etudiantIds.length} sélectionné{form.etudiantIds.length > 1 ? "s" : ""})</span>
            </Label>
            {membres.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Aucun membre dans ce projet</p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-800 p-2">
                {membres.map((m, i) => {
                  const selected = form.etudiantIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMembre(m.id)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left ${
                        selected
                          ? "bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                        {getInitials(m.nom, m.prenom)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                          {m.prenom} {m.nom}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{m.email}</p>
                      </div>
                      {selected && <Check className="w-4 h-4 text-blue-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={saving}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !form.titre.trim() || !form.deadline}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : tache ? "Enregistrer" : "Créer la tâche"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────

const ConfirmModal = ({
  message,
  onConfirm,
  onCancel,
  loading,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
      <p className="text-gray-700 dark:text-gray-200 mb-6 text-sm leading-relaxed">{message}</p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1" disabled={loading}>Annuler</Button>
        <Button onClick={onConfirm} className="flex-1 bg-red-600 hover:bg-red-700 text-white" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Supprimer"}
        </Button>
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Enseignants modal
  const [enseignants, setEnseignants] = useState<any[]>([]);
  const [loadingEnseignants, setLoadingEnseignants] = useState(false);
  const [selectedEnseignant, setSelectedEnseignant] = useState("");
  const [openEncadrant, setOpenEncadrant] = useState(false);

  // Tache modals
  const [tacheModal, setTacheModal] = useState<{ open: boolean; tache?: Tache }>({ open: false });
  const [deleteTacheModal, setDeleteTacheModal] = useState<{ open: boolean; tache?: Tache }>({ open: false });
  const [deletingTache, setDeletingTache] = useState(false);

  // ── Fetch project ──
  const fetchProject = async () => {
    if (!id) return;
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

  useEffect(() => { fetchProject(); }, [id]);

  // ── Fetch enseignants ──
  useEffect(() => {
    const fetch = async () => {
      setLoadingEnseignants(true);
      try {
        const res = await api.get("/users", { params: { role: "enseignant" } });
        const data = res.data?.items || res.data?.users || (Array.isArray(res.data) ? res.data : []);
        setEnseignants(data);
      } catch {
        // silently fail
      } finally {
        setLoadingEnseignants(false);
      }
    };
    fetch();
  }, []);

  // ── Assign encadrant ──
  const handleAssign = async () => {
    if (!selectedEnseignant || !project) return;
    try {
      await api.patch(`/projets/${project.id}/encadrant`, { enseignantId: selectedEnseignant });
      toast({ title: "Encadrant assigné avec succès" });
      setOpenEncadrant(false);
      setSelectedEnseignant("");
      await fetchProject();
    } catch {
      toast({ title: "Erreur", description: "Impossible d'assigner l'encadrant", variant: "destructive" });
    }
  };

  // ── Create tache ──
  const handleCreateTache = async (form: TacheForm) => {
    if (!project) return;
    try {
      await api.post(`/projets/${project.id}/taches`, {
        titre: form.titre.trim(),
        description: form.description.trim(),
        deadline: new Date(form.deadline).toISOString(),
        statut: form.statut,
        etudiantIds: form.etudiantIds,
      });
      toast({ title: "Tâche créée" });
      setTacheModal({ open: false });
      await fetchProject();
    } catch {
      toast({ title: "Erreur", description: "Impossible de créer la tâche", variant: "destructive" });
      throw new Error("fail");
    }
  };

  // ── Update tache ──
  const handleUpdateTache = async (form: TacheForm) => {
    if (!project || !tacheModal.tache) return;
    try {
      await api.put(`/projets/${project.id}/taches/${tacheModal.tache.id}`, {
        titre: form.titre.trim(),
        description: form.description.trim(),
        deadline: new Date(form.deadline).toISOString(),
        statut: form.statut,
        etudiantIds: form.etudiantIds,
      });
      toast({ title: "Tâche mise à jour" });
      setTacheModal({ open: false });
      await fetchProject();
    } catch {
      toast({ title: "Erreur", description: "Impossible de modifier la tâche", variant: "destructive" });
      throw new Error("fail");
    }
  };

  // ── Delete tache ──
  const handleDeleteTache = async () => {
    if (!project || !deleteTacheModal.tache) return;
    setDeletingTache(true);
    try {
      await api.delete(`/projets/${project.id}/taches/${deleteTacheModal.tache.id}`);
      toast({ title: "Tâche supprimée" });
      setDeleteTacheModal({ open: false });
      await fetchProject();
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer la tâche", variant: "destructive" });
    } finally {
      setDeletingTache(false);
    }
  };

  // ── Quick status toggle ──
  const handleToggleStatut = async (tache: Tache) => {
    if (!project) return;
    const next = tache.statut === "terminee" ? "en_cours" : tache.statut === "en_cours" ? "terminee" : "en_cours";
    try {
      await api.put(`/projets/${project.id}/taches/${tache.id}`, { statut: next });
      await fetchProject();
    } catch {
      toast({ title: "Erreur", description: "Impossible de changer le statut", variant: "destructive" });
    }
  };

  // ── Guard: loading ──
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

  const cfg = statutConfig[project.statut] || statutConfig.en_attente;
  const StatutIcon = cfg.icon;
  const days = daysLeft(project.deadline);
  const isOverdue = days !== null && days < 0 && project.statut !== "termine";
  const canManage = user?.role === "club" || user?.role === "admin";
  const membres = project.etudiants || [];
  const taches = project.taches || [];
  const tachesTerminees = taches.filter((t) => t.statut === "terminee").length;

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

        {/* Hero */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-6">
          <div className={`h-1.5 w-full ${cfg.bar}`} />
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {project.clubNom && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-400 mb-2">
                    <Building2 className="w-3 h-3" />{project.clubNom}
                  </span>
                )}
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                  {project.titre}
                </h1>
                {project.description && (
                  <p className="mt-3 text-gray-500 dark:text-gray-400 leading-relaxed">{project.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${cfg.badge}`}>
    <StatutIcon className="w-4 h-4" />{cfg.label}
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

            {project.objectif && (
              <div className="mt-5 flex gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-xl border border-blue-100 dark:border-blue-900">
                <Target className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Objectif</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">{project.objectif}</p>
                </div>
              </div>
            )}

            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Progression globale</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{project.progression}%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                <div className={`h-2.5 rounded-full transition-all duration-700 ${cfg.bar}`} style={{ width: `${project.progression}%` }} />
              </div>
              {taches.length > 0 && (
                <p className="text-xs text-gray-400 mt-1.5">
                  {tachesTerminees} / {taches.length} tâche{taches.length > 1 ? "s" : ""} terminée{tachesTerminees > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Tâches ── */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Tâches
                  {taches.length > 0 && <span className="ml-2 text-xs font-normal text-gray-400">({taches.length})</span>}
                </h2>
                {canManage && (
                  <Button
                    size="sm"
                    onClick={() => setTacheModal({ open: true, tache: undefined })}
                    className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1"
                  >
                    <Plus className="w-3 h-3" /> Ajouter
                  </Button>
                )}
              </div>

              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {taches.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <BookOpen className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Aucune tâche pour ce projet</p>
                    {canManage && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3 text-xs"
                        onClick={() => setTacheModal({ open: true })}
                      >
                        Créer la première tâche
                      </Button>
                    )}
                  </div>
                ) : (
                  taches.map((tache) => {
                    const tOpt = tacheStatutOptions.find((s) => s.value === tache.statut) || tacheStatutOptions[0];
                    const tDays = daysLeft(tache.deadline);
                    const tOverdue = tDays !== null && tDays < 0 && tache.statut !== "terminee";
                    const assignedMembers = membres.filter((m) => tache.etudiantIds?.includes(m.id));

                    return (
                      <div key={tache.id} className="px-6 py-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
                        {/* Status dot / toggle */}
                        <button
                          onClick={() => handleToggleStatut(tache)}
                          title="Changer le statut"
                          className={`mt-1 shrink-0 w-4 h-4 rounded-full border-2 transition-all ${
                            tache.statut === "terminee"
                              ? "bg-emerald-500 border-emerald-500"
                              : tache.statut === "en_cours"
                              ? "bg-blue-500 border-blue-500"
                              : "border-gray-300 hover:border-blue-400"
                          }`}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium ${tache.statut === "terminee" ? "line-through text-gray-400" : "text-gray-900 dark:text-white"}`}>
                              {tache.titre}
                            </p>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tOpt.badge}`}>
                                {tOpt.label}
                              </span>
                              {canManage && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => setTacheModal({ open: true, tache })}
                                    className="p-1 rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                                    title="Modifier"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteTacheModal({ open: true, tache })}
                                    className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {tache.description && (
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{tache.description}</p>
                          )}

                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className={`flex items-center gap-1 text-xs ${tOverdue ? "text-red-500" : "text-gray-400"}`}>
                              <Clock className="w-3 h-3" />
                              {tOverdue ? `En retard de ${Math.abs(tDays!)}j` : formatDate(tache.deadline)}
                            </span>
                            {assignedMembers.length > 0 && (
                              <div className="flex items-center gap-1">
                                <div className="flex -space-x-1.5">
                                  {assignedMembers.slice(0, 3).map((m, i) => (
                                    <div
                                      key={m.id}
                                      title={`${m.prenom} ${m.nom}`}
                                      className={`w-5 h-5 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-[8px] font-bold border border-white dark:border-gray-900`}
                                    >
                                      {getInitials(m.nom, m.prenom)}
                                    </div>
                                  ))}
                                  {assignedMembers.length > 3 && (
                                    <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[8px] font-bold text-gray-600 dark:text-gray-300 border border-white dark:border-gray-900">
                                      +{assignedMembers.length - 3}
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs text-gray-400">{assignedMembers.map((m) => m.prenom).join(", ")}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-4">

            {/* Calendrier */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Calendrier</h3>
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
                        ({isOverdue ? `${Math.abs(days)}j dépassé` : `${days}j restants`})
                      </span>
                    )}
                  </p>
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
                    <Button size="sm" variant="outline" className="text-xs h-7 mt-1" onClick={() => setOpenEncadrant(true)}>
                      Inviter un encadrant
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Membres */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Membres <span className="ml-1 text-xs font-normal text-gray-400">({membres.length})</span>
              </h3>
              {membres.length === 0 ? (
                <div className="flex flex-col items-center py-3 gap-2">
                  <Users className="w-8 h-8 text-gray-200" />
                  <p className="text-xs text-gray-400">Aucun membre</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {membres.map((e, i) => (
                    <div key={e.id} className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                        {getInitials(e.nom, e.prenom)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">{e.prenom} {e.nom}</p>
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

      {/* ── Modal: Tâche (create / edit) ── */}
      {tacheModal.open && (
        <TacheModal
          tache={tacheModal.tache}
          membres={membres}
          onClose={() => setTacheModal({ open: false })}
          onSave={tacheModal.tache ? handleUpdateTache : handleCreateTache}
        />
      )}

      {/* ── Modal: Delete tâche ── */}
      {deleteTacheModal.open && deleteTacheModal.tache && (
        <ConfirmModal
          message={`Supprimer la tâche "${deleteTacheModal.tache.titre}" ? Cette action est irréversible.`}
          onConfirm={handleDeleteTache}
          onCancel={() => setDeleteTacheModal({ open: false })}
          loading={deletingTache}
        />
      )}

      {/* ── Modal: Encadrant ── */}
      {openEncadrant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-900 dark:text-white">Choisir un encadrant</h2>
              <button onClick={() => { setOpenEncadrant(false); setSelectedEnseignant(""); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {loadingEnseignants ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
              ) : enseignants.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Aucun enseignant disponible</p>
              ) : (
                <select
                  className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white p-2.5 rounded-lg text-sm"
                  value={selectedEnseignant}
                  onChange={(e) => setSelectedEnseignant(e.target.value)}
                >
                  <option value="">-- Sélectionner --</option>
                  {enseignants.map((e: any) => (
                    <option key={e.id || e._id} value={e.id || e._id}>
                      {e.prenom} {e.nom} {e.grade ? `· ${e.grade}` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
              <Button variant="outline" onClick={() => { setOpenEncadrant(false); setSelectedEnseignant(""); }} className="flex-1">Annuler</Button>
              <Button onClick={handleAssign} disabled={!selectedEnseignant} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">Assigner</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;