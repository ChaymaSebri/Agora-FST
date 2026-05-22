import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import * as clubDashboardApi from '@/services/club-dashboard.api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  createdAt: string;
}

interface Participation {
  id: string;
  utilisateurId: string;
  utilisateur: string;
  email: string;
  role: string;
  niveau?: string;
  filiere?: string;
  statut: string;
  dateInscription: string;
}

export function ClubEventParticipations() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [loading, setLoading] = useState(true);
  const [participationsLoading, setParticipationsLoading] = useState(false);
  const [teacherDialog, setTeacherDialog] = useState(false);
  const [teacherId, setTeacherId] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await clubDashboardApi.listClubEvents();
      setEvents(data);
      if (data.length > 0) {
        setSelectedEvent(data[0]);
        await loadParticipations(data[0].id);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les événements',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadParticipations = async (eventId: string) => {
    try {
      setParticipationsLoading(true);
      const data = await clubDashboardApi.listEventParticipations(eventId);
      setParticipations(data);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les participations',
        variant: 'destructive',
      });
    } finally {
      setParticipationsLoading(false);
    }
  };

  const handleEventSelect = async (event: Event) => {
    setSelectedEvent(event);
    await loadParticipations(event.id);
  };

  const handleValidateParticipation = async (
    participationId: string,
    statut: 'confirme' | 'annule'
  ) => {
    if (!selectedEvent) return;

    try {
      await clubDashboardApi.validateEventParticipation(
        selectedEvent.id,
        participationId,
        statut
      );
      toast({
        title: 'Succès',
        description: `Participation ${statut === 'confirme' ? 'confirmée' : 'annulée'}`,
      });
      await loadParticipations(selectedEvent.id);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de valider la participation',
        variant: 'destructive',
      });
    }
  };

  const handleInviteTeacher = async () => {
    if (!selectedEvent || !teacherId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un enseignant',
        variant: 'destructive',
      });
      return;
    }

    try {
      await clubDashboardApi.inviteTeacherToEvent(selectedEvent.id, teacherId);
      toast({
        title: 'Succès',
        description: 'Enseignant invité',
      });
      setTeacherDialog(false);
      setTeacherId('');
      await loadParticipations(selectedEvent.id);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'inviter l\'enseignant',
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
      inscrit: 'Inscrit',
      confirme: 'Confirmé',
      annule: 'Annulé',
      present: 'Présent',
    };

    return <Badge variant={variants[statut]}>{labels[statut]}</Badge>;
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Validations des Inscriptions</CardTitle>
          <CardDescription>
            Confirmez ou refusez les inscriptions aux événements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {events.length === 0 ? (
            <p className="text-gray-500">Aucun événement créé</p>
          ) : (
            <>
              <div className="flex gap-2 flex-wrap">
                {events.map((event) => (
                  <Button
                    key={event.id}
                    variant={
                      selectedEvent?.id === event.id ? 'default' : 'outline'
                    }
                    onClick={() => handleEventSelect(event)}
                  >
                    {event.titre}
                  </Button>
                ))}
              </div>

              {selectedEvent && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-900">
                      {selectedEvent.titre}
                    </h3>
                    <p className="text-sm text-blue-700">
                      {format(new Date(selectedEvent.date), 'dd MMMM yyyy HH:mm', {
                        locale: fr,
                      })}
                    </p>
                  </div>

                  <Dialog open={teacherDialog} onOpenChange={setTeacherDialog}>
                    <DialogTrigger asChild>
                      <Button variant="secondary">+ Inviter un enseignant</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Inviter un enseignant</DialogTitle>
                        <DialogDescription>
                          Entrez l'ID de l'enseignant à inviter
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="ID de l'enseignant"
                          value={teacherId}
                          onChange={(e) => setTeacherId(e.target.value)}
                        />
                        <Button onClick={handleInviteTeacher}>Inviter</Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {participationsLoading ? (
                    <div>Chargement des participations...</div>
                  ) : participations.length === 0 ? (
                    <p className="text-gray-500">Aucune participation</p>
                  ) : (
                    <div className="space-y-3">
                      {participations.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{p.utilisateur}</p>
                            <p className="text-sm text-gray-600">{p.email}</p>
                            {p.niveau && (
                              <p className="text-xs text-gray-500">
                                {p.niveau} - {p.filiere}
                              </p>
                            )}
                            <p className="text-xs text-gray-400">
                              Inscrit le{' '}
                              {format(new Date(p.dateInscription), 'dd/MM/yyyy')}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            {getStatutBadge(p.statut)}
                            {p.statut === 'inscrit' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleValidateParticipation(p.id, 'confirme')
                                  }
                                >
                                  Confirmer
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    handleValidateParticipation(p.id, 'annule')
                                  }
                                >
                                  Refuser
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
