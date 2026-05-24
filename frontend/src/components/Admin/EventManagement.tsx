import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronLeft, ChevronRight, Eye, Users } from 'lucide-react';
import api from '@/services/api';
import EventDetailModal from './EventDetailModal';

interface Event {
  _id: string;
  titre: string;
  description: string;
  date: string;
  lieu: string;
  type: string;
  capacite: number;
  participantsCount: number;
  organisateurId: {
    nom: string;
    prenom: string;
    email?: string;
  };
  clubId?: {
    nom?: string;
  };
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function EventManagement() {
  const [events, setEvents] = useState<Event[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [pagination.page, search, typeFilter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(typeFilter && typeFilter !== 'all' && { type: typeFilter }),
      });

      const response = await api.get(`/admin/events?${params}`);
      setEvents(response.data.events);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (event: Event) => {
    try {
      const response = await api.get(`/admin/events/${event._id}`);
      setSelectedEvent(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
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

  const isFull = (event: Event) => event.participantsCount >= event.capacite;
  const getCapacityPercentage = (event: Event) =>
    Math.round((event.participantsCount / event.capacite) * 100);

  const getOrganizerName = (event: Event) => {
    const personName = `${event.organisateurId?.prenom || ''} ${event.organisateurId?.nom || ''}`.trim();
    if (personName) return personName;
    if (event.clubId?.nom) return event.clubId.nom;
    return event.organisateurId?.email || 'Organisateur inconnu';
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Rechercher par titre..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={(value) => {
          setTypeFilter(value);
          setPagination({ ...pagination, page: 1 });
        }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filtre par type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="conference">Conférence</SelectItem>
            <SelectItem value="atelier">Atelier</SelectItem>
            <SelectItem value="hackathon">Hackathon</SelectItem>
            <SelectItem value="sortie">Sortie</SelectItem>
            <SelectItem value="autre">Autre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-6 font-semibold">Titre</th>
                <th className="text-left py-3 px-6 font-semibold">Type</th>
                <th className="text-left py-3 px-6 font-semibold">Date</th>
                <th className="text-left py-3 px-6 font-semibold">Lieu</th>
                <th className="text-left py-3 px-6 font-semibold">Participants</th>
                <th className="text-left py-3 px-6 font-semibold">Organisateur</th>
                <th className="text-left py-3 px-6 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    Chargement...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    Aucun événement trouvé
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event._id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium">{event.titre}</td>
                    <td className="py-4 px-6">
                      <Badge className={getTypeColor(event.type)}>{event.type}</Badge>
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {new Date(event.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-4 px-6 text-gray-600">{event.lieu}</td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-gray-500" />
                          <span
                            className={
                              isFull(event) ? 'text-red-600 font-semibold' : 'text-gray-600'
                            }
                          >
                            {event.participantsCount}/{event.capacite}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className={`${
                              isFull(event) ? 'bg-red-500' : 'bg-green-500'
                            } h-2 rounded-full`}
                            style={{ width: `${getCapacityPercentage(event)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {getCapacityPercentage(event)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {getOrganizerName(event)}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleViewDetails(event)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Voir les détails"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            Affichage {(pagination.page - 1) * pagination.limit + 1} à{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPagination({
                  ...pagination,
                  page: Math.max(1, pagination.page - 1),
                })
              }
              disabled={pagination.page === 1}
            >
              <ChevronLeft size={16} />
            </Button>
            <div className="flex items-center gap-2">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setPagination({ ...pagination, page })}
                  className={`w-8 h-8 rounded ${
                    pagination.page === page
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPagination({
                  ...pagination,
                  page: Math.min(pagination.pages, pagination.page + 1),
                })
              }
              disabled={pagination.page === pagination.pages}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Detail Modal */}
      {showDetailModal && selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
}
