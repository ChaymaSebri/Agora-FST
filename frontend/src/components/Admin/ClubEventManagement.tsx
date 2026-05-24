import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ClubEventTeacherInvitations } from './ClubEventTeacherInvitations';
import * as clubDashboardApi from '@/services/club-dashboard.api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronDown, ChevronUp, Mail } from 'lucide-react';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

interface Event {
  id: string;
  titre: string;
  description?: string;
  imageUrl?: string | null;
  date: string;
  lieu?: string;
  capacite?: number;
  participantsCount: number;
  type: string;
  organisateur: string;
  createdAt: string;
}

export function ClubEventManagement() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    imageUrl: '',
    date: '',
    lieu: '',
    capacite: '',
    type: 'autre',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await clubDashboardApi.listClubEvents();
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

  const resetForm = () => {
    setFormData({
      titre: '',
      description: '',
      imageUrl: '',
      date: '',
      lieu: '',
      capacite: '',
      type: 'autre',
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setEditingEvent(null);
  };

  const handleOpenDialog = (event?: Event) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        titre: event.titre,
        description: event.description || '',
        imageUrl: event.imageUrl || '',
        date: event.date,
        lieu: event.lieu || '',
        capacite: event.capacite?.toString() || '',
        type: event.type,
      });
      setPhotoPreview(event.imageUrl || null);
      setPhotoFile(null);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.titre || !formData.date) {
      toast({
        title: 'Erreur',
        description: 'Le titre et la date sont obligatoires',
        variant: 'destructive',
      });
      return;
    }

    try {
      let uploadedImageUrl = formData.imageUrl;
      if (photoFile) {
        uploadedImageUrl = await uploadImageToCloudinary(photoFile);
      }

      if (editingEvent) {
        await clubDashboardApi.updateClubEvent(editingEvent.id, {
          ...formData,
          imageUrl: uploadedImageUrl || undefined,
          capacite: formData.capacite ? parseInt(formData.capacite) : undefined,
        });
        toast({
          title: 'Succès',
          description: 'Événement mis à jour',
        });
      } else {
        await clubDashboardApi.createClubEvent({
          ...formData,
          imageUrl: uploadedImageUrl || undefined,
          capacite: formData.capacite ? parseInt(formData.capacite) : undefined,
        });
        toast({
          title: 'Succès',
          description: 'Événement créé',
        });
      }
      setIsDialogOpen(false);
      await loadEvents();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder l\'événement',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (eventId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet événement?')) {
      try {
        await clubDashboardApi.deleteClubEvent(eventId);
        toast({
          title: 'Succès',
          description: 'Événement supprimé',
        });
        await loadEvents();
      } catch (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de supprimer l\'événement',
          variant: 'destructive',
        });
      }
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Gestion des Événements</CardTitle>
            <CardDescription>Créer et gérer les événements du club</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                + Nouvel Événement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingEvent ? 'Modifier' : 'Créer'} un événement
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Titre *</label>
                  <Input
                    value={formData.titre}
                    onChange={(e) =>
                      setFormData({ ...formData, titre: e.target.value })
                    }
                    placeholder="Titre de l'événement"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Description de l'événement"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Photo (optionnel)</label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setPhotoFile(file);
                      setPhotoPreview(file ? URL.createObjectURL(file) : formData.imageUrl || null);
                    }}
                  />
                  {photoPreview ? (
                    <div className="mt-2 overflow-hidden rounded-md border border-border">
                      <img src={photoPreview} alt="Aperçu événement" className="h-36 w-full object-cover" />
                    </div>
                  ) : null}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Date *</label>
                    <Input
                      type="datetime-local"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Select value={formData.type} onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conference">Conférence</SelectItem>
                        <SelectItem value="atelier">Atelier</SelectItem>
                        <SelectItem value="hackathon">Hackathon</SelectItem>
                        <SelectItem value="sortie">Sortie</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Lieu</label>
                    <Input
                      value={formData.lieu}
                      onChange={(e) =>
                        setFormData({ ...formData, lieu: e.target.value })
                      }
                      placeholder="Lieu de l'événement"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Capacité</label>
                    <Input
                      type="number"
                      value={formData.capacite}
                      onChange={(e) =>
                        setFormData({ ...formData, capacite: e.target.value })
                      }
                      placeholder="Nombre de places"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave}>Enregistrer</Button>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.length === 0 ? (
            <p className="text-gray-500">Aucun événement créé</p>
          ) : (
            events.map((event) => (
              <Card key={event.id} className="border hover:shadow-md transition">
                <CardContent className="pt-4">
                  {event.imageUrl ? (
                    <div className="mb-3 overflow-hidden rounded-md">
                      <img src={event.imageUrl} alt={event.titre} className="h-44 w-full object-cover" />
                    </div>
                  ) : null}
                  {/* Event Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{event.titre}</h3>
                      <p className="text-sm text-gray-600">{event.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(event)}
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(event.id)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="text-sm text-gray-600 space-y-1 mb-4">
                    <p>
                      📅{' '}
                      {format(new Date(event.date), 'dd MMMM yyyy HH:mm', {
                        locale: fr,
                      })}
                    </p>
                    {event.lieu && <p>📍 {event.lieu}</p>}
                    <p>
                      👥 {event.participantsCount}
                      {event.capacite ? `/${event.capacite}` : ''} participants
                    </p>
                    <p>🏷️ {event.type}</p>
                  </div>

                  {/* Invitations Toggle */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedEventId(expandedEventId === event.id ? null : event.id)}
                    className="w-full justify-between mb-3"
                  >
                    <span className="flex items-center gap-2">
                      <Mail size={16} />
                      Invitations Enseignants
                    </span>
                    {expandedEventId === event.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </Button>

                  {/* Invitations Section */}
                  {expandedEventId === event.id && (
                    <div className="border-t pt-4 mt-4">
                      <ClubEventTeacherInvitations 
                        eventId={event.id} 
                        onInvitationStatusChange={() => loadEvents()}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
