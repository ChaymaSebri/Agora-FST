import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import * as teacherDashboardApi from '@/services/teacher-dashboard.api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, MapPin, Users } from 'lucide-react';

interface Event {
  id: string;
  titre: string;
  description?: string;
  date: string;
  lieu?: string;
  capacite?: number;
  participantsCount: number;
  type: string;
  clubName: string;
  createdAt: string;
}

export function TeacherEventEncadrement() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await teacherDashboardApi.getTeacherEventEncadrement();
      setEvents(data);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les événements encadrés',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
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

  const getTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      conference: 'default',
      atelier: 'secondary',
      hackathon: 'outline',
      sortie: 'destructive',
      autre: 'outline',
    };

    return <Badge variant={variants[type]}>{getTypeLabel(type)}</Badge>;
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Événements que j'encadre</CardTitle>
        <CardDescription>
          Liste des événements dont vous êtes l'organisateur
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-gray-500">Aucun événement encadré pour le moment</p>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="p-4 border rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-start mb-3 gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{event.titre}</h3>
                    <p className="text-sm text-gray-600 truncate">Club: {event.clubName}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {getTypeBadge(event.type)}
                  </div>
                </div>

                {event.description && (
                  <p className="text-sm text-gray-700 mb-3">{event.description}</p>
                )}

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
                        {event.participantsCount}
                        {typeof event.capacite === 'number' ? ` / ${event.capacite}` : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {event.lieu && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin size={16} className="text-blue-500" />
                    <span>{event.lieu}</span>
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
