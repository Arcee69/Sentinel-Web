/**
 * Domain model for SMHP Sentinel Connect (agent PWA).
 *
 * These shapes intentionally mirror the back-office (sentinel-backoffice) so
 * that everything an agent submits lands in the admin console without a
 * translation layer. Do not rename fields without changing the admin too.
 */

/* -------------------------------------------------------------------------- */
/*                                    Agent                                   */
/* -------------------------------------------------------------------------- */

export type AgentRole = "LGA Supervisor" | "Ward Coordinator" | "Field Agent";

export type AgentStatus = "active" | "idle" | "offline";

export interface Agent {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  role: AgentRole;
  state: string;
  lga: string;
  ward?: string;
  /** Total reports submitted to date — shown on the profile. */
  reports: number;
  /** Task completion rate as a percentage, mirrors admin `taskPct`. */
  taskPct: number;
  status: AgentStatus;
}

/* -------------------------------------------------------------------------- */
/*                                    Tasks                                   */
/* -------------------------------------------------------------------------- */

export type TaskCategory = "Opinion Poll" | "Election Report" | "Incident Report";

export type TaskPriority = "High" | "Medium" | "Low";

export type TaskStatus = "Pending" | "In Progress" | "Completed";

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  /** One of the fixed subjects belonging to `category`. */
  subject: string;
  priority: TaskPriority;
  /** Display name of the assigned agent, as the admin stores it. */
  assignee: string;
  assigneeId: string;
  state: string;
  lga: string;
  ward?: string;
  pollingUnit?: string;
  /** Human-readable due label the admin authored, e.g. "Today 6pm". */
  due: string;
  /** Machine-readable deadline, used for sorting and overdue detection. */
  dueAt: string;
  status: TaskStatus;
  campaignId?: string;
  /** Free-text briefing from the admin. */
  instructions?: string;
  /** Optional numeric goal, e.g. 200 voters polled. */
  target?: number;
  createdAt: string;
  /** Set when the agent taps "Start Task". */
  startedAt?: string;
  completedAt?: string;
}

/* -------------------------------------------------------------------------- */
/*                                   Reports                                  */
/* -------------------------------------------------------------------------- */

export type ReportType =
  | "Rally"
  | "Door-to-Door"
  | "Town Hall"
  | "Media"
  | "Distribution";

export interface TaskReport {
  id: string;
  taskId: string;
  agentId: string;
  /** Denormalised agent display name, matching the admin field-report feed. */
  agent: string;
  category: TaskCategory;
  subject: string;
  type: ReportType;
  state: string;
  lga: string;
  /** Composed as "State/LGA" for the admin feed. */
  location: string;
  /** The narrative body of the report. */
  body: string;
  /** Headcount / respondents / turnout, when the subject calls for a number. */
  respondents?: number;
  media: MediaItem[];
  submittedAt: string;
  sync: SyncStatus;
}

/* -------------------------------------------------------------------------- */
/*                              Election reports                              */
/* -------------------------------------------------------------------------- */

/** State of a polling unit at the moment the agent filed. */
export type PollingUnitStatus =
  | "Open"
  | "Not opened"
  | "Closed"
  | "Suspended";

/**
 * A ward/polling-unit return filed from the Election tab.
 *
 * Distinct from `TaskReport`: an election report can be filed on its own on
 * election day, without waiting for the admin to assign a task. When it does
 * answer an assigned task, `taskId` links the two and closes that task out.
 */
export interface ElectionReport {
  id: string;
  agentId: string;
  /** Denormalised agent display name, matching the admin field-report feed. */
  agent: string;
  /** Always "Election Report" — kept so the admin feed can bucket uniformly. */
  category: TaskCategory;
  /** One of the fixed Election Report subjects. */
  subject: string;
  /** Polling unit code, e.g. "AN/ON/04/012". */
  unit: string;
  state: string;
  lga: string;
  ward: string;
  /** Composed as "State/LGA" for the admin feed. */
  location: string;
  unitStatus: PollingUnitStatus;
  /** Voters accredited at the unit, when the subject calls for a number. */
  accredited?: number;
  /** Ballots cast at the unit — never more than `accredited`. */
  votesCast?: number;
  /** The narrative body of the return. */
  body: string;
  media: MediaItem[];
  /** Set when the report answers an assigned Election Report task. */
  taskId?: string;
  submittedAt: string;
  sync: SyncStatus;
}

/* -------------------------------------------------------------------------- */
/*                                  Incidents                                 */
/* -------------------------------------------------------------------------- */

export type IncidentType = "Violence" | "Delay" | "Malpractice" | "Logistics";

export type IncidentSeverity = "Critical" | "High" | "Medium" | "Low";

export type IncidentStatus = "Open" | "Escalated" | "Resolved";

export interface Incident {
  id: string;
  type: IncidentType;
  /** Specific allegation, drawn from the Incident Report subject list. */
  subject: string;
  /** Polling unit code, e.g. "RV/PH/02/015". */
  unit: string;
  state: string;
  lga: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description: string;
  media: MediaItem[];
  agentId: string;
  agent: string;
  /** Optional GPS fix captured at the time of reporting. */
  coords?: { lat: number; lng: number };
  reportedAt: string;
  sync: SyncStatus;
}

/* -------------------------------------------------------------------------- */
/*                                    Media                                   */
/* -------------------------------------------------------------------------- */

export type MediaKind = "image" | "video";

export interface MediaItem {
  id: string;
  kind: MediaKind;
  name: string;
  /** Bytes. */
  size: number;
  mimeType: string;
  /** Object URL for preview in this session. */
  url: string;
  /** Seconds — videos only. */
  duration?: number;
}

/* -------------------------------------------------------------------------- */
/*                                Sync + outbox                               */
/* -------------------------------------------------------------------------- */

/** Where a locally-created record stands relative to the server. */
export type SyncStatus = "synced" | "queued" | "syncing" | "failed";

export type OutboxKind =
  | "report"
  | "election-report"
  | "incident"
  | "task-status";

export interface OutboxItem {
  id: string;
  kind: OutboxKind;
  /** Payload shape depends on `kind`; the flusher narrows it. */
  payload: unknown;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

/* -------------------------------------------------------------------------- */
/*                                    Auth                                    */
/* -------------------------------------------------------------------------- */

export interface Session {
  token: string;
  agent: Agent;
  issuedAt: string;
}

export interface LoginPayload {
  /** The admin login accepts either — we mirror that. */
  identifier: string;
  password: string;
}
