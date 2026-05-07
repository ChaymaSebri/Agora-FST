import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import axios from "axios";
import api, { requestPasswordReset as requestPasswordResetApi, resetPassword as resetPasswordApi } from "@/services/api";

type AuthUser = {
  id?: string | null;
  _id?: string | null;
  email?: string | null;
  fullName?: string | null;
  nom?: string | null;
  prenom?: string | null;
  role?: string | null;
  avatarUrl?: string | null;
  competenceIds?: string[];
  clubId?: string | null;
};

type AuthResult = {
  error: { message: string } | null;
  needsVerification?: boolean;
  email?: string;
  message?: string;
};

type BackendAuthResponse = {
  token: string;
  user: AuthUser;
};

type RegistrationResponse = {
  needsVerification?: boolean;
  email?: string;
  message?: string;
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
    competenceIds?: string[];
  }) => Promise<AuthResult>;

  verifyEmail: (payload: { email: string; code: string }) => Promise<AuthResult>;
  resendVerificationCode: (email: string) => Promise<AuthResult>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  resetPassword: (payload: { email: string; token: string; newPassword: string }) => Promise<AuthResult>;
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
          const { data } = await api.post<RegistrationResponse>("/auth/register", payload);

          return {
            error: null,
            needsVerification: Boolean(data.needsVerification),
            email: data.email,
            message: data.message,
          };
        } catch (error) {
          const message = axios.isAxiosError(error)
            ? (error.response?.data?.message ?? "Erreur lors de l inscription")
            : error instanceof Error
              ? error.message
              : "Erreur lors de l inscription";

          return { error: { message } };
        }
      },
      verifyEmail: async ({ email, code }) => {
        try {
          const { data } = await api.post<BackendAuthResponse>("/auth/verify-email", {
            email,
            code,
          });

          localStorage.setItem("authToken", data.token);
          setUser(data.user);

          return { error: null };
        } catch (error) {
          const message = axios.isAxiosError(error)
            ? (error.response?.data?.message ?? "Erreur lors de la verification")
            : error instanceof Error
              ? error.message
              : "Erreur lors de la verification";

          return { error: { message } };
        }
      },
      resendVerificationCode: async (email) => {
        try {
          const { data } = await api.post<{ message: string }>("/auth/resend-verification-code", {
            email,
          });

          return {
            error: null,
            email,
            message: data.message,
          };
        } catch (error) {
          const message = axios.isAxiosError(error)
            ? (error.response?.data?.message ?? "Erreur lors de lenvoi du code")
            : error instanceof Error
              ? error.message
              : "Erreur lors de lenvoi du code";

          return { error: { message } };
        }
      },
      requestPasswordReset: async (email) => {
        try {
          const { message } = await requestPasswordResetApi(email);
          return { error: null, message };
        } catch (error) {
          const message = axios.isAxiosError(error)
            ? (error.response?.data?.message ?? "Erreur lors de l envoi du lien")
            : error instanceof Error
              ? error.message
              : "Erreur lors de l envoi du lien";

          return { error: { message } };
        }
      },
      resetPassword: async ({ email, token, newPassword }) => {
        try {
          const { message } = await resetPasswordApi({ email, token, newPassword });
          return { error: null, message };
        } catch (error) {
          const message = axios.isAxiosError(error)
            ? (error.response?.data?.message ?? "Erreur lors de la reinitialisation")
            : error instanceof Error
              ? error.message
              : "Erreur lors de la reinitialisation";

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

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    return {
      user: null,
      loading: true,
      isAdmin: false,
      signIn: async (_email?: string, _password?: string) => ({ error: null }),
      signUp: async (_payload?: any) => ({ error: null }),
      verifyEmail: async (_p?: any) => ({ error: null }),
      resendVerificationCode: async (_email?: string) => ({ error: null }),
      requestPasswordReset: async (_email?: string) => ({ error: null }),
      resetPassword: async (_payload?: any) => ({ error: null }),
      signOut: async () => undefined,
      refreshUser: async () => undefined,
    };
  }

  return context;
}
