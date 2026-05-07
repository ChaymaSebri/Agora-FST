import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, ShieldCheck, MapPin, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { fetchClubs, fetchMyClubMembershipRequests, requestClubMembership } from "@/services/api";

type ClubItem = {
  id: string;
  nom: string;
  description: string;
  specialite: string;
  statut: string;
  membersCount: number;
};

type ClubRequest = {
  id: string;
  status: string;
  club: { id: string; nom: string } | null;
};

const Clubs = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [clubs, setClubs] = useState<ClubItem[]>([]);
  const [requests, setRequests] = useState<ClubRequest[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [clubItems, myRequests] = await Promise.all([
          fetchClubs(),
          user ? fetchMyClubMembershipRequests() : Promise.resolve([]),
        ]);
        setClubs(clubItems as ClubItem[]);
        setRequests(myRequests as ClubRequest[]);
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de charger la liste des clubs.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const requestByClubId = useMemo(() => {
    return new Map(requests.map((request) => [request.club?.id, request]));
  }, [requests]);

  const handleRequest = async (clubId: string) => {
    try {
      setRequestingId(clubId);
      const created = await requestClubMembership(clubId);
      setRequests((current) => [
        ...current.filter((request) => request.club?.id !== clubId),
        created,
      ]);
      toast({
        title: "Demande envoyée",
        description: "Le club va pouvoir accepter ou refuser votre demande.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message || "Impossible d'envoyer la demande.",
        variant: "destructive",
      });
    } finally {
      setRequestingId(null);
    }
  };

  const isStudent = user?.role === "etudiant";

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mt-3 text-4xl font-bold text-foreground">Découvrir les clubs</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Parcourez les clubs existants, consultez leurs informations et envoyez une demande d'adhésion.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {clubs.length} club{clubs.length > 1 ? "s" : ""}
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {clubs.map((club) => {
              const request = requestByClubId.get(club.id);
              const isPending = request?.status === "pending";
              const isMember = request?.status === "accepted";

              return (
                <Card key={club.id} className="border-border shadow-sm">
                  <CardHeader className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-foreground">{club.nom}</CardTitle>
                        <CardDescription className="mt-1 line-clamp-3">{club.description || "Aucune description."}</CardDescription>
                      </div>
                      <Badge variant={club.statut === "actif" ? "default" : "secondary"}>{club.statut}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {club.specialite || "Général"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {club.membersCount} membre{club.membersCount > 1 ? "s" : ""}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isStudent ? (
                      <div className="flex flex-col gap-3">
                        {isMember ? (
                          <Badge className="w-fit bg-emerald-600 text-white">Déjà membre</Badge>
                        ) : isPending ? (
                          <Badge variant="outline" className="w-fit">Demande en attente</Badge>
                        ) : null}
                        <Button
                          variant="hero"
                          disabled={Boolean(requestingId) || isPending || isMember}
                          onClick={() => handleRequest(club.id)}
                        >
                          {requestingId === club.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Envoi...
                            </>
                          ) : isMember ? (
                            "Membre"
                          ) : isPending ? (
                            "Demande envoyée"
                          ) : (
                            "Je veux être membre"
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {user ? "Connectez-vous avec un compte étudiant pour demander une adhésion." : "Connectez-vous pour demander une adhésion."}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Clubs;
