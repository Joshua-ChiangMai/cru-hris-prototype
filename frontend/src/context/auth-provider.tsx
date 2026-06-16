"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { fetchSession, login as apiLogin, logout as apiLogout } from "@/lib/auth/api";
import { getPrimaryRole } from "@/lib/auth/roles";
import type { Session } from "@/lib/auth/types";
import type { Role } from "@/lib/rbac";
import { getAccessTokenFromCookie } from "@/lib/auth/session";

type AuthContextValue = {
  session: Session | null;
  role: Role | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const token = getAccessTokenFromCookie();
    if (!token) {
      setSession(null);
      return;
    }

    const data = await fetchSession();
    setSession(data);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (!getAccessTokenFromCookie()) {
          setSession(null);
          return;
        }
        const data = await fetchSession();
        if (!cancelled) {
          setSession(data);
        }
      } catch {
        if (!cancelled) {
          setSession(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await apiLogin(email, password);
    const data = await fetchSession();
    setSession(data);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setSession(null);
    router.replace("/login");
    router.refresh();
  }, [router]);

  const role = session ? getPrimaryRole(session) : null;

  const value = useMemo(
    () => ({
      session,
      role,
      isLoading,
      login,
      logout,
      refreshSession,
    }),
    [session, role, isLoading, login, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
