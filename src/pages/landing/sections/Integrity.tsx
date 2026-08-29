import { X } from "lucide-react";
import { Reveal, Section, SectionHead } from "../ui";

const LIMITS = [
  "Sentinel does not declare winners.",
  "Sentinel does not endorse candidates or political parties.",
  "Sentinel does not replace official electoral results.",
  "Sentinel does not treat social-media sentiment as voter behaviour.",
  "Sentinel does not rely on anonymous rumours as intelligence.",
  "Sentinel does not present scenarios as deterministic predictions.",
];

const STEPS = [
  { id: "01", name: "See.", note: "Real-time signals across geography, field activity and digital environments." },
  { id: "02", name: "Understand.", note: "Turn fragmented information into structured intelligence." },
  { id: "03", name: "Anticipate.", note: "Identify emerging patterns, risks and scenario changes." },
  { id: "04", name: "Act.", note: "Move intelligence into campaigns, operations, communications and decisions." },
];

/** What the platform explicitly does not claim to do. */
export default function Integrity() {
  return (
    <Section id="about">
      <SectionHead eyebrow="Analytical integrity" title="Intelligence. Not Propaganda." />

      <ul className="mt-12 grid gap-3 sm:grid-cols-2">
        {LIMITS.map((limit, i) => (
          <li key={limit}>
            <Reveal delay={(i % 2) * 70}>
              <div className="flex h-full items-start gap-3 rounded-sm border border-l-border bg-l-panel p-4">
                <span
                  className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-l-critical/10 text-l-critical-ink"
                  aria-hidden
                >
                  <X className="size-3" />
                </span>
                <p className="text-[13px] leading-relaxed text-l-foreground">{limit}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>

      <p className="mt-10 max-w-3xl text-lg font-medium leading-snug text-l-foreground">
        Sentinel exists to improve understanding, preparedness and decision-making.
      </p>

      <div className="mt-10 grid gap-px overflow-hidden rounded-sm border border-l-border bg-l-border sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step) => (
          <div key={step.id} className="bg-l-panel p-5">
            <span className="font-mono text-[11px] tabular-nums text-l-ember">
              {step.id}
            </span>
            <h3 className="mt-1.5 text-lg font-bold tracking-tight text-l-foreground">
              {step.name}
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-l-muted-foreground">
              {step.note}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
