import { Reveal, Section, SectionHead, Source } from "../ui";

const COHORTS = [
  {
    band: "18–24",
    name: "Young Adults",
    accent: "text-l-iris",
    traits: [
      "Narrative-driven",
      "Credibility-sensitive",
      "High digital exposure",
      "Higher volatility",
    ],
  },
  {
    band: "25–40",
    name: "Middle Age",
    accent: "text-l-signal",
    traits: [
      "Strong economic concerns",
      "Inflation-sensitive",
      "High WhatsApp influence",
      "Significant electoral bloc",
    ],
  },
  {
    band: "40+",
    name: "Older Adults",
    accent: "text-l-teal",
    traits: [
      "Higher turnout certainty",
      "Security and inflation concerns",
      "More stability-oriented",
      "Less social-media dependent",
    ],
  },
  {
    band: "Cross-cohort",
    name: "Swing / Persuadable",
    accent: "text-l-ember",
    traits: [
      "Less ideologically fixed",
      "Highly responsive to conditions",
      "Influenced by competence and economic realities",
      "Potentially decisive",
    ],
  },
];

/** Voter archetypes drawn from the intelligence guide. */
export default function Cohorts() {
  return (
    <Section tone="panel">
      <SectionHead
        eyebrow="Voter intelligence"
        title="Understand the Nigerian Electorate."
        lede="Participation, persuadability and the issues that move each group differ sharply across the electorate."
      />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {COHORTS.map((cohort, i) => (
          <Reveal key={cohort.name} delay={i * 80}>
            <article className="flex h-full flex-col rounded-sm border border-l-border bg-l-background p-5">
              <p className={`font-mono text-lg font-medium tabular-nums ${cohort.accent}`}>
                {cohort.band}
              </p>
              <h3 className="mt-1 font-l-sans text-[16px] text-l-foreground">
                {cohort.name}
              </h3>
              <ul className="mt-4 space-y-2 border-t border-l-border pt-4">
                {cohort.traits.map((trait) => (
                  <li
                    key={trait}
                    className="flex gap-2 text-[13px] leading-snug text-l-muted-foreground"
                  >
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-l-hairline" aria-hidden />
                    {trait}
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
        ))}
      </div>

      <Source>
        Source: Nigeria 2027 Elections Intelligence Guide — voter archetypes
      </Source>
    </Section>
  );
}
