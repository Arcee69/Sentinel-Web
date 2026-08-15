import { AxiosError, AxiosHeaders } from "axios";
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { DEMO_PASSWORD, loadDb, mutateDb } from "./mockDb";
import { latency, getSettings, setSettings, shouldFail } from "./simulator";
import { INCIDENT_SUBJECT_TYPE } from "../../lib/constants";
import type {
  Agent,
  Incident,
  IncidentSeverity,
  MediaItem,
  Task,
  TaskReport,
  TaskStatus,
} from "../../lib/types";

/**
 * Axios adapter that answers requests from the seeded browser database.
 *
 * This is deliberately an *adapter* rather than a branch inside the service
 * layer: every call still passes through the real interceptors, carries the
 * real Authorization header, and comes back as a real AxiosResponse or
 * AxiosError. The screens therefore exercise the exact integration path they
 * will use against the live backend — swapping this out for the network
 * adapter is the entire migration.
 *
 * Response envelope (the contract the backend must honour):
 *   success →  { "success": true,  "data": <payload> }
 *   failure →  { "success": false, "message": "<human readable>" }
 */

interface Route {
  method: string;
  pattern: RegExp;
  handle: (ctx: RouteContext) => unknown;
}

interface RouteContext {
  params: string[];
  body: Record<string, unknown>;
  files: File[];
  config: InternalAxiosRequestConfig;
  /** Throws unless a bearer token is present; returns the signed-in agent. */
  requireAuth: () => Agent;
}

/** Signals a non-2xx response from a route handler. */
class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Routes                                   */
/* -------------------------------------------------------------------------- */

