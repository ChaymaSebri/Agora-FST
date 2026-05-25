import { useEffect, useMemo, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, CheckCircle, Clock3, Mail, RefreshCw, XCircle } from 'lucide-react';
import * as clubDashboardApi from '@/services/club-dashboard.api';

type TeacherInvitation = {
  id: string;
  eventId: string;
  eventTitle: string;
  enseignantId: string;
  enseignant: string;
  email: string;
  grade: string;
  statut: 'en_attente' | 'accepte' | 'refuse';
  message?: string;
  dateInvitation: string;
  dateReponse?: string;
};

const STATUS_CONFIG = {
  en_attente: {
    label: 'En attente',
    badge: 'outline' as const,
    icon: <Clock3 className="h-4 w-4" />,
  },
  accepte: {
    label: 'Acceptée',
    badge: 'default' as const,
    icon: <CheckCircle className="h-4 w-4" />,
  },
  refuse: {
    label: 'Refusée',
    badge: 'destructive' as const,
    icon: <XCircle className="h-4 w-4" />,
  },
} as const;

export default function ClubInvitations() {
  const [invitations, setInvitations] = useState<TeacherInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const events = await clubDashboardApi.listClubEvents();
      const invitationsByEvent = await Promise.allSettled(
        (events || []).map(async (event: any) => {
          const eventId = event.id || event._id;
          const eventTitle = event.titre || event.title || 'Événement';
          const items = await clubDashboardApi.getEventTeacherInvitations(eventId);

          return (items || []).map((item: any) => ({
            id: item.id,
            eventId,
            eventTitle,
            enseignantId: item.enseignantId,
            enseignant: item.enseignant,
            email: item.email,
            grade: item.grade,
            statut: item.statut,
            message: item.message,
            dateInvitation: item.dateInvitation,
            dateReponse: item.dateReponse,
          })) as TeacherInvitation[];
        }),
      );

      const flattened = invitationsByEvent
        .flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
        .sort((left, right) => new Date(right.dateInvitation).getTime() - new Date(left.dateInvitation).getTime());

      setInvitations(flattened);
    } catch (error) {
      console.error('Erreur lors du chargement des invitations:', error);
      setInvitations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, []);

  const counts = useMemo(() => {
    return invitations.reduce(
      (accumulator, invitation) => {
        accumulator.total += 1;
        accumulator[invitation.statut] += 1;
        return accumulator;
      },
      { total: 0, en_attente: 0, accepte: 0, refuse: 0 },
    );
  }, [invitations]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_35%),linear-gradient(180deg,_#eff6ff_0%,_#f8fafc_55%,_#ffffff_100%)] pt-20">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto mb-6 max-w-6xl rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                <Mail className="h-3.5 w-3.5" />
                Invitations
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                Invitations envoyées aux enseignants
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 md:text-base">
                Consultez toutes les invitations envoyées depuis votre club et suivez leur état en temps réel.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setRefreshing(true);
                loadInvitations();
              }}
              disabled={loading || refreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading || refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>

        <div className="mx-auto mb-6 grid max-w-6xl grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-3xl">{counts.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>En attente</CardDescription>
              <CardTitle className="text-3xl">{counts.en_attente}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Acceptées</CardDescription>
              <CardTitle className="text-3xl">{counts.accepte}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Refusées</CardDescription>
              <CardTitle className="text-3xl">{counts.refuse}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="mx-auto max-w-6xl">
          {loading ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Chargement des invitations...
              </CardContent>
            </Card>
          ) : invitations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12 text-center text-muted-foreground">
                <AlertCircle className="mb-3 h-10 w-10 opacity-60" />
                <p className="font-medium text-foreground">Aucune invitation envoyée</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Les invitations envoyées aux enseignants apparaîtront ici.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {invitations.map((invitation) => {
                  const status = STATUS_CONFIG[invitation.statut];

                  return (
                    <Card key={invitation.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-semibold text-foreground">{invitation.enseignant}</p>
                              <Badge variant={status.badge} className="gap-1">
                                {status.icon}
                                {status.label}
                              </Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{invitation.email}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{invitation.grade}</p>
                            <p className="mt-2 text-sm font-medium text-foreground">{invitation.eventTitle}</p>
                            {invitation.message && (
                              <p className="mt-2 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                                {invitation.message}
                              </p>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground md:text-right">
                            <p>Envoyée le {new Date(invitation.dateInvitation).toLocaleDateString('fr-FR')}</p>
                            {invitation.dateReponse && (
                              <p>Réponse le {new Date(invitation.dateReponse).toLocaleDateString('fr-FR')}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
}