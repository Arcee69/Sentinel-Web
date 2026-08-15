import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  /** Renders a back affordance; defaults to history.back(). */
  back?: boolean | string;
  action?: ReactNode;
}

export default function PageHeader({ eyebrow, title, back, action }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="safe-top border-b border-border bg-surface px-5 pb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          {back && (
            <button
              type="button"
              onClick={() => (typeof back === "string" ? navigate(back) : navigate(-1))}
              aria-label="Go back"
              className="-ml-2 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
          )}

          <div className="min-w-0">
            {eyebrow && (
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                {eyebrow}
              </p>
            )}
            <h1 className="truncate font-display text-xl font-bold uppercase leading-none tracking-tight">
              {title}
            </h1>
          </div>
        </div>

        {action}
      </div>
    </header>
  );
}
