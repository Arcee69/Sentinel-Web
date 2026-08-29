import {Card, Section, SectionHead, Source} from "../ui";
import { accentAt } from "../accents";
import { useCountUp, useInView } from "../hooks";

const STATS = [
  { value: 93, suffix: "M+", decimals: 0, label: "Registered voters", note: "2023 electoral data" },
  { value: 176846, suffix: "", decimals: 0, label: "Polling units", note: "INEC structure" },
  { value: 774, suffix: "", decimals: 0, label: "Local government areas", note: "Administrative baseline" },
  { value: 18818, suffix: "", decimals: 0, label: "Wards", note: "Administrative baseline" },
  { value: 1.5, suffix: "M+", decimals: 1, label: "Ad-hoc personnel", note: "Deployed in 2023" },
];

/** Structural scale of the Nigerian electoral system. */
export default function Baseline() {
  const { ref, seen } = useInView<HTMLDivElement>();

  return (
    <Section>
      <SectionHead
        eyebrow="Reference baseline"
        title="Nigeria's Electoral System at a Glance"
      />

      <div ref={ref} className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {STATS.map((stat, i) => (
          <Figure key={stat.label} {...stat} accent={accentAt(i)} active={seen} />
        ))}
      </div>

      <Source>
        Baseline figures derived from the Nigeria 2027 Elections Intelligence Guide and
        referenced INEC data. Current electoral figures should be validated against the
        latest official INEC publication.
      </Source>
    </Section>
  );
}

function Figure({
  value,
  suffix,
  decimals,
  label,
  note,
  accent,
  active,
}: {
  value: number;
  suffix: string;
  decimals: number;
  label: string;
  note: string;
  accent: string;
  active: boolean;
}) {
  const current = useCountUp(value, active);
  const shown = decimals > 0
    ? current.toFixed(decimals)
    : Math.round(current).toLocaleString();

  return (
    <Card accent={accent} className="px-5 py-6">
      <p className="font-l-display text-[1.85rem] font-semibold leading-none tracking-[-0.02em] text-l-foreground">
        {shown}
        {suffix}
      </p>
      <p className="mt-3 font-l-sans text-[14px] text-l-foreground">{label}</p>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-l-muted-foreground">
        {note}
      </p>
    </Card>
  );
}