const routes: Route[] = [
  {
    method: "POST",
    pattern: /^\/auth\/login$/,
    handle: ({ body }) => {
      const identifier = String(body.identifier ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");

      const agent = loadDb().agents.find(
        (a) => a.email.toLowerCase() === identifier || a.phone === identifier,
      );

      if (!agent || password !== DEMO_PASSWORD) {
        throw new HttpError(401, "Invalid credentials. Check your details and try again.");
      }

      return {
        token: `mock.${agent.id}.${Date.now()}`,
        agent,
        issuedAt: new Date().toISOString(),
      };
    },
  },

  {
    method: "POST",
    pattern: /^\/auth\/logout$/,
    handle: () => ({ ok: true }),
  },

  {
    method: "POST",
    pattern: /^\/auth\/forgot-password$/,
    handle: ({ body }) => {
      const identifier = String(body.identifier ?? "").trim().toLowerCase();

      return mutateDb((db) => {
        const agent = db.agents.find(
          (a) => a.email.toLowerCase() === identifier || a.phone === identifier,
        );

        // Always report success — telling a caller which identifiers exist
        // would let an outsider enumerate the agent roster.
        if (agent) db.resetCodes[identifier] = "123456";

        return { hint: agent ? maskEmail(agent.email) : "your registered contact" };
      });
    },
  },

  {
    method: "POST",
    pattern: /^\/auth\/verify-reset-code$/,
    handle: ({ body }) => {
      assertCode(String(body.identifier ?? ""), String(body.code ?? ""));
      return { ok: true };
    },
  },

  {
    method: "POST",
    pattern: /^\/auth\/reset-password$/,
    handle: ({ body }) => {
      const identifier = String(body.identifier ?? "");
      assertCode(identifier, String(body.code ?? ""));

      const password = String(body.password ?? "");
      if (password.length < 8) {
        throw new HttpError(422, "Password must be at least 8 characters.");
      }

      mutateDb((db) => {
        delete db.resetCodes[identifier.trim().toLowerCase()];
      });
      return { ok: true };
    },
  },

  {
    method: "GET",
    pattern: /^\/agent\/tasks$/,
    handle: ({ requireAuth }) => {
      const agent = requireAuth();
      return loadDb()
        .tasks.filter((t) => t.assigneeId === agent.id)
        .sort(byUrgency);
    },
  },

  {
    method: "GET",
    pattern: /^\/agent\/tasks\/([^/]+)$/,
    handle: ({ params, requireAuth }) => {
      const agent = requireAuth();
      const task = loadDb().tasks.find((t) => t.id === params[0]);

      if (!task) throw new HttpError(404, "That task no longer exists.");
      if (task.assigneeId !== agent.id) {
        throw new HttpError(403, "That task isn't assigned to you.");
      }
      return task;
    },
  },

  {
    method: "PATCH",
    pattern: /^\/agent\/tasks\/([^/]+)\/status$/,
    handle: ({ params, body, requireAuth }) => {
      requireAuth();
      const status = body.status as TaskStatus;

      return mutateDb((db) => {
        const task = db.tasks.find((t) => t.id === params[0]);
        if (!task) throw new HttpError(404, "That task no longer exists.");

        task.status = status;
        if (status === "In Progress" && !task.startedAt) {
          task.startedAt = new Date().toISOString();
        }
        if (status === "Completed") task.completedAt = new Date().toISOString();
        return task;
      });
    },
  },

  {
    method: "GET",
    pattern: /^\/agent\/reports$/,
    handle: ({ requireAuth }) => {
      const agent = requireAuth();
      return loadDb().reports.filter((r) => r.agentId === agent.id);
    },
  },

  {
    method: "POST",
    pattern: /^\/agent\/reports$/,
    handle: ({ body, files, requireAuth }) => {
      const agent = requireAuth();
      const taskId = String(body.taskId ?? "");
      const task = loadDb().tasks.find((t) => t.id === taskId);
      if (!task) throw new HttpError(404, "That task no longer exists.");

      const bodyText = String(body.body ?? "").trim();
      if (bodyText.length < 20) {
        throw new HttpError(422, "Report is too short to be actionable.");
      }

      const report: TaskReport = {
        id: crypto.randomUUID(),
        taskId,
        agentId: agent.id,
        agent: agent.name,
        category: task.category,
        subject: task.subject,
        type: body.type as TaskReport["type"],
        state: agent.state,
        lga: agent.lga,
        location: `${agent.state}/${agent.lga}`,
        body: bodyText,
        respondents: body.respondents ? Number(body.respondents) : undefined,
        media: storeMedia(body.mediaMeta, files),
        submittedAt: new Date().toISOString(),
        sync: "synced",
      };

      mutateDb((db) => {
        db.reports.unshift(report);

        // Filing the report closes out the task it belongs to.
        const target = db.tasks.find((t) => t.id === taskId);
        if (target && target.status !== "Completed") {
          target.status = "Completed";
          target.completedAt = report.submittedAt;
        }

        const author = db.agents.find((a) => a.id === agent.id);
        if (author) author.reports += 1;
      });

      return report;
    },
  },

  {
    method: "GET",
    pattern: /^\/agent\/incidents$/,
    handle: ({ requireAuth }) => {
      const agent = requireAuth();
      return loadDb().incidents.filter((i) => i.agentId === agent.id);
    },
  },

  {
    method: "POST",
    pattern: /^\/agent\/incidents$/,
    handle: ({ body, files, requireAuth }) => {
      const agent = requireAuth();

      const description = String(body.description ?? "").trim();
      if (description.length < 20) {
        throw new HttpError(422, "Describe the incident in more detail.");
      }

      const subject = String(body.subject ?? "");
      const severity = body.severity as IncidentSeverity;

      const incident: Incident = {
        id: crypto.randomUUID(),
        type: INCIDENT_SUBJECT_TYPE[subject] ?? "Malpractice",
        subject,
        unit: String(body.unit ?? "").toUpperCase(),
        state: agent.state,
        lga: agent.lga,
        severity,
        // Critical reports skip triage and go straight to the command desk.
        status: severity === "Critical" ? "Escalated" : "Open",
        description,
        media: storeMedia(body.mediaMeta, files),
        agentId: agent.id,
        agent: agent.name,
        coords: parseCoords(body.coords),
        reportedAt: new Date().toISOString(),
        sync: "synced",
      };

      mutateDb((db) => {
        db.incidents.unshift(incident);
      });
      return incident;
    },
  },
];

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

function byUrgency(a: Task, b: Task): number {
  const rank = (t: Task) => (t.status === "Completed" ? 1 : 0);
  if (rank(a) !== rank(b)) return rank(a) - rank(b);
  return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
}

function assertCode(identifier: string, code: string): void {
  const expected = loadDb().resetCodes[identifier.trim().toLowerCase()];
  if (!expected || expected !== code.trim()) {
    throw new HttpError(422, "That code isn't right. Check the digits and try again.");
  }
}

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!domain) return "your registered contact";
  return `${name.slice(0, 2)}${"•".repeat(Math.max(3, name.length - 2))}@${domain}`;
}

/**
 * Stands in for object storage: returns the CDN-style URLs a real backend
 * would hand back after accepting the upload.
 */
