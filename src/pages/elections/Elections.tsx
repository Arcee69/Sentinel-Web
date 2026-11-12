import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, MapPin, Plus, Vote } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import Badge from "../../components/ui/Badge";
import { EmptyState, ErrorState, Skeleton } from "../../components/ui/States";
import { useWorkspace } from "../../context/auth";
import { useTasks } from "../../hooks/useTasks";
import { POLLING_UNIT_STATUS_STYLES, REVIEW_STATE_STYLES } from "../../lib/constants";
import { dueStamp, timeAgo } from "../../lib/format";
import { isActionable } from "../../lib/tasks";
import * as service from "../../services/agentService";
import { errorMessage } from "../../services/instance";
import type { ElectionReport, Task } from "../../lib/types";

export default function Elections() {
  const workspace = useWorkspace();

  const reportsQuery = useQuery({
    queryKey: ["election-reports", workspace.campaignId],
    queryFn: () => service.fetchElectionReports(workspace.campaignId),
  });

  const tasksQuery = useTasks();

  const reports = reportsQuery.data ?? [];

  // Election tasks the admin assigned that still have no return filed.
  const awaiting = (tasksQuery.data ?? []).filter(
    (task) => task.category === "Election Report" && isActionable(task.status),
  );

  return (
    <>
      <PageHeader
        eyebrow="Filed by you"
        title="Election"
        action={
          <Link
            to="/elections/new"
            className="flex items-center gap-1.5 rounded-sm bg-primary px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-primary-foreground"
          >
            <Plus className="size-3.5" aria-hidden />
            New
          </Link>
        }
      />

      <div className="space-y-2.5 px-4 py-5">
        {awaiting.length > 0 && (
          <section className="mb-4 space-y-2">
            <p className="px-1 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
              Awaiting your return
            </p>
            {awaiting.map((task) => (
              <AwaitingRow key={task.id} task={task} />
            ))}
          </section>
        )}

        {reportsQuery.isPending &&
          Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}

        {reportsQuery.isError && (
          <ErrorState
            message={errorMessage(
              reportsQuery.error,
              "We couldn't load your election reports.",
            )}
            onRetry={() => void reportsQuery.refetch()}
          />
        )}

        {reportsQuery.isSuccess && reports.length === 0 && (
          <EmptyState
            icon={<Vote className="size-7" />}
            title="No election reports yet"
            message="File accreditation figures, votes cast, unit opening status and collation returns straight from the field."
            action={
              <Link
                to="/elections/new"
                className="rounded-sm bg-primary px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-primary-foreground"
              >
                File election report
              </Link>
            }
          />
        )}

        {reports.map((report) => (
          <ReportCard key={report.id} report={report} />
        ))}
      </div>
    </>
  );
}

/** An assigned election task, one tap from becoming a filed return. */
function AwaitingRow({ task }: { task: Task }) {
  return (
    <Link
      to={`/elections/new?task=${task.id}`}
      className="flex items-center gap-3 rounded-sm border border-primary/25 bg-primary/8 px-3 py-2.5 transition-colors hover:bg-primary/12"
    >
      <ClipboardList className="size-4 shrink-0 text-primary" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold">{task.subject ?? task.title}</span>
        <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-tight text-muted-foreground">
          {task.location}
          {task.dueAt && ` · Due ${dueStamp(task.dueAt)}`}
        </span>
      </span>
      <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
        File →
      </span>
    </Link>
  );
}

function ReportCard({ report }: { report: ElectionReport }) {
  const turnout =
    report.accredited && report.accredited > 0 && report.votesCast !== null
      ? Math.round((report.votesCast / report.accredited) * 100)
      : null;

  return (
    <article className="rounded-sm border border-border bg-surface p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {report.unitStatus && (
            <Badge tone={POLLING_UNIT_STATUS_STYLES[report.unitStatus]}>
              {report.unitStatus}
            </Badge>
          )}
          <Badge tone={REVIEW_STATE_STYLES[report.reviewState]}>{report.reviewState}</Badge>
        </div>
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
          {timeAgo(report.observedAt)}
        </span>
      </div>

      <h3 className="text-sm font-bold">{report.subject ?? "Polling unit return"}</h3>

      {report.unitLabel && (
        <p className="mt-1 flex items-center gap-1 font-mono text-[10px] uppercase tracking-tight text-muted-foreground">
          <MapPin className="size-3 shrink-0" aria-hidden />
          {report.unitLabel}
        </p>
      )}

      {(report.accredited !== null || report.votesCast !== null) && (
        <div className="mt-3 grid grid-cols-3 gap-2 font-mono">
          <Figure label="Accredited" value={report.accredited ?? undefined} />
          <Figure label="Votes cast" value={report.votesCast ?? undefined} />
          <Figure label="Turnout" value={turnout === null ? undefined : `${turnout}%`} />
        </div>
      )}

      {report.notes && (
        <p className="mt-2.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
          {report.notes}
        </p>
      )}
    </article>
  );
}

function Figure({ label, value }: { label: string; value?: number | string }) {
  return (
    <div className="rounded-sm border border-border bg-muted/50 p-2">
      <p className="text-[8px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-[11px] font-bold">
        {value === undefined ? "—" : value.toLocaleString()}
      </p>
    </div>
  );
}
