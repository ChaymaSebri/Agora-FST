import { useState, useEffect } from 'react';
import { Check, X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Unwrap response format from backend middleware
api.interceptors.response.use((response) => {
  console.log('[API INTERCEPTOR] Response before unwrap:', response.data);
  
  // If response.data is wrapped { success: true, data: {...} }, unwrap it
  if (response.data?.success === true && 'data' in response.data) {
    console.log('[API INTERCEPTOR] Unwrapped data:', response.data.data);
    return {
      ...response,
      data: response.data.data,
    };
  }
  
  console.log('[API INTERCEPTOR] Response not wrapped, returning as-is');
  return response;
});

interface PendingRegistration {
  id: string;
  email: string;
  role: 'enseignant' | 'club';
  status: 'pending' | 'verified';
  nom?: string;
  prenom?: string;
  clubName?: string;
  grade?: string;
  clubDescription?: string;
  clubSpecialite?: string;
  createdAt: string;
  emailVerifiedAt?: string;
}

interface RejectModalProps {
  registration: PendingRegistration | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => void;
  isLoading: boolean;
}

function RejectModal({ registration, isOpen, onClose, onConfirm, isLoading }: RejectModalProps) {
  const [notes, setNotes] = useState('');

  if (!isOpen || !registration) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(notes);
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Rejeter l'inscription</CardTitle>
          <CardDescription>
            {registration.role === 'club' ? registration.clubName : `${registration.prenom} ${registration.nom}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="notes" className="block text-sm font-medium">
                Notes de rejet (optionnel)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Raison du rejet..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejet en cours...
                  </>
                ) : (
                  'Rejeter'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PendingRegistrationsManagement() {
  const [registrations, setRegistrations] = useState<PendingRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<'all' | 'enseignant' | 'club'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified'>('all');
  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; registration: PendingRegistration | null }>({
    isOpen: false,
    registration: null,
  });
  const [approveLoading, setApproveLoading] = useState<string | null>(null);
  const [rejectLoading, setRejectLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRegistrations = async () => {
    setIsLoading(true);
    try {
      console.log('[FETCH] Requesting pending registrations with filters:', { role: roleFilter, status: statusFilter });
      
      const response = await api.get('/admin/pending-registrations', {
        params: { role: roleFilter, status: statusFilter },
      });
      
      console.log('[FETCH] Raw response:', response);
      console.log('[FETCH] Response data:', response.data);
      console.log('[FETCH] Response data type:', typeof response.data);
      console.log('[FETCH] Response data keys:', Object.keys(response.data || {}));
      console.log('[FETCH] Response data stringified:', JSON.stringify(response.data));
      console.log('[FETCH] Registrations array:', response.data?.registrations);
      
      const registrationsData = response.data?.registrations || [];
      console.log('[FETCH] Extracted registrations:', registrationsData);
      console.log('[FETCH] Number of registrations:', registrationsData.length);
      
      setRegistrations(registrationsData);
    } catch (error) {
        console.error("[FETCH ERROR] Full error object:", error);
        console.error("[FETCH ERROR] Error message:", error instanceof Error ? error.message : String(error));
        if (error && typeof error === 'object') {
          console.error("[FETCH ERROR] Error response:", (error as any).response);
          console.error("[FETCH ERROR] Error config:", (error as any).config);
        }
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les inscriptions en attente',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [roleFilter, statusFilter]);

  const handleApprove = async (registrationId: string) => {
    setApproveLoading(registrationId);
    try {
      await api.post(`/admin/pending-registrations/${registrationId}/approve`);

      toast({
        title: 'Succès',
        description: 'Inscription approuvée avec succès',
      });

      setRegistrations((prev) => prev.filter((r) => r.id !== registrationId));
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'approuver l\'inscription',
        variant: 'destructive',
      });
    } finally {
      setApproveLoading(null);
    }
  };

  const handleRejectConfirm = async (notes: string) => {
    if (!rejectModal.registration) return;

    setRejectLoading(rejectModal.registration.id);
    try {
      await api.post(`/admin/pending-registrations/${rejectModal.registration.id}/reject`, { notes });

      toast({
        title: 'Succès',
        description: 'Inscription rejetée avec succès',
      });

      setRegistrations((prev) => prev.filter((r) => r.id !== rejectModal.registration!.id));
      setRejectModal({ isOpen: false, registration: null });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de rejeter l\'inscription',
        variant: 'destructive',
      });
    } finally {
      setRejectLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Inscriptions en attente</h2>
        <p className="text-gray-600 mt-1">Gérez les inscriptions des enseignants et clubs</p>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Rôle</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | 'enseignant' | 'club')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les rôles</option>
            <option value="enseignant">Enseignants</option>
            <option value="club">Clubs</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Statut</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'verified')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="verified">Email vérifié</option>
            <option value="pending">En attente</option>
            <option value="all">Tous les dossiers a traiter</option>
          </select>
        </div>
      </div>

      {registrations.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium">Aucune inscription en attente</p>
              <p className="text-sm text-gray-500">Tous les dossiers ont été traités</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {registrations.map((reg) => (
            <Card key={reg.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Information principale */}
                  <div className="md:col-span-2">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {reg.role === 'club' ? reg.clubName : `${reg.prenom} ${reg.nom}`}
                        </h3>
                        <p className="text-sm text-gray-600">{reg.email}</p>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {reg.role === 'enseignant' ? 'Enseignant' : 'Club'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {reg.role === 'club' ? (
                        <>
                          {reg.clubDescription && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Description</p>
                              <p className="text-sm text-gray-700 mt-1">{reg.clubDescription}</p>
                            </div>
                          )}
                          {reg.clubSpecialite && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Spécialité</p>
                              <p className="text-sm text-gray-700 mt-1">{reg.clubSpecialite}</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Grade</p>
                          <p className="text-sm text-gray-700 mt-1">{reg.grade}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Demande</p>
                        <p className="text-sm text-gray-700 mt-1">
                          {new Date(reg.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    {reg.status === 'verified' && (
                      <div className="mt-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded">
                        <Check className="h-4 w-4" />
                        Email vérifié
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 md:justify-start">
                    <Button
                      onClick={() => handleApprove(reg.id)}
                      disabled={approveLoading === reg.id}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      {approveLoading === reg.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Approbation...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Approuver
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setRejectModal({ isOpen: true, registration: reg })}
                      disabled={rejectLoading === reg.id}
                      variant="destructive"
                      className="w-full"
                    >
                      {rejectLoading === reg.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Rejet...
                        </>
                      ) : (
                        <>
                          <X className="mr-2 h-4 w-4" />
                          Rejeter
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <RejectModal
        registration={rejectModal.registration}
        isOpen={rejectModal.isOpen}
        onClose={() => setRejectModal({ isOpen: false, registration: null })}
        onConfirm={handleRejectConfirm}
        isLoading={rejectLoading !== null}
      />
    </div>
  );
}
