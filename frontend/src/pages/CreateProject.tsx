import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  FolderKanban, Loader2, Calendar, ArrowLeft,
  GraduationCap, Target, FileText, Info,
} from "lucide-react";
import api from "@/services/api";

interface Enseignant {
  id: string;
  full_name: string;
  email: string;
  grade?: string;
}

const CreateProject = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [loadingEnseignants, setLoadingEnseignants] = useState(false);

  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [objectif, setObjectif] = useState("");
  const [deadline, setDeadline] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [enseignantId, setEnseignantId] = useState("");

  // Redirect non-authorized
  if (!(user?.role === "club" || user?.role === "admin")) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Seuls les clubs et administrateurs peuvent créer des projets.</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate("/projects")}>
            Retour aux projets
          </Button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const fetchEnseignants = async () => {
      setLoadingEnseignants(true);
      try {
        const res = await api.get("/users", { params: { role: "enseignant" } });
        // Adapt to your API response shape
        const data = res.data?.items || res.data?.users || res.data || [];

// keep only enseignants
const enseignantsOnly = Array.isArray(data)
  ? data.filter((user) => user.role === "enseignant")
  : [];

setEnseignants(enseignantsOnly);
      } catch {
        // silently fail — encadrant is optional
      } finally {
        setLoadingEnseignants(false);
      }
    };
    fetchEnseignants();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim() || !deadline) {
      toast({ title: "Erreur", description: "Le titre et la deadline sont obligatoires", variant: "destructive" });
      return;
    }

    try {
      setIsLoading(true);
      const payload: Record<string, unknown> = {
        titre: titre.trim(),
        description: description.trim(),
        objectif: objectif.trim(),
        deadline: new Date(deadline).toISOString(),
        statut: "en_attente",
        progression: 0,
      };
      if (dateDebut) payload.dateDebut = new Date(dateDebut).toISOString();
      if (enseignantId && enseignantId !== "none") payload.enseignantId = enseignantId;

      await api.post("/projets", payload);
      toast({ title: "Projet créé !", description: "Le projet a été créé avec succès." });
      navigate("/projects");
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || "Impossible de créer le projet";
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

        {/* Back */}
        <button
          onClick={() => navigate("/projects")}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux projets
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <FolderKanban className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Créer un projet</h1>
            <p className="text-sm text-gray-400">Lancez un nouveau projet académique</p>
          </div>
        </div>

        <div className="space-y-4">

          {/* Section: Informations */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Informations générales</h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="titre" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Titre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="titre"
                  placeholder="Ex : Développement d'une application mobile..."
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez le contexte et les enjeux du projet..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="objectif" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  <span className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-blue-500" />
                    Objectif
                  </span>
                </Label>
                <Textarea
                  id="objectif"
                  placeholder="Quel est le résultat attendu de ce projet ?"
                  value={objectif}
                  onChange={(e) => setObjectif(e.target.value)}
                  rows={2}
                  className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Calendrier */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Calendrier</h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="dateDebut" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Date de début
                </Label>
                <Input
                  id="dateDebut"
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  min={today}
                  className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deadline" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Deadline <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={dateDebut || today}
                  className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                />
              </div>
            </div>
          </div>

          {/* Section: Encadrant */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-800 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Encadrant</h2>
            </div>
            <div className="p-6">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Choisir un encadrant
                  <span className="ml-1.5 text-xs font-normal text-gray-400">(optionnel)</span>
                </Label>
                <Select value={enseignantId} onValueChange={setEnseignantId}>
                  <SelectTrigger className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <SelectValue placeholder={loadingEnseignants ? "Chargement..." : "Sélectionner un enseignant"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-gray-400 italic">Aucun encadrant pour l'instant</span>
                    </SelectItem>
                    {enseignants.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{e.full_name}</span>
                          {e.grade && <span className="text-xs text-gray-400">{e.grade}</span>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-3 flex items-start gap-2 text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <p>Vous pouvez créer le projet sans encadrant et envoyer une invitation à un enseignant ultérieurement.</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/projects")}
              className="flex-1"
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !titre.trim() || !deadline}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer le projet"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;