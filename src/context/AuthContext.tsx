import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthContext, type AuthValue } from "./auth";
import * as service from "../services/agentService";
import { clearSession, readSession, saveSession } from "../services/session";
import type { Agent, Session } from "../lib/types";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readSession);
  const queryClient = useQueryClient();

  const persist = useCallback((next: Session | null) => {
    if (next) saveSession(next);
    else clearSession();
    setSession(next);
  }, []);

  /**
   * Context is re-read whenever the API is reachable, so a changed assignment,
   * revoked access or new stats show up without signing out. The stored
   * snapshot keeps the app usable offline in the meantime.
   */
  useQuery({
    queryKey: ["auth-context", session?.token],
    queryFn: async () => {
      const context = await service.fetchContext();

      setSession((current) => {
        if (!current) return current;
        const resolved = service.resolveWorkspace(context, current.workspace.campaignId);

        // Field access was withdrawn since sign-in.
        if (!resolved) {
          clearSession();
          return null;
        }

        const next = { ...current, ...resolved };
        saveSession(next);
        return next;
      });

      return context;
    },
    enabled: session !== null,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
  });

  const signIn = useCallback(
    async (email: string, password: string) => {
      persist(await service.login(email, password));
    },
    [persist],
  );

  const signOut = useCallback(async () => {
    await service.logout();
    persist(null);
    // Another agent may sign in on this device next.
    queryClient.clear();
  }, [persist, queryClient]);

  const updateAgent = useCallback((patch: Partial<Agent>) => {
    setSession((current) => {
      if (!current) return current;
      const next = { ...current, agent: { ...current.agent, ...patch } };
      saveSession(next);
      return next;
    });
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      session,
      agent: session?.agent ?? null,
      workspace: session?.workspace ?? null,
      isAuthenticated: session !== null,
      signIn,
      signOut,
      updateAgent,
    }),
    [session, signIn, signOut, updateAgent],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
