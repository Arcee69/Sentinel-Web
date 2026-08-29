import {
  Crown,
  Landmark,
  Map as MapIcon,
  MessageSquareWarning,
  Smartphone,
  Split,
  TriangleAlert,
  UserMinus,
  Wallet,
} from "lucide-react";
import {ArrowLink, Card, Level, Section, SectionHead, Source} from "../ui";
import { accentAt } from "../accents";

const VARIABLES = [
  {
    Icon: Crown,
    level: "Elevated",
    name: "Power of Incumbency",
    note: "Access to structure, resources and visibility shapes competitiveness.",
  },
  {
    Icon: UserMinus,
    level: "High",
    name: "Voter Apathy / Participation",
    note: "Declining participation changes who ultimately decides outcomes.",
  },
  {
    Icon: MessageSquareWarning,
    level: "High",
    name: "Information Warfare",
    note: "Deepfakes, misinformation and digital influence can reshape narratives at scale.",
  },
  {
    Icon: Split,
    level: "Elevated",
    name: "Opposition Fragmentation",
    note: "Coalition stability can materially change electoral arithmetic.",
  },
  {
    Icon: Wallet,
    level: "High",
    name: "Cost-of-Living Pressure",
    note: "Inflation and economic confidence weigh heavily on voter mood.",
  },
  {
    Icon: Smartphone,
    level: "Watch",
    name: "Youth Conversion",
    note: "Online engagement ≠ physical voting.",
  },
  {
    Icon: Landmark,
    level: "High",
    name: "Institutional Trust",
    note: "Confidence in INEC, election-day execution and the judiciary can affect participation and legitimacy.",
  },
  {
    Icon: MapIcon,
    level: "Elevated",
    name: "Regional Dynamics",
    note: "Zonal alignments and local structures alter national outcomes.",
  },
  {
    Icon: TriangleAlert,
    level: "Critical",
    name: "Security & Access",
    note: "Insecurity can suppress access to polling units and distort turnout.",
  },
];

/** The nine decider variables Sentinel tracks into 2027. */
export default function Variables() {
  return (
    <Section>
      <SectionHead eyebrow="Decider variables" title="9 Variables That Could Shape 2027" />

      <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {VARIABLES.map((variable, i) => {
          const accent = accentAt(i);
          return (
            <li key={variable.name}>
              <Card accent={accent} className="h-full px-5 py-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <variable.Icon
                    className="size-5"
                    style={{ color: accent }}
                    aria-hidden
                  />
                  <Level level={variable.level} />
                </div>

                <h3 className="font-l-sans text-[17px] leading-tight text-l-foreground">
                  {variable.name}
                </h3>
                <p className="mt-2 font-l-sans text-[14px] leading-[1.6] text-l-muted-foreground">
                  {variable.note}
                </p>
              </Card>
            </li>
          );
        })}
      </ul>

      <div className="mt-8">
        <ArrowLink href="#platform">Monitor the Variables</ArrowLink>
      </div>

      <Source>Source: Nigeria 2027 Elections Intelligence Guide</Source>
    </Section>
  );
}
