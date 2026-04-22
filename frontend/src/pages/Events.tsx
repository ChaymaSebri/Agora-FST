import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EventCard, Event } from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Calendar as CalendarIcon, Loader2, ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  ApiError,
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
import { useAuth } from "@/contexts/AuthContext";

const Events = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, totalItems: 0, totalPages: 1 });
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [registrationMap, setRegistrationMap] = useState<Record<string, boolean>>({});
  const [isLoadingRegistrations, setIsLoadingRegistrations] = useState(false);
  const [busyAction, setBusyAction] = useState<{ id: string; type: "delete" | "register" | "cancel" } | null>(null);
  const fallbackUtilisateurId = import.meta.env.VITE_UTILISATEUR_ID || "000000000000000000000001";
  const pageSize = 12;
  const currentUserId = String((user as { id?: string; _id?: string } | null)?.id || (user as { id?: string; _id?: string } | null)?._id || "");
  const currentClubId = String((user as { clubId?: string } | null)?.clubId || "");
  const isClubUser = user?.role === "club";

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterType]);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const { items, pagination: responsePagination } = await fetchEvents({
          search: searchTerm.trim() || undefined,
          type: filterType === "all" ? undefined : filterType,
          page,
          limit: pageSize,
          sortBy: "date",
          sortOrder: "asc",
        });
        setEvents(items);
        setPagination(responsePagination ?? { page, limit: pageSize, totalItems: items.length, totalPages: 1 });
      } catch (error) {
        const message = error instanceof ApiError ? error.message : "Impossible de charger les événements.";
        setLoadError(message);
        toast({
          title: "Erreur",
          description: message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, [searchTerm, filterType, page, reloadToken, toast]);

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
      } catch (error) {
        setRegistrationMap({});
      } finally {
        setIsLoadingRegistrations(false);
      }
    };

    loadRegistrationState();
  }, [events, fallbackUtilisateurId]);

  const filteredEvents = events;

  const updateEventCounts = (id: string, delta: number) => {
    setEvents((prev) =>
      prev.map((event) =>
        event.id === id
          ? {
              ...event,
              attendees: Math.max(0, event.attendees + delta),
              participantsCount: Math.max(0, (event.participantsCount ?? event.attendees) + delta),
            }
          : event,
      ),
    );
  };

  const handleDeleteEvent = async (id: string) => {
    setBusyAction({ id, type: "delete" });
    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((event) => event.id !== id));
      setRegistrationMap((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      toast({
        title: "Événement supprimé",
        description: "L'événement a été supprimé avec succès.",
      });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "La suppression de l'événement a échoué.";
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
    } finally {
      setBusyAction((current) => (current?.id === id && current.type === "delete" ? null : current));
    }
  };

  const handleRegisterEvent = async (id: string) => {
    setBusyAction({ id, type: "register" });
    try {
      await registerToEvent(id, { utilisateurId: fallbackUtilisateurId });
      updateEventCounts(id, 1);
      setRegistrationMap((prev) => ({ ...prev, [id]: true }));
      toast({
        title: "Inscription réussie",
        description: "Vous êtes inscrit à cet événement.",
      });
    } catch (error) {
      if (error instanceof ApiError && error.code === "ALREADY_REGISTERED") {
        setRegistrationMap((prev) => ({ ...prev, [id]: true }));
        toast({
          title: "Déjà inscrit",
          description: "Vous êtes déjà inscrit à cet événement.",
        });
        return;
      }

      if (error instanceof ApiError && error.code === "EVENT_FULL") {
        toast({
          title: "Événement complet",
          description: "Toutes les places sont déjà prises.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Inscription impossible",
        description: error instanceof ApiError ? error.message : "Vérifiez votre utilisateur ou la capacité de l'événement.",
        variant: "destructive",
      });
    } finally {
      setBusyAction((current) => (current?.id === id && current.type === "register" ? null : current));
    }
  };

  const handleCancelRegistration = async (id: string) => {
    setBusyAction({ id, type: "cancel" });
    try {
      await cancelEventParticipation(id, fallbackUtilisateurId);
      updateEventCounts(id, -1);
      setRegistrationMap((prev) => ({ ...prev, [id]: false }));
      toast({
        title: "Inscription annulée",
        description: "Votre inscription a été annulée.",
      });
    } catch (error) {
      if (error instanceof ApiError && error.code === "PARTICIPATION_NOT_FOUND") {
        setRegistrationMap((prev) => ({ ...prev, [id]: false }));
        toast({
          title: "Déjà désinscrit",
          description: "Cette inscription n'existe plus.",
        });
        return;
      }

      toast({
        title: "Annulation impossible",
        description: error instanceof ApiError ? error.message : "Impossible d'annuler cette inscription.",
        variant: "destructive",
      });
    } finally {
      setBusyAction((current) => (current?.id === id && current.type === "cancel" ? null : current));
    }
  };

  const totalPages = Math.max(1, pagination.totalPages || 1);
  const isEmpty = !isLoading && !loadError && filteredEvents.length === 0;

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
          {isClubUser ? (
            <Button variant="accent" size="lg" className="md:self-start" onClick={() => navigate("/events/new")}>
              <Plus className="w-4 h-4 mr-2" />
              Créer un événement
            </Button>
          ) : null}
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

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <div>
            {pagination.totalItems > 0 ? `${pagination.totalItems} événement${pagination.totalItems > 1 ? "s" : ""} trouvé${pagination.totalItems > 1 ? "s" : ""}` : "Aucun événement chargé"}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setFilterType("all");
              setPage(1);
              setReloadToken((current) => current + 1);
            }}
            disabled={isLoading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Réinitialiser
          </Button>
        </div>

        {loadError && (
          <div className="mb-8 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive">
            <div className="flex items-center justify-between gap-4">
              <p>{loadError}</p>
              <Button variant="outline" size="sm" onClick={() => setReloadToken((current) => current + 1)}>
                Réessayer
              </Button>
            </div>
          </div>
        )}

        {(isLoading || isLoadingRegistrations) && (
          <div className="py-8 text-center text-muted-foreground">
            <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
            Chargement des événements...
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const isOwnerByClub = Boolean(event.clubId && currentClubId && String(event.clubId) === currentClubId);
            const isOwnerByOrganisateur = Boolean(event.organisateurId && currentUserId && String(event.organisateurId) === currentUserId);
            const canManageEvent = isClubUser && (isOwnerByClub || isOwnerByOrganisateur);

            return (
            <EventCard
              key={event.id}
              event={event}
              onDelete={handleDeleteEvent}
              onRegister={handleRegisterEvent}
              onCancelRegistration={handleCancelRegistration}
              isRegistered={Boolean(registrationMap[event.id])}
              isDeleting={busyAction?.id === event.id && busyAction.type === "delete"}
              isRegistering={busyAction?.id === event.id && busyAction.type === "register"}
              isCancelling={busyAction?.id === event.id && busyAction.type === "cancel"}
              canManage={canManageEvent}
            />
            );
          })}
        </div>

        {isEmpty && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              Aucun événement ne correspond à vos critères de recherche
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-3">
            <Button variant="outline" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || isLoading}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Précédent
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} sur {totalPages}
            </span>
            <Button variant="outline" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages || isLoading}>
              Suivant
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
