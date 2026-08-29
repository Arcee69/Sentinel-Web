import { ChevronRight } from "lucide-react";
import { Reveal, Section, SectionHead } from "../ui";

const CHAIN = ["Nigeria", "Region", "State", "LGA", "Ward", "Polling Unit"];

const TIERS = [
  {
    name: "State Intelligence",
    items: ["Turnout", "Sentiment", "Political activity", "Risk"],
  },
  {
    name: "LGA Intelligence",
    items: ["Field activity", "Mobilisation", "Issues", "Alerts"],
  },
  {
    name: "Ward / Polling Unit",
    items: ["Reports", "Incidents", "Local signals", "Field intelligence"],
  },
];

/** National signals resolved down to the polling unit. */
export default function Geography() {
  return (
    <Section>
      <SectionHead
        eyebrow="Geographic intelligence"
        title="From Nigeria to the Polling Unit."
        lede="Electoral intelligence becomes more useful when national signals can be connected to local realities."
      />

      <ol className="mt-12 flex flex-wrap items-center gap-2">
        {CHAIN.map((level, i) => (
          <li key={level} className="flex items-center gap-2">
            <span className="rounded-sm border border-l-border bg-l-panel px-3 py-2 text-[13px] font-medium text-l-foreground">
              {level}
            </span>
            {i < CHAIN.length - 1 && (
              <ChevronRight className="size-4 text-l-hairline" aria-hidden />
            )}
          </li>
        ))}
      </ol>

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {TIERS.map((tier, i) => (
          <Reveal key={tier.name} delay={i * 90}>
            <article className="h-full rounded-sm border border-l-border bg-l-panel p-5">
              <h3 className="font-l-sans text-[16px] text-l-foreground">{tier.name}</h3>
              <ul className="mt-4 grid grid-cols-2 gap-2 border-t border-l-border pt-4">
                {tier.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-sm bg-l-panel-2 px-2.5 py-2 text-center font-mono text-[10px] uppercase tracking-wide text-l-muted-foreground"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
