import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Container } from "../ui";

const COLUMNS = [
  {
    title: "Navigation",
    links: [
      { label: "Platform", href: "#platform" },
      { label: "Intelligence", href: "#intelligence" },
      { label: "Methodology", href: "#methodology" },
      { label: "Scenarios", href: "#scenarios" },
      { label: "About", href: "#about" },
    ],
  },
  {
    title: "Intelligence",
    links: [
      { label: "Early warning", href: "#intelligence" },
      { label: "Voter intelligence", href: "#methodology" },
      { label: "Geographic intelligence", href: "#platform" },
      { label: "Scenario modelling", href: "#scenarios" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#about" },
      { label: "Terms", href: "#about" },
      { label: "Responsible Intelligence", href: "#about" },
      { label: "Data & Methodology", href: "#methodology" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-l-border bg-l-background py-14">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className="flex size-8 items-center justify-center rounded-sm bg-l-ember text-l-primary-foreground"
                aria-hidden
              >
                <ShieldCheck className="size-4.5" />
              </span>
              <span className="text-[15px] font-bold tracking-tight text-l-foreground">
                SMHP Sentinel
              </span>
            </div>

            <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-l-muted-foreground">
              Election intelligence and decision support for Nigeria's 2027 general
              elections.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-l-foreground">
                  {column.title}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-[13px] text-l-muted-foreground transition-colors hover:text-l-foreground"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 border-t border-l-border pt-6">
          <p className="max-w-4xl text-xs leading-relaxed text-l-muted-foreground/80">
            SMHP Sentinel is an intelligence and decision-support platform. Its analytical
            outputs are designed to support understanding, monitoring and preparedness and
            should not be interpreted as deterministic predictions or official electoral
            outcomes.
          </p>
          <p className="mt-4 font-mono text-[11px] text-l-muted-foreground">
            © {new Date().getFullYear()} SMHP Sentinel. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  );
}
