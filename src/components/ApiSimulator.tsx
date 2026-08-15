import { useState, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FlaskConical, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import {
  DEFAULT_SETTINGS,
  PRESETS,
  getSettings,
  resetSettings,
  setSettings,
  subscribe,
  type SimulatorSettings,
} from "../services/mock/simulator";
import { resetDb } from "../services/mock/mockDb";
import { USE_MOCK_API } from "../services/instance";
import { cn } from "../lib/format";

function useSimulator(): SimulatorSettings {
  return useSyncExternalStore(subscribe, getSettings, () => DEFAULT_SETTINGS);
}

/**
 * Demo control panel for the mock backend.
 *
 * The screens can't show how they behave on a bad connection until something
 * gives them one. This drives the mock adapter's latency, failure rate and
 * token expiry so loading, error, retry, offline-queue and forced-sign-out
 * states can all be walked through on demand.
 *
 * Renders only while the mock API is in use, so it disappears by itself once
 * `VITE_USE_MOCK_API=false`.
 */
export default function ApiSimulator() {
  const settings = useSimulator();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  if (!USE_MOCK_API) return null;

  const activePreset = Object.entries(PRESETS).find(([, preset]) =>
    Object.entries(preset).every(
      ([key, value]) => settings[key as keyof SimulatorSettings] === value,
    ),
  )?.[0];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open API simulator"
        title="API simulator — demo backend conditions"
        className={cn(
          "absolute bottom-20 right-3 z-40 flex size-11 items-center justify-center rounded-full shadow-lg transition-colors",
          settings.networkDown || settings.errorRate > 0
            ? "bg-warning text-warning-foreground"
            : "bg-console text-console-foreground",
        )}
      >
        <FlaskConical className="size-5" aria-hidden />
      </button>

      {open && (
        <div
          className="absolute inset-0 z-50 flex flex-col justify-end bg-black/50"
          onClick={() => setOpen(false)}
        >
          <div
            className="no-scrollbar max-h-[85%] overflow-y-auto rounded-t-lg border-t border-border bg-surface"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  Demo only
                </p>
                <h2 className="font-display text-lg font-bold uppercase leading-none">
                  API Simulator
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="-mr-1 -mt-1 flex size-8 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" aria-hidden />
              </button>
            </header>

            <div className="space-y-5 px-5 py-5">
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                There's no backend yet, so requests are answered locally — but they
                still travel through the real axios stack. Change the conditions
                here to see how every screen reacts once the API is live.
              </p>

              <section className="space-y-2">
                <Label>Connection profile</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PRESETS).map(([name, preset]) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setSettings(preset)}
                      className={cn(
                        "rounded-sm border py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors",
                        activePreset === name
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-surface text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </section>

              <Slider
                label="Latency"
                value={settings.latencyMs}
                max={4000}
                step={50}
                display={`${settings.latencyMs} ms`}
                onChange={(latencyMs) => setSettings({ latencyMs })}
              />

              <Slider
                label="Failure rate"
                value={Math.round(settings.errorRate * 100)}
                max={100}
                step={5}
                display={`${Math.round(settings.errorRate * 100)}%`}
                onChange={(percent) => setSettings({ errorRate: percent / 100 })}
              />

              <Toggle
                label="Server unreachable"
                hint="Every request fails at the transport layer, as a dead connection would."
                checked={settings.networkDown}
                onChange={(networkDown) => setSettings({ networkDown })}
              />

              <section className="space-y-2 border-t border-border pt-4">
                <Label>One-off scenarios</Label>

                <ActionRow
                  title="Expire my session"
                  hint="Next request returns 401 — the app signs you out and returns to login."
                  action="Trigger"
                  onClick={() => {
                    setSettings({ expireToken: true });
                    setOpen(false);
                    toast.message("Session will expire on the next request");
                  }}
                />

                <ActionRow
                  title="Reset demo data"
                  hint="Restores the seeded tasks, reports and incidents."
                  action="Reset"
                  onClick={async () => {
                    resetDb();
                    await queryClient.invalidateQueries();
                    setOpen(false);
                    toast.success("Demo data reset");
                  }}
                />
              </section>

              <button
                type="button"
                onClick={() => {
                  resetSettings();
                  toast.success("Simulator defaults restored");
                }}
                className="flex w-full items-center justify-center gap-2 rounded-sm border border-border py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-3.5" aria-hidden />
                Restore defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
      {children}
    </span>
  );
}

function Slider({
  label,
  value,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="font-mono text-[10px] font-bold">{display}</span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
        className="w-full accent-[var(--primary)]"
      />
    </section>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3">
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
          {hint}
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 size-4 shrink-0 accent-[var(--primary)]"
      />
    </label>
  );
}

function ActionRow({
  title,
  hint,
  action,
  onClick,
}: {
  title: string;
  hint: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-sm border border-border px-3 py-2.5">
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
          {hint}
        </span>
      </span>
      <button
        type="button"
        onClick={onClick}
        className="shrink-0 rounded-sm border border-border px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest hover:border-foreground/40"
      >
        {action}
      </button>
    </div>
  );
}
