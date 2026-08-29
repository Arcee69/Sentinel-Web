import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Container, Eyebrow } from "../ui";

/** Closing call to action. */
export default function FinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-l-border bg-l-panel py-24">
      <div className="l-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden />

      <Container className="relative text-center">
        <Eyebrow>Nigeria 2027</Eyebrow>

        <h2 className="mx-auto max-w-3xl text-3xl font-bold leading-[1.1] tracking-tight text-l-foreground sm:text-4xl">
          The 2027 Election Is Already Moving.
        </h2>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-l-muted-foreground sm:text-lg">
          The question is not whether the signals exist. The question is whether you can
          see them early enough to understand what they mean.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-sm bg-l-ember px-6 py-3 text-sm font-semibold text-l-primary-foreground transition-colors hover:bg-l-ember-ink"
          >
            Operator Sign In
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <a
            href="#intelligence"
            className="inline-flex items-center gap-2 rounded-sm border border-l-border bg-l-background px-6 py-3 text-sm font-semibold text-l-foreground transition-colors hover:border-l-foreground/30"
          >
            Explore Intelligence
          </a>
        </div>
      </Container>
    </section>
  );
}
