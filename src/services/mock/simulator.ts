/**
 * Runtime knobs for the mock API.
 *
 * Real networks are slow, flaky, and occasionally reject your token. Until the
 * backend exists, these settings let the app demonstrate exactly how it behaves
 * under those conditions — loading states, error states, retries, the offline
 * outbox and forced sign-out — without waiting for a server to misbehave.
 */

const STORE_KEY = "sentinel.simulator";

export interface SimulatorSettings {
  /** Base round-trip latency in milliseconds. */
  latencyMs: number;
  /** Extra random jitter added on top, 0–this value. */
  jitterMs: number;
  /** Probability (0–1) that a request fails with a 500. */
  errorRate: number;
  /** Reject the next authenticated request with a 401 to show the sign-out path. */
  expireToken: boolean;
  /** Fail every request at the transport layer, as a dead connection would. */
  networkDown: boolean;
}

export const DEFAULT_SETTINGS: SimulatorSettings = {
  latencyMs: 350,
  jitterMs: 250,
  errorRate: 0,
  expireToken: false,
  networkDown: false,
};

/** Preset profiles for demoing the app under different field conditions. */
export const PRESETS: Record<string, Partial<SimulatorSettings>> = {
  "Good signal": { latencyMs: 150, jitterMs: 100, errorRate: 0, networkDown: false },
  "Rural 3G": { latencyMs: 1400, jitterMs: 900, errorRate: 0, networkDown: false },
  "Flaky": { latencyMs: 700, jitterMs: 600, errorRate: 0.35, networkDown: false },
  "No service": { networkDown: true },
};

let settings: SimulatorSettings = load();

const listeners = new Set<(value: SimulatorSettings) => void>();

function load(): SimulatorSettings {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as SimulatorSettings) };
  } catch {
    /* fall through to defaults */
  }
  return { ...DEFAULT_SETTINGS };
}

export function getSettings(): SimulatorSettings {
  return settings;
}

export function setSettings(patch: Partial<SimulatorSettings>): void {
  settings = { ...settings, ...patch };
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(settings));
  } catch {
    /* non-fatal */
  }
  for (const listener of listeners) listener(settings);
}

export function resetSettings(): void {
  setSettings(DEFAULT_SETTINGS);
}

export function subscribe(listener: (value: SimulatorSettings) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Waits out the configured latency for one request. */
export function latency(): Promise<void> {
  const { latencyMs, jitterMs } = settings;
  const wait = latencyMs + Math.random() * jitterMs;
  return new Promise((resolve) => setTimeout(resolve, wait));
}

/** True when this request should be failed to simulate a flaky server. */
export function shouldFail(): boolean {
  return Math.random() < settings.errorRate;
}
