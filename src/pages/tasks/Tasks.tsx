import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import { TaskRow } from "../../components/TaskCard";
import { EmptyState, ErrorState, Skeleton } from "../../components/ui/States";
import { useAgent } from "../../context/auth";
import { TASK_STATUSES } from "../../lib/constants";
import { cn } from "../../lib/format";
import * as service from "../../services/agentService";
import { errorMessage } from "../../services/instance";
import type { TaskStatus } from "../../lib/types";

type Filter = "All" | TaskStatus;

const FILTERS: Filter[] = ["All", ...TASK_STATUSES];

export default function Tasks() {
  const agent = useAgent();
  const [filter, setFilter] = useState<Filter>("All");

  const tasksQuery = useQuery({
    queryKey: ["tasks", agent.id],
    queryFn: service.fetchTasks,
  });

  const tasks = tasksQuery.data ?? [];
  const visible = filter === "All" ? tasks : tasks.filter((t) => t.status === filter);

  const countFor = (value: Filter) =>
    value === "All" ? tasks.length : tasks.filter((t) => t.status === value).length;

  return (
    <>
      <PageHeader eyebrow="Assigned to you" title="Tasks" />

      <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-border bg-surface px-4 py-3">
        {FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={cn(
              "shrink-0 rounded-sm border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors",
              filter === value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-muted-foreground hover:text-foreground",
            )}
          >
            {value}
            {tasksQuery.isSuccess && (
              <span className="ml-1.5 opacity-70">{countFor(value)}</span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-2.5 px-4 py-5">
        {tasksQuery.isPending &&
          Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}

        {tasksQuery.isError && (
          <ErrorState
            message={errorMessage(tasksQuery.error, "We couldn't load your tasks.")}
            onRetry={() => void tasksQuery.refetch()}
          />
        )}

        {tasksQuery.isSuccess && visible.length === 0 && (
          <EmptyState
            icon={<ClipboardList className="size-7" />}
            title={filter === "All" ? "No tasks yet" : `Nothing ${filter.toLowerCase()}`}
            message={
              filter === "All"
                ? "Tasks assigned by your administrator will appear here."
                : "Try a different filter to see your other tasks."
            }
          />
        )}

        {visible.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </div>
    </>
  );
}
