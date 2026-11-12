import type {
  IncidentSeverity,
  IncidentStatus,
  PollingUnitStatus,
  ReportType,
  ReviewState,
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from "./types";

/**
 * The three task categories the admin can assign, with the exact subject lists
 * the back-office offers. An agent never invents a subject — they report
 * against the one the admin picked.
 */
export const TASK_CATEGORIES: {
  id: TaskCategory;
  blurb: string;
  subjects: string[];
}[] = [
  {
    id: "Opinion Poll",
    blurb: "Gather voter feedback on the candidates and why they rate them best.",
    subjects: [
      "Candidate preference & reasons",
      "Why voters rate our candidate best",
      "Perception of rival candidates",
      "Top issues driving the choice",
      "Undecided voter sentiment",
    ],
  },
  {
    id: "Election Report",
    blurb: "Report polling-unit accreditation, turnout and collation.",
    subjects: [
      "Ward voter accreditation",
      "Votes cast at the ward",
      "Polling unit opening status",
      "Result collation at ward",
      "BVAS & materials status",
    ],
  },
  {
    id: "Incident Report",
    blurb: "Flag violence, intimidation, vote buying and other malpractice.",
    subjects: [
      "Election violence",
      "Voter intimidation",
      "Vote buying",
      "Ballot box snatching",
      "Underage voting",
      "Late or missing materials",
    ],
  },
];

export const CATEGORY_LABEL: Record<string, TaskCategory> = {
  opinion_poll: "Opinion Poll",
  election_report: "Election Report",
  incident_report: "Incident Report",
};

/**
 * Subject label ↔ API code. Election codes are the polling-report `subject`
 * enum and incident codes are the `incident_type` enum; opinion-poll codes
 * match what the back office writes on a task.
 */
export const SUBJECT_CODE: Record<string, string> = {
  "Candidate preference & reasons": "candidate_preference",
  "Why voters rate our candidate best": "why_rate_candidate",
  "Perception of rival candidates": "rival_perception",
  "Top issues driving the choice": "top_issues",
  "Undecided voter sentiment": "undecided_sentiment",

  "Ward voter accreditation": "ward_accreditation",
  "Votes cast at the ward": "votes_cast",
  "Polling unit opening status": "polling_unit_opening",
  "Result collation at ward": "result_collation",
  "BVAS & materials status": "bvas_materials",

  "Election violence": "election_violence",
  "Voter intimidation": "voter_intimidation",
  "Vote buying": "vote_buying",
  "Ballot box snatching": "ballot_box_snatching",
  "Underage voting": "underage_voting",
  "Late or missing materials": "late_or_missing_materials",
};

const SUBJECT_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(SUBJECT_CODE).map(([label, code]) => [code, label]),
);

