import { Link } from "react-router-dom";
import { Container, Eyebrow } from "../ui";
import NigeriaMap from "./NigeriaMap";

/** Legend entries under the map, colour-matched to the node types. */
const LEGEND = [
  { label: "Turnout signal", colour: "var(--l-signal)" },
  { label: "Sentiment", colour: "var(--l-positive)" },
  { label: "Field activity", colour: "var(--l-foreground)" },
  { label: "Watch signal", colour: "var(--l-amber)" },
];

const READOUTS = [
  { label: "36 States + FCT", value: "Monitored", tone: "text-l-foreground" },
  { label: "Turnout signal", value: "Tracked", tone: "text-l-signal-ink" },
  { label: "Sentiment", value: "Streaming", tone: "text-l-positive-ink" },
  { label: "Field activity", value: "Reporting", tone: "text-l-ember-ink" },
];

export default function Hero() {
  return (
    <div id="top" className="relative overflow-hidden bg-l-background">
      <div className="l-grid pointer-events-none absolute inset-0 opacity-70" aria-hidden />
      {/* Warm wash bleeding in from the top-right, as on the reference. */}
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[720px] rounded-full opacity-45 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--l-ember) 22%, transparent), transparent 68%)",
        }}
        aria-hidden
      />

      <Container className="relative grid items-center gap-14 py-16 lg:grid-cols-[1fr_1fr] lg:gap-12 lg:py-24">
        <div className="l-rise">
          <Eyebrow>Nigeria 2027 Election Intelligence</Eyebrow>

          <h1 className="font-l-display text-[2.9rem] font-semibold leading-[1.05] tracking-[-0.02em] text-l-foreground sm:text-[3.75rem]">
            See the Election Before Election Day.
          </h1>

          <p className="mt-6 max-w-lg font-l-sans text-[17px] leading-[1.6] text-l-foreground/90">
            Understand the forces, signals and voter behaviours shaping Nigeria's 2027
            election.
          </p>

          <p className="mt-5 max-w-lg font-l-sans text-[15px] leading-[1.7] text-l-muted-foreground">
            SMHP Sentinel brings electoral data, voter behaviour, sentiment, field
            intelligence, geographic signals and scenario analysis into one
            decision-support platform built for the complexity of Nigeria's 2027
            elections.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="#platform"
              className="inline-flex items-center gap-2.5 rounded-sm bg-l-ember px-6 py-3.5 font-l-sans text-[15px] font-medium text-white shadow-sm transition-colors hover:bg-l-ember-ink"
            >
              Explore Sentinel
              <span aria-hidden>→</span>
            </a>
            <a
              href="#intelligence"
              className="inline-flex items-center rounded-sm border border-l-border bg-l-panel px-6 py-3.5 font-l-sans text-[15px] font-medium text-l-foreground transition-colors hover:border-l-foreground/30"
            >
              View Intelligence
            </a>
            <Link
              to="/login"
              className="px-2 py-3.5 font-l-sans text-[15px] text-l-muted-foreground underline-offset-4 transition-colors hover:text-l-foreground hover:underline"
            >
              Operator Sign In
            </Link>
          </div>
        </div>

        <IntelligencePanel />
      </Container>
    </div>
  );
}

function IntelligencePanel() {
  return (
    <div
      className="l-rise rounded-sm border border-l-border bg-l-panel shadow-[0_28px_70px_-40px_rgba(23,30,41,0.4)]"
      style={{ animationDelay: "140ms" }}
    >
      <div className="flex items-center justify-between gap-3 px-6 pt-6">
        <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-l-signal-ink">
          <span className="size-1.5 rounded-full bg-l-signal tactical-pulse" aria-hidden />
          Live intelligence
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-l-muted-foreground">
          Sentinel Intelligence Layer
        </span>
      </div>

      <NigeriaMap />

      <ul className="flex flex-wrap gap-x-6 gap-y-2 px-6 pb-5">
        {LEGEND.map((item) => (
          <li
            key={item.label}
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-l-muted-foreground"
          >
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: item.colour }}
              aria-hidden
            />
            {item.label}
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-2 gap-px border-t border-l-border bg-l-border">
        {READOUTS.map((readout) => (
          <div key={readout.label} className="bg-l-panel px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-l-muted-foreground">
              {readout.label}
            </p>
            <p
              className={`mt-1 font-mono text-[13px] uppercase tracking-[0.12em] ${readout.tone}`}
            >
              {readout.value}
            </p>
          </div>
        ))}
      </div>

      <p className="px-6 py-4 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-l-muted-foreground">
        Illustrative visualisation of Sentinel's monitoring surface — not live results.
      </p>
    </div>
  );
}
