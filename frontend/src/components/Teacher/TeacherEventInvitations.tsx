import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import * as teacherDashboardApi from '@/services/teacher-dashboard.api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, MapPin, Tag } from 'lucide-react';

interface Event {
  id: string;
  titre: string;
  description?: string;
  date: string;
  lieu?: string;
  capacite?: number;
  participantsCount: number;
  type: string;
  organisateur: string;
  clubName: string;
  createdAt: string;
}

interface EventInvitation {
  id: string;
  invitationId: string;
  evenementId: string;
  titre: string;
  description?: string;
  date: string;
  lieu?: string;
  type: string;
  statut: string;
  clubName: string;
  organisateur: string;
  dateInvitation: string;
}

export function TeacherEventInvitations() {
  const [invitations, setInvitations] = useState<EventInvitation[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadInvitations();
    loadAllEvents();
  }, []);

  const loadInvitations = async () => {
    try {
      const data = await teacherDashboardApi.getTeacherEventInvitations();
      setInvitations(data);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les invitations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAllEvents = async () => {
    try {
      const data = await teacherDashboardApi.getAllEvents();
      setAllEvents(data);
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
    }
  };

  const handleRespond = async (invitationId: string, statut: 'confirme' | 'annule') => {
    try {
      await teacherDashboardApi.respondToEventInvitation(invitationId, statut);
      toast({
        title: 'Succès',
        description: `Invitation ${statut === 'confirme' ? 'acceptée' : 'refusée'}`,
      });
      await loadInvitations();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de répondre à l\'invitation',
        variant: 'destructive',
      });
    }
  };

  const getStatutBadge = (statut: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      inscrit: 'outline',
      confirme: 'default',
      annule: 'destructive',
      present: 'secondary',
    };

    const labels: Record<string, string> = {
      inscrit: 'En attente',
      confirme: 'Acceptée',
      annule: 'Refusée',
      present: 'Présent',
    };

    return <Badge variant={variants[statut]}>{labels[statut]}</Badge>;
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invitations aux Événements</CardTitle>
        <CardDescription>
          Gérez vos invitations aux événements du club
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <p className="text-gray-500">Aucune invitation pour le moment</p>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{invitation.titre}</h3>
                    <p className="text-sm text-gray-600">
                      Club: {invitation.clubName} | Par: {invitation.organisateur}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {getStatutBadge(invitation.statut)}
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-3">{invitation.description}</p>

                <div className="text-sm text-gray-600 space-y-1 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-blue-500" />
                    <span>
                      {format(new Date(invitation.date), 'dd MMMM yyyy HH:mm', {
                        locale: fr,
                      })}
                    </span>
                  </div>
                  {invitation.lieu && (
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-blue-500" />
                      <span>{invitation.lieu}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Tag size={16} className="text-blue-500" />
                    <span className="capitalize">{invitation.type}</span>
                  </div>
                </div>

                {invitation.statut === 'inscrit' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleRespond(invitation.invitationId, 'confirme')}
                    >
                      Accepter
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRespond(invitation.invitationId, 'annule')}
                    >
                      Refuser
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
