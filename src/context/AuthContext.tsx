import { useCallback, useMemo, useState, type ReactNode } from "react";
import { AuthContext, type AuthValue } from "./auth";
import { STORAGE_KEYS } from "../lib/constants";
import * as service from "../services/agentService";
import type { Agent, Session } from "../lib/types";

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.session);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readSession);

  const persist = useCallback((next: Session | null) => {
    if (next) {
      localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(next));
    } else {
      localStorage.removeItem(STORAGE_KEYS.session);
    }
    setSession(next);
  }, []);

  const signIn = useCallback(
    async (identifier: string, password: string) => {
      persist(await service.login(identifier, password));
    },
    [persist],
  );

  const signOut = useCallback(async () => {
    await service.logout();
    persist(null);
  }, [persist]);

  const updateAgent = useCallback((patch: Partial<Agent>) => {
    setSession((current) => {
      if (!current) return current;
      const next = { ...current, agent: { ...current.agent, ...patch } };
      localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      agent: session?.agent ?? null,
      isAuthenticated: session !== null,
      signIn,
      signOut,
      updateAgent,
    }),
    [session, signIn, signOut, updateAgent],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
