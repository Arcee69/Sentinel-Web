import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Camera, Film, MapPin, Plus, ShieldAlert } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import Badge from "../../components/ui/Badge";
import { EmptyState, ErrorState, Skeleton } from "../../components/ui/States";
import { useAgent } from "../../context/auth";
import { INCIDENT_STATUS_STYLES, SEVERITY_STYLES } from "../../lib/constants";
import { timeAgo } from "../../lib/format";
import * as service from "../../services/agentService";
import { errorMessage } from "../../services/instance";
import type { Incident } from "../../lib/types";

export default function Incidents() {
  const agent = useAgent();

  const incidentsQuery = useQuery({
    queryKey: ["incidents", agent.id],
    queryFn: service.fetchIncidents,
  });

  const incidents = incidentsQuery.data ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Filed by you"
        title="Incidents"
        action={
          <Link
            to="/incidents/new"
            className="flex items-center gap-1.5 rounded-sm bg-destructive px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-destructive-foreground"
          >
            <Plus className="size-3.5" aria-hidden />
            New
          </Link>
        }
      />

      <div className="space-y-2.5 px-4 py-5">
        {incidentsQuery.isPending &&
          Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}

        {incidentsQuery.isError && (
          <ErrorState
            message={errorMessage(
              incidentsQuery.error,
              "We couldn't load your incident reports.",
            )}
            onRetry={() => void incidentsQuery.refetch()}
          />
        )}

        {incidentsQuery.isSuccess && incidents.length === 0 && (
          <EmptyState
            icon={<ShieldAlert className="size-7" />}
            title="No incidents filed"
            message="Report violence, intimidation, vote buying, delays or logistics failures as you witness them."
            action={
              <Link
                to="/incidents/new"
                className="rounded-sm bg-destructive px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-destructive-foreground"
              >
                Report incident
              </Link>
            }
          />
        )}

        {incidents.map((incident) => (
          <IncidentCard key={incident.id} incident={incident} />
        ))}
      </div>
    </>
  );
}

function IncidentCard({ incident }: { incident: Incident }) {
  const photos = incident.media.filter((m) => m.kind === "image").length;
  const videos = incident.media.filter((m) => m.kind === "video").length;

  return (
    <article className="rounded-sm border border-border bg-surface p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={SEVERITY_STYLES[incident.severity]}>{incident.severity}</Badge>
          <Badge tone={INCIDENT_STATUS_STYLES[incident.status]}>{incident.status}</Badge>
        </div>
        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
          {timeAgo(incident.reportedAt)}
        </span>
      </div>

      <h3 className="text-sm font-bold">{incident.subject}</h3>

      <p className="mt-1 flex items-center gap-1 font-mono text-[10px] uppercase tracking-tight text-muted-foreground">
        <MapPin className="size-3 shrink-0" aria-hidden />
        {incident.unit} · {incident.type}
      </p>

      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
        {incident.description}
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
