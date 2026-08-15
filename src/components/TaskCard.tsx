import { Link } from "react-router-dom";
import { ChevronRight, MapPin } from "lucide-react";
import Badge from "./ui/Badge";
import { PRIORITY_STYLES, STATUS_STYLES } from "../lib/constants";
import { cn, dueStamp, isOverdue } from "../lib/format";
import type { Task } from "../lib/types";

/**
 * Full-bleed card for the task an agent should act on next.
 */
export function FeaturedTaskCard({ task }: { task: Task }) {
  const overdue = isOverdue(task.dueAt) && task.status !== "Completed";

  return (
    <Link
      to={`/tasks/${task.id}`}
      className="tactical-slide-up block rounded-sm border-2 border-primary bg-surface shadow-sm"
    >
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={PRIORITY_STYLES[task.priority]}>
              Priority · {task.priority}
            </Badge>
            <span className="font-mono text-[10px] text-muted-foreground">
              {task.category}
            </span>
          </div>
          <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
            #{task.id.slice(0, 8).toUpperCase()}
          </span>
        </div>

        <h2 className="mb-1 font-display text-lg font-bold leading-tight">{task.title}</h2>

        <p className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3 shrink-0" aria-hidden />
          <span className="truncate">
            {task.ward ?? task.lga}, {task.state}
          </span>
        </p>

        <div className="mb-4 grid grid-cols-3 gap-2 font-mono">
          <Metric
            label="Due"
            value={overdue ? "Overdue" : task.due}
            tone={overdue ? "text-destructive" : undefined}
          />
          <Metric label="Subject" value={task.subject} />
          <Metric label="Target" value={task.target ? String(task.target) : "—"} />
        </div>

        <div className="rounded-sm bg-primary py-3 text-center font-display text-sm font-bold uppercase tracking-widest text-primary-foreground">
          {task.status === "In Progress" ? "Continue Task →" : "Start Task →"}
        </div>
      </div>
    </Link>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-sm border border-border bg-muted/60 p-2">
      <p className="mb-0.5 text-[8px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className={cn("truncate text-xs font-bold", tone)}>{value}</p>
    </div>
  );
}

/** Compact row used in the task list and the home feed. */
export function TaskRow({ task }: { task: Task }) {
  const overdue = isOverdue(task.dueAt) && task.status !== "Completed";

  return (
    <Link
      to={`/tasks/${task.id}`}
      className="flex items-center justify-between rounded-sm border border-border bg-surface p-4 transition-colors hover:border-foreground/40 active:bg-muted/40"
    >
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span
            className={cn(
              "size-2 shrink-0 rounded-full",
              task.status === "Completed"
                ? "bg-success"
                : task.status === "In Progress"
                  ? "bg-primary"
                  : "bg-muted-foreground/40",
            )}
            aria-hidden
          />
          <h3 className="truncate text-sm font-bold">{task.title}</h3>
        </div>
        <p className="truncate font-mono text-[10px] uppercase tracking-tight text-muted-foreground">
          {task.ward ?? task.lga} ·{" "}
          <span className={cn(overdue && "font-bold text-destructive")}>
            {overdue ? "OVERDUE" : dueStamp(task.dueAt)}
          </span>
        </p>
      </div>

      <div className="ml-2 flex shrink-0 items-center gap-2">
        <Badge tone={STATUS_STYLES[task.status]}>{task.status}</Badge>
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
      </div>
    </Link>
  );
}
