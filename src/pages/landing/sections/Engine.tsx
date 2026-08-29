import { useState } from "react";
import { ArrowLink, Panel, Section, SectionHead } from "../ui";
import { cn } from "../../../lib/format";

/** Horizontal breathing room so the outermost labels are never clipped. */
const GUTTER = 92;

/** Vertical crop — the ring plus its top/bottom labels, without dead space. */
const TOP = 40;
const BOTTOM = 524;

const FORCES = [
  { name: "Turnout Dynamics", note: "Who shows up can matter more than who is most popular." },
  { name: "Elite Alignment", note: "Coalitions, defections and endorsements redraw the arithmetic." },
  { name: "Identity Mobilisation", note: "Ethnic, regional and faith networks shape how blocs move." },
  { name: "Economic Pressure", note: "Inflation and cost-of-living weigh directly on voter mood." },
  { name: "Institutional Trust", note: "Confidence in the process affects whether people participate." },
  { name: "Mobilisation", note: "Organisational reach converts sentiment into actual votes." },
];

/** Six interacting forces, plotted on a labelled ring. */
export default function Engine() {
  const [active, setActive] = useState(0);
  const force = FORCES[active];

  return (
    <Section id="intelligence" tone="panel">
      <div className="grid items-center gap-10 lg:grid-cols-[0.74fr_1.26fr]">
        <div>
          <SectionHead
            eyebrow="The Electoral Engine™"
            title="Six forces. One interacting system."
            lede="Elections are not determined by a single variable. They emerge from the interaction of turnout, identity, economic pressure, institutional trust, elite alignment and mobilisation."
          />

          <Panel className="mt-8 px-5 py-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-l-signal-ink">
              {force.name}
            </p>
            <p className="mt-2 font-l-sans text-[15px] leading-[1.6] text-l-foreground">
              {force.note}
            </p>
          </Panel>

          <ul className="mt-5 flex flex-wrap gap-2">
            {FORCES.map((item, i) => (
              <li key={item.name}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-pressed={i === active}
                  className={cn(
                    "rounded-sm border px-3.5 py-2 font-l-sans text-[13px] transition-colors",
                    i === active
                      ? "border-l-signal bg-l-signal/8 text-l-signal-ink"
                      : "border-l-border bg-l-panel text-l-muted-foreground hover:border-l-foreground/25 hover:text-l-foreground",
                  )}
                >
                  {item.name}
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-7">
            <ArrowLink href="#scenarios">Explore the Intelligence Model</ArrowLink>
          </div>
        </div>

        <ForceRing active={active} onSelect={setActive} />
      </div>
    </Section>
  );
}

function ForceRing({
  active,
  onSelect,
}: {
  active: number;
  onSelect: (index: number) => void;
}) {
  const size = 560;
  const c = size / 2;
  const radius = 200;

  // Start at 12 o'clock so the first force reads top-centre.
  const pointAt = (i: number) => {
    const angle = (i / FORCES.length) * Math.PI * 2 - Math.PI / 2;
    return { x: c + Math.cos(angle) * radius, y: c + Math.sin(angle) * radius, angle };
  };

  return (
    <svg
      viewBox={`${-GUTTER} ${TOP} ${size + GUTTER * 2} ${BOTTOM - TOP}`}
      className="mx-auto h-auto w-full"
      aria-hidden="true"
    >
      <circle
        cx={c}
        cy={c}
        r={radius}
        fill="none"
        stroke="var(--l-border)"
        strokeWidth="1"
      />
      <circle
        cx={c}
        cy={c}
        r={radius - 50}
        fill="none"
        stroke="var(--l-border)"
        strokeWidth="1"
        opacity="0.55"
      />

      {/* Chords between every pair — the "interacting system". */}
      {FORCES.map((_, i) =>
        FORCES.slice(i + 1).map((__, j) => {
          const a = pointAt(i);
          const b = pointAt(i + j + 1);
          const involved = i === active || i + j + 1 === active;
          return (
            <line
              key={`${i}-${j}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={involved ? "var(--l-signal)" : "var(--l-hairline)"}
              strokeOpacity={involved ? 0.55 : 0.3}
              strokeWidth={involved ? 1.2 : 0.8}
            />
          );
        }),
      )}

      <text
        x={c}
        y={c + 4}
        textAnchor="middle"
        fontSize="14"
        fontFamily="var(--font-l-mono)"
        letterSpacing="2.4"
        fill="var(--l-muted-foreground)"
      >
        ELECTORAL ENGINE
      </text>

      {FORCES.map((force, i) => {
        const { x, y } = pointAt(i);
        const isActive = i === active;
        // Push the label outward, flipping side so text never crosses the ring.
        const dx = x - c;
        const labelX = x + (Math.abs(dx) < 12 ? 0 : dx > 0 ? 16 : -16);
        const anchor = Math.abs(dx) < 12 ? "middle" : dx > 0 ? "start" : "end";
        const labelY = y < c ? y - 22 : y + 30;

        return (
          <g
            key={force.name}
            data-force={force.name}
            onClick={() => onSelect(i)}
            className="cursor-pointer"
          >
            <circle
              cx={x}
              cy={y}
              r={isActive ? 13 : 8}
              fill={isActive ? "var(--l-signal)" : "var(--l-hairline)"}
            />
            <text
              x={labelX}
              y={labelY}
              textAnchor={anchor}
              fontSize="12"
              fontFamily="var(--font-l-mono)"
              letterSpacing="1.4"
              fill={isActive ? "var(--l-foreground)" : "var(--l-muted-foreground)"}
            >
              {force.name.toUpperCase()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
