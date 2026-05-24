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
  createProjectTask,
  deleteProjectTask,
  getProjectTasks,
  updateProjectTask,
  updateProjectTaskStatus,
  type ProjectProgressStats,
  type ProjectTask,
  type ProjectTaskUser,
  type TaskPriority,
  type TaskStatus,
} from "@/services/project-tasks.api";
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
}

interface TaskForm {
  title: string;
  description: string;
  assignedTo: string;
  role: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
}

// ─── Bundle (même structure que ClubProjectTasksManagement) ──────────────────

const emptyStats: ProjectProgressStats = {
  totalTasks: 0,
  completedTasks: 0,
  inProgressTasks: 0,
  blockedTasks: 0,
  todoTasks: 0,
  remainingTasks: 0,
  progressPercentage: 0,
};

// ─── Configs ─────────────────────────────────────────────────────────────────

const statutConfig = {
  en_attente: { label: "En attente", icon: CircleDashed, bar: "bg-amber-400", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  en_cours:   { label: "En cours",   icon: CirclePlay,   bar: "bg-blue-500",  badge: "bg-blue-50 text-blue-700 border-blue-200" },
  termine:    { label: "Terminé",    icon: CheckCircle2, bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  annule:     { label: "Annulé",     icon: CircleX,      bar: "bg-red-400",   badge: "bg-red-50 text-red-700 border-red-200" },
};

const statusOptions: { value: TaskStatus; label: string; dot: string; badge: string }[] = [
  { value: "todo",        label: "À faire",  dot: "bg-gray-400",    badge: "bg-gray-100 text-gray-600" },
  { value: "in_progress", label: "En cours", dot: "bg-blue-500",    badge: "bg-blue-100 text-blue-700" },
  { value: "completed",   label: "Terminée", dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
  { value: "blocked",     label: "Bloquée",  dot: "bg-red-500",     badge: "bg-red-100 text-red-700" },
];

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: "low",    label: "Basse" },
  { value: "medium", label: "Moyenne" },
  { value: "high",   label: "Haute" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function toInputDate(d?: string | null) {
  if (!d) return "";
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
}

function daysLeft(deadline?: string) {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
}

function getInitials(nom?: string, prenom?: string) {
  return `${(prenom?.[0] || "").toUpperCase()}${(nom?.[0] || "").toUpperCase()}`;
}

function userName(user?: ProjectTaskUser | null) {
  return [user?.prenom, user?.nom].filter(Boolean).join(" ") || user?.email || "Participant";
}

const avatarColors = [
  "from-indigo-400 to-purple-500",
  "from-blue-400 to-cyan-500",
  "from-emerald-400 to-teal-500",
  "from-orange-400 to-red-500",
  "from-pink-400 to-rose-500",
];

const defaultForm = (firstParticipantId = ""): TaskForm => ({
  title: "",
  description: "",
  assignedTo: firstParticipantId,
  role: "",
  priority: "medium",
  status: "todo",
  dueDate: "",
});

// ─── Task Modal ───────────────────────────────────────────────────────────────

const TaskModal = ({
  task,
  participants,
  onClose,
  onSave,
}: {
  task?: ProjectTask;
  participants: ProjectTaskUser[];
  onClose: () => void;
  onSave: (form: TaskForm) => Promise<void>;
}) => {
  const [form, setForm] = useState<TaskForm>(
    task
      ? {
          title: task.title,
          description: task.description || "",
          assignedTo: task.assignedTo?.id || participants[0]?.id || "",
          role: task.role || "",
          priority: task.priority,
          status: task.status,
          dueDate: toInputDate(task.dueDate),
        }
      : defaultForm(participants[0]?.id || "")
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title.trim() || !form.assignedTo) return;
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
            {task ? "Modifier la tâche" : "Nouvelle tâche"}
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
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
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

          {/* Participant + Rôle */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Participant <span className="text-red-500">*</span>
              </Label>
              {participants.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Aucun membre</p>
              ) : (
                <select
                  value={form.assignedTo}
                  onChange={(e) => setForm((f) => ({ ...f, assignedTo: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">-- Choisir --</option>
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>{userName(p)}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">Rôle</Label>
              <Input
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                placeholder="Frontend, rapport..."
                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              />
            </div>
          </div>

          {/* Priorité + Statut */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">Priorité</Label>
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                {priorityOptions.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">Statut</Label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TaskStatus }))}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">Deadline</Label>
            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={saving}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !form.title.trim() || !form.assignedTo}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : task ? "Enregistrer" : "Créer la tâche"}
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

  // Bundle tâches (même structure que ClubProjectTasksManagement)
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [participants, setParticipants] = useState<ProjectTaskUser[]>([]);
  const [stats, setStats] = useState<ProjectProgressStats>(emptyStats);
  const [bundleLoading, setBundleLoading] = useState(false);

  // Enseignants modal
  const [enseignants, setEnseignants] = useState<any[]>([]);
  const [loadingEnseignants, setLoadingEnseignants] = useState(false);
  const [selectedEnseignant, setSelectedEnseignant] = useState("");
  const [openEncadrant, setOpenEncadrant] = useState(false);

  // Task modals
  const [taskModal, setTaskModal] = useState<{ open: boolean; task?: ProjectTask }>({ open: false });
  const [deleteTaskModal, setDeleteTaskModal] = useState<{ open: boolean; task?: ProjectTask }>({ open: false });
  const [deletingTask, setDeletingTask] = useState(false);

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

  // ── Fetch bundle tâches (même logique que ClubProjectTasksManagement) ──
  const loadBundle = async (projectId: string) => {
    setBundleLoading(true);
    try {
      const data = await getProjectTasks(projectId);
      setTasks(data.tasks || []);
      setParticipants(data.participants || []);
      setStats(data.stats || emptyStats);
    } catch (error) {
      console.error("Erreur lors du chargement des tâches du projet", error);
      setTasks([]);
      setParticipants([]);
      setStats(emptyStats);
    } finally {
      setBundleLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  useEffect(() => {
    if (id) loadBundle(id);
  }, [id]);

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

  // ── Create task ──
  const handleCreateTask = async (form: TaskForm) => {
    if (!project) return;
    try {
      await createProjectTask({
        projectId: project.id,
        title: form.title.trim(),
        description: form.description.trim(),
        assignedTo: form.assignedTo,
        role: form.role.trim(),
        priority: form.priority,
        status: form.status,
        dueDate: form.dueDate || null,
      });
      toast({ title: "Tâche créée" });
      setTaskModal({ open: false });
      await loadBundle(project.id);
    } catch {
      toast({ title: "Erreur", description: "Impossible de créer la tâche", variant: "destructive" });
      throw new Error("fail");
    }
  };

  // ── Update task ──
  const handleUpdateTask = async (form: TaskForm) => {
    if (!project || !taskModal.task) return;
    try {
      await updateProjectTask(taskModal.task.id, {
        projectId: project.id,
        title: form.title.trim(),
        description: form.description.trim(),
        assignedTo: form.assignedTo,
        role: form.role.trim(),
        priority: form.priority,
        status: form.status,
        dueDate: form.dueDate || null,
      });
      toast({ title: "Tâche mise à jour" });
      setTaskModal({ open: false });
      await loadBundle(project.id);
    } catch {
      toast({ title: "Erreur", description: "Impossible de modifier la tâche", variant: "destructive" });
      throw new Error("fail");
    }
  };

  // ── Delete task ──
  const handleDeleteTask = async () => {
    if (!project || !deleteTaskModal.task) return;
    setDeletingTask(true);
    try {
      await deleteProjectTask(deleteTaskModal.task.id);
      toast({ title: "Tâche supprimée" });
      setDeleteTaskModal({ open: false });
      await loadBundle(project.id);
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer la tâche", variant: "destructive" });
    } finally {
      setDeletingTask(false);
    }
  };

  // ── Quick status toggle (completed ↔ in_progress) ──
  const handleToggleStatus = async (task: ProjectTask) => {
    const next: TaskStatus = task.status === "completed" ? "in_progress" : "completed";
    try {
      await updateProjectTaskStatus(task.id, next);
      if (project) await loadBundle(project.id);
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

  // Progression depuis les stats de tâches si disponibles, sinon valeur projet
  const progression = stats.totalTasks > 0 ? stats.progressPercentage : project.progression;

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

            {/* Progression depuis les stats tâches */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Progression globale</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {bundleLoading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : `${progression}%`}
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                <div className={`h-2.5 rounded-full transition-all duration-700 ${cfg.bar}`} style={{ width: `${progression}%` }} />
              </div>
              {stats.totalTasks > 0 && (
                <p className="text-xs text-gray-400 mt-1.5">
                  {stats.completedTasks} / {stats.totalTasks} tâche{stats.totalTasks > 1 ? "s" : ""} terminée{stats.completedTasks > 1 ? "s" : ""}
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
                  {tasks.length > 0 && <span className="ml-2 text-xs font-normal text-gray-400">({tasks.length})</span>}
                </h2>
                {canManage && (
                  <Button
                    size="sm"
                    onClick={() => setTaskModal({ open: true, task: undefined })}
                    className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1"
                    disabled={participants.length === 0}
                  >
                    <Plus className="w-3 h-3" /> Ajouter
                  </Button>
                )}
              </div>

              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {bundleLoading ? (
                  <div className="px-6 py-12 flex justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <BookOpen className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Aucune tâche pour ce projet</p>
                    {canManage && participants.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3 text-xs"
                        onClick={() => setTaskModal({ open: true })}
                      >
                        Créer la première tâche
                      </Button>
                    )}
                    {canManage && participants.length === 0 && (
                      <p className="text-xs text-gray-300 mt-2">Ajoutez des membres au projet pour créer des tâches</p>
                    )}
                  </div>
                ) : (
                  tasks.map((task) => {
                    const sOpt = statusOptions.find((s) => s.value === task.status) || statusOptions[0];
                    const tDays = daysLeft(task.dueDate ?? undefined);
                    const tOverdue = tDays !== null && tDays < 0 && task.status !== "completed";

                    return (
                      <div key={task.id} className="px-6 py-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
                        {/* Status dot / toggle */}
                        <button
                          onClick={() => handleToggleStatus(task)}
                          title="Marquer comme terminée / en cours"
                          className={`mt-1 shrink-0 w-4 h-4 rounded-full border-2 transition-all ${
                            task.status === "completed"
                              ? "bg-emerald-500 border-emerald-500"
                              : task.status === "in_progress"
                              ? "bg-blue-500 border-blue-500"
                              : task.status === "blocked"
                              ? "bg-red-500 border-red-500"
                              : "border-gray-300 hover:border-blue-400"
                          }`}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium ${task.status === "completed" ? "line-through text-gray-400" : "text-gray-900 dark:text-white"}`}>
                              {task.title}
                            </p>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sOpt.badge}`}>
                                {sOpt.label}
                              </span>
                              {canManage && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => setTaskModal({ open: true, task })}
                                    className="p-1 rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                                    title="Modifier"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteTaskModal({ open: true, task })}
                                    className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {task.description && (
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{task.description}</p>
                          )}

                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            {task.dueDate && (
                              <span className={`flex items-center gap-1 text-xs ${tOverdue ? "text-red-500" : "text-gray-400"}`}>
                                <Clock className="w-3 h-3" />
                                {tOverdue ? `En retard de ${Math.abs(tDays!)}j` : formatDate(task.dueDate)}
                              </span>
                            )}
                            {task.assignedTo && (
                              <span className="text-xs text-gray-400">
                                → {userName(task.assignedTo)}
                                {task.role && <span className="ml-1 text-gray-300">· {task.role}</span>}
                              </span>
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

            {/* Stats tâches */}
            {stats.totalTasks > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Tâches</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Total",      value: stats.totalTasks,      color: "text-gray-700 dark:text-gray-200" },
                    { label: "Terminées",  value: stats.completedTasks,  color: "text-emerald-600" },
                    { label: "En cours",   value: stats.inProgressTasks, color: "text-blue-600" },
                    { label: "Bloquées",   value: stats.blockedTasks,    color: "text-red-500" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                      <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-gray-400">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

            {project.enseignant ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Encadrant</h3>
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
              </div>
            ) : null}

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

      {/* ── Modal: Task (create / edit) ── */}
      {taskModal.open && (
        <TaskModal
          task={taskModal.task}
          participants={participants}
          onClose={() => setTaskModal({ open: false })}
          onSave={taskModal.task ? handleUpdateTask : handleCreateTask}
        />
      )}

      {/* ── Modal: Delete task ── */}
      {deleteTaskModal.open && deleteTaskModal.task && (
        <ConfirmModal
          message={`Supprimer la tâche "${deleteTaskModal.task.title}" ? Cette action est irréversible.`}
          onConfirm={handleDeleteTask}
          onCancel={() => setDeleteTaskModal({ open: false })}
          loading={deletingTask}
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