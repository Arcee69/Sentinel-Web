import type { Agent, Incident, Task, TaskReport } from "../../lib/types";

/**
 * Seeded in-browser database standing in for the Sentinel backend.
 *
 * The back-office is currently a mock front end too, so there is no live API to
 * call yet. Records here use the exact admin field names, which means switching
 * `VITE_USE_MOCK_API` to `false` is the only change needed once the real
 * endpoints land.
 */

/**
 * Bump this whenever the seed changes. The database persists in localStorage,
 * so a stale copy would otherwise keep serving the previous credentials and
 * make a changed demo account look broken.
 */
const STORE_KEY = "sentinel.mockdb.v2";

/** Demo credential — any seeded agent's email or phone works with this. */
export const DEMO_PASSWORD = "password";

export interface MockDb {
  agents: Agent[];
  tasks: Task[];
  reports: TaskReport[];
  incidents: Incident[];
  /** Reset codes issued by the forgot-password flow, keyed by identifier. */
  resetCodes: Record<string, string>;
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3600_000).toISOString();
}

/**
 * Produces the machine deadline and the human label together so the two can't
 * drift apart the way hand-written seed strings do.
 */
function dueIn(hours: number): { dueAt: string; due: string } {
  const at = new Date(Date.now() + hours * 3600_000);

  const today = new Date();
  const sameDay =
    at.getDate() === today.getDate() &&
    at.getMonth() === today.getMonth() &&
    at.getFullYear() === today.getFullYear();

  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const isTomorrow =
    at.getDate() === tomorrow.getDate() &&
    at.getMonth() === tomorrow.getMonth() &&
    at.getFullYear() === tomorrow.getFullYear();

  const clock = at
    .toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true })
    .replace(" ", "")
    .toLowerCase();

  const day = sameDay
    ? "Today"
    : isTomorrow
      ? "Tomorrow"
      : at.toLocaleDateString(undefined, { weekday: "short" });

  return { dueAt: at.toISOString(), due: `${day} ${clock}` };
}

