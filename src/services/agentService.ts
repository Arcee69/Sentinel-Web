import { API } from "./api";
import apiInstance from "./instance";
import { ApiError, toApiError } from "./errors";
import { getAllPages, getList, getMethod, patchMethod, postMethod } from "./requests";
import {
  CATEGORY_LABEL,
  COLLECTION_METHOD_CODE,
  INCIDENT_STATUS_LABEL,
  OPERATING_STATUS_LABEL,
  PRIORITY_LABEL,
  REVIEW_STATE_LABEL,
  TASK_STATUS_LABEL,
  humanize,
  subjectLabel,
} from "../lib/constants";
import { initialsOf } from "../lib/format";
import { forgetMedia, mediaBlob } from "../lib/media";
import { placeLabel, rememberPlace } from "../lib/places";
import type {
  Agent,
  ApiAuthContext,
  ApiFieldReport,
  ApiIncident,
  ApiLoginResult,
  ApiNotification,
  ApiPollingOccasion,
  ApiPollingPlace,
  ApiPollingReport,
  ApiTask,
  ElectionReport,
  EvidenceParent,
  Incident,
  IncidentSeverity,
  MediaItem,
  Notice,
  NotificationPreferences,
  ReportType,
  Session,
  Task,
  TaskAction,
  Workspace,
} from "../lib/types";

/**
 * The one place screens talk to the backend.
 *
 * Every response is `{ success, message, data, meta }`; the helpers in
 * `./requests` return the envelope and this file maps `data` into the shapes
 * in `lib/types`. All IDs come from `/auth/context` and earlier responses —
 * never from display names.
 */

/** Reports progress while media uploads, 0–100. */
export type ProgressHandler = (percent: number) => void;

const DEVICE_NAME = "Sentinel Connect PWA";

/* -------------------------------------------------------------------------- */
/*                               Auth + context                               */
/* -------------------------------------------------------------------------- */

