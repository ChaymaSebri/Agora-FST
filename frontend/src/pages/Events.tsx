import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EventCard, Event } from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  cancelEventParticipation,
  deleteEvent,
  fetchEvents,
  listEventParticipations,
  registerToEvent,
} from "@/services/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Events = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [registrationMap, setRegistrationMap] = useState<Record<string, boolean>>({});
  const [isLoadingRegistrations, setIsLoadingRegistrations] = useState(false);
  const fallbackUtilisateurId = import.meta.env.VITE_UTILISATEUR_ID || "000000000000000000000001";

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsLoading(true);
        const { items } = await fetchEvents({
          search: searchTerm || undefined,
          type: filterType === "all" ? undefined : filterType,
          limit: 50,
          sortBy: "date",
          sortOrder: "asc",
        });
        setEvents(items);
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les événements.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [searchTerm, filterType, toast]);

  useEffect(() => {
    const loadRegistrationState = async () => {
      if (events.length === 0) {
        setRegistrationMap({});
        return;
      }

      try {
        setIsLoadingRegistrations(true);
        const entries = await Promise.all(
          events.map(async (event) => {
            try {
              const data = await listEventParticipations(event.id);
              const isRegistered = (data.items || []).some(
                (item) => item.utilisateurId === fallbackUtilisateurId,
              );
              return [event.id, isRegistered];
            } catch (error) {
              return [event.id, false];
            }
          }),
        );

        setRegistrationMap(Object.fromEntries(entries));
      } finally {
        setIsLoadingRegistrations(false);
      }
    };

    loadRegistrationState();
  }, [events, fallbackUtilisateurId]);

  const filteredEvents = events;

  const handleDeleteEvent = async (id: string) => {
    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((event) => event.id !== id));
    } catch (error) {
      toast({
        title: "Erreur",
        description: "La suppression de l'événement a échoué.",
        variant: "destructive",
      });
    }
  };

  const handleRegisterEvent = async (id: string) => {
    try {
      await registerToEvent(id, { utilisateurId: fallbackUtilisateurId });
      setEvents((prev) =>
        prev.map((event) =>
          event.id === id ? { ...event, attendees: event.attendees + 1 } : event,
        ),
      );
      setRegistrationMap((prev) => ({ ...prev, [id]: true }));
      toast({
        title: "Inscription réussie",
        description: "Vous êtes inscrit à cet événement.",
      });
    } catch (error) {
      toast({
        title: "Inscription impossible",
        description: "Vérifiez votre utilisateur ou la capacité de l'événement.",
        variant: "destructive",
      });
    }
  };

  const handleCancelRegistration = async (id: string) => {
    try {
      await cancelEventParticipation(id, fallbackUtilisateurId);
      setEvents((prev) =>
        prev.map((event) =>
          event.id === id
            ? { ...event, attendees: Math.max(0, event.attendees - 1) }
            : event,
        ),
      );
      setRegistrationMap((prev) => ({ ...prev, [id]: false }));
      toast({
        title: "Inscription annulée",
        description: "Votre inscription a été annulée.",
      });
    } catch (error) {
      toast({
        title: "Annulation impossible",
        description: "Impossible d'annuler cette inscription.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Événements</h1>
            <p className="text-muted-foreground">
              Participez aux événements organisés par les clubs et projets
            </p>
          </div>
          <Button variant="accent" size="lg" className="md:self-start" onClick={() => navigate("/events/new")}>
            <Plus className="w-4 h-4 mr-2" />
            Créer un événement
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un événement..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-[200px]">
              <CalendarIcon className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Type d'événement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="atelier">Ateliers</SelectItem>
              <SelectItem value="conference">Conférences</SelectItem>
              <SelectItem value="hackathon">Hackathons</SelectItem>
              <SelectItem value="sortie">Sorties</SelectItem>
              <SelectItem value="autre">Autres</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(isLoading || isLoadingRegistrations) && (
          <div className="py-8 text-center text-muted-foreground">Chargement des événements...</div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onDelete={handleDeleteEvent}
              onRegister={handleRegisterEvent}
              onCancelRegistration={handleCancelRegistration}
              isRegistered={Boolean(registrationMap[event.id])}
            />
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              Aucun événement ne correspond à vos critères de recherche
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
