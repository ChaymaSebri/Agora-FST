import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireClub?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false, requireClub = false }: ProtectedRouteProps) => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const isClub = user?.role === "club";

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (requireAdmin && !isAdmin) {
        navigate("/");
      } else if (requireClub && !isClub) {
        navigate("/");
      }
    }
  }, [user, loading, isAdmin, isClub, requireAdmin, requireClub, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (requireAdmin && !isAdmin) || (requireClub && !isClub)) {
    return null;
  }

  return <>{children}</>;
};
