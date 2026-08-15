import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/format";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 disabled:bg-primary/50",
  secondary:
    "bg-muted text-foreground border border-border hover:bg-accent active:bg-muted",
  outline:
    "border border-border bg-surface text-foreground hover:border-foreground/40 active:bg-muted/50",
  ghost: "text-muted-foreground hover:text-foreground hover:bg-muted/60",
  danger:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-[11px]",
  md: "h-11 px-4 text-xs",
  lg: "h-13 px-5 text-sm",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  icon,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-sm font-display font-bold uppercase tracking-widest",
        "transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "disabled:cursor-not-allowed disabled:opacity-60",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}
