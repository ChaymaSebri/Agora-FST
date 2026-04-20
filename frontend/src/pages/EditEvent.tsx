import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Loader2, MapPin, Users, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { fetchEventById, updateEvent } from "@/services/api";

const eventSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères").max(100),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères").max(500),
  type: z.string().min(1, "Veuillez sélectionner un type"),
  date: z.string().min(1, "Veuillez sélectionner une date"),
  time: z.string().min(1, "Veuillez sélectionner une heure"),
  location: z.string().min(3, "Le lieu doit contenir au moins 3 caractères"),
  maxAttendees: z.number().min(1, "Le nombre minimum est 1").max(1000),
});

const EditEvent = () => {
  const { id } = useParams<{ id: string }>();
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
  const fallbackOrganisateurId = import.meta.env.VITE_ORGANISATEUR_ID || "000000000000000000000001";

  useEffect(() => {
    const loadEvent = async () => {
      if (!id) {
        navigate("/events");
        return;
      }

      try {
        const event = await fetchEventById(id);
        setTitle(event.title);
        setDescription(event.description);
        setType(event.type);
        setDate(event.date);
        setTime(event.time);
        setLocation(event.location);
        setMaxAttendees(String(event.maxAttendees || 0));
      } catch (error) {
        toast({ title: "Erreur", description: "Événement introuvable.", variant: "destructive" });
        navigate("/events");
      }
    };

    loadEvent();
  }, [id, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      eventSchema.parse({
        title, description, type, date, time, location,
        maxAttendees: parseInt(maxAttendees),
      });
      setIsLoading(true);

      if (!id) {
        throw new Error("Missing event id");
      }

      await updateEvent(id, {
        title,
        description,
        type,
        date,
        time,
        location,
        maxAttendees,
        organisateurId: fallbackOrganisateurId,
      });

      toast({ title: "Événement modifié", description: "L'événement a été mis à jour avec succès !" });
      navigate("/events");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: "Erreur de validation", description: error.errors[0].message, variant: "destructive" });
      } else {
        toast({ title: "Erreur", description: "La mise à jour de l'événement a échoué.", variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate("/events")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux événements
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-gradient-accent rounded-lg">
            <CalendarIcon className="w-6 h-6 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Modifier l'événement</h1>
            <p className="text-muted-foreground">Modifiez les détails de votre événement</p>
          </div>
        </div>

        <Card className="border-border shadow-elegant">
          <CardHeader>
            <CardTitle className="text-foreground">Informations de l'événement</CardTitle>
            <CardDescription>Mettez à jour les détails de votre événement</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Titre de l'événement *</Label>
                <Input id="title" placeholder="Ex: Atelier Intelligence Artificielle" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea id="description" placeholder="Décrivez votre événement..." value={description} onChange={(e) => setDescription(e.target.value)} required rows={5} />
                <p className="text-xs text-muted-foreground">{description.length}/500 caractères</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="type">Type d'événement *</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue placeholder="Sélectionnez un type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="atelier">Atelier</SelectItem>
                      <SelectItem value="conference">Conférence</SelectItem>
                      <SelectItem value="hackathon">Hackathon</SelectItem>
                      <SelectItem value="sortie">Sortie</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Lieu *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input id="location" placeholder="Salle A302" className="pl-10" value={location} onChange={(e) => setLocation(e.target.value)} required />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input id="date" type="date" className="pl-10" value={date} onChange={(e) => setDate(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Heure *</Label>
                  <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAttendees">Places max *</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input id="maxAttendees" type="number" className="pl-10" value={maxAttendees} onChange={(e) => setMaxAttendees(e.target.value)} required min="1" max="1000" />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate("/events")} className="flex-1">Annuler</Button>
                <Button type="submit" variant="accent" disabled={isLoading} className="flex-1">
                  {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mise à jour...</>) : "Enregistrer les modifications"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditEvent;
