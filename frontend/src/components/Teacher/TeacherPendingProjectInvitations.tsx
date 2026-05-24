import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import * as teacherDashboardApi from '@/services/teacher-dashboard.api';
import { useToast } from '@/hooks/use-toast';
import { Briefcase, Users, Check, X, Loader, Target } from 'lucide-react';

interface ProjectInvitation {
  id: string;
  projetId: string;
  titre: string;
  description: string;
  objectif: string;
  deadline: string;
  statut: string;
  progression: number;
  clubName: string;
  etudiantsCount: number;
  message?: string;
  invitationStatut: string;
  dateInvitation: string;
}

export function TeacherPendingProjectInvitations() {
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const data = await teacherDashboardApi.getPendingProjectInvitations();
      setInvitations(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des invitations:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les invitations de projets',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (invitationId: string, statut: 'accepte' | 'refuse') => {
    try {
      setRespondingId(invitationId);
      await teacherDashboardApi.respondToProjectInvitation(invitationId, statut);
      
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
        <h2 className="text-2xl font-bold">Invitations d'Encadrement de Projets</h2>
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
        <h2 className="text-2xl font-bold">Invitations d'Encadrement de Projets</h2>
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            <Briefcase className="inline-block mb-2 text-gray-400" size={32} />
            <p>Aucune invitation en attente</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Invitations d'Encadrement de Projets</h2>
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
              {/* Project Details */}
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3">
                  <Target size={16} className="mt-0.5 text-purple-500" />
                  <div>
                    <p className="text-gray-600">Deadline</p>
                    <p className="font-medium">
                      {new Date(invitation.deadline).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3">
                  <Users size={16} className="mt-0.5 text-purple-500" />
                  <div>
                    <p className="text-gray-600">Étudiants</p>
                    <p className="font-medium">{invitation.etudiantsCount}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-gray-600 text-sm mb-1">Description</p>
                <p className="text-sm">{invitation.description || 'Aucune description'}</p>
              </div>

              {invitation.objectif && (
                <div>
                  <p className="text-gray-600 text-sm mb-1">Objectif</p>
                  <p className="text-sm">{invitation.objectif}</p>
                </div>
              )}

              {invitation.message && (
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Message du club</p>
                  <p className="text-sm">{invitation.message}</p>
                </div>
              )}

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Statut du projet:</span>
                <Badge variant={invitation.statut === 'en_cours' ? 'default' : 'secondary'}>
                  {invitation.statut}
                </Badge>
              </div>

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
                      Accepter l'Encadrement
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