function storeMedia(metaField: unknown, files: File[]): MediaItem[] {
  let meta: Omit<MediaItem, "url">[] = [];
  try {
    if (typeof metaField === "string") meta = JSON.parse(metaField);
  } catch {
    meta = [];
  }

  if (meta.length === 0 && files.length > 0) {
    meta = files.map((file) => ({
      id: crypto.randomUUID(),
      kind: file.type.startsWith("video/") ? "video" : "image",
      name: file.name,
      size: file.size,
      mimeType: file.type,
    }));
  }

  return meta.map((item) => ({
    ...item,
    url: `https://cdn.sentinel.example/media/${item.id}`,
  }));
}

function parseCoords(value: unknown): { lat: number; lng: number } | undefined {
  if (typeof value !== "string" || !value) return undefined;
  try {
    return JSON.parse(value) as { lat: number; lng: number };
  } catch {
    return undefined;
  }
}

/** Reads the request body whether it arrived as JSON or multipart. */
function readBody(config: InternalAxiosRequestConfig): {
  body: Record<string, unknown>;
  files: File[];
} {
  const data = config.data;

  if (data instanceof FormData) {
    const body: Record<string, unknown> = {};
    const files: File[] = [];

    for (const [key, value] of data.entries()) {
      if (value instanceof File) files.push(value);
      else body[key] = value;
    }
    return { body, files };
  }

  if (typeof data === "string") {
    try {
      return { body: JSON.parse(data) as Record<string, unknown>, files: [] };
    } catch {
      return { body: {}, files: [] };
    }
  }

  return { body: (data as Record<string, unknown>) ?? {}, files: [] };
}

/** Streams upload progress so the UI can show a real progress bar. */
async function reportUploadProgress(config: InternalAxiosRequestConfig, files: File[]) {
  if (!config.onUploadProgress || files.length === 0) return;

  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total === 0) return;

  const steps = 8;
  for (let step = 1; step <= steps; step++) {
    await new Promise((resolve) => setTimeout(resolve, 60));
    config.onUploadProgress({
      loaded: Math.round((total * step) / steps),
      total,
      bytes: Math.round(total / steps),
      lengthComputable: true,
    });
  }
}

function respond(config: InternalAxiosRequestConfig, status: number, payload: unknown): AxiosResponse {
  return {
    data: { success: status < 400, data: payload },
    status,
    statusText: status === 201 ? "Created" : "OK",
    headers: new AxiosHeaders({ "content-type": "application/json" }),
    config,
  };
}

function fail(
  config: InternalAxiosRequestConfig,
  status: number,
  message: string,
): AxiosError {
  const response: AxiosResponse = {
    data: { success: false, message },
    status,
    statusText: status === 401 ? "Unauthorized" : "Error",
    headers: new AxiosHeaders({ "content-type": "application/json" }),
    config,
  };

  return new AxiosError(message, String(status), config, null, response);
}

/* -------------------------------------------------------------------------- */
/*                                   Adapter                                  */
/* -------------------------------------------------------------------------- */

export const mockAdapter: AxiosAdapter = async (config) => {
  const method = (config.method ?? "get").toUpperCase();
  const path = new URL(config.url ?? "", "http://mock.local").pathname;

  const { body, files } = readBody(config);

  await reportUploadProgress(config, files);
  await latency();

  if (getSettings().networkDown) {
    throw new AxiosError("Network Error", AxiosError.ERR_NETWORK, config, null);
  }

  if (shouldFail()) {
    throw fail(config, 500, "The server is having trouble. Please try again.");
  }

  const route = routes.find((r) => r.method === method && r.pattern.test(path));
  if (!route) throw fail(config, 404, `No mock route for ${method} ${path}`);

  const params = path.match(route.pattern)?.slice(1) ?? [];

  const requireAuth = (): Agent => {
    const header = config.headers?.Authorization ?? config.headers?.authorization;
    if (!header) throw new HttpError(401, "Your session has expired. Please sign in again.");

    // One-shot switch so the expired-token path can be demonstrated on demand.
    if (getSettings().expireToken) {
      setSettings({ expireToken: false });
      throw new HttpError(401, "Your session has expired. Please sign in again.");
    }

    const agentId = String(header).replace("Bearer ", "").split(".")[1];
    const agent = loadDb().agents.find((a) => a.id === agentId);
    if (!agent) throw new HttpError(401, "Your session has expired. Please sign in again.");

    return agent;
  };

  try {
    const payload = route.handle({ params, body, files, config, requireAuth });
    return respond(config, method === "POST" ? 201 : 200, payload);
  } catch (error) {
    if (error instanceof HttpError) throw fail(config, error.status, error.message);
    throw fail(config, 500, "Unexpected server error.");
  }
};
