import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Camera, ClipboardList, Film, MapPin, Plus, Vote } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import Badge from "../../components/ui/Badge";
import { EmptyState, ErrorState, Skeleton } from "../../components/ui/States";
import { useAgent } from "../../context/auth";
import { POLLING_UNIT_STATUS_STYLES } from "../../lib/constants";
import { timeAgo } from "../../lib/format";
import * as service from "../../services/agentService";
import { errorMessage } from "../../services/instance";
import type { ElectionReport, Task } from "../../lib/types";

export default function Elections() {
  const agent = useAgent();

  const reportsQuery = useQuery({
    queryKey: ["election-reports", agent.id],
    queryFn: service.fetchElectionReports,
  });

  const tasksQuery = useQuery({
    queryKey: ["tasks", agent.id],
    queryFn: service.fetchTasks,
  });

  const reports = reportsQuery.data ?? [];

  // Election tasks the admin assigned that still have no return filed.
  const awaiting = (tasksQuery.data ?? []).filter(
    (task) => task.category === "Election Report" && task.status !== "Completed",
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
        <span className="block truncate text-xs font-bold">{task.subject}</span>
        <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-tight text-muted-foreground">
          {task.pollingUnit ?? task.ward ?? task.lga} · Due {task.due}
        </span>
      </span>
      <span className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
        File →
      </span>
    </Link>
  );
}

function ReportCard({ report }: { report: ElectionReport }) {
  const photos = report.media.filter((m) => m.kind === "image").length;
  const videos = report.media.filter((m) => m.kind === "video").length;

  const turnout =
    report.accredited && report.accredited > 0 && report.votesCast !== undefined
      ? Math.round((report.votesCast / report.accredited) * 100)
      : null;

  return (
    <article className="rounded-sm border border-border bg-surface p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <Badge tone={POLLING_UNIT_STATUS_STYLES[report.unitStatus]}>
          {report.unitStatus}
        </Badge>
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
          {timeAgo(report.submittedAt)}
        </span>
      </div>

      <h3 className="text-sm font-bold">{report.subject}</h3>

      <p className="mt-1 flex items-center gap-1 font-mono text-[10px] uppercase tracking-tight text-muted-foreground">
        <MapPin className="size-3 shrink-0" aria-hidden />
        {report.unit} · {report.ward}
      </p>

      {(report.accredited !== undefined || report.votesCast !== undefined) && (
        <div className="mt-3 grid grid-cols-3 gap-2 font-mono">
          <Figure label="Accredited" value={report.accredited} />
          <Figure label="Votes cast" value={report.votesCast} />
          <Figure label="Turnout" value={turnout === null ? undefined : `${turnout}%`} />
        </div>
      )}

      <p className="mt-2.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
        {report.body}
      </p>

      {(photos > 0 || videos > 0) && (
        <div className="mt-3 flex items-center gap-3 border-t border-border pt-2.5 font-mono text-[10px] text-muted-foreground">
          {photos > 0 && (
            <span className="flex items-center gap-1">
              <Camera className="size-3" aria-hidden />
              {photos} photo{photos === 1 ? "" : "s"}
            </span>
          )}
          {videos > 0 && (
            <span className="flex items-center gap-1">
              <Film className="size-3" aria-hidden />
              {videos} video{videos === 1 ? "" : "s"}
            </span>
          )}
        </div>
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
