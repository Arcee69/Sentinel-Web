import { useEffect } from "react";
import { useAuth } from "../context/auth";
import { useOffline } from "../context/offline";
import * as service from "../services/agentService";

/** Measured cadence — presence for the command desk, not fabricated activity. */
const INTERVAL_MS = 5 * 60_000;

/**
 * Checks the active assignment in while the app is open, visible and online,
 * so the back office's agent roster reflects who is actually in the field.
 */
export function useHeartbeat() {
  const { workspace } = useAuth();
  const { isOnline } = useOffline();
  const assignmentId = workspace?.assignmentId;

  useEffect(() => {
    if (!assignmentId || !isOnline) return;

    const beat = () => {
      if (document.visibilityState !== "visible") return;
      // Presence is best effort; a missed beat must never bother the agent.
      service.heartbeat(assignmentId).catch(() => undefined);
    };

    beat();
    const id = window.setInterval(beat, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [assignmentId, isOnline]);
}