function titleCase(code: string): string {
  return humanize(code).replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * Picks the campaign this app works under: one the agent `can_work`, with an
 * active assignment if they have one. `preferredCampaignId` keeps the same
 * campaign across refreshes.
 */
export function resolveWorkspace(
  context: ApiAuthContext,
  preferredCampaignId?: string,
): { agent: Agent; workspace: Workspace } | null {
  const candidates = context.organizations.flatMap((org) =>
    org.campaigns
      .filter((campaign) => campaign.access.can_work)
      .map((campaign) => ({
        org,
        campaign,
        assignment:
          org.assignments.find((a) => a.campaign_id === campaign.id && a.ends_at === null) ??
          null,
      })),
  );

  const score = (c: (typeof candidates)[number]) =>
    (c.campaign.id === preferredCampaignId ? 4 : 0) +
    (c.assignment ? 2 : 0) +
    (c.campaign.status === "active" ? 1 : 0);

  const chosen = [...candidates].sort((a, b) => score(b) - score(a))[0];
  if (!chosen) return null;

  const { org, campaign, assignment } = chosen;
  const { user } = context;

  const unitNames: Record<string, string> = {};
  if (org.home_unit) unitNames[org.home_unit.id] = org.home_unit.name;

  return {
    agent: {
      id: user.id,
      name: user.name,
      initials: initialsOf(user.name),
      email: user.email,
      phone: user.phone ?? org.agent_profile?.phone ?? null,
      role: assignment ? titleCase(assignment.duty) : titleCase(campaign.access.role),
      status: org.agent_profile?.status ?? "active",
      sector: org.home_unit?.name ?? org.organization.name,
      stats: {
        tasksTotal: org.stats.tasks_total,
        tasksCompleted: org.stats.tasks_completed,
        reports: org.stats.field_reports + org.stats.polling_reports + org.stats.incidents,
      },
      notificationPreferences: user.notification_preferences,
    },
    workspace: {
      organizationId: org.organization.id,
      organizationName: org.organization.name,
      membershipId: org.membership.id,
      campaignId: campaign.id,
      campaignName: campaign.name,
      assignmentId: assignment?.id ?? null,
      unitNames,
    },
  };
}

export async function fetchContext(token?: string): Promise<ApiAuthContext> {
  const res = await getMethod<ApiAuthContext>(
    API.auth.context,
    undefined,
    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  );
  return res.data;
}

export async function login(email: string, password: string): Promise<Session> {
  const { data } = await postMethod<ApiLoginResult>(API.auth.login, {
    email,
    password,
    device_name: DEVICE_NAME,
  });

  const resolved = resolveWorkspace(await fetchContext(data.token));

  if (!resolved) {
    // A manager or observer signed in to the field app: don't leave a live token behind.
    await logout(data.token);
    throw new ApiError({
      status: 403,
      message:
        "This account has no field assignment. Managers and admins use the Sentinel back office.",
    });
  }

  return { token: data.token, expiresAt: data.expires_at, ...resolved };
}

/** Pass the token explicitly when the local session is cleared at the same time. */
export async function logout(token?: string): Promise<void> {
  // A failed logout shouldn't trap the agent in a session they've left.
  await postMethod(
    API.auth.logout,
    undefined,
    token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  ).catch(() => undefined);
}

/** Always resolves with the same neutral acknowledgement, whether or not the account exists. */
export async function requestPasswordReset(email: string): Promise<void> {
  await postMethod(API.auth.forgotPassword, { email });
}

export async function resetPassword(payload: {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}): Promise<void> {
  await postMethod(API.auth.resetPassword, payload);
}

export async function updateNotificationPreferences(
  patch: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  const res = await patchMethod<NotificationPreferences>(API.auth.notificationPreferences, patch);
  return res.data;
}

/** Field presence check-in for the active assignment. */
export async function heartbeat(assignmentId: string): Promise<void> {
  await postMethod(API.assignment.heartbeat(assignmentId), {});
}

/* -------------------------------------------------------------------------- */
/*                                    Tasks                                   */
/* -------------------------------------------------------------------------- */

function mapTask(task: ApiTask, workspace: Workspace): Task {
  const fallbackArea = Object.values(workspace.unitNames)[0] ?? "Assigned area";

  return {
    id: task.id,
    title: task.title,
    category: task.category ? (CATEGORY_LABEL[task.category] ?? null) : null,
    subject: subjectLabel(task.subject),
    subjectCode: task.subject,
    priority: PRIORITY_LABEL[task.priority] ?? "Medium",
    status: TASK_STATUS_LABEL[task.status] ?? "Pending",
    location:
      (task.geographic_unit_id &&
        (workspace.unitNames[task.geographic_unit_id] ?? placeLabel(task.geographic_unit_id))) ||
      fallbackArea,
    dueAt: task.due_at,
    completedAt: task.completed_at,
    instructions: task.instructions,
    target: task.target_count,
    assignmentId: task.assignment_id,
    revision: task.revision,
  };
}

export async function fetchTasks(workspace: Workspace): Promise<Task[]> {
  const tasks = await getAllPages<ApiTask>(API.campaign.tasks(workspace.campaignId));
  return tasks.map((task) => mapTask(task, workspace));
}

export async function fetchTask(id: string, workspace: Workspace): Promise<Task> {
  const res = await getMethod<ApiTask>(API.task.show(id));
  return mapTask(res.data, workspace);
}

export async function transitionTask(
  taskId: string,
  action: TaskAction,
  expectedRevision: number,
): Promise<ApiTask> {
  const url = action === "start" ? API.task.start(taskId) : API.task.complete(taskId);
  const res = await postMethod<ApiTask>(url, { expected_revision: expectedRevision });
  return res.data;
}

/**
 * Completes a task from whatever state it is in. A pending task is started
 * first, carrying the revision forward, since the API moves one step at a time.
 */
export async function completeTask(task: Pick<Task, "id" | "status" | "revision">): Promise<void> {
  let revision = task.revision;
  if (task.status === "Pending") {
    revision = (await transitionTask(task.id, "start", revision)).revision;
  }
  await transitionTask(task.id, "complete", revision);
}

/**
 * Closes out a task after the agent filed against it, unless it's already
 * done — the server may complete it from the submission itself.
 */
export async function completeTaskIfOpen(taskId: string, workspace: Workspace): Promise<void> {
  const task = await fetchTask(taskId, workspace);
  if (task.status === "Pending" || task.status === "In Progress") await completeTask(task);
}

/* -------------------------------------------------------------------------- */
/*                                  Evidence                                  */
/* -------------------------------------------------------------------------- */

/**
 * The parent record exists but some attachments didn't reach the server.
 * Callers queue `remaining` as an evidence job rather than refiling the parent.
 */
export class EvidencePendingError extends Error {
  readonly parent: EvidenceParent;
  readonly parentId: string;
  readonly remaining: MediaItem[];
  readonly uploadError: ApiError;

  constructor(parent: EvidenceParent, parentId: string, remaining: MediaItem[], cause: unknown) {
    super("Report filed, but some attachments haven't uploaded yet.");
    this.name = "EvidencePendingError";
    this.parent = parent;
    this.parentId = parentId;
    this.remaining = remaining;
    this.uploadError = toApiError(cause);
  }
}

export interface EvidenceJob {
  parent: EvidenceParent;
  parentId: string;
  media: MediaItem[];
}

/**
 * Uploads each file as its own `/media/uploads` request, in order. Uploaded
 * files may still be pending scanning/review server-side.
 */
export async function uploadEvidence(
  job: EvidenceJob,
  onProgress?: ProgressHandler,
): Promise<void> {
  const total = job.media.reduce((sum, item) => sum + item.size, 0) || 1;
  let sent = 0;

  for (const [index, item] of job.media.entries()) {
    try {
      const form = new FormData();
      form.append("parent_type", job.parent);
      form.append("parent_id", job.parentId);
      form.append("file", await mediaBlob(item), item.name);

      await apiInstance.post(API.media.uploads, form, {
        // Video on a weak signal takes a while; don't cut it off at the default.
        timeout: 10 * 60_000,
        onUploadProgress: (event) => {
          onProgress?.(Math.min(100, Math.round(((sent + event.loaded) / total) * 100)));
        },
      });

      sent += item.size;
      void forgetMedia(item.id);
    } catch (error) {
      throw new EvidencePendingError(job.parent, job.parentId, job.media.slice(index), error);
    }
  }

  onProgress?.(100);
}

/* -------------------------------------------------------------------------- */
/*                                Field reports                               */
/* -------------------------------------------------------------------------- */

/** Everything needed to (re)send a task report, captured when the agent filed it. */
export interface FieldReportDraft {
  clientSubmissionId: string;
  observedAt: string;
  campaignId: string;
  assignmentId: string;
  taskId: string;
  method: ReportType;
  narrative: string;
  peopleReached?: number;
  media: MediaItem[];
}

export async function submitFieldReport(
  draft: FieldReportDraft,
  onProgress?: ProgressHandler,
): Promise<ApiFieldReport> {
  const { data: report } = await postMethod<ApiFieldReport>(
    API.campaign.fieldReports(draft.campaignId),
    {
      assignment_id: draft.assignmentId,
      task_id: draft.taskId,
      activity_type: "task_note",
      collection_method: COLLECTION_METHOD_CODE[draft.method],
      people_reached: draft.peopleReached,
      narrative: draft.narrative,
      observed_at: draft.observedAt,
      client_submission_id: draft.clientSubmissionId,
    },
  );

  await uploadEvidence({ parent: "field_report", parentId: report.id, media: draft.media }, onProgress);
  return report;
}

/* -------------------------------------------------------------------------- */
/*                              Election reports                              */
/* -------------------------------------------------------------------------- */

/** Every published polling place in the campaign matching an official code. */
export async function lookupPollingPlaces(
  campaignId: string,
  code: string,
): Promise<ApiPollingPlace[]> {
  const res = await getMethod<ApiPollingPlace[]>(API.campaign.pollingPlaces(campaignId), { code });
  for (const place of res.data) {
    rememberPlace(place.polling_unit_id, { code: place.official_code, name: place.name });
  }
  return res.data;
}

export function fetchPollingOccasions(): Promise<ApiPollingOccasion[]> {
  return getAllPages<ApiPollingOccasion>(API.pollingOccasions);
}

export interface PollingReportDraft {
  clientSubmissionId: string;
  /** Sent as `Idempotency-Key`; reused with the identical body on every retry. */
  idempotencyKey: string;
  observedAt: string;
  campaignId: string;
  assignmentId: string;
  taskId?: string;
  /** The code the agent typed; resolved at send time when `place` is unset (offline). */
  unitCode: string;
  place: ApiPollingPlace | null;
  subject: string;
  operatingStatus?: string;
  accredited?: number;
  votesCast?: number;
  notes: string;
  media: MediaItem[];
}

async function resolvePlace(draft: PollingReportDraft): Promise<ApiPollingPlace> {
  if (draft.place) return draft.place;

  const matches = await lookupPollingPlaces(draft.campaignId, draft.unitCode);
  if (matches.length === 1) return matches[0];

  throw new ApiError({
    status: 422,
    message:
      matches.length === 0
        ? `No published polling unit matches ${draft.unitCode}.`
        : `${draft.unitCode} matches more than one polling occasion. File it again and pick one.`,
  });
}

export async function submitPollingReport(
  draft: PollingReportDraft,
  onProgress?: ProgressHandler,
): Promise<ApiPollingReport> {
  const place = await resolvePlace(draft);

  const { data: report } = await postMethod<ApiPollingReport>(
    API.pollingPlace.reports(place.id),
    {
      campaign_id: draft.campaignId,
      assignment_id: draft.assignmentId,
      client_submission_id: draft.clientSubmissionId,
      observed_at: draft.observedAt,
      task_id: draft.taskId,
      subject: draft.subject,
      operating_status: draft.operatingStatus,
      reported_votes_cast: draft.votesCast,
      participation:
        draft.accredited === undefined
          ? undefined
          : { accredited_persons: draft.accredited, collection_method: "field_observation" },
      notes: draft.notes,
    },
    { headers: { "Idempotency-Key": draft.idempotencyKey } },
  );

  rememberPlace(report.polling_unit_id, { code: place.official_code, name: place.name });
  await uploadEvidence({ parent: "polling_report", parentId: report.id, media: draft.media }, onProgress);
  return report;
}

function mapPollingReport(report: ApiPollingReport): ElectionReport {
  return {
    id: report.id,
    subject: subjectLabel(report.subject),
    unitLabel: placeLabel(report.polling_unit_id),
    unitStatus: report.operating_status
      ? (OPERATING_STATUS_LABEL[report.operating_status] ?? null)
      : null,
    accredited: report.participation?.accredited_persons ?? null,
    votesCast: report.reported_votes_cast ?? report.participation?.participating_persons ?? null,
    notes: report.notes,
    reviewState: REVIEW_STATE_LABEL[report.review_state] ?? "Pending review",
    taskId: report.task_id,
    observedAt: report.observed_at,
  };
}

export async function fetchElectionReports(campaignId: string): Promise<ElectionReport[]> {
  const reports = await getAllPages<ApiPollingReport>(API.campaign.pollingReports(campaignId));
  return reports.map(mapPollingReport);
}

/* -------------------------------------------------------------------------- */
/*                                  Incidents                                 */
/* -------------------------------------------------------------------------- */

export interface IncidentDraft {
  clientSubmissionId: string;
  occurredAt: string;
  campaignId: string;
  /** API `incident_type` code. */
  incidentType: string;
  severity: IncidentSeverity;
  unitCode: string;
  description: string;
  coords?: { lat: number; lng: number };
  media: MediaItem[];
}

export async function submitIncident(
  draft: IncidentDraft,
  onProgress?: ProgressHandler,
): Promise<ApiIncident> {
  const { data: incident } = await postMethod<ApiIncident>(
    API.campaign.incidents(draft.campaignId),
    {
      polling_unit_code: draft.unitCode,
      incident_type: draft.incidentType,
      severity: draft.severity.toLowerCase(),
      description: draft.description,
      occurred_at: draft.occurredAt,
      client_submission_id: draft.clientSubmissionId,
      // Latitude and longitude travel together or not at all.
      latitude: draft.coords?.lat,
      longitude: draft.coords?.lng,
    },
  );

  rememberPlace(incident.geographic_unit_id, { code: draft.unitCode });
  await uploadEvidence({ parent: "incident", parentId: incident.id, media: draft.media }, onProgress);
  return incident;
}

function mapIncident(incident: ApiIncident): Incident {
  const severity = humanize(incident.severity) as IncidentSeverity;

  return {
    id: incident.id,
    subject:
      subjectLabel(incident.incident_type) ??
      (incident.category ? `${humanize(incident.category)} incident` : "Incident"),
    category: incident.category ? humanize(incident.category) : null,
    unitLabel: placeLabel(incident.geographic_unit_id),
    severity,
    status: INCIDENT_STATUS_LABEL[incident.status] ?? "Open",
    description: incident.description,
    coords:
      incident.latitude != null && incident.longitude != null
        ? { lat: incident.latitude, lng: incident.longitude }
        : null,
    occurredAt: incident.occurred_at,
  };
}

export async function fetchIncidents(campaignId: string): Promise<Incident[]> {
  const incidents = await getAllPages<ApiIncident>(API.campaign.incidents(campaignId));
  return incidents.map(mapIncident);
}

/* -------------------------------------------------------------------------- */
/*                                Notifications                               */
/* -------------------------------------------------------------------------- */

export async function fetchNotices(campaignId: string): Promise<Notice[]> {
  const res = await getList<ApiNotification>(API.campaign.notifications(campaignId));
  return res.data.map((notice) => ({
    id: notice.id,
    title: notice.title,
    body: notice.body,
    read: notice.read_at !== null,
    createdAt: notice.created_at,
  }));
}

/** Safe to repeat. */
export async function markNoticeRead(id: string): Promise<void> {
  await postMethod(API.notification.read(id));
}