function seed(): MockDb {
  const agent: Agent = {
    id: "ag3",
    name: "Chinedu Eze",
    initials: "CE",
    email: "test@sentinel.com",
    phone: "07039884120",
    role: "Field Agent",
    state: "Anambra",
    lga: "Onitsha North",
    ward: "Onitsha North 04",
    reports: 29,
    taskPct: 76,
    status: "active",
  };

  const tasks: Task[] = [
    {
      id: "t1",
      title: "Poll 200 voters on candidate preference",
      category: "Opinion Poll",
      subject: "Candidate preference & reasons",
      priority: "High",
      assignee: agent.name,
      assigneeId: agent.id,
      state: agent.state,
      lga: agent.lga,
      ward: "Onitsha North 04",
      ...dueIn(5),
      status: "In Progress",
      campaignId: "c2",
      instructions:
        "Cover the market district and residential blocks. Record why each voter rates their preferred candidate best — verbatim quotes are valuable.",
      target: 200,
      createdAt: hoursAgo(26),
      startedAt: hoursAgo(2),
    },
    {
      id: "t2",
      title: "Report Ward 4 accreditation figures",
      category: "Election Report",
      subject: "Ward voter accreditation",
      priority: "High",
      assignee: agent.name,
      assigneeId: agent.id,
      state: agent.state,
      lga: agent.lga,
      ward: "Onitsha North 04",
      pollingUnit: "AN/ON/04/012",
      ...dueIn(7),
      status: "Pending",
      campaignId: "c2",
      instructions:
        "Collect accreditation totals from the presiding officer at each of the six polling units. Photograph the posted figures.",
      createdAt: hoursAgo(20),
    },
    {
      id: "t3",
      title: "Door-to-door canvass, Awada axis",
      category: "Opinion Poll",
      subject: "Undecided voter sentiment",
      priority: "Medium",
      assignee: agent.name,
      assigneeId: agent.id,
      state: agent.state,
      lga: agent.lga,
      ...dueIn(21),
      status: "Pending",
      campaignId: "c1",
      instructions:
        "Focus on households that declined to state a preference in the last sweep.",
      target: 80,
      createdAt: hoursAgo(14),
    },
    {
      id: "t4",
      title: "Monitor BVAS deployment at PU 004",
      category: "Election Report",
      subject: "BVAS & materials status",
      priority: "Medium",
      assignee: agent.name,
      assigneeId: agent.id,
      state: agent.state,
      lga: agent.lga,
      pollingUnit: "AN/ON/04/004",
      ...dueIn(20),
      status: "Pending",
      campaignId: "c2",
      instructions: "Confirm machine serial numbers and note any malfunction.",
      createdAt: hoursAgo(12),
    },
    {
      id: "t5",
      title: "Log intimidation reports at Ward 2",
      category: "Incident Report",
      subject: "Voter intimidation",
      priority: "High",
      assignee: agent.name,
      assigneeId: agent.id,
      state: agent.state,
      lga: agent.lga,
      ward: "Onitsha North 02",
      due: "Yesterday 5pm",
      dueAt: hoursAgo(18),
      status: "Completed",
      campaignId: "c1",
      instructions: "Interview affected voters and capture supporting media.",
      createdAt: hoursAgo(48),
      startedAt: hoursAgo(30),
      completedAt: hoursAgo(19),
    },
    {
      id: "t6",
      title: "Town hall attendance and sentiment",
      category: "Opinion Poll",
      subject: "Top issues driving the choice",
      priority: "Low",
      assignee: agent.name,
      assigneeId: agent.id,
      state: agent.state,
      lga: agent.lga,
      ...dueIn(70),
      status: "Completed",
      campaignId: "c1",
      createdAt: hoursAgo(72),
      startedAt: hoursAgo(50),
      completedAt: hoursAgo(44),
    },
  ];

  const reports: TaskReport[] = [
    {
      id: "r1",
      taskId: "t5",
      agentId: agent.id,
      agent: agent.name,
      category: "Incident Report",
      subject: "Voter intimidation",
      type: "Door-to-Door",
      state: agent.state,
      lga: agent.lga,
      location: `${agent.state}/${agent.lga}`,
      body: "Three households in Ward 2 reported being approached by unidentified men warning them against voting. Statements recorded, no physical harm reported.",
      respondents: 3,
      media: [],
      submittedAt: hoursAgo(19),
      sync: "synced",
    },
    {
      id: "r2",
      taskId: "t6",
      agentId: agent.id,
      agent: agent.name,
      category: "Opinion Poll",
      subject: "Top issues driving the choice",
      type: "Town Hall",
      state: agent.state,
      lga: agent.lga,
      location: `${agent.state}/${agent.lga}`,
      body: "Town hall drew roughly 180 attendees. Dominant issues: road repairs, electricity tariffs, and youth employment — in that order.",
      respondents: 180,
      media: [],
      submittedAt: hoursAgo(44),
      sync: "synced",
    },
  ];

  const incidents: Incident[] = [
    {
      id: "i1",
      type: "Logistics",
      subject: "Late or missing materials",
      unit: "AN/ON/04/009",
      state: agent.state,
      lga: agent.lga,
      severity: "Medium",
      status: "Resolved",
      description:
        "Result sheets arrived 90 minutes after the scheduled opening time. Presiding officer confirmed full delivery at 09:20.",
      media: [],
      agentId: agent.id,
      agent: agent.name,
      reportedAt: hoursAgo(30),
      sync: "synced",
    },
    {
      id: "i2",
      type: "Malpractice",
      subject: "Vote buying",
      unit: "AN/ON/02/003",
      state: agent.state,
      lga: agent.lga,
      severity: "High",
      status: "Escalated",
      description:
        "Cash disbursement observed roughly 40 metres from the polling unit entrance. Photographed from a distance; security notified.",
      media: [],
      agentId: agent.id,
      agent: agent.name,
      reportedAt: hoursAgo(6),
      sync: "synced",
    },
  ];

  return { agents: [agent], tasks, reports, incidents, resetCodes: {} };
}

export function loadDb(): MockDb {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as MockDb;
  } catch {
    /* corrupt payload — fall through to a fresh seed */
  }

  const fresh = seed();
  saveDb(fresh);
  return fresh;
}

export function saveDb(db: MockDb): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(db));
  } catch {
    /* quota exceeded — in-memory state still serves this session */
  }
}

/** Read-modify-write helper so callers can't forget to persist. */
export function mutateDb<T>(fn: (db: MockDb) => T): T {
  const db = loadDb();
  const result = fn(db);
  saveDb(db);
  return result;
}

export function resetDb(): void {
  saveDb(seed());
}
