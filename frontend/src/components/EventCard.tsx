import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users as UsersIcon, Loader2, Building2, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ApiError, fetchEventInvitations, fetchTeachers, inviteTeachersToEvent } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  participantsCount?: number;
  maxAttendees: number;
  type: "atelier" | "conference" | "hackathon" | "sortie" | "autre" | "workshop" | "meeting" | "competition";
  organisateurId?: string;
  clubId?: string;
  clubName?: string | null;
  coOrganizerClubIds?: string[];
  coOrganizerClubNames?: string[];
  competenceNames?: string[];
  organizers?: string[];
}

type TeacherInvitation = {
  id: string;
  enseignantId: string | null;
  statut: string;
  invitedAt: string | null;
  respondedAt: string | null;
};

interface EventCardProps {
  event: Event;
  onDelete?: (id: string) => void | Promise<void>;
  onRegister?: (id: string) => void | Promise<void>;
  onCancelRegistration?: (id: string) => void | Promise<void>;
  isRegistered?: boolean;
  isDeleting?: boolean;
  isRegistering?: boolean;
  isCancelling?: boolean;
  canManage?: boolean;
  canRegister?: boolean;
}

const typeColors = {
  atelier: "bg-accent text-accent-foreground",
  workshop: "bg-accent text-accent-foreground",
  conference: "bg-primary text-primary-foreground",
  meeting: "bg-secondary text-secondary-foreground",
  hackathon: "bg-gradient-accent text-accent-foreground",
  competition: "bg-gradient-accent text-accent-foreground",
  sortie: "bg-secondary text-secondary-foreground",
  autre: "bg-muted text-foreground",
};

const typeLabels = {
  atelier: "Atelier",
  workshop: "Atelier",
  conference: "Conférence",
  meeting: "Réunion",
  hackathon: "Hackathon",
  competition: "Compétition",
  sortie: "Sortie",
  autre: "Autre",
};

