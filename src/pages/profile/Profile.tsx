import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  Bell,
  CloudUpload,
  Flag,
  LogOut,
  Mail,
  MapPin,
  Moon,
  Phone,
  RefreshCw,
  Sun,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "../../components/PageHeader";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { useAgent, useAuth, useWorkspace } from "../../context/auth";
import { useOffline } from "../../context/offline";
import { useTheme } from "../../context/theme";
import { useTasks } from "../../hooks/useTasks";
import { timeAgo } from "../../lib/format";
import * as service from "../../services/agentService";
import { errorMessage } from "../../services/instance";
import type { NotificationPreferences, OutboxItem, OutboxKind } from "../../lib/types";

const PREFERENCES: { key: keyof NotificationPreferences; label: string }[] = [
  { key: "assignments", label: "Assignments & tasks" },
  { key: "incidents", label: "Incident alerts" },
  { key: "campaign_messages", label: "Campaign messages" },
];

const KIND_LABEL: Record<OutboxKind, string> = {
  "field-report": "Task report",
  "polling-report": "Election report",
  "incident-report": "Incident report",
  "task-transition": "Task update",
  evidence: "Attachments",
};

export default function Profile() {
  const agent = useAgent();
  const workspace = useWorkspace();
  const { signOut, updateAgent } = useAuth();
  const { theme, toggle } = useTheme();
  const { isOnline, pending, rejected, sync } = useOffline();
  const navigate = useNavigate();

  // Same basis as Home: cancelled tasks don't count against the agent. The
  // context totals include them, so they're only the fallback before tasks load.
  const tasks = useTasks().data?.filter((t) => t.status !== "Cancelled");
  const tasksTotal = tasks?.length ?? agent.stats.tasksTotal;
  const tasksCompleted =
    tasks?.filter((t) => t.status === "Completed").length ?? agent.stats.tasksCompleted;
  const taskRate = tasksTotal ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;
  const { reports } = agent.stats;

  const preferenceMutation = useMutation({
    mutationFn: service.updateNotificationPreferences,
    onSuccess: (preferences) => updateAgent({ notificationPreferences: preferences }),
    onError: (error) => toast.error(errorMessage(error, "Couldn't save that preference.")),
  });

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/login", { replace: true });
  };

  return (
    <>
      <PageHeader eyebrow="Your account" title="Profile" />

      <div className="space-y-4 px-4 py-5">
        <section className="flex items-center gap-4 rounded-sm border border-border bg-surface p-4">
          <span
            className="flex size-14 shrink-0 items-center justify-center rounded-sm bg-primary font-display text-lg font-bold text-primary-foreground"
            aria-hidden
          >
            {agent.initials}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-base font-bold">{agent.name}</p>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {agent.role}
            </p>
            <Badge
              className="mt-1.5"
              tone={
                agent.status === "active"
                  ? "bg-success/15 text-success border border-success/30"
                  : "bg-muted text-muted-foreground border border-border"
              }
            >
              {agent.status}
            </Badge>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-2">
          <Stat label="Reports" value={String(reports)} />
          <Stat label="Completed" value={String(tasksCompleted)} />
          <Stat label="Task rate" value={`${taskRate}%`} />
        </section>

        <section className="divide-y divide-border rounded-sm border border-border bg-surface">
          <Row icon={<Mail className="size-4" />} label="Email" value={agent.email} />
          <Row icon={<Phone className="size-4" />} label="Phone" value={agent.phone ?? "—"} />
          <Row icon={<MapPin className="size-4" />} label="Sector" value={agent.sector} />
          <Row icon={<Flag className="size-4" />} label="Campaign" value={workspace.campaignName} />
        </section>

        {!workspace.assignmentId && (
          <p className="flex items-start gap-2 rounded-sm border border-warning/30 bg-warning/10 px-3 py-2.5 text-[11px] leading-snug">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden />
            You have no active assignment in this campaign, so reports can't be filed yet.
            Contact your supervisor.
          </p>
        )}

        {rejected.length > 0 && <RejectedQueue items={rejected} />}

        <section className="divide-y divide-border rounded-sm border border-border bg-surface">
          <p className="flex items-center gap-3 px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <Bell className="size-4" aria-hidden />
            Notify me about
          </p>
          {PREFERENCES.map(({ key, label }) => {
            const on = agent.notificationPreferences[key];
            return (
              <label
                key={key}
                className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3"
              >
                <span className="text-sm font-medium">{label}</span>
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={on}
                  disabled={!isOnline || preferenceMutation.isPending}
                  onChange={() => preferenceMutation.mutate({ [key]: !on })}
                />
              </label>
            );
          })}
        </section>

        <section className="divide-y divide-border rounded-sm border border-border bg-surface">
          <button
            type="button"
            onClick={toggle}
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-muted/40"
          >
            <span className="flex items-center gap-3">
              <span className="text-muted-foreground" aria-hidden>
                {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
              </span>
              <span className="text-sm font-medium">Appearance</span>
            </span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {theme}
            </span>
          </button>

          <button
            type="button"
            onClick={() => void sync()}
            disabled={!isOnline || pending === 0}
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-muted/40 disabled:opacity-60"
          >
            <span className="flex items-center gap-3">
              <span className="text-muted-foreground" aria-hidden>
                {pending > 0 ? (
                  <CloudUpload className="size-4" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
              </span>
              <span className="text-sm font-medium">
                {pending > 0 ? "Sync queued work" : "Everything synced"}
              </span>
            </span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {pending > 0 ? `${pending} pending` : isOnline ? "Online" : "Offline"}
            </span>
          </button>
        </section>

        <Button
          variant="outline"
          size="lg"
          fullWidth
          icon={<LogOut className="size-4" aria-hidden />}
          onClick={() => void handleSignOut()}
        >
          Sign out
        </Button>

        <p className="pb-2 text-center font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
          SMHP Sentinel Connect
        </p>
      </div>
    </>
  );
}

/** Submissions the server turned down — kept visible until the agent decides. */
function RejectedQueue({ items }: { items: OutboxItem[] }) {
  const { isOnline, retry, discard } = useOffline();

  return (
    <section className="space-y-2 rounded-sm border border-destructive/30 bg-destructive/5 p-3">
      <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-destructive">
        <TriangleAlert className="size-3.5" aria-hidden />
        {items.length} not delivered
      </p>

      {items.map((item) => (
        <div key={item.id} className="rounded-sm border border-border bg-surface p-3">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs font-bold">{KIND_LABEL[item.kind] ?? "Submission"}</p>
            <span className="shrink-0 font-mono text-[9px] text-muted-foreground">
              Saved {timeAgo(item.createdAt)}
            </span>
          </div>
          {item.lastError && (
            <p className="mt-1 text-[11px] leading-snug text-destructive">{item.lastError}</p>
          )}
          <div className="mt-2.5 flex gap-2">
            <Button size="sm" variant="outline" disabled={!isOnline} onClick={() => void retry(item)}>
              Retry
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (window.confirm("Discard this submission? It hasn't reached the server.")) {
                  void discard(item);
                }
              }}
            >
              Discard
            </Button>
          </div>
        </div>
      ))}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-border bg-surface p-3 text-center">
      <p className="font-display text-lg font-bold leading-none">{value}</p>
      <p className="mt-1.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <span className="flex items-center gap-3">
        <span className="text-muted-foreground" aria-hidden>
          {icon}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      </span>
      <span className="truncate text-right text-sm font-medium">{value}</span>
    </div>
  );
}
