import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CloudUpload,
  LogOut,
  Mail,
  MapPin,
  Moon,
  Phone,
  RefreshCw,
  Sun,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "../../components/PageHeader";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { useAgent, useAuth } from "../../context/auth";
import { useOffline } from "../../context/offline";
import { useTheme } from "../../context/theme";
import * as service from "../../services/agentService";

export default function Profile() {
  const agent = useAgent();
  const { signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const { isOnline, pending, sync } = useOffline();
  const navigate = useNavigate();

  const tasksQuery = useQuery({
    queryKey: ["tasks", agent.id],
    queryFn: service.fetchTasks,
  });

  const tasks = tasksQuery.data ?? [];
  const completed = tasks.filter((t) => t.status === "Completed").length;

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
          <Stat label="Reports" value={String(agent.reports)} />
          <Stat label="Completed" value={String(completed)} />
          <Stat label="Task rate" value={`${agent.taskPct}%`} />
        </section>

        <section className="divide-y divide-border rounded-sm border border-border bg-surface">
          <Row icon={<Mail className="size-4" />} label="Email" value={agent.email} />
          <Row icon={<Phone className="size-4" />} label="Phone" value={agent.phone} />
          <Row
            icon={<MapPin className="size-4" />}
            label="Sector"
            value={`${agent.ward ? `${agent.ward}, ` : ""}${agent.lga}, ${agent.state}`}
          />
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
