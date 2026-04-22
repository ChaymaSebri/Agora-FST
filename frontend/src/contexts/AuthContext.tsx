import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import axios from "axios";
import api from "@/services/api";

type AuthUser = {
  email?: string | null;
  fullName?: string | null;
  nom?: string | null;
  prenom?: string | null;
  role?: string | null;
  avatar_url?: string | null;
  avatarUrl?: string | null;
};

type AuthResult = {
  error: { message: string } | null;
};

type BackendAuthResponse = {
  token: string;
  user: AuthUser;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (payload: {
    email: string;
    password: string;
    fullName?: string;
    role: string;
    niveau?: string;
    filiere?: string;
    grade?: string;
    specialite?: string;
    clubName?: string;
    clubDescription?: string;
    clubSpecialite?: string;
    avatarUrl?: string;
  }) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = localStorage.getItem("authToken");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(data.user);
      } catch {
        localStorage.removeItem("authToken");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const isAdmin = user?.role === "admin";

  const refreshUser = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const { data } = await api.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUser(data.user);
    } catch {
      localStorage.removeItem("authToken");
      setUser(null);
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAdmin,
      signIn: async (email, password) => {
        try {
          const { data } = await api.post<BackendAuthResponse>("/auth/login", {
            email,
            password,
          });

          localStorage.setItem("authToken", data.token);
          setUser(data.user);

          return { error: null };
        } catch (error) {
          const message = axios.isAxiosError(error)
            ? (error.response?.data?.message ?? "Email ou mot de passe incorrect")
            : error instanceof Error
              ? error.message
              : "Email ou mot de passe incorrect";

          return { error: { message } };
        }
      },
      signUp: async (payload) => {
        try {
          const { data } = await api.post<BackendAuthResponse>("/auth/register", payload);

          localStorage.setItem("authToken", data.token);
          setUser(data.user);

          return { error: null };
        } catch (error) {
          const message = axios.isAxiosError(error)
            ? (error.response?.data?.message ?? "Erreur lors de l inscription")
            : error instanceof Error
              ? error.message
              : "Erreur lors de l inscription";

          return { error: { message } };
        }
      },
      signOut: async () => {
        const token = localStorage.getItem("authToken");
        if (token) {
          try {
            await api.post(
              "/auth/logout",
              {},
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );
          } catch {
            // Logout is stateless; clear local session even if the request fails.
          }
        }

        localStorage.removeItem("authToken");
        setUser(null);
      },
      refreshUser,
    }),
    [user, loading, isAdmin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    return {
      user: null,
      loading: true,
      isAdmin: false,
      signIn: async () => ({ error: null }),
      signUp: async () => ({ error: null }),
      signOut: async () => undefined,
      refreshUser: async () => undefined,
    };
  }

  return context;
}
