import { STORAGE_KEYS } from "../lib/constants";
import type { Session } from "../lib/types";

/**
 * The persisted session: bearer token plus a snapshot of who the agent is and
 * which campaign they work. The snapshot lets an agent open the app with no
 * signal; it is refreshed from `/auth/context` whenever the API is reachable.
 */

let memory: Session | null = null;

function isExpired(session: Session): boolean {
  return session.expiresAt != null && Date.parse(session.expiresAt) <= Date.now();
}

export function readSession(): Session | null {
  if (memory) return isExpired(memory) ? null : memory;

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.session);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    // Sessions written by the pre-API build have no workspace; drop them.
    if (!parsed?.token || !parsed.workspace || isExpired(parsed)) return null;
    memory = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return readSession()?.token ?? null;
}

export function saveSession(session: Session) {
  memory = session;
  try {
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
  } catch {
    /* storage blocked — the memory copy still authenticates this tab */
  }
}

export function clearSession() {
  memory = null;
  try {
    localStorage.removeItem(STORAGE_KEYS.session);
  } catch {
    /* nothing to clear */
  }
}
