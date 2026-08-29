import { Activity, AlertTriangle, Users } from "lucide-react";
import { Section, SectionHead } from "../ui";

const METRICS = [
  { label: "States monitored", value: "36 + FCT" },
  { label: "Critical alerts", value: "04" },
  { label: "Sentiment score", value: "62 / 100" },
  { label: "Active agents", value: "1,284" },
];

const ALERTS = [
  "Turnout signal divergence",
  "Narrative velocity anomaly",
  "Field incident cluster",
];

const STREAM = [
  "Geo-intelligence heatmap refreshed",
  "Alert escalated · North-West cluster",
  "Field report ingested · Kano LGA",
];

/** Mock of the command centre the intelligence feeds into. */
export default function PlatformPreview() {
  return (
    <Section id="platform" tone="panel">
      <SectionHead
        eyebrow="The platform"
        title="Intelligence Is Only Useful When It Drives Action."
      />

      <div className="mt-12 overflow-hidden rounded-sm border border-l-border bg-l-background shadow-[0_24px_60px_-40px_rgba(23,30,41,0.4)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-l-border bg-l-panel px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="flex gap-1.5" aria-hidden>
              <span className="size-2.5 rounded-full bg-l-critical/60" />
              <span className="size-2.5 rounded-full bg-l-amber/60" />
              <span className="size-2.5 rounded-full bg-l-positive/60" />
            </span>
            <span className="text-[13px] font-semibold text-l-foreground">
              National Command Dashboard
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-l-muted-foreground">
            sentinel.smhp<span className="text-l-signal">/app</span>
          </span>
        </div>

        <div className="grid gap-px bg-l-border sm:grid-cols-4">
          {METRICS.map((metric) => (
            <div key={metric.label} className="bg-l-background p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-l-muted-foreground">
                {metric.label}
              </p>
              <p className="mt-1.5 text-xl font-bold tabular-nums tracking-tight text-l-foreground">
                {metric.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-px border-t border-l-border bg-l-border lg:grid-cols-[1.4fr_1fr]">
          <div className="bg-l-background p-5">
            <p className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-l-muted-foreground">
              <Activity className="size-3 text-l-signal" aria-hidden />
              Geo-intelligence heatmap
            </p>
            <Heatmap />
          </div>

          <div className="bg-l-background p-5">
            <p className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-l-muted-foreground">
              <AlertTriangle className="size-3 text-l-critical" aria-hidden />
              Critical alerts
            </p>
            <ul className="space-y-2">
              {ALERTS.map((alert) => (
                <li
                  key={alert}
                  className="rounded-sm border border-l-critical/25 bg-l-critical/8 px-3 py-2 text-[12px] font-medium text-l-critical-ink"
                >
                  {alert}
                </li>
              ))}
            </ul>

            <p className="mb-3 mt-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-l-muted-foreground">
              <Users className="size-3 text-l-teal" aria-hidden />
              Activity stream
            </p>
            <ul className="space-y-2">
              {STREAM.map((entry) => (
                <li
                  key={entry}
                  className="flex gap-2 text-[12px] leading-snug text-l-muted-foreground"
                >
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-l-teal" aria-hidden />
                  {entry}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-l-muted-foreground/80">
        Interface preview · illustrative values, not live electoral measurements.
      </p>
    </Section>
  );
}

/** Deterministic intensity grid — a stand-in for the live heatmap. */
function Heatmap() {
  const cells = Array.from({ length: 72 }, (_, i) => {
    // Cheap repeatable pseudo-random so the pattern is stable across renders.
    const n = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
    return n;
  });

  return (
    <div className="grid grid-cols-12 gap-1" aria-hidden>
      {cells.map((intensity, i) => (
        <span
          key={i}
          className="aspect-square rounded-[2px]"
          style={{
            backgroundColor: "var(--l-signal)",
            opacity: 0.08 + intensity * 0.72,
          }}
        />
      ))}
    </div>
  );
}
