import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users as UsersIcon, Pencil, Trash2, Loader2, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  type: "atelier" | "conference" | "hackathon" | "sortie" | "autre";
  organisateurId?: string;
  clubId?: string;
  clubName?: string | null;
  coOrganizerClubIds?: string[];
  coOrganizerClubNames?: string[];
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

const typeColors = {
  atelier: "bg-accent text-accent-foreground",
  conference: "bg-primary text-primary-foreground",
  hackathon: "bg-gradient-accent text-accent-foreground",
  sortie: "bg-secondary text-secondary-foreground",
  autre: "bg-muted text-foreground",
};

const typeLabels = {
  atelier: "Atelier",
  conference: "Conférence",
  hackathon: "Hackathon",
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
  const organizerClubNames = Array.from(
    new Set(
      [event.clubName, ...(event.coOrganizerClubNames || [])]
        .filter((name): name is string => Boolean(name && String(name).trim()))
        .map((name) => String(name).trim()),
    ),
  );
  const isBusy = isDeleting || isRegistering || isCancelling;
  const actionLabel = isDeleting
    ? "Suppression..."
    : isRegistering
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

  return (
    <Card className="group hover:shadow-hover transition-all duration-300 border-border hover:border-primary/50">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Badge className={typeColors[event.type]}>
            {typeLabels[event.type]}
          </Badge>
          {isRegistered && (
            <Badge variant="outline" className="text-xs border-primary/40 text-primary">
              Déjà inscrit
            </Badge>
          )}
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="w-4 h-4 text-primary" />
                <span>Clubs organisateurs</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {organizerClubNames.map((clubName) => (
                  <Badge key={clubName} variant="secondary" className="text-xs">
                    {clubName}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        
        <div className="flex gap-2">
          {canRegister ? (
            <Button 
              variant={isRegistered ? "outline" : spotsLeft === 0 ? "outline" : "default"}
              className="flex-1"
              disabled={isBusy || (spotsLeft === 0 && !isRegistered)}
              onClick={() => {
                if (isRegistered) {
                  onCancelRegistration?.(event.id);
                  return;
                }
                onRegister?.(event.id);
              }}
            >
              {isBusy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {actionLabel}
                </>
              ) : (
                actionLabel
              )}
            </Button>
          ) : null}
          {canManage ? (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate(`/events/${event.id}/edit`)}
                disabled={isBusy}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive hover:text-destructive-foreground" disabled={isBusy}>
                    <Trash2 className="w-4 h-4" />
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
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};
