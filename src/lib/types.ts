/**
 * Domain model for SMHP Sentinel Connect (agent PWA).
 *
 * Two layers live here. The `Api*` shapes are what the Sentinel API returns,
 * field for field. The plain shapes (`Task`, `ElectionReport`, …) are what the
 * screens render; `services/agentService.ts` is the only place that maps one
 * to the other, so a contract change stays out of the components.
 */

/* -------------------------------------------------------------------------- */
/*                                 API shapes                                 */
/* -------------------------------------------------------------------------- */

export interface NotificationPreferences {
  incidents: boolean;
  assignments: boolean;
  campaign_messages: boolean;
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  last_login_at: string | null;
  notification_preferences: NotificationPreferences;
  email_verified_at: string | null;
  created_at: string;
}

export interface ApiLoginResult {
  user: ApiUser;
  token: string;
  token_type: string;
  expires_at: string | null;
}

export interface ApiCampaign {
  id: string;
  organization_id: string;
  geography_version_id: string;
  name: string;
  status: string;
  access: { role: string; can_manage: boolean; can_work: boolean };
}

export interface ApiAssignment {
  id: string;
  campaign_id: string;
  agent_membership_id: string;
  geographic_unit_id: string;
  duty: string;
  starts_at: string;
  /** Null while the assignment is active. */
  ends_at: string | null;
}

export interface ApiGeographicUnit {
  id: string;
  name: string;
  official_code: string;
  kind: string;
}

export interface ApiContextOrganization {
  organization: { id: string; name: string };
  membership: { id: string; role: string };
  campaigns: ApiCampaign[];
  assignments: ApiAssignment[];
  agent_profile: { phone: string | null; status: string } | null;
  home_unit: ApiGeographicUnit | null;
  stats: {
    tasks_total: number;
    tasks_completed: number;
    field_reports: number;
    polling_reports: number;
    incidents: number;
  };
}

export interface ApiAuthContext {
  user: ApiUser;
  organizations: ApiContextOrganization[];
}

export type ApiTaskStatus = "open" | "in_progress" | "completed" | "cancelled";

export interface ApiTask {
  id: string;
  campaign_id: string;
  assignment_id: string;
  geographic_unit_id: string | null;
  title: string;
  instructions: string | null;
  priority: "high" | "medium" | "low";
  category: "opinion_poll" | "election_report" | "incident_report" | null;
  subject: string | null;
  target_count: number | null;
  status: ApiTaskStatus;
  due_at: string | null;
  completed_at: string | null;
  /** Send back as `expected_revision` on every transition. */
  revision: number;
}

export interface ApiFieldReport {
  id: string;
  task_id: string | null;
  activity_type: string;
  collection_method: string | null;
  people_reached: number | null;
  narrative: string;
  observed_at: string;
  received_at: string;
  client_submission_id: string;
}

export interface ApiPollingPlace {
  id: string;
  polling_occasion_id: string;
  polling_unit_id: string;
  official_code: string;
  name: string;
}

export interface ApiPollingOccasion {
  id: string;
  name: string;
  scheduled_on: string | null;
  status: string;
}

export interface ApiPollingReport {
  id: string;
  polling_place_id: string;
  polling_unit_id: string;
  task_id: string | null;
  subject: string | null;
  operating_status: string | null;
  reported_votes_cast: number | null;
  notes: string | null;
  review_state: string;
  observed_at: string;
  received_at: string;
  participation: {
    accredited_persons: number | null;
    participating_persons: number | null;
  } | null;
}

export interface ApiIncident {
  id: string;
  geographic_unit_id: string | null;
  category: string | null;
  incident_type: string | null;
  latitude: number | null;
  longitude: number | null;
  severity: string;
  description: string;
  status: string;
  occurred_at: string;
}

export interface ApiNotification {
  id: string;
  title: string;
  body: string;
  kind: string;
  read_at: string | null;
  created_at: string;
}

/* -------------------------------------------------------------------------- */
/*                              Agent + workspace                             */
/* -------------------------------------------------------------------------- */

export interface Agent {
  /** The user ID. */
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string | null;
  /** Display form of the assignment duty, e.g. "Field Agent". */
  role: string;
  /** Agent profile status from the organization, e.g. "active". */
  status: string;
  /** Name of the agent's home geographic unit, e.g. "Lagos State". */
  sector: string;
  stats: {
    tasksTotal: number;
    tasksCompleted: number;
    /** Field, polling and incident reports combined. */
    reports: number;
  };
  notificationPreferences: NotificationPreferences;
}

