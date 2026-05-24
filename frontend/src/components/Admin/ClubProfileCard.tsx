import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import * as clubDashboardApi from '@/services/club-dashboard.api';

interface ClubProfile {
  id: string;
  nom: string;
  description: string;
  specialite: string;
  statut: string;
  dateCreation: string;
  bureauExecutif: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
  } | null;
  membresCount: number;
  membres: Array<{
    id: string;
    nom: string;
    prenom: string;
    email: string;
    role: string;
  }>;
}

export function ClubProfileCard() {
  const [profile, setProfile] = useState<ClubProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    specialite: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await clubDashboardApi.getClubProfile();
      setProfile(data);
      setFormData({
        nom: data.nom,
        description: data.description || '',
        specialite: data.specialite || '',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le profil du club',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await clubDashboardApi.updateClubProfile(formData);
      toast({
        title: 'Succès',
        description: 'Profil du club mis à jour',
      });
      setIsEditing(false);
      await loadProfile();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le profil',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!profile) {
    return <div>Profil non trouvé</div>;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{profile.nom}</CardTitle>
            <CardDescription>{profile.specialite}</CardDescription>
          </div>
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modifier le profil du club</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nom du club</label>
                  <Input
                    value={formData.nom}
                    onChange={(e) =>
                      setFormData({ ...formData, nom: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Spécialité</label>
                  <Input
                    value={formData.specialite}
                    onChange={(e) =>
                      setFormData({ ...formData, specialite: e.target.value })
                    }
                  />
                </div>
                <Button onClick={handleUpdate}>Enregistrer</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Description</h3>
          <p className="text-sm text-gray-600">{profile.description}</p>
        </div>

        {profile.bureauExecutif && (
          <div>
            <h3 className="font-semibold mb-2">Bureau Exécutif</h3>
            <p className="text-sm">
              {profile.bureauExecutif.nom} {profile.bureauExecutif.prenom}
              <br />
              {profile.bureauExecutif.email}
            </p>
          </div>
        )}

        <div>
          <h3 className="font-semibold mb-2">Membres ({profile.membresCount})</h3>
          <div className="space-y-2">
            {profile.membres.map((membre) => (
              <div key={membre.id} className="text-sm p-2 bg-gray-50 rounded">
                {membre.nom} {membre.prenom} ({membre.role})
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
