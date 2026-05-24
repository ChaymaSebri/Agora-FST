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
import { uploadImageToCloudinary } from "@/lib/cloudinary";

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

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Guard
  if (!(user?.role === "club" || user?.role === "admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Accès refusé</p>
          <Button onClick={() => navigate("/projects")} className="mt-4">
            Retour
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
        const data = res.data?.items || res.data?.users || res.data || [];

        const list = Array.isArray(data)
          ? data.filter((u: any) => u.role === "enseignant")
          : [];

        setEnseignants(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingEnseignants(false);
      }
    };

    fetchEnseignants();
  }, []);

  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titre.trim() || !deadline) {
      toast({
        title: "Erreur",
        description: "Titre et deadline obligatoires",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      let imageUrl: string | undefined;
      if (photoFile) {
        imageUrl = await uploadImageToCloudinary(photoFile);
      }

      const payload = {
        titre: titre.trim(),
        description: description.trim(),
        objectif: objectif.trim(),
        deadline: new Date(deadline).toISOString(),
        dateDebut: dateDebut ? new Date(dateDebut).toISOString() : undefined,
        enseignantId: enseignantId && enseignantId !== "none" ? enseignantId : undefined,
        imageUrl,
        statut: "en_attente",
        progression: 0,
      };

      await api.post("/projets", payload);

      toast({
        title: "Projet créé",
        description: enseignantId && enseignantId !== "none"
          ? "Le projet a été créé et une demande d'encadrement a été envoyée"
          : "Le projet a été créé avec succès",
      });

      navigate("/projects");
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.response?.data?.message || "Erreur création projet",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Back */}
        <Button variant="ghost" onClick={() => navigate("/projects")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <FolderKanban className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Créer un projet</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Titre */}
          <div>
            <Label>Titre *</Label>
            <Input value={titre} onChange={(e) => setTitre(e.target.value)} />
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {/* Objectif */}
          <div>
            <Label>Objectif</Label>
            <Textarea value={objectif} onChange={(e) => setObjectif(e.target.value)} />
          </div>

          {/* Image */}
          <div>
            <Label>Image</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setPhotoFile(file);
                setPhotoPreview(file ? URL.createObjectURL(file) : null);
              }}
            />
            {photoPreview && (
              <img src={photoPreview} className="mt-2 rounded-md h-40 object-cover" />
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date début</Label>
              <Input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
            </div>

            <div>
              <Label>Deadline *</Label>
              <Input
                type="date"
                value={deadline}
                min={dateDebut || today}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          {/* Encadrant à inviter */}
          <div>
            <Label>Encadrant à inviter</Label>
            <Select value={enseignantId} onValueChange={setEnseignantId}>
              <SelectTrigger>
                <SelectValue placeholder={loadingEnseignants ? "Chargement..." : "Choisir un enseignant"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun</SelectItem>
                {enseignants.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit */}
          <Button disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
            Créer le projet
          </Button>

        </form>
      </div>
    </div>
  );
};

export default CreateProject;