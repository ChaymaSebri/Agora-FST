import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users as UsersIcon, Loader2, Building2, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as clubDashboardApi from "@/services/club-dashboard.api";
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
  imageUrl?: string | null;
  organisateurId?: string;
  clubId?: string;
  clubName?: string | null;
  coOrganizerClubIds?: string[];
  coOrganizerClubNames?: string[];
  competenceNames?: string[];
  organizers?: string[];
}

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

type ClubTeacher = {
  id: string;
  nom?: string;
  prenom?: string;
  email: string;
  fullName?: string;
  photo?: string | null;
};

type TeacherInvitation = {
  id: string;
  enseignantId: string;
  enseignant: string;
  email: string;
  grade: string;
  statut: 'en_attente' | 'accepte' | 'refuse';
  message?: string;
  dateInvitation: string;
  dateReponse?: string;
};

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
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [teachers, setTeachers] = useState<ClubTeacher[]>([]);
  const [teacherInvitations, setTeacherInvitations] = useState<TeacherInvitation[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [invitingTeacher, setInvitingTeacher] = useState(false);
  const attendees = event.participantsCount ?? event.attendees;
  const spotsLeft = event.maxAttendees - attendees;
  const isPastEvent = new Date(event.date).getTime() < Date.now();
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
  const isBusy = isDeleting || isRegistering || isCancelling;
  const isRegistrationBusy = isRegistering || isCancelling;
  const invitedTeacherIds = new Set(teacherInvitations.map((invitation) => invitation.enseignantId));
  const availableTeachers = teachers.filter((teacher) => !invitedTeacherIds.has(teacher.id));
  const registrationLabel = isRegistering
    ? "Inscription..."
    : isCancelling
      ? "Annulation..."
      : isRegistered
        ? "Annuler inscription"
        : spotsLeft === 0
          ? "Complet"
          : "S'inscrire";

    const competenceNames = Array.from(
      new Set(
        (event.competenceNames || [])
          .filter((name): name is string => Boolean(name && String(name).trim()))
          .map((name) => String(name).trim()),
      ),
    );
  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(event.id);
    }
  };

  useEffect(() => {
    if (!inviteDialogOpen || !canManage) {
      return;
    }

    const loadTeacherData = async () => {
      try {
        setLoadingTeachers(true);
        const [availableTeacherItems, invitationItems] = await Promise.all([
          clubDashboardApi.getAvailableTeachers(),
          clubDashboardApi.getEventTeacherInvitations(event.id),
        ]);

        setTeachers((availableTeacherItems || []).map((teacher: ClubTeacher) => ({
          id: teacher.id,
          nom: teacher.nom || '',
          prenom: teacher.prenom || '',
          email: teacher.email || '',
          fullName: teacher.fullName || `${teacher.nom || ''} ${teacher.prenom || ''}`.trim(),
          photo: teacher.photo || null,
        })));
        setTeacherInvitations((invitationItems || []) as TeacherInvitation[]);

        const firstAvailableTeacher = (availableTeacherItems || []).find(
          (teacher: ClubTeacher) => !(invitationItems || []).some((invitation: TeacherInvitation) => invitation.enseignantId === teacher.id),
        );
        setSelectedTeacherId(firstAvailableTeacher?.id || '');
      } catch {
        setTeachers([]);
        setTeacherInvitations([]);
        setSelectedTeacherId('');
      } finally {
        setLoadingTeachers(false);
      }
    };

    loadTeacherData();
  }, [canManage, event.id, inviteDialogOpen]);

  const handleInviteTeacher = async () => {
    if (!selectedTeacherId) {
      return;
    }

    try {
      setInvitingTeacher(true);
      await clubDashboardApi.inviteTeacherToEvent(event.id, selectedTeacherId);

      const invitationItems = await clubDashboardApi.getEventTeacherInvitations(event.id);
      setTeacherInvitations((invitationItems || []) as TeacherInvitation[]);

      setTeachers((current) => current.filter((teacher) => teacher.id !== selectedTeacherId));
      setSelectedTeacherId('');
    } finally {
      setInvitingTeacher(false);
    }
  };

  const getInvitationLabel = (statut: TeacherInvitation['statut']) => {
    switch (statut) {
      case 'accepte':
        return 'Acceptée';
      case 'refuse':
        return 'Refusée';
      default:
        return 'En attente';
    }
  };

  const getInvitationVariant = (statut: TeacherInvitation['statut']) => {
    switch (statut) {
      case 'accepte':
        return 'default';
      case 'refuse':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="group hover:shadow-hover transition-all duration-300 border-border hover:border-primary/50">
      {event.imageUrl ? (
        <div className="aspect-video w-full overflow-hidden rounded-t-xl">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : null}
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
                <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                  C
                </span>
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
                  disabled={isBusy || isPastEvent}
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

              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-center gap-2" disabled={isBusy || isPastEvent}>
                    <Mail className="h-4 w-4" />
                    Inviter un enseignant
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Inviter un enseignant</DialogTitle>
                    <DialogDescription>
                      Choisissez un enseignant à inviter à cet événement.
                    </DialogDescription>
                  </DialogHeader>

                  {loadingTeachers ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Chargement des enseignants...
                    </div>
                  ) : availableTeachers.length === 0 ? (
                    <div className="rounded-md border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                      Aucun enseignant disponible.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={selectedTeacherId}
                        onChange={(e) => setSelectedTeacherId(e.target.value)}
                      >
                        <option value="">Choisir un enseignant</option>
                        {availableTeachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.fullName || `${teacher.nom || ''} ${teacher.prenom || ''}`.trim() || teacher.email}
                          </option>
                        ))}
                      </select>

                      {teacherInvitations.length > 0 && (
                        <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
                          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Invitations envoyées
                          </div>
                          <div className="space-y-2">
                            {teacherInvitations.map((invitation) => (
                              <div key={invitation.id} className="flex items-center justify-between gap-3 rounded-md bg-background px-3 py-2 text-sm">
                                <div className="min-w-0">
                                  <div className="truncate font-medium text-foreground">{invitation.enseignant}</div>
                                  <div className="truncate text-xs text-muted-foreground">{invitation.email}</div>
                                </div>
                                <Badge variant={getInvitationVariant(invitation.statut) as 'default' | 'secondary' | 'outline' | 'destructive'}>
                                  {getInvitationLabel(invitation.statut)}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)} disabled={invitingTeacher}>
                      Fermer
                    </Button>
                    <Button type="button" variant="default" onClick={() => { void handleInviteTeacher(); }} disabled={isBusy || invitingTeacher || loadingTeachers || !selectedTeacherId}>
                      {invitingTeacher ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Envoi...
                        </>
                      ) : (
                        'Envoyer'
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
