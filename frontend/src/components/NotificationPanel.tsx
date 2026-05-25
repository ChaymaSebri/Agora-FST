import { useNotifications } from "@/hooks/useNotifications";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Check, Trash2, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useState } from "react";
import notificationService from "@/services/notification.service";
import { useAuth } from "@/contexts/AuthContext";
import * as clubDashboardApi from "@/services/club-dashboard.api";

interface NotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ClubTeacherInvitation = {
  id: string;
  eventId: string;
  eventTitle: string;
  enseignantId: string;
  enseignant: string;
  email: string;
  grade: string;
  statut: "en_attente" | "accepte" | "refuse";
  message?: string;
  dateInvitation: string;
  dateReponse?: string;
};

export function NotificationDialog({ open, onOpenChange }: NotificationDialogProps) {
  const { user } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    deleteNotification, 
    markAllAsRead,
    // new opened APIs are available on the service but the hook may still use markAsRead
    // we will call the 'markAllAsOpened' via the hook if available
    // (the hook exposes markAllAsRead for backward compatibility)
    loadNotifications,
  } = useNotifications();
  const [clubTeacherInvitations, setClubTeacherInvitations] = useState<ClubTeacherInvitation[]>([]);
  const [loadingClubInvitations, setLoadingClubInvitations] = useState(false);
  const relevantNotifications = notifications;

  // Recharger les notifications quand la dialog s'ouvre
  useEffect(() => {
    if (open) {
      (async () => {
        const data = await loadNotifications();
            if (data?.notifications && data.notifications.length > 0) {
              const visible = data.notifications; // current page/loaded notifications
              const toOpen = visible.filter((n: any) => n.etat === 'ferme').map((n: any) => n.id);

              if (toOpen.length > 0) {
                try {
                  // Call per-notification 'open' endpoint in parallel when available
                  if ((notificationService as any)?.markAsOpened) {
                    await Promise.all(toOpen.map((id: string) => (notificationService as any).markAsOpened(id)));
                  } else {
                    // Fallback to marking as read
                    await Promise.all(toOpen.map((id: string) => markAsRead(id)));
                  }

                  // Refresh local list after marking opened
                  await loadNotifications();
                } catch (err) {
                  console.error('Erreur lors du marquage des notifications affichées comme ouvertes:', err);
                }
              }
            }
      })();
    }
  }, [open, loadNotifications, markAllAsRead]);

  useEffect(() => {
    if (!open || user?.role !== "club") {
      setClubTeacherInvitations([]);
      return;
    }

    const loadClubTeacherInvitations = async () => {
      try {
        setLoadingClubInvitations(true);
        const events = await clubDashboardApi.listClubEvents();
        const invitationsByEvent = await Promise.allSettled(
          (events || []).map(async (event: any) => {
            const eventId = event.id || event._id;
            const eventTitle = event.titre || event.title || "Événement";
            const invitations = await clubDashboardApi.getEventTeacherInvitations(eventId);

            return (invitations || []).map((invitation: any) => ({
              id: invitation.id,
              eventId,
              eventTitle,
              enseignantId: invitation.enseignantId,
              enseignant: invitation.enseignant,
              email: invitation.email,
              grade: invitation.grade,
              statut: invitation.statut,
              message: invitation.message,
              dateInvitation: invitation.dateInvitation,
              dateReponse: invitation.dateReponse,
            })) as ClubTeacherInvitation[];
          }),
        );

        const flattened = invitationsByEvent
          .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
          .sort(
            (left, right) =>
              new Date(right.dateInvitation).getTime() - new Date(left.dateInvitation).getTime(),
          );

        setClubTeacherInvitations(flattened);
      } catch (error) {
        console.error("Erreur lors du chargement des invitations d'enseignants:", error);
        setClubTeacherInvitations([]);
      } finally {
        setLoadingClubInvitations(false);
      }
    };

    loadClubTeacherInvitations();
  }, [open, user?.role]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "participation_request":
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case "participation_approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "participation_rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "membership_request":
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case "membership_approved":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "membership_rejected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "invitation_accepted":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "invitation_refused":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationTitle = (type: string) => {
    switch (type) {
      case "participation_request":
        return "Demande de participation";
      case "participation_approved":
        return "Demande acceptée";
      case "participation_rejected":
        return "Demande refusée";
      case "membership_request":
        return "Demande d'adhésion";
      case "membership_approved":
        return "Adhésion acceptée";
      case "membership_rejected":
        return "Adhésion refusée";
      case "invitation_accepted":
        return "Invitation acceptée";
      case "invitation_refused":
        return "Invitation refusée";
      default:
        return "Notification";
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    // If available, prefer the 'open' endpoint to set etat:'ouvert' without toggling 'lue'
    try {
      if ((notificationService as any)?.markAsOpened) {
        await (notificationService as any).markAsOpened(notificationId);
      } else {
        await markAsRead(notificationId);
      }
    } catch (err) {
      console.error('Erreur lors du marquage de notification comme ouverte:', err);
    }
  };

  const handleDelete = async (notificationId: string) => {
    await deleteNotification(notificationId);
  };

  const getInvitationLabel = (status: ClubTeacherInvitation["statut"]) => {
    switch (status) {
      case "accepte":
        return "Acceptée";
      case "refuse":
        return "Refusée";
      default:
        return "En attente";
    }
  };

  const getInvitationVariant = (status: ClubTeacherInvitation["statut"]) => {
    switch (status) {
      case "accepte":
        return "default" as const;
      case "refuse":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </span>
            {unreadCount > 0 && (
              <Badge variant="default">{unreadCount} non lues</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Consultez vos notifications et marquez-les comme ouvertes.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin">
              <Bell className="w-6 h-6 text-muted-foreground" />
            </div>
          </div>
        ) : relevantNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground">Aucune notification</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {relevantNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      notif.etat === "ouvert"
                        ? "bg-background hover:bg-muted/50"
                        : "bg-blue-50/50 hover:bg-blue-100/50 border-blue-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-1">
                          {notif.titre || getNotificationTitle(notif.type)}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {notif.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDistanceToNow(new Date(notif.dateNotification), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        {notif.etat === "ferme" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            title="Marquer comme ouverte"
                            onClick={() => handleMarkAsRead(notif.id)}
                          >
                            <Check className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          title="Supprimer"
                          onClick={() => handleDelete(notif.id)}
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {user?.role === "club" && (
              <div className="mt-4 border-t pt-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    Invitations envoyées aux enseignants
                  </h3>
                  <Badge variant="secondary">{clubTeacherInvitations.length}</Badge>
                </div>

                {loadingClubInvitations ? (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    Chargement des invitations...
                  </div>
                ) : clubTeacherInvitations.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                    Aucune invitation envoyée pour le moment.
                  </div>
                ) : (
                  <ScrollArea className="mt-2 max-h-56 pr-4">
                    <div className="space-y-2">
                      {clubTeacherInvitations.map((invitation) => (
                        <div
                          key={invitation.id}
                          className="rounded-lg border border-border bg-background p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">
                                {invitation.enseignant}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {invitation.email}
                              </p>
                              <p className="mt-1 truncate text-xs text-muted-foreground">
                                {invitation.eventTitle}
                              </p>
                            </div>
                            <Badge variant={getInvitationVariant(invitation.statut)}>
                              {getInvitationLabel(invitation.statut)}
                            </Badge>
                          </div>
                          {invitation.grade && (
                            <p className="mt-2 text-xs text-muted-foreground">{invitation.grade}</p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                            <span>
                              Envoyée{' '}
                              {formatDistanceToNow(new Date(invitation.dateInvitation), {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </span>
                            {invitation.dateReponse && (
                              <span>
                                Réponse{' '}
                                {formatDistanceToNow(new Date(invitation.dateReponse), {
                                  addSuffix: true,
                                  locale: fr,
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}

            {unreadCount > 0 && (
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => markAllAsRead()}
                >
                  Marquer tout comme lu
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
