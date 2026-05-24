import { X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Participant {
  utilisateurId: {
    _id: string;
    nom: string;
    prenom: string;
    email: string;
  };
  statut: string;
  dateInscription: string;
}

interface EventDetailModalProps {
  event: any;
  onClose: () => void;
}

export default function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'inscrit':
        return 'bg-blue-100 text-blue-800';
      case 'confirme':
        return 'bg-green-100 text-green-800';
      case 'present':
        return 'bg-purple-100 text-purple-800';
      case 'annule':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'conference':
        return 'bg-purple-100 text-purple-800';
      case 'atelier':
        return 'bg-blue-100 text-blue-800';
      case 'hackathon':
        return 'bg-red-100 text-red-800';
      case 'sortie':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isFull = event.participantsCount >= event.capacite;
  const fillPercentage = event.capacite > 0
    ? Math.round((event.participantsCount / event.capacite) * 100)
    : 0;

  const organizerName = (() => {
    const personName = `${event.organisateurId?.prenom || ''} ${event.organisateurId?.nom || ''}`.trim();
    if (personName) return personName;
    if (event.clubId?.nom) return event.clubId.nom;
    return event.organisateurId?.email || 'Organisateur inconnu';
  })();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">{event.titre}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Event Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
              <Badge className={getTypeColor(event.type)}>{event.type}</Badge>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
              <p className="text-gray-600">
                {new Date(event.date).toLocaleDateString('fr-FR')} à{' '}
                {new Date(event.date).toLocaleTimeString('fr-FR')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Lieu</label>
              <p className="text-gray-600">{event.lieu}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Organisateur
              </label>
              <p className="text-gray-600">{organizerName}</p>
            </div>
          </div>

          {/* Capacity */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-semibold text-gray-700">Capacité</label>
              <span className={`font-semibold ${isFull ? 'text-red-600' : 'text-green-600'}`}>
                {event.participantsCount}/{event.capacite}
              </span>
            </div>
            <div className="w-full bg-white rounded-full h-4">
              <div
                className={`h-4 rounded-full ${isFull ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${fillPercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">{fillPercentage}% rempli</p>
          </div>

          {/* Description */}
          {event.description && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <p className="text-gray-600">{event.description}</p>
            </div>
          )}

          {/* Club Info */}
          {event.clubId && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Club</label>
              <p className="text-gray-600">{event.clubId.nom}</p>
            </div>
          )}

          {/* Co-organizers */}
          {event.coOrganizerClubIds && event.coOrganizerClubIds.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Clubs co-organisateurs
              </label>
              <div className="flex flex-wrap gap-2">
                {event.coOrganizerClubIds.map((club: any) => (
                  <Badge key={club._id} variant="outline">
                    {club.nom}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Participants */}
          {event.participations && event.participations.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Participants ({event.participations.length})
              </label>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left py-2 px-3">Nom</th>
                      <th className="text-left py-2 px-3">Email</th>
                      <th className="text-left py-2 px-3">Statut</th>
                      <th className="text-left py-2 px-3">Inscription</th>
                    </tr>
                  </thead>
                  <tbody>
                    {event.participations.map((participation: Participant) => (
                      <tr key={participation.utilisateurId._id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-3">
                          {participation.utilisateurId.prenom} {participation.utilisateurId.nom}
                        </td>
                        <td className="py-2 px-3 text-gray-600">
                          {participation.utilisateurId.email}
                        </td>
                        <td className="py-2 px-3">
                          <Badge className={getStatutColor(participation.statut)}>
                            {participation.statut}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-gray-600 text-xs">
                          {new Date(participation.dateInscription).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
