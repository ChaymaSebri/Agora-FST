import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Rocket, Menu, Shield, LogOut, User, Inbox } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { fetchClubMembershipRequests } from "@/services/api";

const navItems = [
  { name: "Accueil", path: "/" },
  { name: "Clubs", path: "/clubs" },
  { name: "Projets", path: "/projects" },
  { name: "Événements", path: "/events" },
  { name: "Statistiques", path: "/stats" },
];

export const Navbar = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [pendingMembershipCount, setPendingMembershipCount] = useState(0);
  const { user, isAdmin, signOut } = useAuth();
  const avatarSrc = user?.avatarUrl || undefined;
  const avatarInitial = user?.email?.charAt(0).toUpperCase() || "U";
  const roleLabel = (() => {
    switch (user?.role) {
      case "admin":
        return "Administrateur";
      case "club":
        return "Club";
      case "enseignant":
        return "Enseignant";
      case "etudiant":
        return "Étudiant";
      default:
        return "Membre";
    }
  })();
  const displayRoleLabel = roleLabel
    ? roleLabel.charAt(0).toUpperCase() + roleLabel.slice(1)
    : "Membre";

  useEffect(() => {
    const loadPendingRequests = async () => {
      if (user?.role !== "club") {
        setPendingMembershipCount(0);
        return;
      }

      try {
        const requests = await fetchClubMembershipRequests();
        setPendingMembershipCount(requests.length);
      } catch {
        setPendingMembershipCount(0);
      }
    };

    loadPendingRequests();
  }, [user]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <img
                src={logo}
                alt="Agora FST Logo"
                className="h-8 w-8 object-contain"
              />
            <span className="font-bold text-lg text-foreground">Agora FST</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === item.path
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={avatarSrc} alt={user.email || "Avatar"} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {avatarInitial}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm">
                    <div className="font-medium">{user.email}</div>
                    <div className="text-xs text-muted-foreground">
                      {displayRoleLabel}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      Mon profil
                    </Link>
                  </DropdownMenuItem>
                  {user?.role === "club" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/club-requests" className="cursor-pointer flex items-center justify-between gap-2">
                          <span className="flex items-center">
                            <Inbox className="w-4 h-4 mr-2" />
                            Demandes de membres
                          </span>
                          {pendingMembershipCount > 0 && <Badge variant="secondary">{pendingMembershipCount}</Badge>}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer">
                          <Shield className="w-4 h-4 mr-2" />
                          Dashboard Admin
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="hero" size="sm" asChild>
                <Link to="/auth">Connexion</Link>
              </Button>
            )}
          </div>

          {/* Mobile Navigation */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <div className="flex flex-col gap-4 mt-8">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setOpen(false)}
                    className={`text-lg font-medium transition-colors hover:text-primary ${
                      location.pathname === item.path
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                
                {user ? (
                  <>
                    {user?.role === "club" && (
                      <Link
                        to="/club-requests"
                        onClick={() => setOpen(false)}
                        className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                      >
                        <Inbox className="w-5 h-5" />
                        Demandes de membres
                        {pendingMembershipCount > 0 && <Badge variant="secondary">{pendingMembershipCount}</Badge>}
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      onClick={() => setOpen(false)}
                      className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                    >
                      <User className="w-5 h-5" />
                      Mon profil
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setOpen(false)}
                        className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                      >
                        <Shield className="w-5 h-5" />
                        Dashboard Admin
                      </Link>
                    )}
                    <Button variant="destructive" className="mt-4" onClick={() => { signOut(); setOpen(false); }}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Déconnexion
                    </Button>
                  </>
                ) : (
                  <Button variant="hero" className="mt-4" asChild onClick={() => setOpen(false)}>
                    <Link to="/auth">Connexion</Link>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};
