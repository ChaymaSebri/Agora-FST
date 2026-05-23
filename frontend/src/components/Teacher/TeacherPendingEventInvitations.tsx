import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import * as teacherDashboardApi from '@/services/teacher-dashboard.api';
import { useToast } from '@/hooks/use-toast';
import { Calendar, MapPin, Check, X, Loader } from 'lucide-react';

interface EventInvitation {
  id: string;
  evenementId: string;
  titre: string;
  description: string;
  date: string;
  lieu: string;
  capacite: number;
  type: string;
  clubName: string;
  organisateur: string;
  message?: string;
  statut: string;
  dateInvitation: string;
}

export function TeacherPendingEventInvitations() {
  const [invitations, setInvitations] = useState<EventInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const data = await teacherDashboardApi.getPendingEventInvitations();
      setInvitations(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des invitations:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les invitations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (invitationId: string, statut: 'accepte' | 'refuse') => {
    try {
      setRespondingId(invitationId);
      await teacherDashboardApi.respondToEventInvitationPending(invitationId, statut);
      
      toast({
        title: 'Succès',
        description: `Invitation ${statut === 'accepte' ? 'acceptée' : 'refusée'}`,
        variant: 'default',
      });

      // Rafraîchir la liste
      loadInvitations();
    } catch (error) {
      console.error('Erreur lors de la réponse à l\'invitation:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de répondre à l\'invitation',
        variant: 'destructive',
      });
    } finally {
      setRespondingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Invitations à des Événements</h2>
        <div className="text-center py-8">
          <Loader className="inline-block animate-spin" />
          <p className="text-gray-600 mt-2">Chargement...</p>
        </div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Invitations à des Événements</h2>
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            <Calendar className="inline-block mb-2 text-gray-400" size={32} />
            <p>Aucune invitation en attente</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Invitations à des Événements</h2>
      <div className="grid gap-4">
        {invitations.map((invitation) => (
          <Card key={invitation.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{invitation.titre}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{invitation.clubName}</p>
                </div>
                <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700">
                  En attente
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Event Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-blue-500" />
                  <div>
                    <p className="text-gray-600">Date</p>
                    <p className="font-medium">
                      {new Date(invitation.date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-blue-500" />
                  <div>
                    <p className="text-gray-600">Lieu</p>
                    <p className="font-medium">{invitation.lieu || 'À déterminer'}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-gray-600 text-sm mb-1">Description</p>
                <p className="text-sm">{invitation.description || 'Aucune description'}</p>
              </div>

              {invitation.message && (
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Message du club</p>
                  <p className="text-sm">{invitation.message}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="default"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleRespond(invitation.id, 'accepte')}
                  disabled={respondingId === invitation.id}
                >
                  {respondingId === invitation.id ? (
                    <>
                      <Loader size={16} className="mr-2 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <Check size={16} className="mr-2" />
                      Accepter
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleRespond(invitation.id, 'refuse')}
                  disabled={respondingId === invitation.id}
                >
                  {respondingId === invitation.id ? (
                    <>
                      <Loader size={16} className="mr-2 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <X size={16} className="mr-2" />
                      Refuser
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
