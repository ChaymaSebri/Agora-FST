import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EventCard, Event } from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Calendar as CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const mockEvents: Event[] = [
  {
    id: "1",
    title: "Atelier Intelligence Artificielle",
    description: "Introduction pratique aux concepts fondamentaux de l'IA et du machine learning.",
    date: "18 Déc 2025",
    time: "14:00",
    location: "Salle A302",
    attendees: 35,
    maxAttendees: 40,
    type: "workshop",
  },
  {
    id: "2",
    title: "Conférence Entrepreneuriat",
    description: "Rencontre avec des entrepreneurs à succès et présentation d'opportunités de financement.",
    date: "22 Déc 2025",
    time: "10:00",
    location: "Amphithéâtre Principal",
    attendees: 180,
    maxAttendees: 200,
    type: "conference",
  },
  {
    id: "3",
    title: "Réunion Club Robotique",
    description: "Point d'avancement sur les projets en cours et planification du trimestre.",
    date: "20 Déc 2025",
    time: "18:00",
    location: "Lab Robotique",
    attendees: 15,
    maxAttendees: 20,
    type: "meeting",
  },
  {
    id: "4",
    title: "Hackathon Innovation Sociale",
    description: "48h pour développer des solutions innovantes aux défis sociaux locaux.",
    date: "10 Jan 2026",
    time: "09:00",
    location: "Campus Innovation Hub",
    attendees: 95,
    maxAttendees: 100,
    type: "competition",
  },
  {
    id: "5",
    title: "Atelier Design Thinking",
    description: "Apprenez la méthodologie design thinking à travers des cas pratiques.",
    date: "25 Déc 2025",
    time: "15:00",
    location: "Salle B205",
    attendees: 28,
    maxAttendees: 30,
    type: "workshop",
  },
];

const Events = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const filteredEvents = mockEvents.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || event.type === filterType;
    return matchesSearch && matchesFilter;
  });

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
              <SelectItem value="workshop">Ateliers</SelectItem>
              <SelectItem value="conference">Conférences</SelectItem>
              <SelectItem value="meeting">Réunions</SelectItem>
              <SelectItem value="competition">Compétitions</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
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
