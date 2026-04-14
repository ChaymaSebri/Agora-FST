import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, Crown, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

interface UserWithRole extends Profile {
  roles: string[];
}

const initialUsers: UserWithRole[] = [
  {
    id: "1",
    email: "admin@agora-fst.local",
    full_name: "Administrateur",
    created_at: new Date().toISOString(),
    roles: ["admin"],
  },
  {
    id: "2",
    email: "member@agora-fst.local",
    full_name: "Membre Test",
    created_at: new Date().toISOString(),
    roles: ["member"],
  },
];

const Admin = () => {
  const [users, setUsers] = useState<UserWithRole[]>(initialUsers);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  useEffect(() => {
    setLoading(false);
  }, []);

  const toggleAdminRole = async (userId: string, currentRoles: string[]) => {
    const nextUsers = users.map((user) => {
      if (user.id !== userId) {
        return user;
      }

      const isCurrentlyAdmin = currentRoles.includes("admin");
      const nextRoles = isCurrentlyAdmin
        ? currentRoles.filter((role) => role !== "admin")
        : [...currentRoles, "admin"];

      return {
        ...user,
        roles: nextRoles,
      };
    });

    setUsers(nextUsers);

    toast({
      title: "Rôle modifié",
      description: currentRoles.includes("admin")
        ? "Le rôle admin a été retiré"
        : "Le rôle admin a été attribué",
    });
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12 flex items-center justify-center">
        <Card className="border-border max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="text-foreground">Accès refusé</CardTitle>
            <CardDescription>
              Vous devez être administrateur pour accéder à cette page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Dashboard Admin</h1>
          </div>
          <p className="text-muted-foreground">
            Gérez les utilisateurs et leurs permissions
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Users className="w-5 h-5 text-primary" />
                Utilisateurs totaux
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{users.length}</div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Crown className="w-5 h-5 text-accent" />
                Administrateurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {users.filter((u) => u.roles.includes("admin")).length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Users className="w-5 h-5 text-primary" />
                Membres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {users.filter((u) => !u.roles.includes("admin")).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Gestion des utilisateurs</CardTitle>
            <CardDescription>
              Attribuez ou retirez les rôles d'administrateur
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.full_name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-foreground">
                        {user.full_name || "Sans nom"}
                      </div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Membre depuis {new Date(user.created_at).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {user.roles.includes("admin") ? (
                      <Badge className="bg-gradient-accent text-accent-foreground">
                        <Crown className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="outline">Membre</Badge>
                    )}
                    <Button
                      variant={user.roles.includes("admin") ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleAdminRole(user.id, user.roles)}
                    >
                      {user.roles.includes("admin") ? "Retirer admin" : "Promouvoir admin"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
