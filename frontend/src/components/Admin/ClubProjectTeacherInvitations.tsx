import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import * as clubDashboardApi from '@/services/club-dashboard.api';
import { useToast } from '@/hooks/use-toast';
import { Clock, CheckCircle, XCircle, Trash2, Loader, Mail } from 'lucide-react';

interface TeacherInvitation {
  id: string;
  enseignantId: string;
  enseignant: string;
  email: string;
  grade: string;
  statut: 'en_attente' | 'accepte' | 'refuse';
  message?: string;
  dateInvitation: string;
  dateReponse?: string;
}

interface ClubProjectTeacherInvitationsProps {
  projectId: string;
  onInvitationStatusChange?: () => void;
}

export function ClubProjectTeacherInvitations({ projectId, onInvitationStatusChange }: ClubProjectTeacherInvitationsProps) {
  const [invitations, setInvitations] = useState<TeacherInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadInvitations();
  }, [projectId]);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const data = await clubDashboardApi.getProjectTeacherInvitations(projectId);
      setInvitations(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des invitations:', error);
      // Ne pas afficher de toast si pas d'invitations
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (invitationId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette invitation?')) {
      return;
    }

    try {
      setCancelingId(invitationId);
      await clubDashboardApi.cancelProjectInvitation(projectId, invitationId);
      
      toast({
        title: 'Succès',
        description: 'Invitation annulée',
        variant: 'default',
      });

      loadInvitations();
      onInvitationStatusChange?.();
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'annuler l\'invitation',
        variant: 'destructive',
      });
    } finally {
      setCancelingId(null);
    }
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'en_attente':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock size={14} className="mr-1" />En attente</Badge>;
      case 'accepte':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle size={14} className="mr-1" />Acceptée</Badge>;
      case 'refuse':
        return <Badge className="bg-red-100 text-red-800"><XCircle size={14} className="mr-1" />Refusée</Badge>;
      default:
        return <Badge>{statut}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Invitations d'Encadrement Envoyées</h3>
        <div className="text-center py-6">
          <Loader className="inline-block animate-spin" />
          <p className="text-gray-600 mt-2 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Invitations d'Encadrement Envoyées</h3>
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            <Mail className="inline-block mb-2 text-gray-400" size={24} />
            <p className="text-sm">Aucune invitation envoyée</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Invitations d'Encadrement Envoyées ({invitations.length})</h3>
      <div className="space-y-2">
        {invitations.map((invitation) => (
          <Card key={invitation.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-medium truncate">{invitation.enseignant}</p>
                    {getStatusBadge(invitation.statut)}
                  </div>
                  <p className="text-sm text-gray-600 truncate">{invitation.email}</p>
                  <p className="text-xs text-gray-500 mt-1">{invitation.grade}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Envoyée: {new Date(invitation.dateInvitation).toLocaleDateString('fr-FR')}
                  </p>
                  {invitation.dateReponse && (
                    <p className="text-xs text-gray-500">
                      Réponse: {new Date(invitation.dateReponse).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
                {invitation.statut === 'en_attente' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancel(invitation.id)}
                    disabled={cancelingId === invitation.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {cancelingId === invitation.id ? (
                      <Loader size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
