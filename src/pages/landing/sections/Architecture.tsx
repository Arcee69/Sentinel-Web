import { ChevronRight } from "lucide-react";
import { Reveal, Section, SectionHead } from "../ui";

const LAYERS = [
  { id: "01", name: "Electoral Data", note: "Historical results, turnout and electoral structures." },
  { id: "02", name: "Voter Intelligence", note: "Demographics, behavioural patterns, participation signals." },
  { id: "03", name: "Digital Intelligence", note: "Social conversations, search behaviour and online narratives." },
  { id: "04", name: "Field Intelligence", note: "Reports, incidents, local activity and ground signals." },
  { id: "05", name: "AI Analysis", note: "Signal detection, classification, summarisation and anomaly identification." },
  { id: "06", name: "Decision Intelligence", note: "Alerts, scenarios, dashboards and actionable insights." },
];

const PIPELINE = ["Data", "Signal", "Analysis", "Intelligence", "Decision", "Action"];

/** The six layers feeding one intelligence surface. */
export default function Architecture() {
  return (
    <Section>
      <SectionHead
        eyebrow="Architecture"
        title="One Intelligence Layer. Multiple Sources of Truth."
      />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LAYERS.map((layer, i) => (
          <Reveal key={layer.id} delay={(i % 3) * 80}>
            <article className="h-full rounded-sm border border-l-border bg-l-panel p-5">
              <span className="font-mono text-[11px] tabular-nums text-l-signal">
                {layer.id}
              </span>
              <h3 className="mt-1.5 font-l-sans text-[16px] text-l-foreground">
                {layer.name}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-l-muted-foreground">
                {layer.note}
              </p>
            </article>
          </Reveal>
        ))}
      </div>

      <ol className="mt-10 flex flex-wrap items-center justify-center gap-2 rounded-sm border border-l-border bg-l-panel-2 px-5 py-4">
        {PIPELINE.map((step, i) => (
          <li key={step} className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-medium uppercase tracking-widest text-l-foreground">
              {step}
            </span>
            {i < PIPELINE.length - 1 && (
              <ChevronRight className="size-3.5 text-l-hairline" aria-hidden />
            )}
          </li>
        ))}
      </ol>
    </Section>
  );
}
