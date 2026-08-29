import type { CSSProperties, ReactNode } from "react";
import { cn } from "../../lib/format";
import { useInView } from "./hooks";

/** Page-width container — every section shares this measure. */
export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1280px] px-5 sm:px-8 lg:px-[52px]", className)}>{children}</div>
  );
}

interface SectionProps {
  id?: string;
  children: ReactNode;
  className?: string;
  /** Alternate surface for rhythm between sections. */
  tone?: "base" | "panel";
}

export function Section({ id, children, className, tone = "base" }: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-20 border-t border-l-border py-20 sm:py-24",
        tone === "panel" ? "bg-l-panel" : "bg-l-background",
        className,
      )}
    >
      <Container>{children}</Container>
    </section>
  );
}

/** Rule-prefixed mono kicker in ember — the site's section marker. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-6 flex items-center gap-3 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-l-ember-ink">
      <span className="h-px w-7 bg-l-ember" aria-hidden />
      {children}
    </p>
  );
}

interface SectionHeadProps {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  className?: string;
}

export function SectionHead({ eyebrow, title, lede, className }: SectionHeadProps) {
  return (
    <header className={cn("max-w-3xl", className)}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="font-l-display text-3xl font-semibold tracking-[-0.02em] text-l-foreground sm:text-4xl">
        {title}
      </h2>
      {lede && (
        <p className="mt-5 max-w-2xl font-l-sans text-[15px] leading-[1.7] text-l-muted-foreground">
          {lede}
        </p>
      )}
    </header>
  );
}

interface CardProps {
  children: ReactNode;
  className?: string;
  /** CSS colour for the top cap and wash. */
  accent?: string;
  style?: CSSProperties;
}

/** White card with a coloured top cap and a faint wash of the same hue. */
export function Card({ children, className, accent, style }: CardProps) {
  return (
    <div
      className={cn("l-card rounded-sm", className)}
      style={{ ...style, ["--l-card-accent" as string]: accent }}
    >
      {children}
    </div>
  );
}

/** Plain bordered surface, no accent cap. */
export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-sm border border-l-border bg-l-panel", className)}>
      {children}
    </div>
  );
}

/** Wraps children in a rise-on-scroll reveal. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, seen } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cn("h-full", seen && "l-rise", className)}
      style={{ animationDelay: seen ? `${delay}ms` : undefined, opacity: seen ? undefined : 0 }}
    >
      {children}
    </div>
  );
}

const LEVEL_TONES: Record<string, string> = {
  Critical: "text-l-critical-ink",
  "Very High": "text-l-critical-ink",
  High: "text-l-warning-ink",
  Elevated: "text-l-teal",
  Watch: "text-l-signal-ink",
  Moderate: "text-l-positive-ink",
};

/** Bare mono level marker, as the reference sets it — no chip, no fill. */
export function Level({ level }: { level: string }) {
  return (
    <span
      className={cn(
        "shrink-0 font-mono text-[10px] font-medium uppercase tracking-[0.16em]",
        LEVEL_TONES[level] ?? "text-l-muted-foreground",
      )}
    >
      {level}
    </span>
  );
}

/** Attribution line — mono, uppercase, letter-spaced. */
export function Source({ children }: { children: ReactNode }) {
  return (
    <p className="mt-6 font-mono text-[10px] uppercase leading-relaxed tracking-[0.14em] text-l-muted-foreground">
      {children}
    </p>
  );
}

/** Pull-quote with the ember rule the site uses for emphasis lines. */
export function PullQuote({ children }: { children: ReactNode }) {
  return (
    <p className="border-l-2 border-l-ember py-1 pl-5 font-l-sans text-[17px] leading-[1.6] text-l-foreground">
      {children}
    </p>
  );
}

/** Ember primary action. */
export function CtaPrimary({
  children,
  href,
  className,
}: {
  children: ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-sm bg-l-ember px-5 py-3 font-l-sans text-sm font-medium text-white shadow-sm transition-colors hover:bg-l-ember-ink",
        className,
      )}
    >
      {children}
    </a>
  );
}

/** Teal text link with trailing arrow, used to close sections. */
export function ArrowLink({
  children,
  href,
}: {
  children: ReactNode;
  href: string;
}) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 font-l-sans text-sm font-medium text-l-signal-ink underline-offset-4 hover:underline"
    >
      {children}
      <span aria-hidden>→</span>
    </a>
  );
}
