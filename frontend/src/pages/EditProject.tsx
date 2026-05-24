import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";

interface ProjectForm {
  titre: string;
  description?: string;
  objectif?: string;
  deadline: string;
  progression: number;
  statut: "en_cours" | "termine" | "annule" | "en_attente";
}

const EditProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<ProjectForm>({
    titre: "",
    description: "",
    objectif: "",
    deadline: "",
    progression: 0,
    statut: "en_attente",
  });

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await api.get(`/projets/${id}`);
        const p = res.data;

        setForm({
          titre: p.titre || "",
          description: p.description || "",
          objectif: p.objectif || "",
          deadline: p.deadline?.split("T")[0] || "",
          progression: p.progression || 0,
          statut: p.statut || "en_attente",
        });
      } catch {
        toast({
          title: "Erreur",
          description: "Impossible de charger le projet",
          variant: "destructive",
        });
        navigate("/projects");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProject();
  }, [id]);

  const handleChange = (key: keyof ProjectForm, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.put(`/projets/${id}`, form);

      toast({
        title: "Succès",
        description: "Projet mis à jour avec succès",
      });

      navigate(`/projects/${id}`);
    } catch {
      toast({
        title: "Erreur",
        description: "Échec de la mise à jour",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm mb-6 text-gray-500"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

      <h1 className="text-2xl font-bold mb-6">Modifier le projet</h1>

      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="text-sm">Titre</label>
          <Input
            value={form.titre}
            onChange={(e) => handleChange("titre", e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm">Description</label>
          <Textarea
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm">Objectif</label>
          <Textarea
            value={form.objectif}
            onChange={(e) => handleChange("objectif", e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm">Deadline</label>
          <Input
            type="date"
            value={form.deadline}
            onChange={(e) => handleChange("deadline", e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm">Progression (%)</label>
          <Input
            type="number"
            min={0}
            max={100}
            value={form.progression}
            onChange={(e) =>
              handleChange("progression", Number(e.target.value))
            }
          />
        </div>

        <div>
          <label className="text-sm">Statut</label>
          <select
            className="w-full border rounded p-2"
            value={form.statut}
            onChange={(e) => handleChange("statut", e.target.value)}
          >
            <option value="en_attente">En attente</option>
            <option value="en_cours">En cours</option>
            <option value="termine">Terminé</option>
            <option value="annule">Annulé</option>
          </select>
        </div>

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Sauvegarde...
            </>
          ) : (
            "Enregistrer"
          )}
        </Button>
      </form>
    </div>
  );
};

export default EditProject;