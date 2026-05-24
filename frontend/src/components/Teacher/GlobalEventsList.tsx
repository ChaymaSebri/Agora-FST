import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { useToast } from '@/hooks/use-toast';
import * as teacherDashboardApi from '@/services/teacher-dashboard.api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, MapPin, Users, BadgeInfo } from 'lucide-react';

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

export function GlobalEventsList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAllEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm]);

  const loadAllEvents = async () => {
    try {
      const data = await teacherDashboardApi.getAllEvents();
      setEvents(data);
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

  const filterEvents = () => {
    const filtered = events.filter(
      (event) =>
        event.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.clubName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.organisateur.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEvents(filtered);
  };

  const handleViewDetails = (event: Event) => {
    setSelectedEvent(event);
    setShowDetailsDialog(true);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      conference: 'Conférence',
      atelier: 'Atelier',
      hackathon: 'Hackathon',
      sortie: 'Sortie',
      autre: 'Autre',
    };
    return labels[type] || type;
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tous les Événements</CardTitle>
        <CardDescription>
          Vue globale de tous les événements disponibles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Rechercher par titre, club ou organisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        {filteredEvents.length === 0 ? (
          <p className="text-gray-500">
            {searchTerm ? 'Aucun événement ne correspond à votre recherche' : 'Aucun événement disponible'}
          </p>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{event.titre}</h3>
                    <p className="text-sm text-gray-600">
                      Club: {event.clubName} | Par: {event.organisateur}
                    </p>
                  </div>
                  <Badge variant="outline">{getTypeLabel(event.type)}</Badge>
                </div>

                <p className="text-sm text-gray-700 mb-3">{event.description}</p>

                <div className="grid grid-cols-1 gap-3 text-sm mb-4 sm:grid-cols-2">
                  <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3">
                    <Calendar size={16} className="mt-0.5 text-blue-500" />
                    <div>
                      <p className="text-gray-600">Date</p>
                      <p className="font-medium">
                        {format(new Date(event.date), 'dd MMMM yyyy HH:mm', {
                          locale: fr,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3">
                    <Users size={16} className="mt-0.5 text-blue-500" />
                    <div>
                      <p className="text-gray-600">Participants</p>
                      <p className="font-medium">
                        {event.participantsCount}/{event.capacite || '∞'}
                      </p>
                    </div>
                  </div>
                </div>

                {event.lieu && (
                  <div className="mb-3 flex items-start gap-2 rounded-xl bg-slate-50 p-3">
                    <MapPin size={16} className="mt-0.5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600">Lieu</p>
                      <p className="font-medium">{event.lieu}</p>
                    </div>
                  </div>
                )}

                <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(event)}
                    >
                      Voir Détails
                    </Button>
                  </DialogTrigger>
                  {selectedEvent?.id === event.id && (
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{selectedEvent.titre}</DialogTitle>
                        <DialogDescription>
                          {selectedEvent.clubName} - {selectedEvent.organisateur}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Description</h4>
                          <p className="text-sm text-gray-600">{selectedEvent.description}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-sm mb-1 flex items-center gap-1.5">
                              <BadgeInfo size={14} className="text-blue-500" />
                              Type
                            </h4>
                            <p className="text-sm">{getTypeLabel(selectedEvent.type)}</p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm mb-1 flex items-center gap-1.5">
                              <Users size={14} className="text-blue-500" />
                              Participants
                            </h4>
                            <p className="text-sm">
                              {selectedEvent.participantsCount}/{selectedEvent.capacite || '∞'}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm mb-1 flex items-center gap-1.5">
                              <Calendar size={14} className="text-blue-500" />
                              Date
                            </h4>
                            <p className="text-sm">
                              {format(new Date(selectedEvent.date), 'dd MMMM yyyy HH:mm', {
                                locale: fr,
                              })}
                            </p>
                          </div>
                          {selectedEvent.lieu && (
                            <div>
                              <h4 className="font-semibold text-sm mb-1 flex items-center gap-1.5">
                                <MapPin size={14} className="text-blue-500" />
                                Lieu
                              </h4>
                              <p className="text-sm">{selectedEvent.lieu}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  )}
                </Dialog>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
