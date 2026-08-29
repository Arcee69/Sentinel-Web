import {Card, PullQuote, Section, SectionHead} from "../ui";
import { accentAt } from "../accents";

const TENSIONS = [
  { left: "Economic Pressure", right: "Political Promises" },
  { left: "Youth Awakening", right: "Institutional Inertia" },
  { left: "Digital Transparency", right: "Systemic Opacity" },
];

/** The page's central argument: outcomes are built long before polling day. */
export default function Thesis() {
  return (
    <Section id="methodology">
      <SectionHead
        eyebrow="The central thesis"
        title="Elections Are Not Won on Election Day."
        lede="They are a chain reaction of events."
      />

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {TENSIONS.map((pair, i) => (
          <Card key={pair.left} accent={accentAt(i)} className="px-6 py-7">
            <p className="font-l-sans text-[17px] text-l-foreground">{pair.left}</p>

            <div className="my-4 flex items-center gap-3" aria-hidden>
              <span className="h-px flex-1 bg-l-border" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-l-muted-foreground">
                vs
              </span>
              <span className="h-px flex-1 bg-l-border" />
            </div>

            <p className="font-l-sans text-[17px] text-l-muted-foreground">{pair.right}</p>
          </Card>
        ))}
      </div>

      {/* Banner slot — drop the campaign photography in here when available. */}
      <div
        className="mt-10 h-56 rounded-sm sm:h-72"
        style={{
          background:
            "linear-gradient(115deg, var(--l-ember) 0%, color-mix(in srgb, var(--l-ember) 78%, #ffffff) 55%, color-mix(in srgb, var(--l-amber) 60%, #ffffff) 100%)",
        }}
        aria-hidden
      />

      <div className="mt-10 max-w-2xl">
        <PullQuote>
          Sentinel helps stakeholders understand how these forces interact — and where the
          pressure points are changing.
        </PullQuote>
      </div>
    </Section>
  );
}
