import { createContext, useContext } from "react";
import type { Agent, Session, Workspace } from "../lib/types";

export interface AuthValue {
  session: Session | null;
  agent: Agent | null;
  workspace: Workspace | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
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

/** The campaign and assignment every field request is scoped to. */
export function useWorkspace(): Workspace {
  const { workspace } = useAuth();
  if (!workspace) throw new Error("useWorkspace used outside an authenticated route");
  return workspace;
}
