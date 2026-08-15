import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/format";

/** Centred spinner for route-level and list-level loading. */
export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
      <Loader2 className="size-6 animate-spin" aria-hidden />
      <p className="font-mono text-[10px] font-bold uppercase tracking-widest">{label}</p>
    </div>
  );
}

/** Grey placeholder blocks that mirror a card's silhouette. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-sm bg-muted", className)} />;
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-sm border border-dashed border-border px-6 py-14 text-center">
      {icon && <div className="text-muted-foreground/60" aria-hidden>{icon}</div>}
      <div className="space-y-1">
        <p className="font-display text-sm font-bold">{title}</p>
        {message && (
          <p className="mx-auto max-w-[34ch] text-xs leading-relaxed text-muted-foreground">
            {message}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this. Check your connection and try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="rounded-sm border border-destructive/30 bg-destructive/5 px-5 py-8 text-center">
      <p className="font-display text-sm font-bold text-destructive">{title}</p>
      <p className="mx-auto mt-1 max-w-[34ch] text-xs leading-relaxed text-muted-foreground">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 font-mono text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}
