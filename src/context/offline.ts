import { createContext, useContext } from "react";
import type { OutboxItem, OutboxKind } from "../lib/types";
import type { ProgressHandler } from "../services/agentService";

/**
 * How a submission ended: delivered, parked on the device, or delivered with
 * some attachments still waiting to upload.
 */
export type SubmitOutcome = "sent" | "queued" | "evidence-queued";

export interface OfflineValue {
  isOnline: boolean;
  /** Number of submissions waiting to reach the server. */
  pending: number;
  /** Submissions the server rejected; they wait for the agent to retry or discard. */
  rejected: OutboxItem[];
  /**
   * Sends now when online, or queues for later. A dropped connection mid-send
   * also queues. Server rejections are thrown so the form can show them.
   */
  submit: (kind: OutboxKind, payload: unknown, onProgress?: ProgressHandler) => Promise<SubmitOutcome>;
  /** Attempts delivery now; safe to call when already online. */
  sync: () => Promise<void>;
  retry: (item: OutboxItem) => Promise<void>;
  discard: (item: OutboxItem) => Promise<void>;
}

export const OfflineContext = createContext<OfflineValue | null>(null);

export function useOffline(): OfflineValue {
  const context = useContext(OfflineContext);
  if (!context) throw new Error("useOffline must be used inside <OfflineProvider>");
  return context;
}
