import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, ShieldCheck, X } from "lucide-react";
import { cn } from "../../../lib/format";
import { Container } from "../ui";

const NAV = [
  { label: "Platform", href: "#platform" },
  { label: "Intelligence", href: "#intelligence" },
  { label: "Methodology", href: "#methodology" },
  { label: "Scenarios", href: "#scenarios" },
  { label: "About", href: "#about" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // A menu left open while the viewport grows would strand the overlay.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const close = () => mq.matches && setOpen(false);
    mq.addEventListener("change", close);
    return () => mq.removeEventListener("change", close);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors",
        scrolled
          ? "border-l-border bg-l-background/92 backdrop-blur"
          : "border-transparent bg-l-background/80",
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-4">
        <a href="#top" className="flex items-center gap-2.5">
          <span
            className="flex size-8 items-center justify-center rounded-sm bg-l-ember text-l-primary-foreground"
            aria-hidden
          >
            <ShieldCheck className="size-4.5" />
          </span>
          <span className="font-mono text-[13px] font-medium uppercase tracking-[0.18em] text-l-foreground">
            SMHP Sentinel
          </span>
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="font-l-sans text-sm text-l-muted-foreground transition-colors hover:text-l-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden rounded-sm bg-l-ember px-4 py-2 font-l-sans text-sm font-medium text-white shadow-sm transition-colors hover:bg-l-ember-ink sm:inline-flex"
          >
            Sign In
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex size-9 items-center justify-center rounded-sm border border-l-border text-l-foreground md:hidden"
          >
            {open ? <X className="size-4" aria-hidden /> : <Menu className="size-4" aria-hidden />}
          </button>
        </div>
      </Container>

      {open && (
        <div className="border-t border-l-border bg-l-panel md:hidden">
          <Container className="flex flex-col py-3">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-2.5 font-l-sans text-sm text-l-muted-foreground hover:text-l-foreground"
              >
                {item.label}
              </a>
            ))}
            <Link
              to="/login"
              className="mt-2 rounded-sm bg-l-ember px-4 py-2.5 text-center font-l-sans text-sm font-medium text-white"
            >
              Sign In
            </Link>
          </Container>
        </div>
      )}
    </header>
  );
}
