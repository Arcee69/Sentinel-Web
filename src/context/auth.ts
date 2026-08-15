import { createContext, useContext } from "react";
import type { Agent, Session } from "../lib/types";

export interface AuthValue {
  session: Session | null;
  agent: Agent | null;
  isAuthenticated: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateAgent: (patch: Partial<Agent>) => void;
}

export const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}

/**
 * Convenience hook for screens behind <ProtectedRoute>, where the agent is
 * guaranteed present.
 */
export function useAgent(): Agent {
  const { agent } = useAuth();
  if (!agent) throw new Error("useAgent used outside an authenticated route");
  return agent;
}
