import * as API from "./api";
import apiInstance from "./instance";
import { getList, getMethod, patchMethod, postMethod } from "./requests";
import { toFormData } from "../lib/media";
import type {
  ElectionReport,
  Incident,
  IncidentSeverity,
  MediaItem,
  PollingUnitStatus,
  ReportType,
  Session,
  Task,
  TaskReport,
  TaskStatus,
} from "../lib/types";

/**
 * The one place screens talk to the backend.
 *
 * There is no mock branch here by design — the mock lives behind an axios
 * adapter (see `./mock/mockAdapter`), so this file already contains the
 * production code path. When the API goes live, only `VITE_USE_MOCK_API`
 * changes.
 *
 * Every endpoint answers with `{ success, data }`; the helpers in
 * `./requests` unwrap it.
 */

/** Reports progress while media uploads, 0–100. */
export type ProgressHandler = (percent: number) => void;

/**
 * Descriptive metadata only — the local preview URL is meaningless to the
 * server, which assigns its own once the binary is stored.
 */
function mediaMetaOf(media: MediaItem[]) {
  return media.map((item) => ({
    id: item.id,
    kind: item.kind,
    name: item.name,
    size: item.size,
    mimeType: item.mimeType,
    duration: item.duration,
  }));
}

function uploadConfig(onProgress?: ProgressHandler) {
  if (!onProgress) return undefined;

  return {
    onUploadProgress: (event: { loaded: number; total?: number }) => {
      if (!event.total) return;
      onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    },
  };
}

/* -------------------------------------------------------------------------- */
/*                                    Auth                                    */
/* -------------------------------------------------------------------------- */

export async function login(identifier: string, password: string): Promise<Session> {
  const res = await postMethod(API.LOGIN, { identifier, password });
  return res.data.data as Session;
}

export async function logout(): Promise<void> {
  // A failed logout shouldn't trap the agent in a session they've left.
  await postMethod(API.LOGOUT).catch(() => undefined);
}

/** Step 1 — issue a reset code to the agent's registered contact. */
export async function requestPasswordReset(identifier: string): Promise<{ hint: string }> {
  const res = await postMethod(API.FORGOT_PASSWORD, { identifier });
  return res.data.data as { hint: string };
}

/** Step 2 — confirm the 6-digit code. */
export async function verifyResetCode(identifier: string, code: string): Promise<void> {
  await postMethod(API.VERIFY_RESET_CODE, { identifier, code });
}

/** Step 3 — set the new password and burn the code. */
export async function resetPassword(
  identifier: string,
  code: string,
  password: string,
): Promise<void> {
  await postMethod(API.RESET_PASSWORD, { identifier, code, password });
}

/* -------------------------------------------------------------------------- */
/*                                    Tasks                                   */
/* -------------------------------------------------------------------------- */

export function fetchTasks(): Promise<Task[]> {
  return getList<Task[]>(API.TASKS);
}

export async function fetchTask(id: string): Promise<Task> {
  const envelope = await getMethod<{ data: Task }>(API.TASKS, id);
  return envelope.data;
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
  const res = await patchMethod(API.TASK_STATUS(id), { status });
  return res.data.data as Task;
}

/* -------------------------------------------------------------------------- */
/*                                   Reports                                  */
/* -------------------------------------------------------------------------- */

export interface ReportDraft {
  taskId: string;
  type: ReportType;
  body: string;
  respondents?: number;
  media: MediaItem[];
}

export async function submitReport(
  draft: ReportDraft,
  onProgress?: ProgressHandler,
): Promise<TaskReport> {
  const payload = {
    taskId: draft.taskId,
    type: draft.type,
    body: draft.body,
    respondents: draft.respondents,
    // Metadata travels alongside the binaries so the server can keep names,
    // sizes and durations without re-probing every upload.
    mediaMeta: mediaMetaOf(draft.media),
  };

  const form = await toFormData(payload, draft.media);
  const res = await apiInstance.post(API.REPORTS, form, uploadConfig(onProgress));
  return res.data.data as TaskReport;
}

export function fetchReports(): Promise<TaskReport[]> {
  return getList<TaskReport[]>(API.REPORTS);
}

/* -------------------------------------------------------------------------- */
/*                              Election reports                              */
/* -------------------------------------------------------------------------- */

export interface ElectionReportDraft {
  subject: string;
  unit: string;
  ward: string;
  unitStatus: PollingUnitStatus;
  accredited?: number;
  votesCast?: number;
  body: string;
  media: MediaItem[];
  /** Set when the return answers an assigned Election Report task. */
  taskId?: string;
}

export async function submitElectionReport(
  draft: ElectionReportDraft,
  onProgress?: ProgressHandler,
): Promise<ElectionReport> {
  const payload = {
    subject: draft.subject,
    unit: draft.unit,
    ward: draft.ward,
    unitStatus: draft.unitStatus,
    accredited: draft.accredited,
    votesCast: draft.votesCast,
    body: draft.body,
    taskId: draft.taskId,
    mediaMeta: mediaMetaOf(draft.media),
  };

  const form = await toFormData(payload, draft.media);
  const res = await apiInstance.post(
    API.ELECTION_REPORTS,
    form,
    uploadConfig(onProgress),
  );
  return res.data.data as ElectionReport;
}

export function fetchElectionReports(): Promise<ElectionReport[]> {
  return getList<ElectionReport[]>(API.ELECTION_REPORTS);
}

/* -------------------------------------------------------------------------- */
/*                                  Incidents                                 */
/* -------------------------------------------------------------------------- */

export interface IncidentDraft {
  subject: string;
  unit: string;
  severity: IncidentSeverity;
  description: string;
  media: MediaItem[];
  coords?: { lat: number; lng: number };
}

export async function submitIncident(
  draft: IncidentDraft,
  onProgress?: ProgressHandler,
): Promise<Incident> {
  const payload = {
    subject: draft.subject,
    unit: draft.unit,
    severity: draft.severity,
    description: draft.description,
    coords: draft.coords,
    mediaMeta: mediaMetaOf(draft.media),
  };

  const form = await toFormData(payload, draft.media);
  const res = await apiInstance.post(API.INCIDENTS, form, uploadConfig(onProgress));
  return res.data.data as Incident;
}

export function fetchIncidents(): Promise<Incident[]> {
  return getList<Incident[]>(API.INCIDENTS);
}
