import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Loader2, MapPin, Users, ArrowLeft } from "lucide-react";
import { z } from "zod";

const eventSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères").max(100),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères").max(500),
  type: z.string().min(1, "Veuillez sélectionner un type"),
  date: z.string().min(1, "Veuillez sélectionner une date"),
  time: z.string().min(1, "Veuillez sélectionner une heure"),
  location: z.string().min(3, "Le lieu doit contenir au moins 3 caractères"),
  maxAttendees: z.number().min(1, "Le nombre minimum est 1").max(1000),
});

const CreateEvent = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("30");
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      eventSchema.parse({
        title,
        description,
        type,
        date,
        time,
        location,
        maxAttendees: parseInt(maxAttendees),
      });
      
      setIsLoading(true);
      
      // Simulate event creation (you'll implement actual database logic)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast({
        title: "Événement créé",
        description: "L'événement a été créé avec succès !",
      });
      
      navigate("/events");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erreur de validation",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/events")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux événements
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-gradient-accent rounded-lg">
            <CalendarIcon className="w-6 h-6 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Créer un événement</h1>
            <p className="text-muted-foreground">Organisez un nouvel événement pour votre club</p>
          </div>
        </div>

        <Card className="border-border shadow-elegant">
          <CardHeader>
            <CardTitle className="text-foreground">Informations de l'événement</CardTitle>
            <CardDescription>
              Remplissez les détails de votre événement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Titre de l'événement *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Atelier Intelligence Artificielle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre événement en quelques lignes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  {description.length}/500 caractères
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="type">Type d'événement *</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="workshop">Atelier</SelectItem>
                      <SelectItem value="conference">Conférence</SelectItem>
                      <SelectItem value="meeting">Réunion</SelectItem>
                      <SelectItem value="competition">Compétition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Lieu *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="location"
                      placeholder="Salle A302"
                      className="pl-10"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="date"
                      type="date"
                      className="pl-10"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Heure *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxAttendees">Places max *</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="maxAttendees"
                      type="number"
                      className="pl-10"
                      value={maxAttendees}
                      onChange={(e) => setMaxAttendees(e.target.value)}
                      required
                      min="1"
                      max="1000"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/events")}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    "Créer l'événement"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateEvent;
