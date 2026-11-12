import { STORES, idbDelete, idbGetAll, idbPut } from "./idb";
import type { OutboxItem, OutboxKind, TaskAction } from "./types";
import { toApiError } from "../services/errors";
import {
  EvidencePendingError,
  submitFieldReport,
  submitIncident,
  submitPollingReport,
  transitionTask,
  uploadEvidence,
  type EvidenceJob,
  type FieldReportDraft,
  type IncidentDraft,
  type PollingReportDraft,
  type ProgressHandler,
} from "../services/agentService";

/**
 * Durable outbox for work created while offline.
 *
 * Agents routinely lose coverage mid-shift. Submissions are written here with
 * their exact body, `client_submission_id` and idempotency key, then replayed
 * in creation order once the connection returns — so a retry is the same
 * request, never a duplicate report.
 */

export interface TaskTransitionJob {
  taskId: string;
  action: TaskAction;
  expectedRevision: number;
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

/** Items still waiting to send — rejected ones are counted separately. */
export async function queueSize(): Promise<number> {
  return (await listQueue()).filter((item) => !item.failed).length;
}

/**
 * Sends one submission. If the record is created but an attachment fails, the
 * rest of the evidence is queued on its own so the record is never refiled.
 */
export async function deliver(
  kind: OutboxKind,
  payload: unknown,
  onProgress?: ProgressHandler,
): Promise<"sent" | "evidence-queued"> {
  try {
    await dispatch(kind, payload, onProgress);
    return "sent";
  } catch (error) {
    if (!(error instanceof EvidencePendingError)) throw error;

    const job: EvidenceJob = {
      parent: error.parent,
      parentId: error.parentId,
      media: error.remaining,
    };
    await enqueue("evidence", job);
    return "evidence-queued";
  }
}

function dispatch(kind: OutboxKind, payload: unknown, onProgress?: ProgressHandler) {
  switch (kind) {
    case "field-report":
      return submitFieldReport(payload as FieldReportDraft, onProgress);
    case "polling-report":
      return submitPollingReport(payload as PollingReportDraft, onProgress);
    case "incident-report":
      return submitIncident(payload as IncidentDraft, onProgress);
    case "evidence":
      return uploadEvidence(payload as EvidenceJob, onProgress);
    case "task-transition": {
      const job = payload as TaskTransitionJob;
      return transitionTask(job.taskId, job.action, job.expectedRevision);
    }
    default:
      return Promise.reject(new Error(`Unknown outbox item: ${String(kind)}`));
  }
}

const KNOWN_KINDS: OutboxKind[] = [
  "field-report",
  "polling-report",
  "incident-report",
  "task-transition",
  "evidence",
];

export interface FlushResult {
  sent: number;
  failed: number;
  remaining: number;
}

let flushing = false;

/**
 * Replays queued items oldest-first. Stops at the first network failure so a
 * flaky connection doesn't burn every item's retry budget in one pass. A
 * request the server rejects outright is parked as failed for the agent to
 * correct or discard — it is never shown as delivered.
 */
export async function flushQueue(): Promise<FlushResult> {
  if (flushing) return { sent: 0, failed: 0, remaining: await queueSize() };
  flushing = true;

  let sent = 0;
  let failed = 0;

  try {
    for (const item of await listQueue()) {
      if (item.failed) continue;

      // Left over from the pre-API build; its payload can't be sent.
      if (!KNOWN_KINDS.includes(item.kind)) {
        await idbDelete(STORES.outbox, item.id);
        continue;
      }

      try {
        await deliver(item.kind, item.payload);
        await idbDelete(STORES.outbox, item.id);
        sent += 1;
      } catch (error) {
        failed += 1;
        const apiError =
          error instanceof EvidencePendingError ? error.uploadError : toApiError(error);
        const attempts = item.attempts + 1;

        await idbPut(STORES.outbox, {
          ...item,
          attempts,
          lastError: apiError.message,
          failed: !apiError.isRetryable || attempts >= MAX_ATTEMPTS,
        });

        if (apiError.isNetwork) break;
      }
    }
  } finally {
    flushing = false;
  }

  return { sent, failed, remaining: await queueSize() };
}

/** Puts a rejected item back in line, e.g. after the agent's access is fixed. */
export async function retryItem(item: OutboxItem): Promise<void> {
  await idbPut(STORES.outbox, { ...item, attempts: 0, failed: false });
}

export async function discardItem(id: string): Promise<void> {
  await idbDelete(STORES.outbox, id);
}
