import { ArrowLink, Section, SectionHead } from "../ui";
import { useInView } from "../hooks";
import { cn } from "../../../lib/format";

interface Signal {
  code: string;
  name: string;
  tint: string;
  /** Sparkline bar heights in px, oldest reading first. */
  bars: number[];
}

const SIGNALS: Signal[] = [
  {
    code: "S01",
    name: "Voter Registration Spikes",
    tint: "var(--l-ember)",
    bars: [6, 9, 12, 15, 18, 21, 8, 11],
  },
  {
    code: "S02",
    name: "Youth Mobilisation",
    tint: "var(--l-teal)",
    bars: [11, 14, 17, 20, 7, 10, 13, 16],
  },
  {
    code: "S03",
    name: "Google Search Trends",
    tint: "var(--l-iris)",
    bars: [16, 19, 6, 9, 12, 15, 18, 21],
  },
  {
    code: "S04",
    name: "Political Defections",
    tint: "var(--l-amber)",
    bars: [21, 8, 11, 14, 17, 20, 7, 10],
  },
  {
    code: "S05",
    name: "Sentiment Movement",
    tint: "var(--l-positive)",
    bars: [10, 13, 16, 19, 6, 9, 12, 15],
  },
];

/** Feed lines converge on the hub from four independent sources. */
const FEEDS = [
  { y: 40, dur: "1.6s" },
  { y: 80, dur: "1.8s" },
  { y: 120, dur: "2s" },
  { y: 160, dur: "2.2s" },
];

/** Independent signals converging into a single directional alert. */
export default function EarlyWarning() {
  const { ref, seen } = useInView<HTMLDivElement>();

  return (
    <Section tone="panel">
      <SectionHead
        eyebrow="Early warning system"
        title="Detect the Shift Before It Becomes the Story."
        lede="Sentinel continuously brings together signals that can indicate changing electoral conditions."
      />

      <div
        ref={ref}
        className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-center"
      >
        <ul className="grid gap-px overflow-hidden rounded-sm border border-l-border bg-l-border">
          {SIGNALS.map((signal, i) => (
            <li
              key={signal.code}
              className={cn(
                "l-tint-cell flex items-center gap-3 px-4 py-3.5 transition-all duration-700 ease-out",
                seen ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
              )}
              style={{
                ["--l-tint" as string]: signal.tint,
                transitionDelay: `${i * 60}ms`,
              }}
            >
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-l-signal-ink">
                {signal.code}
              </span>
              <span className="font-l-sans text-sm text-l-foreground">{signal.name}</span>

              <span className="ml-auto flex items-end gap-0.5" aria-hidden>
                {signal.bars.map((h, b) => (
                  <span
                    key={b}
                    className="w-0.5 bg-l-signal/70 transition-[height] duration-700 ease-out"
                    style={{ height: seen ? h : 2, transitionDelay: `${i * 60 + b * 40}ms` }}
                  />
                ))}
              </span>
            </li>
          ))}
        </ul>

        <div
          className={cn(
            "rounded-sm border border-l-border bg-l-panel p-6 shadow-sm transition-all duration-700 ease-out",
            seen ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
          )}
          style={{ transitionDelay: "120ms" }}
        >
          <svg
            viewBox="0 0 360 200"
            className="w-full"
            role="img"
            aria-label="Diagram showing independent signals converging into a single alert"
          >
            {FEEDS.map((feed) => (
              <g key={feed.y}>
                <circle cx="30" cy={feed.y} r="4" fill="var(--l-signal)" opacity="0.8" />
                <path
                  d={`M34 ${feed.y} C 120 ${feed.y}, 150 100, 210 100`}
                  fill="none"
                  stroke="var(--l-signal)"
                  strokeWidth="0.9"
                  strokeDasharray="4 5"
                  opacity="0.55"
                >
                  {/* Dashes travel toward the hub, so the feed reads as live. */}
                  <animate
                    attributeName="stroke-dashoffset"
                    from="18"
                    to="0"
                    dur={feed.dur}
                    repeatCount="indefinite"
                  />
                </path>
              </g>
            ))}

            <circle cx="215" cy="100" r="16" fill="none" stroke="var(--l-signal)" strokeWidth="1" />
            <circle cx="215" cy="100" r="6" fill="var(--l-signal)" />
            <text
              x="215"
              y="140"
              textAnchor="middle"
              fontSize="9"
              fontFamily="var(--font-l-mono)"
              fill="var(--l-muted-foreground)"
            >
              CONVERGENCE
            </text>

            <path d="M235 100 L292 100" stroke="var(--l-warning)" strokeWidth="1" />
            <rect x="292" y="86" width="52" height="28" fill="none" stroke="var(--l-warning)" strokeWidth="1" />
            <text
              x="318"
              y="104"
              textAnchor="middle"
              fontSize="10"
              fontFamily="var(--font-l-mono)"
              fill="var(--l-warning)"
            >
              ALERT
            </text>
          </svg>

          <p className="mt-4 font-l-sans text-sm leading-relaxed text-l-muted-foreground">
            When multiple independent signals move together, the system can identify an
            emerging directional shift.
          </p>

          <div className="mt-5">
            <ArrowLink href="#platform">Explore Early Warning Intelligence</ArrowLink>
          </div>
        </div>
      </div>
    </Section>
  );
}
