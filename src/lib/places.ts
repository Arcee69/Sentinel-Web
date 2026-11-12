import { STORAGE_KEYS } from "./constants";

/**
 * Polling-unit labels this device has learned, keyed by geographic unit ID.
 *
 * Report and incident lists only carry unit IDs, and there is no single-unit
 * lookup an agent can call. The code lookup and the agent's own submissions
 * tell us the code and name, so we remember them here to label the lists.
 * Records filed elsewhere simply show without a unit label.
 */

interface KnownPlace {
  code: string;
  name?: string;
}

function readAll(): Record<string, KnownPlace> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.places);
    return raw ? (JSON.parse(raw) as Record<string, KnownPlace>) : {};
  } catch {
    return {};
  }
}

export function rememberPlace(unitId: string | null | undefined, place: KnownPlace) {
  if (!unitId) return;
  const all = readAll();
  // Keep a name learned from the lookup when a later submission only knows the code.
  all[unitId] = { ...all[unitId], ...place, name: place.name ?? all[unitId]?.name };
  try {
    localStorage.setItem(STORAGE_KEYS.places, JSON.stringify(all));
  } catch {
    /* storage full or blocked — labels are a convenience */
  }
}

/** "DEMO-A-001 · Demo Polling Unit A1", or null when this device never saw it. */
export function placeLabel(unitId: string | null | undefined): string | null {
  if (!unitId) return null;
  const place = readAll()[unitId];
  if (!place) return null;
  return place.name ? `${place.code} · ${place.name}` : place.code;
}
