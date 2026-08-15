import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2, Crosshair, MapPin, Target } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "../../components/PageHeader";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { ErrorState, Loading } from "../../components/ui/States";
import { useAgent } from "../../context/auth";
import { useOffline } from "../../context/offline";
import { PRIORITY_STYLES, STATUS_STYLES, TASK_CATEGORIES } from "../../lib/constants";
import { cn, dueStamp, isOverdue } from "../../lib/format";
import * as service from "../../services/agentService";
import { errorMessage } from "../../services/instance";

export default function TaskDetail() {
  const { id = "" } = useParams();
  const agent = useAgent();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isOnline, queue } = useOffline();

  const taskQuery = useQuery({
    queryKey: ["task", id],
    queryFn: () => service.fetchTask(id),
    enabled: Boolean(id),
  });

  const startMutation = useMutation({
    mutationFn: async () => {
      // Offline: record the intent locally and let the outbox deliver it.
      if (!isOnline) {
        await queue("task-status", { taskId: id, status: "In Progress" });
        return null;
      }
      return service.updateTaskStatus(id, "In Progress");
    },
    onSuccess: async () => {
      toast.success(isOnline ? "Task started" : "Queued — will sync when you're back online");
      await queryClient.invalidateQueries({ queryKey: ["task", id] });
      await queryClient.invalidateQueries({ queryKey: ["tasks", agent.id] });
    },
    onError: (error) =>
      toast.error(errorMessage(error, "Couldn't start the task. Try again.")),
  });

  if (taskQuery.isPending) {
    return (
      <>
        <PageHeader title="Task" back />
        <Loading label="Loading task" />
      </>
    );
  }

  if (taskQuery.isError || !taskQuery.data) {
    return (
      <>
        <PageHeader title="Task" back />
        <div className="px-4 py-6">
          <ErrorState
            title="Task unavailable"
            message={errorMessage(
              taskQuery.error,
              "This task may have been reassigned or withdrawn.",
            )}
            onRetry={() => void taskQuery.refetch()}
          />
        </div>
      </>
    );
  }

  const task = taskQuery.data;
  const overdue = isOverdue(task.dueAt) && task.status !== "Completed";
  const blurb = TASK_CATEGORIES.find((c) => c.id === task.category)?.blurb;

  return (
    <>
      <PageHeader eyebrow={task.category} title={task.title} back="/tasks" />

      <div className="space-y-4 px-4 py-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={PRIORITY_STYLES[task.priority]}>Priority · {task.priority}</Badge>
          <Badge tone={STATUS_STYLES[task.status]}>{task.status}</Badge>
          {overdue && (
            <Badge tone="bg-destructive text-destructive-foreground">Overdue</Badge>
          )}
        </div>

        <section className="rounded-sm border border-border bg-surface p-4">
          <h2 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Briefing
          </h2>

          <p className="text-sm font-bold">{task.subject}</p>
          {blurb && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{blurb}</p>
          )}

          {task.instructions && (
            <p className="mt-3 border-t border-border pt-3 text-sm leading-relaxed">
              {task.instructions}
            </p>
          )}
        </section>

        <section className="grid grid-cols-2 gap-2">
          <DetailTile
            icon={<CalendarClock className="size-3.5" />}
            label="Due"
            value={dueStamp(task.dueAt)}
            tone={overdue ? "text-destructive" : undefined}
          />
          <DetailTile
            icon={<MapPin className="size-3.5" />}
            label="Location"
            value={`${task.ward ?? task.lga}, ${task.state}`}
          />
          {task.pollingUnit && (
            <DetailTile
              icon={<Crosshair className="size-3.5" />}
              label="Polling unit"
              value={task.pollingUnit}
            />
          )}
          {task.target && (
            <DetailTile
              icon={<Target className="size-3.5" />}
              label="Target"
              value={String(task.target)}
            />
          )}
        </section>

        {task.status === "Completed" ? (
          <div className="flex items-center gap-3 rounded-sm border border-success/30 bg-success/8 px-4 py-3.5">
            <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden />
            <div>
              <p className="text-sm font-bold text-success">Task complete</p>
              {task.completedAt && (
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Filed {dueStamp(task.completedAt)}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {task.status === "Pending" && (
              <Button
                size="lg"
                fullWidth
                loading={startMutation.isPending}
                onClick={() => startMutation.mutate()}
              >
                Start task →
              </Button>
            )}

            <Button
              size="lg"
              fullWidth
              variant={task.status === "Pending" ? "outline" : "primary"}
              onClick={() => navigate(`/tasks/${task.id}/report`)}
            >
              Submit report
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

function DetailTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-sm border border-border bg-surface p-3">
      <div className="mb-1 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        <span aria-hidden>{icon}</span>
        {label}
      </div>
      <p className={cn("truncate text-xs font-bold", tone)}>{value}</p>
    </div>
  );
}