export const EventCard = ({
  event,
  onDelete,
  onRegister,
  onCancelRegistration,
  isRegistered = false,
  isDeleting = false,
  isRegistering = false,
  isCancelling = false,
  canManage = false,
  canRegister = true,
}: EventCardProps) => {
  const navigate = useNavigate();
  const attendees = event.participantsCount ?? event.attendees;
  const spotsLeft = event.maxAttendees - attendees;
  const { toast } = useToast();
  const [invitePanelOpen, setInvitePanelOpen] = useState(false);
  const [teachers, setTeachers] = useState<Array<{ id: string; full_name: string; email: string }>>([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [teacherInvitations, setTeacherInvitations] = useState<TeacherInvitation[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [isInvitingTeachers, setIsInvitingTeachers] = useState(false);
  const invitedTeacherIds = new Set(
    teacherInvitations
      .map((invitation) => invitation.enseignantId)
      .filter((teacherId): teacherId is string => Boolean(teacherId)),
  );
  const availableTeachers = teachers.filter((teacher) => !invitedTeacherIds.has(teacher.id));
  const organizerClubNames = Array.from(
    new Set(
      [
        ...(event.organizers || []),
        event.clubName,
        ...(event.coOrganizerClubNames || []),
      ]
        .filter((name): name is string => Boolean(name && String(name).trim()))
        .map((name) => String(name).trim()),
    ),
  );
    const competenceNames = Array.from(
      new Set(
        (event.competenceNames || [])
          .filter((name): name is string => Boolean(name && String(name).trim()))
          .map((name) => String(name).trim()),
      ),
    );
  const isBusy = isDeleting || isRegistering || isCancelling;
  const isRegistrationBusy = isRegistering || isCancelling;
  const registrationLabel = isRegistering
    ? "Inscription..."
    : isCancelling
      ? "Annulation..."
      : isRegistered
        ? "Annuler inscription"
        : spotsLeft === 0
          ? "Complet"
          : "S'inscrire";

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(event.id);
    }
  };

  useEffect(() => {
    if (!invitePanelOpen) {
      return;
    }

    const loadTeachers = async () => {
      try {
        setIsLoadingTeachers(true);
        const [teacherItems, invitationItems] = await Promise.all([
          fetchTeachers(),
          fetchEventInvitations(event.id),
        ]);

        setTeachers(
          teacherItems.map((teacher) => ({
            id: teacher.id,
            full_name: teacher.full_name,
            email: teacher.email,
          })),
        );

        setTeacherInvitations(
          invitationItems.map((invitation) => ({
            id: invitation.id,
            enseignantId: invitation.enseignantId ?? null,
            statut: invitation.statut,
            invitedAt: invitation.invitedAt ?? null,
            respondedAt: invitation.respondedAt ?? null,
          })),
        );
        setSelectedTeacherIds([]);
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "Impossible de charger les enseignants.";
        toast({ title: "Erreur", description: message, variant: "destructive" });
      } finally {
        setIsLoadingTeachers(false);
      }
    };

    loadTeachers();
  }, [event.id, invitePanelOpen, toast]);

  const handleInviteTeachers = async () => {
    try {
      setIsInvitingTeachers(true);
      const invitations = await inviteTeachersToEvent(event.id, selectedTeacherIds);
      setSelectedTeacherIds([]);
      setTeacherInvitations((current) => {
        const merged = [...current];

        invitations.forEach((invitation) => {
          const teacherId = invitation.enseignantId ?? null;
          const existingIndex = merged.findIndex(
            (item) => item.id === invitation.id || (teacherId && item.enseignantId === teacherId),
          );

          const nextInvitation = {
            id: invitation.id,
            enseignantId: teacherId,
            statut: invitation.statut,
            invitedAt: invitation.invitedAt ?? null,
            respondedAt: invitation.respondedAt ?? null,
          };

          if (existingIndex >= 0) {
            merged[existingIndex] = nextInvitation;
          } else {
            merged.push(nextInvitation);
          }
        });

        return merged;
      });
      toast({
        title: "Invitations envoyées",
        description: "Les enseignants sélectionnés ont été invités à l'événement.",
      });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "L'invitation a échoué.";
      toast({ title: "Erreur", description: message, variant: "destructive" });
    } finally {
      setIsInvitingTeachers(false);
    }
  };

  return (
    <Card className="group hover:shadow-hover transition-all duration-300 border-border hover:border-primary/50">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Badge className={typeColors[event.type] || typeColors.autre}>
            {typeLabels[event.type] || typeLabels.autre}
          </Badge>
          {spotsLeft <= 10 && spotsLeft > 0 && (
            <Badge variant="outline" className="text-xs text-accent">
              {spotsLeft} places restantes
            </Badge>
          )}
        </div>
        <CardTitle className="text-foreground group-hover:text-primary transition-colors">
          {event.title}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {event.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {competenceNames.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">C</span>
                <div className="flex flex-wrap gap-2">
                  {competenceNames.map((competenceName) => (
                    <Badge key={competenceName} variant="outline" className="text-xs font-normal">
                      {competenceName}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 text-primary" />
            <span>{event.date} à {event.time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UsersIcon className="w-4 h-4 text-primary" />
            <span>{attendees}/{event.maxAttendees} participants</span>
          </div>
          {organizerClubNames.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Building2 className="w-4 h-4 text-primary" />
                <div className="flex flex-wrap gap-2">
                  {organizerClubNames.map((clubName) => (
                    <Badge key={clubName} variant="secondary" className="text-xs font-normal">
                      {clubName}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
        
        <div className="space-y-2">
          {canRegister ? (
            <Button 
              variant={isRegistered ? "outline" : spotsLeft === 0 ? "outline" : "default"}
              className="w-full"
              disabled={isBusy || (spotsLeft === 0 && !isRegistered)}
              onClick={() => {
                if (isRegistered) {
                  onCancelRegistration?.(event.id);
                  return;
                }
                onRegister?.(event.id);
              }}
            >
              {isRegistrationBusy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {registrationLabel}
                </>
              ) : (
                registrationLabel
              )}
            </Button>
          ) : null}
          {canManage ? (
            <div className="space-y-2">
              <div className="grid w-full grid-cols-2 gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="w-full justify-center hover:bg-primary/80"
                  onClick={() => navigate(`/events/${event.id}/edit`)}
                  disabled={isBusy}
                >
                  Modifier
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="default" size="sm" className="w-full justify-center hover:bg-destructive hover:text-destructive-foreground" disabled={isBusy}>
                      Supprimer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer l'événement</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir supprimer "{event.title}" ? Cette action est irréversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={() => { void handleDelete(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <Dialog open={invitePanelOpen} onOpenChange={setInvitePanelOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-center gap-2"
                    disabled={isBusy}
                  >
                    <Mail className="h-4 w-4" />
                    Inviter un enseignant
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Inviter un enseignant</DialogTitle>
                    <DialogDescription>
                      Choisir un ou plusieurs enseignants à inviter à cet événement.
                    </DialogDescription>
                  </DialogHeader>

                  {isLoadingTeachers ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Chargement des enseignants...
                    </div>
                  ) : availableTeachers.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Aucun enseignant disponible.</div>
                  ) : (
                    <div className="max-h-72 space-y-2 overflow-auto pr-1">
                      {availableTeachers.map((teacher) => {
                        return (
                          <label key={teacher.id} className="flex items-start gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm">
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={selectedTeacherIds.includes(teacher.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTeacherIds((current) => Array.from(new Set([...current, teacher.id])));
                                } else {
                                  setSelectedTeacherIds((current) => current.filter((id) => id !== teacher.id));
                                }
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-medium text-foreground">{teacher.full_name || teacher.email}</div>
                              <div className="truncate text-xs text-muted-foreground">{teacher.email}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {teacherInvitations.length > 0 && (
                    <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
                      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Statut des invitations
                      </div>
                      <div className="space-y-2">
                        {teacherInvitations.map((invitation) => {
                          const teacher = teachers.find((item) => item.id === invitation.enseignantId);
                          const statusLabel =
                            invitation.statut === "accepted"
                              ? "Acceptée"
                              : invitation.statut === "declined"
                                ? "Refusée"
                                : "En attente";
                          const statusVariant =
                            invitation.statut === "accepted"
                              ? "default"
                              : invitation.statut === "declined"
                                ? "destructive"
                                : "outline";

                          return (
                            <div key={invitation.id} className="flex items-center justify-between gap-3 rounded-md bg-background px-3 py-2 text-sm">
                              <div className="min-w-0">
                                <div className="truncate font-medium text-foreground">
                                  {teacher?.full_name || teacher?.email || "Enseignant"}
                                </div>
                                <div className="truncate text-xs text-muted-foreground">
                                  {teacher?.email || "—"}
                                </div>
                              </div>
                              <Badge variant={statusVariant as "default" | "secondary" | "outline" | "destructive"}>
                                {statusLabel}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    {selectedTeacherIds.length} enseignant{selectedTeacherIds.length > 1 ? "s" : ""} sélectionné{selectedTeacherIds.length > 1 ? "s" : ""}
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setInvitePanelOpen(false)}
                      disabled={isInvitingTeachers}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="button"
                      variant="accent"
                      onClick={() => { void handleInviteTeachers(); }}
                      disabled={isBusy || isInvitingTeachers || isLoadingTeachers}
                    >
                      {isInvitingTeachers ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Envoi...
                        </>
                      ) : (
                        "Envoyer l'invitation"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};
