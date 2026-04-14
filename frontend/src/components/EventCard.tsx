import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users as UsersIcon, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  maxAttendees: number;
  type: "workshop" | "conference" | "meeting" | "competition";
}

interface EventCardProps {
  event: Event;
}

const typeColors = {
  workshop: "bg-accent text-accent-foreground",
  conference: "bg-primary text-primary-foreground",
  meeting: "bg-secondary text-secondary-foreground",
  competition: "bg-gradient-accent text-accent-foreground",
};

const typeLabels = {
  workshop: "Atelier",
  conference: "Conférence",
  meeting: "Réunion",
  competition: "Compétition",
};

export const EventCard = ({ event }: EventCardProps) => {
  const navigate = useNavigate();
  const spotsLeft = event.maxAttendees - event.attendees;
  
  return (
    <Card className="group hover:shadow-hover transition-all duration-300 border-border hover:border-primary/50">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Badge className={typeColors[event.type]}>
            {typeLabels[event.type]}
          </Badge>
          {spotsLeft <= 10 && spotsLeft > 0 && (
            <Badge variant="outline" className="text-xs text-accent">
              {spotsLeft} places restantes
            </Badge>
          )}
        </div>
        <CardTitle className="text-foreground group-hover:text-primary transition-colors">
          {event.title}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {event.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 text-primary" />
            <span>{event.date} à {event.time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UsersIcon className="w-4 h-4 text-primary" />
            <span>{event.attendees}/{event.maxAttendees} participants</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={spotsLeft === 0 ? "outline" : "default"}
            className="flex-1"
            disabled={spotsLeft === 0}
          >
            {spotsLeft === 0 ? "Complet" : "S'inscrire"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(`/events/${event.id}/edit`)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
