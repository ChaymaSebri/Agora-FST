import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useStudentParticipationRequests } from "@/hooks/useParticipationRequests";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Project {
  _id: string;
  titre: string;
  description?: string;
  imageUrl?: string | null;
  statut: "en_cours" | "termine" | "annule" | "en_attente";
  progression: number;
  deadline: string;
  enseignantId?: string;
  etudiantIds?: string[];
}

const statusLabels: Record<string, string> = {
  pending: 'En attente',
  accepted: 'Acceptée',
  rejected: 'Refusée',
  cancelled: 'Annulée',
};

const Projects = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { requests, fetchMyRequests, requestParticipation } = useStudentParticipationRequests();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("tous");
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestProjectId, setRequestProjectId] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await api.get("/projets");
        setProjects(response.data.projets || []);
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les projets",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    if (user?.role === 'etudiant') {
      void fetchMyRequests();
    }
  }, [user?.role, fetchMyRequests]);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "tous" || project.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses = [
    { value: "tous", label: "Tous les statuts" },
    { value: "en_attente", label: "En attente" },
    { value: "en_cours", label: "En cours" },
    { value: "termine", label: "Terminé" },
    { value: "annule", label: "Annulé" },
  ];

  const getRequestForProject = (projectId: string) =>
    requests.find((request) => request.project?.id === projectId || request.projet?.id === projectId);

  const openRequestDialog = (projectId: string) => {
    setRequestProjectId(projectId);
    setRequestMessage('');
    setRequestDialogOpen(true);
  };

  const handleSendRequest = async () => {
    if (!requestProjectId) return;

    const success = await requestParticipation(requestProjectId, requestMessage.trim() || undefined);
    if (success) {
      toast({
        title: 'Succès',
        description: 'Demande envoyée',
      });
      setRequestDialogOpen(false);
      setRequestProjectId(null);
      setRequestMessage('');
      await fetchMyRequests();
    } else {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer la demande',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-20">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-foreground">Projets</h1>
        {user?.role === "enseignant" && (
          <Button onClick={() => navigate("/projects/new")}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Projet
          </Button>
        )}
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Rechercher un projet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Aucun projet trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <div
              key={project._id}
              className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              {project.imageUrl ? (
                <div className="mb-3 overflow-hidden rounded-md">
                  <img src={project.imageUrl} alt={project.titre} className="h-40 w-full object-cover" />
                </div>
              ) : null}
              <h3 className="font-bold mb-2">{project.titre}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {project.description}
              </p>
              <div className="flex justify-between items-center text-sm">
                <span className="capitalize">{project.statut}</span>
                <span className="font-medium">{project.progression}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${project.progression}%` }}
                />
              </div>
              {user?.role === 'etudiant' && (
                <div className="mt-4 space-y-3">
                  {(() => {
                    const existingRequest = getRequestForProject(project._id);
                    return existingRequest ? (
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline">
                          Demande: {statusLabels[existingRequest.status] || existingRequest.status}
                        </Badge>
                        <Button variant="outline" disabled>
                          Demander à participer
                        </Button>
                      </div>
                    ) : (
                      <Dialog open={requestDialogOpen && requestProjectId === project._id} onOpenChange={setRequestDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="w-full" onClick={() => openRequestDialog(project._id)}>
                            Demander à participer
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Demander à participer</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                              Ajouter un message optionnel pour le club organisateur.
                            </p>
                            <Textarea
                              value={requestMessage}
                              onChange={(e) => setRequestMessage(e.target.value)}
                              placeholder="Message optionnel..."
                            />
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
                                Annuler
                              </Button>
                              <Button onClick={handleSendRequest}>
                                Envoyer la demande
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    );
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;
