import { useState } from "react";
import {Level, Section, SectionHead} from "../ui";
import { accentAt } from "../accents";
import { cn } from "../../../lib/format";

const SCENARIOS = [
  {
    id: "01",
    name: "Legitimacy Recovery",
    risk: "Moderate",
    probability: 0.42,
    impact: 0.55,
    conditions: [
      "Improved credibility signals",
      "More transparent logistics",
      "Reduced election-day violence",
    ],
    implications: [
      "Higher turnout",
      "Increased youth participation",
      "Greater participation from persuadable voters",
    ],
  },
  {
    id: "02",
    name: "Security Deterioration",
    risk: "High",
    probability: 0.6,
    impact: 0.72,
    conditions: ["Rising insecurity", "Violence around campaigns or polling units"],
    implications: [
      "Rural turnout decline",
      "Regional distortion",
      "Swing voters retreating into apathy",
    ],
  },
  {
    id: "03",
    name: "Economic Shock",
    risk: "High",
    probability: 0.68,
    impact: 0.64,
    conditions: ["Further inflation", "Currency instability", "Fuel/subsidy crisis"],
    implications: [
      "Higher protest voting",
      "Harder anti-incumbent sentiment",
      "Anger becoming a major mobilisation force",
    ],
  },
  {
    id: "04",
    name: "Legitimacy Collapse & Apathy",
    risk: "Very High",
    probability: 0.5,
    impact: 0.88,
    conditions: [
      "Further deterioration in trust",
      "Perception that outcomes are predetermined",
    ],
    implications: ["Turnout below 30%", "High youth abstention", "Elite-dominated participation"],
  },
];

/** Four modelled futures, with a probability × impact plot. */
export default function Scenarios() {
  const [active, setActive] = useState(1);

  return (
    <Section id="scenarios">
      <SectionHead
        eyebrow="Scenario intelligence"
        title={
          <>
            Don't Just Monitor What Is Happening.
            <span className="mt-2 block text-l-muted-foreground">
              Model What Could Happen Next.
            </span>
          </>
        }
      />

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <ul className="grid gap-4 sm:grid-cols-2">
          {SCENARIOS.map((scenario, i) => (
            <li key={scenario.id}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-pressed={i === active}
                className={cn(
                  "l-card flex h-full w-full flex-col rounded-sm p-5 text-left transition-colors",
                  i === active ? "ring-1 ring-l-signal" : "hover:border-l-foreground/25",
                )}
                style={{ ["--l-card-accent" as string]: accentAt(i) }}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-l-muted-foreground">
                    Scenario {scenario.id}
                  </span>
                  <Level level={scenario.risk} />
                </div>

                <h3 className="font-l-sans text-[17px] leading-tight text-l-foreground">
                  {scenario.name}
                </h3>

                <Block title="Conditions" items={scenario.conditions} />
                <Block title="Potential implications" items={scenario.implications} />
              </button>
            </li>
          ))}
        </ul>

        <Matrix active={active} onSelect={setActive} />
      </div>

      <p className="mt-8 max-w-3xl font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-l-muted-foreground">
        Scenarios are analytical constructs designed to support preparedness and
        decision-making. They are not predictions of electoral outcomes.
      </p>
    </Section>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-l-muted-foreground">
        {title}
      </p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li
            key={item}
            className="flex gap-2 text-[13px] leading-snug text-l-muted-foreground"
          >
            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-l-hairline" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Matrix({
  active,
  onSelect,
}: {
  active: number;
  onSelect: (index: number) => void;
}) {
  const scenario = SCENARIOS[active];

  return (
    <div className="rounded-sm border border-l-border bg-l-panel p-5 lg:sticky lg:top-24 lg:self-start">
      <p className="font-mono text-[10px] uppercase tracking-widest text-l-muted-foreground">
        Probability × Impact × Stability
      </p>

      <div className="relative mt-4 aspect-square w-full rounded-sm border border-l-border bg-l-background">
        <div className="l-grid absolute inset-0 rounded-sm opacity-60" aria-hidden />

        {SCENARIOS.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(i)}
            aria-label={`${item.name}: probability ${Math.round(item.probability * 100)}%, impact ${Math.round(item.impact * 100)}%`}
            aria-pressed={i === active}
            className={cn(
              "absolute flex size-9 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border-2 font-mono text-[10px] font-medium transition-colors",
              i === active
                ? "border-l-signal bg-l-signal text-l-primary-foreground"
                : "border-l-hairline bg-l-panel text-l-muted-foreground hover:border-l-signal",
            )}
            style={{ left: `${item.probability * 100}%`, bottom: `${item.impact * 100}%` }}
          >
            {item.id}
          </button>
        ))}

        <span className="absolute bottom-2 right-3 font-mono text-[9px] uppercase tracking-widest text-l-muted-foreground">
          Probability →
        </span>
        <span
          className="absolute left-2 top-3 font-mono text-[9px] uppercase tracking-widest text-l-muted-foreground"
          style={{ writingMode: "vertical-rl" }}
        >
          Impact →
        </span>
      </div>

      <p className="mt-4 text-[13px] leading-relaxed text-l-foreground">
        <span className="font-mono text-[10px] uppercase tracking-widest text-l-muted-foreground">
          Selected
        </span>
        <br />
        <span className="font-semibold">{scenario.name}</span>
        <span className="text-l-muted-foreground"> · stability pressure </span>
        <span className="font-semibold text-l-critical-ink">
          {scenario.risk.toLowerCase()}
        </span>
      </p>
    </div>
  );
}
