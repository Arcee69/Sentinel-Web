import { Section, SectionHead, Source } from "../ui";
import { useCountUp, useInView } from "../hooks";

const FIGURES = [
  { value: 3000, decimals: 0, prefix: "", suffix: "", label: "Respondents" },
  { value: 6, decimals: 0, prefix: "", suffix: "", label: "Geopolitical zones" },
  { value: 95, decimals: 0, prefix: "", suffix: "%", label: "Confidence level" },
  { value: 1.8, decimals: 1, prefix: "±", suffix: "%", label: "Approx. margin of error" },
];

const INSIGHTS = [
  { stat: "38%", note: "of voters are described in the report as not locked in." },
  { stat: "Cost of Living", note: "is identified as a defining issue." },
  { stat: "57%", note: "of respondents expressed distrust in the electoral system." },
  { stat: "28%", note: "selected candidate competence as a voting decision driver." },
  { stat: "WhatsApp", note: "is identified as a primary political information battlefield." },
  { stat: "Credibility + Safety + Ease", note: "are presented as key turnout levers." },
];

/** Survey basis behind the intelligence guide. */
export default function Evidence() {
  const { ref, seen } = useInView<HTMLDivElement>();

  return (
    <Section>
      <SectionHead
        eyebrow="Evidence base"
        title="Intelligence Grounded in Voter Reality."
        lede="The intelligence guide incorporates a nationwide survey of approximately 3,000 respondents across all six geopolitical zones, examining voter sentiment, participation, intent, priorities, trust and decision triggers."
      />

      <div className="mt-10 flex flex-wrap gap-3">
        <Meta label="Fieldwork" value="January 30 – March 05" />
        <Meta label="Method" value="Hybrid Data Collection" />
      </div>

      <div
        ref={ref}
        className="mt-8 grid gap-px overflow-hidden rounded-sm border border-l-border bg-l-border sm:grid-cols-2 lg:grid-cols-4"
      >
        {FIGURES.map((figure) => (
          <Figure key={figure.label} {...figure} active={seen} />
        ))}
      </div>

      <p className="mt-4 text-xs text-l-muted-foreground/80">
        These are characteristics of the referenced survey in the guide, not live Sentinel
        telemetry.
      </p>

      <h3 className="mt-14 font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-l-signal">
        Key survey insights
      </h3>

      <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {INSIGHTS.map((insight) => (
          <li
            key={insight.stat}
            className="rounded-sm border border-l-border bg-l-panel p-5"
          >
            <p className="text-xl font-bold leading-tight tracking-tight text-l-signal-ink">
              {insight.stat}
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-l-muted-foreground">
              {insight.note}
            </p>
          </li>
        ))}
      </ul>

      <Source>Source: Nigeria 2027 Elections Intelligence Guide</Source>
    </Section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-l-border bg-l-panel px-4 py-2.5">
      <p className="font-mono text-[10px] uppercase tracking-widest text-l-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-[13px] font-semibold text-l-foreground">{value}</p>
    </div>
  );
}

function Figure({
  value,
  decimals,
  prefix,
  suffix,
  label,
  active,
}: {
  value: number;
  decimals: number;
  prefix: string;
  suffix: string;
  label: string;
  active: boolean;
}) {
  const current = useCountUp(value, active);
  const shown = decimals > 0
    ? current.toFixed(decimals)
    : Math.round(current).toLocaleString();

  return (
    <div className="bg-l-panel p-6">
      <p className="text-3xl font-bold tabular-nums tracking-tight text-l-foreground">
        {prefix}
        {shown}
        <span className="text-l-signal">{suffix}</span>
      </p>
      <p className="mt-2 text-[13px] font-medium text-l-muted-foreground">{label}</p>
    </div>
  );
}
