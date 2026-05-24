import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import { fetchCompetences, fetchMyClubMembershipRequests, fetchMyEventInvitations, respondToEventInvitation } from "@/services/api";
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

type EventInvitation = {
  id: string;
  statut: string;
  invitedAt: string | null;
  respondedAt: string | null;
  event: { id: string; title: string; date: string | null; type: string } | null;
  club: { id: string; nom: string } | null;
};

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const showInvitationsOnly = location.hash === "#invitations";
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
  const [eventInvitations, setEventInvitations] = useState<EventInvitation[]>([]);
  const [respondingInvitationId, setRespondingInvitationId] = useState<string | null>(null);
  const [acceptedClubMemberships, setAcceptedClubMemberships] = useState<Array<{ id: string; club: { id: string; nom: string } | null }>>([]);

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
        setAcceptedClubMemberships([]);
        return;
      }

      try {
        const items = await fetchMyClubMembershipRequests();
        setAcceptedClubMemberships(
          (items as Array<{ id: string; status: string; club: { id: string; nom: string } | null }>)
            .filter((request) => request.status === "accepted"),
        );
      } catch {
        setAcceptedClubMemberships([]);
      }
    };

    const loadEventInvitations = async () => {
      if (user?.role !== "enseignant") {
        setEventInvitations([]);
        return;
      }

      try {
        const items = await fetchMyEventInvitations();
        setEventInvitations(items as EventInvitation[]);
      } catch {
        setEventInvitations([]);
      }
    };

    loadCompetences();
    loadClubMembershipRequests();
    loadEventInvitations();
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
  const invitationsSection =
    role === "enseignant" ? (
      <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
        <div className="text-sm font-medium text-foreground">Mes invitations d'événements</div>
        {eventInvitations.length === 0 ? (
          <div className="text-sm text-muted-foreground">Aucune invitation pour le moment.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {eventInvitations.map((invitation) => (
              <div key={invitation.id} className="rounded-md border border-border bg-background px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {invitation.event?.title || "Événement"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {invitation.club?.nom || "Club"}
                      {invitation.event?.date ? ` • ${String(invitation.event.date).slice(0, 10)}` : ""}
                    </div>
                  </div>
                  <Badge variant={invitation.statut === "pending" ? "outline" : "secondary"} className="shrink-0">
                    {invitation.statut === "pending" ? "En attente" : invitation.statut === "accepted" ? "Acceptée" : "Refusée"}
                  </Badge>
                </div>

                {invitation.statut === "pending" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      disabled={respondingInvitationId === invitation.id}
                      onClick={async () => {
                        try {
                          setRespondingInvitationId(invitation.id);
                          const updated = await respondToEventInvitation(invitation.id, "accept");
                          setEventInvitations((current) =>
                            current.map((item) => (item.id === invitation.id ? updated : item)),
                          );
                        } catch (error) {
                          const message =
                            (error as { message?: string })?.message || "Impossible d'accepter l'invitation";
                          toast({ title: "Erreur", description: message, variant: "destructive" });
                        } finally {
                          setRespondingInvitationId(null);
                        }
                      }}
                    >
                      Accepter
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={respondingInvitationId === invitation.id}
                      onClick={async () => {
                        try {
                          setRespondingInvitationId(invitation.id);
                          const updated = await respondToEventInvitation(invitation.id, "decline");
                          setEventInvitations((current) =>
                            current.map((item) => (item.id === invitation.id ? updated : item)),
                          );
                        } catch (error) {
                          const message =
                            (error as { message?: string })?.message || "Impossible de refuser l'invitation";
                          toast({ title: "Erreur", description: message, variant: "destructive" });
                        } finally {
                          setRespondingInvitationId(null);
                        }
                      }}
                    >
                      Refuser
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    ) : null;

  if (showInvitationsOnly) {
    return (
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Mes invitations</CardTitle>
            <CardDescription>Les invitations reçues de tous les clubs</CardDescription>
          </CardHeader>
          <CardContent>
            {invitationsSection ?? (
              <div className="text-sm text-muted-foreground">Cette section est réservée aux enseignants.</div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

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

                <div className="flex items-start gap-3">
                  <Users className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Clubs</div>
                    <div className="text-sm text-foreground flex flex-wrap gap-2">
                      {acceptedClubMemberships.length === 0 ? (
                        <span className="text-sm text-muted-foreground">Aucune adhésion validée.</span>
                      ) : (
                        acceptedClubMemberships.map((request) => (
                          <span key={request.id} className="inline-block bg-muted px-2 py-0.5 rounded text-xs">
                            {request.club?.nom || "Club"}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
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
