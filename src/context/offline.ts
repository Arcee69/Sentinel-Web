import { createContext, useContext } from "react";
import type { OutboxKind } from "../lib/types";

export interface OfflineValue {
  isOnline: boolean;
  /** Number of submissions waiting to reach the server. */
  pending: number;
  /** Queues work for later delivery and bumps the badge. */
  queue: (kind: OutboxKind, payload: unknown) => Promise<void>;
  /** Attempts delivery now; safe to call when already online. */
  sync: () => Promise<void>;
  refreshPending: () => Promise<void>;
}

export const OfflineContext = createContext<OfflineValue | null>(null);

export function useOffline(): OfflineValue {
  const context = useContext(OfflineContext);
  if (!context) throw new Error("useOffline must be used inside <OfflineProvider>");
  return context;
}
