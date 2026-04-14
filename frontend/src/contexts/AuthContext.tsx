import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type AuthUser = {
  email?: string | null;
  fullName?: string | null;
};

type AuthResult = {
  error: { message: string } | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, fullName: string) => Promise<AuthResult>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState<AuthUser[]>([]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAdmin,
      signIn: async (email) => {
        const existingUser = registeredUsers.find((entry) => entry.email === email);

        if (!existingUser) {
          return { error: { message: "Invalid login credentials" } };
        }

        setUser(existingUser);
        setIsAdmin(false);
        return { error: null };
      },
      signUp: async (email, _password, fullName) => {
        const alreadyRegistered = registeredUsers.some((entry) => entry.email === email);

        if (alreadyRegistered) {
          return { error: { message: "already registered" } };
        }

        const nextUser = { email, fullName };
        setRegisteredUsers((current) => [...current, nextUser]);
        setUser(nextUser);
        setIsAdmin(false);
        return { error: null };
      },
      signOut: () => {
        setUser(null);
        setIsAdmin(false);
      },
    }),
    [user, isAdmin, registeredUsers],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    return {
      user: null,
      isAdmin: false,
      signIn: async () => ({ error: null }),
      signUp: async () => ({ error: null }),
      signOut: () => undefined,
    };
  }

  return context;
}
