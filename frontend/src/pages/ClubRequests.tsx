import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Check, X, Inbox } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { fetchClubMembershipRequests, resolveClubMembershipRequest } from "@/services/api";

type RequestItem = {
  id: string;
  status: string;
  requestedAt: string | null;
  club: { id: string; nom: string } | null;
  member: { id: string; email: string; full_name: string } | null;
};

const ClubRequests = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [requests, setRequests] = useState<RequestItem[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const items = await fetchClubMembershipRequests();
        setRequests(items as RequestItem[]);
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les demandes de membres.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleAction = async (requestId: string, action: "accept" | "deny") => {
    try {
      setSavingId(requestId);
      await resolveClubMembershipRequest(requestId, action);
      setRequests((current) => current.filter((request) => request.id !== requestId));
      toast({
        title: action === "accept" ? "Membre accepté" : "Demande refusée",
        description: action === "accept" ? "Le membre a été ajouté au club." : "La demande a été supprimée.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de traiter la demande.",
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Inbox className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Demandes de membres</CardTitle>
                <CardDescription>
                  Validez ou refusez les demandes d'adhésion à votre club.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : requests.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Aucune demande en attente pour le moment.
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col gap-4 rounded-lg border border-border bg-secondary/40 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="font-semibold text-foreground">
                        {request.member?.full_name || request.member?.email || "Utilisateur"}
                      </div>
                      <div className="text-sm text-muted-foreground">{request.member?.email}</div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="hero"
                        onClick={() => handleAction(request.id, "accept")}
                        disabled={savingId === request.id}
                      >
                        {savingId === request.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                        Accepter
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleAction(request.id, "deny")}
                        disabled={savingId === request.id}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Refuser
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClubRequests;
