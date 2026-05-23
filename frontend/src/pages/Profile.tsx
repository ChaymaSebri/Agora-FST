import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import { fetchCompetences, fetchMyClubMembershipRequests } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import {
  Loader2,
  ArrowLeft,
  Pencil,
  KeyRound,
  Mail,
  User as UserIcon,
  Building2,
  GraduationCap,
  BadgeInfo,
  CalendarDays,
  Users,
} from "lucide-react";

type ProfileResponse = {
  email: string;
  role: "etudiant" | "enseignant" | "club" | "admin";
  full_name?: string;
  avatar_url?: string;
  niveau?: string;
  filiere?: string;
  grade?: string;
  club_name?: string;
  club_description?: string;
  club_specialite?: string;
  club_creation_date?: string;
  club_member_count?: number;
};

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<ProfileResponse["role"] | "">("");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [email, setEmail] = useState("");
  const [niveau, setNiveau] = useState("");
  const [filiere, setFiliere] = useState("");
  const [grade, setGrade] = useState("");
  const [clubName, setClubName] = useState("");
  const [clubDescription, setClubDescription] = useState("");
  const [clubSpecialite, setClubSpecialite] = useState("");
  const [clubCreationDate, setClubCreationDate] = useState("");
  const [clubMemberCount, setClubMemberCount] = useState(0);
  const [competences, setCompetences] = useState<Array<{ id: string; nom: string }>>([]);
  const [userCompetenceIds, setUserCompetenceIds] = useState<string[]>([]);
  const [clubMembershipRequests, setClubMembershipRequests] = useState<
    Array<{ id: string; status: string; club: { id: string; nom: string } | null }>
  >([]);

  const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : user?.role || "—";

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
        const competenceIds = Array.isArray((data as any).competenceIds)
          ? (data as any).competenceIds
          : Array.isArray(user?.competenceIds)
            ? user.competenceIds
            : [];
        setUserCompetenceIds(competenceIds.map(String));
        setClubName(data.club_name ?? "");
        setClubDescription(data.club_description ?? "");
        setClubSpecialite(data.club_specialite ?? "");
        setClubCreationDate(data.club_creation_date ? String(data.club_creation_date).slice(0, 10) : "");
        setClubMemberCount(Number((data as ProfileResponse & { club_member_count?: number }).club_member_count || 0));
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
    const loadCompetences = async () => {
      try {
        const items = await fetchCompetences();
        setCompetences(items.map((c) => ({ id: c.id, nom: c.nom })));
      } catch (e) {
        // ignore
      }
    };
    const loadClubMembershipRequests = async () => {
      if (user?.role !== "etudiant") {
        setClubMembershipRequests([]);
        return;
      }

      try {
        const items = await fetchMyClubMembershipRequests();
        setClubMembershipRequests(items as Array<{ id: string; status: string; club: { id: string; nom: string } | null }>);
      } catch {
        setClubMembershipRequests([]);
      }
    };
    loadCompetences();
    loadClubMembershipRequests();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = role === "club" ? clubName : fullName;
  const initial = (displayName || email).charAt(0).toUpperCase();

  return (
    <div className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
      <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Retour
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Mon profil</CardTitle>
          <CardDescription>Vos informations personnelles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={avatarUrl || undefined} alt={displayName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {initial}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-lg font-semibold text-foreground">
                {displayName || "Sans nom"}
              </div>
              <div className="text-sm text-muted-foreground">{email}</div>
            </div>
          </div>

          <div className="space-y-3 border-t border-border pt-6">
            {role !== "club" ? (
              <div className="flex items-start gap-3">
                <UserIcon className="w-4 h-4 mt-1 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Nom complet</div>
                  <div className="text-sm text-foreground">{fullName || "—"}</div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 mt-1 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Nom du club</div>
                  <div className="text-sm text-foreground">{clubName || "—"}</div>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 mt-1 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Email</div>
                <div className="text-sm text-foreground">{email}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <BadgeInfo className="w-4 h-4 mt-1 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Rôle</div>
                <div className="text-sm text-foreground">{displayRole}</div>
              </div>
            </div>

            {role === "etudiant" && (
              <>
                <div className="flex items-start gap-3">
                  <GraduationCap className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Niveau</div>
                    <div className="text-sm text-foreground">{niveau || "—"}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BadgeInfo className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Filière</div>
                    <div className="text-sm text-foreground">{filiere || "—"}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BadgeInfo className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Compétences</div>
                    <div className="text-sm text-foreground flex flex-wrap gap-2">
                      {userCompetenceIds.length === 0 && <span className="text-muted-foreground">Aucune compétence</span>}
                      {userCompetenceIds.map((id) => {
                        const c = competences.find((x) => x.id === id);
                        return (
                          <span key={id} className="inline-block bg-muted px-2 py-0.5 rounded text-xs">
                            {c ? c.nom : id}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                  <div className="text-sm font-medium text-foreground">Mes clubs</div>
                  {clubMembershipRequests.filter((request) => request.status === "accepted").length === 0 ? (
                    <div className="text-sm text-muted-foreground">Aucune adhésion validée.</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {clubMembershipRequests
                        .filter((request) => request.status === "accepted")
                        .map((request) => (
                          <Badge key={request.id} className="bg-emerald-600 text-white">
                            {request.club?.nom || "Club"}
                          </Badge>
                        ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                  <div className="text-sm font-medium text-foreground">Demandes en attente</div>
                  {clubMembershipRequests.filter((request) => request.status === "pending").length === 0 ? (
                    <div className="text-sm text-muted-foreground">Aucune demande en attente.</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {clubMembershipRequests
                        .filter((request) => request.status === "pending")
                        .map((request) => (
                          <Badge key={request.id} variant="outline">
                            {request.club?.nom || "Club"}
                          </Badge>
                        ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {role === "enseignant" && (
              <>
                <div className="flex items-start gap-3">
                  <GraduationCap className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Grade</div>
                    <div className="text-sm text-foreground">{grade || "—"}</div>
                  </div>
                </div>
              </>
            )}

            {role === "club" && (
              <>
                <div className="flex items-start gap-3">
                  <BadgeInfo className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Description</div>
                    <div className="text-sm text-foreground">{clubDescription || "—"}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BadgeInfo className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Spécialité</div>
                    <div className="text-sm text-foreground">{clubSpecialite || "—"}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CalendarDays className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Date de création</div>
                    <div className="text-sm text-foreground">{clubCreationDate || "—"}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Membres</div>
                    <div className="text-sm text-foreground">
                      {clubMemberCount} membre{clubMemberCount > 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button variant="hero" className="flex-1" onClick={() => navigate("/profile/edit")}>
              <Pencil className="w-4 h-4 mr-2" />
              Modifier le profil
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate("/profile/password")}>
              <KeyRound className="w-4 h-4 mr-2" />
              Changer le mot de passe
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