/** The organization, campaign and assignment the agent is working under. */
export interface Workspace {
  organizationId: string;
  organizationName: string;
  membershipId: string;
  campaignId: string;
  campaignName: string;
  /** Null when the agent has campaign access but no active assignment. */
  assignmentId: string | null;
  /** Geographic unit names known from context, keyed by unit ID. */
  unitNames: Record<string, string>;
}

/* -------------------------------------------------------------------------- */
/*                                    Tasks                                   */
/* -------------------------------------------------------------------------- */

export type TaskCategory = "Opinion Poll" | "Election Report" | "Incident Report";

export type TaskPriority = "High" | "Medium" | "Low";

export type TaskStatus = "Pending" | "In Progress" | "Completed" | "Cancelled";

export interface Task {
  id: string;
  title: string;
  /** Null for a general task the admin didn't categorise. */
  category: TaskCategory | null;
  /** Display label of the subject, or null when none was set. */
  subject: string | null;
  /** The API's subject code, used to preselect the matching form. */
  subjectCode: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  /** Name of the task's geographic unit, or the agent's sector. */
  location: string;
  dueAt: string | null;
  completedAt: string | null;
  instructions: string | null;
  /** Optional numeric goal, e.g. 200 voters polled. */
  target: number | null;
  assignmentId: string;
  /** Optimistic-concurrency token; sent back on start/complete. */
  revision: number;
}

export type TaskAction = "start" | "complete";

/* -------------------------------------------------------------------------- */
/*                                   Reports                                  */
/* -------------------------------------------------------------------------- */

export type ReportType =
  | "Rally"
  | "Door-to-Door"
  | "Town Hall"
  | "Media"
  | "Distribution";

/* -------------------------------------------------------------------------- */
/*                              Election reports                              */
/* -------------------------------------------------------------------------- */

/** State of a polling unit at the moment the agent filed. */
export type PollingUnitStatus =
  | "Open"
  | "Delayed"
  | "Not opened"
  | "Closed"
  | "Suspended";

export type ReviewState = "Pending review" | "Verified" | "Rejected" | "Revoked";

/** A polling-unit return filed from the Election tab. */
export interface ElectionReport {
  id: string;
  /** One of the fixed Election Report subjects, or null for a general return. */
  subject: string | null;
  /** Polling unit code and/or name when known on this device. */
  unitLabel: string | null;
  unitStatus: PollingUnitStatus | null;
  accredited: number | null;
  votesCast: number | null;
  notes: string | null;
  reviewState: ReviewState;
  taskId: string | null;
  observedAt: string;
}

/* -------------------------------------------------------------------------- */
/*                                  Incidents                                 */
/* -------------------------------------------------------------------------- */

export type IncidentSeverity = "Critical" | "High" | "Medium" | "Low";

export type IncidentStatus = "Open" | "Escalated" | "Resolved";

export interface Incident {
  id: string;
  /** Specific allegation, or the broad category when no type was recorded. */
  subject: string;
  /** Broad category the API filed it under, e.g. "Logistics". */
  category: string | null;
  unitLabel: string | null;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description: string;
  coords: { lat: number; lng: number } | null;
  occurredAt: string;
}

/* -------------------------------------------------------------------------- */
/*                                Notifications                               */
/* -------------------------------------------------------------------------- */

export interface Notice {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
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

/** What a piece of evidence is attached to, as `/media/uploads` names it. */
export type EvidenceParent = "field_report" | "polling_report" | "incident";

/* -------------------------------------------------------------------------- */
/*                                Sync + outbox                               */
/* -------------------------------------------------------------------------- */

export type OutboxKind =
  | "field-report"
  | "polling-report"
  | "incident-report"
  | "task-transition"
  | "evidence";

export interface OutboxItem {
  id: string;
  kind: OutboxKind;
  /** Payload shape depends on `kind`; the dispatcher narrows it. */
  payload: unknown;
  createdAt: string;
  attempts: number;
  lastError?: string;
  /**
   * Set when the server rejected the item outright (validation, permission,
   * conflict). It stops retrying and waits for the agent to retry or discard.
   */
  failed?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                                    Auth                                    */
/* -------------------------------------------------------------------------- */

export interface Session {
  token: string;
  /** ISO timestamp from the login response; null when the API gave none. */
  expiresAt: string | null;
  agent: Agent;
  workspace: Workspace;
}
