import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { z } from "zod";

type ProfileResponse = {
  email: string;
  role: "etudiant" | "enseignant" | "club" | "admin";
  full_name?: string;
  avatar_url?: string;
  niveau?: string;
  filiere?: string;
  grade?: string;
  specialite?: string;
  club_name?: string;
  club_description?: string;
  club_specialite?: string;
  club_creation_date?: string;
};

const EditProfile = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<ProfileResponse["role"] | "">("");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [email, setEmail] = useState("");
  const [niveau, setNiveau] = useState("");
  const [filiere, setFiliere] = useState("");
  const [grade, setGrade] = useState("");
  const [specialite, setSpecialite] = useState("");
  const [clubName, setClubName] = useState("");
  const [clubDescription, setClubDescription] = useState("");
  const [clubSpecialite, setClubSpecialite] = useState("");
  const [clubCreationDate, setClubCreationDate] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setPhotoFile(selectedFile);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }

    if (selectedFile) {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const { data } = await api.get<ProfileResponse>("/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setRole(data.role ?? "");
        setFullName(data.full_name ?? "");
        setAvatarUrl(data.avatar_url ?? "");
        setEmail(data.email ?? user.email ?? "");
        setNiveau(data.niveau ?? "");
        setFiliere(data.filiere ?? "");
        setGrade(data.grade ?? "");
        setSpecialite(data.specialite ?? "");
        setClubName(data.club_name ?? "");
        setClubDescription(data.club_description ?? "");
        setClubSpecialite(data.club_specialite ?? "");
        setClubCreationDate(data.club_creation_date ? String(data.club_creation_date).slice(0, 10) : "");
      } catch (error) {
        const message =
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Impossible de charger le profil";
        toast({ title: "Erreur", description: message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (role !== "club" && fullName.trim().length < 1) {
      toast({ title: "Validation", description: "Le nom est requis", variant: "destructive" });
      return;
    }

    if (role === "etudiant" && (!niveau.trim() || !filiere.trim())) {
      toast({
        title: "Validation",
        description: "Niveau et filière sont requis pour un étudiant",
        variant: "destructive",
      });
      return;
    }

    if (role === "enseignant" && !grade.trim()) {
      toast({ title: "Validation", description: "Le grade est requis pour un enseignant", variant: "destructive" });
      return;
    }

    if (role === "club" && !clubName.trim()) {
      toast({ title: "Validation", description: "Le nom du club est requis", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      let uploadedAvatarUrl = avatarUrl;
      if (photoFile) {
        uploadedAvatarUrl = await uploadImageToCloudinary(photoFile);
      }

      const token = localStorage.getItem("authToken");
      const { data } = await api.patch(
        "/users/me",
        {
          full_name: role === "club" ? undefined : fullName.trim(),
          avatar_url: uploadedAvatarUrl,
          niveau: role === "etudiant" ? niveau.trim() : undefined,
          filiere: role === "etudiant" ? filiere.trim() : undefined,
          grade: role === "enseignant" ? grade.trim() : undefined,
          specialite: role === "etudiant" || role === "enseignant" || role === "admin" ? specialite.trim() : undefined,
          club_name: role === "club" ? clubName.trim() : undefined,
          club_description: role === "club" ? clubDescription.trim() : undefined,
          club_specialite: role === "club" ? clubSpecialite.trim() : undefined,
          club_creation_date: role === "club" ? (clubCreationDate || undefined) : undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const profile = data as ProfileResponse;
      setRole(profile.role ?? role);
      setFullName(profile.full_name ?? "");
      setAvatarUrl(profile.avatar_url ?? "");
      setEmail(profile.email ?? email);
      setNiveau(profile.niveau ?? "");
      setFiliere(profile.filiere ?? "");
      setGrade(profile.grade ?? "");
      setSpecialite(profile.specialite ?? "");
      setClubName(profile.club_name ?? "");
      setClubDescription(profile.club_description ?? "");
      setClubSpecialite(profile.club_specialite ?? "");
      setClubCreationDate(profile.club_creation_date ? String(profile.club_creation_date).slice(0, 10) : "");
      setPhotoFile(null);
      setPreviewUrl("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await refreshUser();
      toast({ title: "Profil mis à jour", description: "Vos informations ont été enregistrées." });
      navigate("/profile");
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Impossible de mettre a jour le profil";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const initial = (fullName || email).charAt(0).toUpperCase();
  const displayedAvatar = previewUrl || avatarUrl || undefined;

  return (
    <div className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
      <Button variant="ghost" size="sm" onClick={() => navigate("/profile")} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Retour au profil
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Modifier le profil</CardTitle>
          <CardDescription>Mettez à jour vos informations personnelles</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Changer la photo de profil"
              >
                <Avatar className="w-20 h-20 cursor-pointer ring-2 ring-transparent transition hover:ring-primary/50">
                  <AvatarImage src={displayedAvatar} alt={fullName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {initial}
                  </AvatarFallback>
                </Avatar>
              </button>
              <div className="text-sm text-muted-foreground">Cliquez sur la photo pour la changer</div>
              <Input
                id="avatar_file"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                ref={fileInputRef}
                className="hidden"
              />
            </div>

            {role !== "club" && (
              <div className="space-y-2">
                <Label htmlFor="full_name">Nom complet</Label>
                <Input
                  id="full_name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Votre nom"
                  maxLength={100}
                />
              </div>
            )}

            {role === "etudiant" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="niveau">Niveau</Label>
                  <Input id="niveau" value={niveau} onChange={(e) => setNiveau(e.target.value)} placeholder="L3" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filiere">Filière</Label>
                  <Input
                    id="filiere"
                    value={filiere}
                    onChange={(e) => setFiliere(e.target.value)}
                    placeholder="Informatique"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialite-etudiant">Spécialité</Label>
                  <Input
                    id="specialite-etudiant"
                    value={specialite}
                    onChange={(e) => setSpecialite(e.target.value)}
                    placeholder="IA, Web, Cybersécurité..."
                  />
                </div>
              </>
            )}

            {role === "enseignant" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade</Label>
                  <Input
                    id="grade"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="Maître de conférences"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialite-enseignant">Spécialité</Label>
                  <Input
                    id="specialite-enseignant"
                    value={specialite}
                    onChange={(e) => setSpecialite(e.target.value)}
                    placeholder="Data, Génie logiciel..."
                  />
                </div>
              </>
            )}

            {role === "club" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="club-name">Nom du club</Label>
                  <Input
                    id="club-name"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    placeholder="Club Robotique"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="club-description">Description</Label>
                  <Input
                    id="club-description"
                    value={clubDescription}
                    onChange={(e) => setClubDescription(e.target.value)}
                    placeholder="Description du club"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="club-specialite">Spécialité</Label>
                  <Input
                    id="club-specialite"
                    value={clubSpecialite}
                    onChange={(e) => setClubSpecialite(e.target.value)}
                    placeholder="Robotique, Entrepreneuriat..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="club-creation-date">Date de création</Label>
                  <Input
                    id="club-creation-date"
                    type="date"
                    value={clubCreationDate}
                    onChange={(e) => setClubCreationDate(e.target.value)}
                  />
                </div>
              </>
            )}

            {role === "admin" && (
              <div className="space-y-2">
                <Label htmlFor="specialite-admin">Spécialité</Label>
                <Input
                  id="specialite-admin"
                  value={specialite}
                  onChange={(e) => setSpecialite(e.target.value)}
                  placeholder="Optionnel"
                />
              </div>
            )}

            <Button type="submit" variant="hero" disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditProfile;
