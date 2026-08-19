import { STORES, idbDelete, idbGetAll, idbPut } from "./idb";
import type { OutboxItem, OutboxKind, TaskStatus } from "./types";
import {
  submitElectionReport,
  submitIncident,
  submitReport,
  updateTaskStatus,
  type ElectionReportDraft,
  type IncidentDraft,
  type ReportDraft,
} from "../services/agentService";

/**
 * Durable outbox for work created while offline.
 *
 * Agents routinely lose coverage mid-shift. Submissions are written here first
 * and replayed in creation order once the connection returns, so nothing a
 * field officer captured is ever lost to a dropped signal.
 */

interface TaskStatusJob {
  taskId: string;
  status: TaskStatus;
}

const MAX_ATTEMPTS = 5;

export async function enqueue(kind: OutboxKind, payload: unknown): Promise<OutboxItem> {
  const item: OutboxItem = {
    id: crypto.randomUUID(),
    kind,
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };

  await idbPut(STORES.outbox, item);
  return item;
}

export async function listQueue(): Promise<OutboxItem[]> {
  const items = await idbGetAll<OutboxItem>(STORES.outbox).catch(() => []);
  return items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function queueSize(): Promise<number> {
  return (await listQueue()).length;
}

export interface FlushResult {
  sent: number;
  failed: number;
  remaining: number;
}

let flushing = false;

/**
 * Replays queued items oldest-first. Stops at the first network failure so a
 * flaky connection doesn't burn every item's retry budget in one pass.
 */
export async function flushQueue(): Promise<FlushResult> {
  if (flushing) return { sent: 0, failed: 0, remaining: await queueSize() };
  flushing = true;

  let sent = 0;
  let failed = 0;

  try {
    for (const item of await listQueue()) {
      try {
        await dispatch(item);
        await idbDelete(STORES.outbox, item.id);
        sent += 1;
      } catch (error) {
        failed += 1;
        const attempts = item.attempts + 1;

        if (attempts >= MAX_ATTEMPTS) {
          // Give up rather than retry forever; surfaced to the agent as failed.
          await idbDelete(STORES.outbox, item.id);
        } else {
          await idbPut(STORES.outbox, {
            ...item,
            attempts,
            lastError: error instanceof Error ? error.message : "Unknown error",
          });
        }

        if (!navigator.onLine) break;
      }
    }
  } finally {
    flushing = false;
  }

  return { sent, failed, remaining: await queueSize() };
}

function dispatch(item: OutboxItem): Promise<unknown> {
  switch (item.kind) {
    case "report":
      return submitReport(item.payload as ReportDraft);
    case "election-report":
      return submitElectionReport(item.payload as ElectionReportDraft);
    case "incident":
      return submitIncident(item.payload as IncidentDraft);
    case "task-status": {
      const job = item.payload as TaskStatusJob;
      return updateTaskStatus(job.taskId, job.status);
    }
    default:
      return Promise.reject(new Error(`Unknown outbox item: ${item.kind}`));
  }
}

export async function clearQueue(): Promise<void> {
  for (const item of await listQueue()) {
    await idbDelete(STORES.outbox, item.id);
  }
}
