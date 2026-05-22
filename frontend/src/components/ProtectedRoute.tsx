import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireRole?: string;
}

export const ProtectedRoute = ({ children, requireAdmin = false, requireRole }: ProtectedRouteProps) => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/auth");
      } else if (requireAdmin && !isAdmin) {
        navigate("/");
      } else if (requireRole && user.role !== requireRole) {
        navigate("/");
      }
    }
  }, [user, loading, isAdmin, requireAdmin, requireRole, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (requireAdmin && !isAdmin) || (requireRole && user.role !== requireRole)) {
    return null;
  }

  return <>{children}</>;
};
