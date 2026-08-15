import type { ReactNode } from "react";
import { cn } from "../../lib/format";

interface BadgeProps {
  children: ReactNode;
  /** Pre-composed Tailwind classes from lib/constants style maps. */
  tone?: string;
  className?: string;
}

export default function Badge({ children, tone, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest",
        tone ?? "bg-muted text-muted-foreground border border-border",
        className,
      )}
    >
      {children}
    </span>
  );
}
