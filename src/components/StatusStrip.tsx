import { useEffect, useState } from "react";
import { useOffline } from "../context/offline";

/**
 * Console strip showing the agent whether their work is actually reaching HQ:
 * GPS lock, connection state, queue depth and battery.
 */
export default function StatusStrip() {
  const { isOnline, pending, sync } = useOffline();
  const gps = useGpsLock();

  return (
    <div className="flex items-center justify-between bg-console px-5 py-2 font-mono text-[10px] tracking-tight text-console-foreground/90">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span
            className={
              gps === "locked"
                ? "size-1.5 rounded-full bg-success tactical-pulse"
                : gps === "searching"
                  ? "size-1.5 rounded-full bg-warning tactical-pulse"
                  : "size-1.5 rounded-full bg-white/30"
            }
            aria-hidden
          />
          <span>GPS: {gps.toUpperCase()}</span>
        </div>

        <div className="h-3 w-px bg-white/20" aria-hidden />

        <div className="flex items-center gap-1.5">
          <span className={isOnline ? "font-bold text-success" : "font-bold text-warning"}>
            {isOnline ? "ONLINE" : "OFFLINE"}
          </span>
          {pending > 0 && (
            <button
              type="button"
              onClick={() => void sync()}
              className="opacity-70 underline-offset-2 hover:underline"
              title="Sync queued submissions now"
            >
              ({pending} QUEUED)
            </button>
          )}
        </div>
      </div>

    
    </div>
  );
}

type GpsState = "locked" | "searching" | "off";

/** Watches position so the strip reflects a real fix, not a decoration. */
function useGpsLock(): GpsState {
  const [state, setState] = useState<GpsState>(() =>
    "geolocation" in navigator ? "searching" : "off",
  );

  useEffect(() => {
    if (!("geolocation" in navigator)) return;

    const id = navigator.geolocation.watchPosition(
      () => setState("locked"),
      () => setState("off"),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 20_000 },
    );

    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return state;
}




