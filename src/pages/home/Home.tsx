import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, FileText, MapPin, TriangleAlert } from "lucide-react";
import ProgressRing from "../../components/ProgressRing";
import { FeaturedTaskCard, TaskRow } from "../../components/TaskCard";
import { EmptyState, ErrorState, Skeleton } from "../../components/ui/States";
import { useAgent } from "../../context/auth";
import { greeting } from "../../lib/format";
import * as service from "../../services/agentService";
import { errorMessage } from "../../services/instance";
import type { Task } from "../../lib/types";

export default function Home() {
  const agent = useAgent();

  const tasksQuery = useQuery({
    queryKey: ["tasks", agent.id],
    queryFn: service.fetchTasks,
  });

  const tasks = tasksQuery.data ?? [];
  const open = tasks.filter((t) => t.status !== "Completed");
  const completed = tasks.length - open.length;
  const quota = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  // The task to push: whatever is already underway, else the most urgent.
  const featured: Task | undefined =
    open.find((t) => t.status === "In Progress") ?? open[0];
  const rest = open.filter((t) => t.id !== featured?.id);

  return (
    <>
      <header className="safe-top border-b border-border bg-surface px-5 pb-5">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              SMHP Sentinel · Connect
            </p>
            <h1 className="font-display text-xl font-bold uppercase leading-none tracking-tight">
              HOME
            </h1>
          </div>
          <span className="shrink-0 rounded-sm border border-primary/25 bg-primary/10 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
            {agent.role}
          </span>
        </div>

        <div className="flex items-center gap-5">
          <ProgressRing value={quota} label="" />

          <div className="min-w-0 flex-1">
            <p className="text-xs leading-relaxed text-muted-foreground">
              {greeting()},
              <br />
              <span className="text-sm font-bold text-foreground">{agent.name}</span>
            </p>

            <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-[width] duration-700"
                style={{ width: `${quota}%` }}
              />
            </div>

            <p className="mt-2 font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              {completed}/{tasks.length} tasks complete
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 font-mono">
          <Tile icon={<MapPin className="size-2.5" />} label="Sector" value={agent.lga} />
          <Tile
            icon={<ClipboardList className="size-2.5" />}
            label="Open"
            value={`${open.length} task${open.length === 1 ? "" : "s"}`}
          />
          <Tile
            icon={<FileText className="size-2.5" />}
            label="Filed"
            value={String(agent.reports)}
          />
        </div>
      </header>

      <div className="space-y-3 px-4 py-5">
        <div className="flex items-center justify-between px-1">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
            Active Operations
          </p>
          <Link
            to="/tasks"
            className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary"
          >
            All →
          </Link>
        </div>

        {tasksQuery.isPending && (
          <div className="space-y-3">
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {tasksQuery.isError && (
          <ErrorState
            message={errorMessage(tasksQuery.error, "We couldn't load your tasks.")}
            onRetry={() => void tasksQuery.refetch()}
          />
        )}

        {tasksQuery.isSuccess && !featured && (
          <EmptyState
            icon={<ClipboardList className="size-7" />}
            title="No open tasks"
            message="Everything assigned to you is done. New tasks appear here as soon as your administrator assigns them."
          />
        )}

        {featured && <FeaturedTaskCard task={featured} />}
        {rest.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </div>

      <div className="px-4 pb-5">
        <Link
          to="/incidents/new"
          className="flex w-full items-center justify-center gap-3 rounded-sm border border-destructive/30 bg-destructive/10 py-3.5 font-mono text-xs font-bold uppercase tracking-widest text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
        >
          <TriangleAlert className="size-4" aria-hidden />
          Report Incident
          <span className="size-2 animate-pulse rounded-full bg-destructive" aria-hidden />
        </Link>
      </div>
    </>
  );
}

function Tile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-sm border border-border bg-muted/50 p-2">
      <div className="mb-1 flex items-center gap-1 text-[8px] uppercase tracking-widest text-muted-foreground">
        <span aria-hidden>{icon}</span>
        {label}
      </div>
      <p className="truncate text-[10px] font-bold">{value}</p>
    </div>
  );
}
