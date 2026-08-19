import type {
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
  PollingUnitStatus,
  ReportType,
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
    blurb: "Report ward-level accreditation, turnout and collation.",
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

export const ELECTION_SUBJECTS =
  TASK_CATEGORIES.find((c) => c.id === "Election Report")?.subjects ?? [];

export const POLLING_UNIT_STATUSES: PollingUnitStatus[] = [
  "Open",
  "Not opened",
  "Closed",
  "Suspended",
];

export const POLLING_UNIT_STATUS_STYLES: Record<PollingUnitStatus, string> = {
  Open: "bg-success/15 text-success border border-success/30",
  "Not opened": "bg-warning/15 text-warning border border-warning/30",
  Closed: "bg-muted text-muted-foreground border border-border",
  Suspended: "bg-destructive/12 text-destructive border border-destructive/30",
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

/**
 * Each allegation rolls up to one of the four incident types the admin
 * dashboard buckets by, so the agent only has to pick the specific thing they
 * witnessed.
 */
export const INCIDENT_SUBJECT_TYPE: Record<string, IncidentType> = {
  "Election violence": "Violence",
  "Voter intimidation": "Violence",
  "Vote buying": "Malpractice",
  "Ballot box snatching": "Malpractice",
  "Underage voting": "Malpractice",
  "Late or missing materials": "Logistics",
};

export const INCIDENT_TYPES: IncidentType[] = [
  "Violence",
  "Delay",
  "Malpractice",
  "Logistics",
];

export const INCIDENT_SEVERITIES: IncidentSeverity[] = [
  "Critical",
  "High",
  "Medium",
  "Low",
];

export const INCIDENT_STATUSES: IncidentStatus[] = [
  "Open",
  "Escalated",
  "Resolved",
];

export const REPORT_TYPES: ReportType[] = [
  "Rally",
  "Door-to-Door",
  "Town Hall",
  "Media",
  "Distribution",
];

export const TASK_STATUSES: TaskStatus[] = ["Pending", "In Progress", "Completed"];

export const TASK_PRIORITIES: TaskPriority[] = ["High", "Medium", "Low"];

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

/** Media limits — field agents are usually on metered, patchy connections. */
export const MEDIA_LIMITS = {
  maxFiles: 6,
  maxImageBytes: 8 * 1024 * 1024,
  maxVideoBytes: 40 * 1024 * 1024,
  accept: "image/*,video/*",
};

export const STORAGE_KEYS = {
  session: "sentinel.session",
  theme: "sentinel.theme",
  installDismissed: "sentinel.install-dismissed",
};
