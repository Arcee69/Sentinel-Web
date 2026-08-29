import { Reveal, Section, SectionHead } from "../ui";

const ROLES = [
  {
    name: "Political Strategists",
    note: "Understand electoral dynamics, voter movement and structural advantages.",
  },
  {
    name: "Campaign Operations",
    note: "Connect intelligence with mobilisation and field execution.",
  },
  {
    name: "Media & Analysts",
    note: "Track narratives, sentiment and emerging political signals.",
  },
  {
    name: "Policy & Government Stakeholders",
    note: "Understand public mood, trust and institutional pressure.",
  },
  {
    name: "Election Observers",
    note: "Monitor risks, turnout signals and local developments.",
  },
  {
    name: "Organisations & Decision Makers",
    note: "Build evidence-based scenarios around a rapidly changing political environment.",
  },
];

/** Who the platform is designed to serve. */
export default function BuiltFor() {
  return (
    <Section tone="panel">
      <SectionHead eyebrow="Who Sentinel is for" title="Built for serious decision-making." />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ROLES.map((role, i) => (
          <Reveal key={role.name} delay={(i % 3) * 80}>
            <article className="h-full rounded-sm border border-l-border bg-l-background p-5">
              <h3 className="font-l-sans text-[16px] leading-tight text-l-foreground">
                {role.name}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-l-muted-foreground">
                {role.note}
              </p>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
