import { useState } from "react";
import { Panel, PullQuote, Section, SectionHead, Source } from "../ui";
import { useInView } from "../hooks";
import { cn } from "../../../lib/format";

const SERIES = [
  { year: "1999", pct: 52, note: "Return to civilian rule drew broad participation." },
  { year: "2003", pct: 69, note: "The high-water mark for recorded turnout." },
  { year: "2007", pct: 57, note: "Participation begins its long retreat." },
  { year: "2011", pct: 52, note: "Competitive contest, still above half." },
  { year: "2015", pct: 44, note: "First opposition win at federal level." },
  { year: "2019", pct: 35, note: "Turnout falls sharply below prior cycles." },
  { year: "2023", pct: 27, note: "Lowest recorded participation to date." },
];

const TICKS = [80, 60, 40, 20];
const MIN = 10;
const MAX = 80;

/** Long-run decline in presidential turnout, plotted as a line. */
export default function Turnout() {
  const { ref, seen } = useInView<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const current = active === null ? null : SERIES[active];

  // Plot geometry in viewBox units.
  const W = 900;
  const H = 320;
  const padX = 46;
  const padTop = 30;
  const padBottom = 34;

  const xAt = (i: number) => padX + (i / (SERIES.length - 1)) * (W - padX * 2);
  const yAt = (pct: number) =>
    padTop + (1 - (pct - MIN) / (MAX - MIN)) * (H - padTop - padBottom);

  const line = SERIES.map((p, i) => `${i === 0 ? "M" : "L"}${xAt(i)} ${yAt(p.pct)}`).join(" ");
  const area = `${line} L${xAt(SERIES.length - 1)} ${H - padBottom} L${xAt(0)} ${H - padBottom} Z`;

  return (
    <Section>
      <SectionHead
        eyebrow="Turnout intelligence"
        title="The Silent Variable: Turnout"
        lede="Nigeria's voter turnout has experienced a long-term structural decline. As participation falls, organisational strength, mobilisation capacity and turnout efficiency become increasingly important."
      />

      <Panel className="mt-10 p-5 sm:p-7">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-l-sans text-[15px] text-l-foreground">
            Presidential Election Turnout — 1999–2023
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-l-muted-foreground">
            Share of registered voters
          </p>
        </div>

        <div ref={ref} onMouseLeave={() => setActive(null)}>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full"
            role="img"
            aria-label="Line chart of Nigerian presidential election turnout from 1999 to 2023, declining from 52% to 27%"
          >
            {TICKS.map((tick) => (
              <g key={tick}>
                <line
                  x1={padX}
                  y1={yAt(tick)}
                  x2={W - padX}
                  y2={yAt(tick)}
                  stroke="var(--l-border)"
                  strokeWidth="1"
                />
                <text
                  x={padX - 12}
                  y={yAt(tick) + 4}
                  textAnchor="end"
                  fontSize="12"
                  fontFamily="var(--font-l-mono)"
                  fill="var(--l-muted-foreground)"
                >
                  {tick}%
                </text>
              </g>
            ))}

            <path d={area} fill="var(--l-signal)" fillOpacity={seen ? 0.07 : 0} style={{ transition: "fill-opacity 900ms ease" }} />

            <path
              d={line}
              fill="none"
              stroke="var(--l-signal)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={seen ? 0 : 1}
              style={{ transition: "stroke-dashoffset 1400ms cubic-bezier(0.16,1,0.3,1)" }}
            />

            {SERIES.map((point, i) => (
              <g
                key={point.year}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                tabIndex={0}
                role="button"
                aria-label={`${point.year}: ${point.pct}% turnout`}
                className="cursor-pointer outline-none"
              >
                {/* Generous invisible target so hovering the line is easy. */}
                <rect
                  x={xAt(i) - 30}
                  y={padTop}
                  width="60"
                  height={H - padTop - padBottom}
                  fill="transparent"
                />
                <text
                  x={xAt(i)}
                  y={yAt(point.pct) - 16}
                  textAnchor="middle"
                  fontSize="14"
                  fontFamily="var(--font-l-sans)"
                  fill={active === i ? "var(--l-signal-ink)" : "var(--l-foreground)"}
                >
                  {point.pct}%
                </text>
                <circle
                  cx={xAt(i)}
                  cy={yAt(point.pct)}
                  r={active === i ? 7 : 5}
                  fill={active === i ? "var(--l-signal-ink)" : "var(--l-signal)"}
                  stroke="var(--l-panel)"
                  strokeWidth="2"
                  style={{ opacity: seen ? 1 : 0, transition: "opacity 500ms ease" }}
                />
                <text
                  x={xAt(i)}
                  y={H - 10}
                  textAnchor="middle"
                  fontSize="12"
                  fontFamily="var(--font-l-mono)"
                  fill="var(--l-muted-foreground)"
                >
                  {point.year}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <p
          className={cn(
            "mt-4 border-t border-l-border pt-4 font-l-sans text-[14px] leading-relaxed",
            current ? "text-l-foreground" : "text-l-muted-foreground",
          )}
        >
          {current ? (
            <>
              <span className="font-mono text-[11px] tracking-[0.12em] text-l-signal-ink">
                {current.year}
              </span>{" "}
              {current.note}
            </>
          ) : (
            "Hover, or focus the chart and use the arrow keys, for contextual insight."
          )}
        </p>
      </Panel>

      <div className="mt-10 max-w-2xl">
        <PullQuote>
          Elections are increasingly decided by who shows up, not simply by who is most
          popular.
        </PullQuote>
      </div>

      <Source>Source: INEC / Nigeria 2027 Elections Intelligence Guide</Source>
    </Section>
  );
}
