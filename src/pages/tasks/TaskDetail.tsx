import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2, CircleSlash, MapPin, Target } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "../../components/PageHeader";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { ErrorState, Loading } from "../../components/ui/States";
import { useWorkspace } from "../../context/auth";
import { useOffline } from "../../context/offline";
import { PRIORITY_STYLES, STATUS_STYLES, TASK_CATEGORIES } from "../../lib/constants";
import { cn, dueStamp } from "../../lib/format";
import { isTaskOverdue } from "../../lib/tasks";
import * as service from "../../services/agentService";
import { toApiError } from "../../services/errors";
import { errorMessage } from "../../services/instance";
import type { TaskTransitionJob } from "../../lib/outbox";
import type { Task, TaskAction } from "../../lib/types";

/** Where "Submit report" leads: the form that matches what the admin asked for. */
function reportPath(task: Task): string {
  if (task.category === "Election Report") return `/elections/new?task=${task.id}`;
  if (task.category === "Incident Report") return `/incidents/new?task=${task.id}`;
  return `/tasks/${task.id}/report`;
}

export default function TaskDetail() {
  const { id = "" } = useParams();
  const workspace = useWorkspace();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isOnline, submit } = useOffline();

  const taskQuery = useQuery({
    queryKey: ["task", id],
    queryFn: () => service.fetchTask(id, workspace),
    enabled: Boolean(id),
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["task", id] });
    await queryClient.invalidateQueries({ queryKey: ["tasks", workspace.campaignId] });
  };

  const transitionMutation = useMutation({
    mutationFn: async ({ task, action }: { task: Task; action: TaskAction }) => {
      // Completing a pending task online starts it first; offline we can only
      // queue the one step whose revision we know.
      if (action === "complete" && isOnline) {
        await service.completeTask(task);
        return "sent" as const;
      }
      const job: TaskTransitionJob = { taskId: task.id, action, expectedRevision: task.revision };
      return submit("task-transition", job);
    },
    onSuccess: async (outcome, { action }) => {
      toast.success(
        outcome === "queued"
          ? "Queued — will sync when you're back online"
          : action === "start"
            ? "Task started"
            : "Task marked complete",
      );
      await refresh();
    },
    onError: async (error) => {
      if (toApiError(error).isConflict) {
        toast.error("This task changed since you opened it. We've refreshed it — try again.");
        await refresh();
        return;
      }
      toast.error(errorMessage(error, "Couldn't update the task. Try again."));
    },
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
  const overdue = isTaskOverdue(task);
  const blurb = TASK_CATEGORIES.find((c) => c.id === task.category)?.blurb;
  const pendingAction = transitionMutation.isPending ? transitionMutation.variables?.action : null;

  return (
    <>
      <PageHeader eyebrow={task.category ?? "Task"} title={task.title} back="/tasks" />

      <div className="space-y-4 px-4 py-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={PRIORITY_STYLES[task.priority]}>Priority · {task.priority}</Badge>
          <Badge tone={STATUS_STYLES[task.status]}>{task.status}</Badge>
          {overdue && (
            <Badge tone="bg-destructive text-destructive-foreground">Overdue</Badge>
          )}
        </div>

        {(task.subject || blurb || task.instructions) && (
          <section className="rounded-sm border border-border bg-surface p-4">
            <h2 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Briefing
            </h2>

            {task.subject && <p className="text-sm font-bold">{task.subject}</p>}
            {blurb && (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{blurb}</p>
            )}

            {task.instructions && (
              <p
                className={cn(
                  "text-sm leading-relaxed",
                  (task.subject || blurb) && "mt-3 border-t border-border pt-3",
                )}
              >
                {task.instructions}
              </p>
            )}
          </section>
        )}

        <section className="grid grid-cols-2 gap-2">
          <DetailTile
            icon={<CalendarClock className="size-3.5" />}
            label="Due"
            value={task.dueAt ? dueStamp(task.dueAt) : "No deadline"}
            tone={overdue ? "text-destructive" : undefined}
          />
          <DetailTile icon={<MapPin className="size-3.5" />} label="Location" value={task.location} />
          {task.target !== null && (
            <DetailTile
              icon={<Target className="size-3.5" />}
              label="Target"
              value={String(task.target)}
            />
          )}
        </section>

        {task.status === "Completed" && (
          <div className="flex items-center gap-3 rounded-sm border border-success/30 bg-success/8 px-4 py-3.5">
            <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden />
            <div>
              <p className="text-sm font-bold text-success">Task complete</p>
              {task.completedAt && (
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Completed {dueStamp(task.completedAt)}
                </p>
              )}
            </div>
          </div>
        )}

        {task.status === "Cancelled" && (
          <div className="flex items-center gap-3 rounded-sm border border-border bg-muted/50 px-4 py-3.5">
            <CircleSlash className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <p className="text-sm font-bold">Task cancelled</p>
              <p className="text-xs text-muted-foreground">
                Your administrator withdrew this task. No action is needed.
              </p>
            </div>
          </div>
        )}

        {(task.status === "Pending" || task.status === "In Progress") && (
          <div className="space-y-2">
            {task.status === "Pending" && (
              <Button
                size="lg"
                fullWidth
                loading={pendingAction === "start"}
                disabled={transitionMutation.isPending}
                onClick={() => transitionMutation.mutate({ task, action: "start" })}
              >
                Start task →
              </Button>
            )}

            <Button
              size="lg"
              fullWidth
              variant={task.status === "Pending" ? "outline" : "primary"}
              onClick={() => navigate(reportPath(task))}
            >
              Submit report
            </Button>

            {task.status === "In Progress" && (
              <Button
                size="lg"
                fullWidth
                variant="outline"
                icon={<CheckCircle2 className="size-4" aria-hidden />}
                loading={pendingAction === "complete"}
                disabled={transitionMutation.isPending}
                onClick={() => transitionMutation.mutate({ task, action: "complete" })}
              >
                Mark complete
              </Button>
            )}
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