/** "late_or_missing_materials" → "Late or missing materials". */
export function humanize(code: string): string {
  const spaced = code.replace(/[_-]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function subjectLabel(code: string | null | undefined): string | null {
  if (!code) return null;
  return SUBJECT_LABEL[code] ?? humanize(code);
}

export const ELECTION_SUBJECTS =
  TASK_CATEGORIES.find((c) => c.id === "Election Report")?.subjects ?? [];

export const POLLING_UNIT_STATUSES: PollingUnitStatus[] = [
  "Open",
  "Delayed",
  "Not opened",
  "Closed",
  "Suspended",
];

export const OPERATING_STATUS_CODE: Record<PollingUnitStatus, string> = {
  Open: "open",
  Delayed: "delayed",
  "Not opened": "not_opened",
  Closed: "closed",
  Suspended: "suspended",
};

export const OPERATING_STATUS_LABEL: Record<string, PollingUnitStatus> = Object.fromEntries(
  Object.entries(OPERATING_STATUS_CODE).map(([label, code]) => [code, label as PollingUnitStatus]),
);

export const POLLING_UNIT_STATUS_STYLES: Record<PollingUnitStatus, string> = {
  Open: "bg-success/15 text-success border border-success/30",
  Delayed: "bg-warning/15 text-warning border border-warning/30",
  "Not opened": "bg-warning/15 text-warning border border-warning/30",
  Closed: "bg-muted text-muted-foreground border border-border",
  Suspended: "bg-destructive/12 text-destructive border border-destructive/30",
};

export const REVIEW_STATE_LABEL: Record<string, ReviewState> = {
  pending_review: "Pending review",
  verified: "Verified",
  rejected: "Rejected",
  revoked: "Revoked",
};

export const REVIEW_STATE_STYLES: Record<ReviewState, string> = {
  "Pending review": "bg-muted text-muted-foreground border border-border",
  Verified: "bg-success/15 text-success border border-success/30",
  Rejected: "bg-destructive/12 text-destructive border border-destructive/30",
  Revoked: "bg-destructive/12 text-destructive border border-destructive/30",
};

/**
 * Subjects that are meaningless without figures — the form makes the
 * accreditation / votes-cast boxes required for these and optional elsewhere.
 */
export const ELECTION_SUBJECTS_NEEDING_FIGURES = [
  "Ward voter accreditation",
  "Votes cast at the ward",
  "Result collation at ward",
];

export const INCIDENT_SUBJECTS =
  TASK_CATEGORIES.find((c) => c.id === "Incident Report")?.subjects ?? [];

export const INCIDENT_SEVERITIES: IncidentSeverity[] = [
  "Critical",
  "High",
  "Medium",
  "Low",
];

export const INCIDENT_STATUS_LABEL: Record<string, IncidentStatus> = {
  open: "Open",
  escalated: "Escalated",
  resolved: "Resolved",
};

export const REPORT_TYPES: ReportType[] = [
  "Rally",
  "Door-to-Door",
  "Town Hall",
  "Media",
  "Distribution",
];

/** Report method → field-report `collection_method`. */
export const COLLECTION_METHOD_CODE: Record<ReportType, string> = {
  Rally: "rally",
  "Door-to-Door": "door_to_door",
  "Town Hall": "town_hall",
  Media: "media",
  Distribution: "distribution",
};

export const TASK_STATUSES: TaskStatus[] = ["Pending", "In Progress", "Completed", "Cancelled"];

export const TASK_STATUS_LABEL: Record<string, TaskStatus> = {
  open: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PRIORITY_LABEL: Record<string, TaskPriority> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

/** Tailwind classes keyed by enum, so badges stay consistent across screens. */
export const PRIORITY_STYLES: Record<TaskPriority, string> = {
  High: "bg-primary text-primary-foreground",
  Medium: "bg-warning/15 text-warning border border-warning/30",
  Low: "bg-muted text-muted-foreground border border-border",
};

export const STATUS_STYLES: Record<TaskStatus, string> = {
  Pending: "bg-muted text-muted-foreground border border-border",
  "In Progress": "bg-primary/12 text-primary border border-primary/30",
  Completed: "bg-success/15 text-success border border-success/30",
  Cancelled: "bg-muted text-muted-foreground border border-border line-through",
};

export const SEVERITY_STYLES: Record<IncidentSeverity, string> = {
  Critical: "bg-destructive text-destructive-foreground",
  High: "bg-destructive/12 text-destructive border border-destructive/30",
  Medium: "bg-warning/15 text-warning border border-warning/30",
  Low: "bg-muted text-muted-foreground border border-border",
};

export const INCIDENT_STATUS_STYLES: Record<IncidentStatus, string> = {
  Open: "bg-warning/15 text-warning border border-warning/30",
  Escalated: "bg-destructive/12 text-destructive border border-destructive/30",
  Resolved: "bg-success/15 text-success border border-success/30",
};

/**
 * Media limits — field agents are usually on metered, patchy connections. The
 * API accepts JPEG/PNG/MP4/WebM/MOV up to 50 MiB per file.
 */
export const MEDIA_LIMITS = {
  maxFiles: 6,
  maxImageBytes: 8 * 1024 * 1024,
  maxVideoBytes: 40 * 1024 * 1024,
  imageTypes: ["image/jpeg", "image/png"],
  videoTypes: ["video/mp4", "video/webm", "video/quicktime"],
};

export const STORAGE_KEYS = {
  session: "sentinel.session",
  theme: "sentinel.theme",
  installDismissed: "sentinel.install-dismissed",
  places: "sentinel.places",
};
