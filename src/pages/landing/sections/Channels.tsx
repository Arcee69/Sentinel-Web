import { Section, SectionHead } from "../ui";
import { useInView } from "../hooks";

/** Relative prominence only — for comparing the channels the guide references. */
const CHANNELS = [
  { name: "WhatsApp", weight: 100, tone: "bg-l-positive" },
  { name: "Facebook", weight: 74, tone: "bg-l-signal" },
  { name: "TikTok", weight: 61, tone: "bg-l-iris" },
  { name: "X", weight: 52, tone: "bg-l-foreground" },
  { name: "Radio", weight: 46, tone: "bg-l-amber" },
  { name: "Community", weight: 38, tone: "bg-l-teal" },
  { name: "TV", weight: 31, tone: "bg-l-muted-foreground" },
];

/** Where political narratives actually travel. */
export default function Channels() {
  const { ref, seen } = useInView<HTMLDivElement>();

  return (
    <Section tone="panel">
      <SectionHead
        eyebrow="Information ecosystem"
        title="Where Political Narratives Move."
        lede="WhatsApp is identified in the report as Nigeria's primary political battlefield. Narratives increasingly travel peer-to-peer, not only from traditional political institutions to voters."
      />

      <div ref={ref} className="mt-12 rounded-sm border border-l-border bg-l-background p-5 sm:p-8">
        <ul className="space-y-4">
          {CHANNELS.map((channel, i) => (
            <li key={channel.name} className="flex items-center gap-4">
              <span className="w-24 shrink-0 text-[13px] font-semibold text-l-foreground sm:w-28">
                {channel.name}
              </span>
              <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-l-muted">
                <span
                  className={`block h-full rounded-full ${channel.tone} transition-[width] duration-1000 ease-out`}
                  style={{
                    width: seen ? `${channel.weight}%` : 0,
                    transitionDelay: `${i * 90}ms`,
                  }}
                />
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-6 border-t border-l-border pt-4 text-xs text-l-muted-foreground/80">
          Relative prominence shown for comparison of channels referenced in the guide.
        </p>
      </div>
    </Section>
  );
}
