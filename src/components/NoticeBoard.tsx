import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone, X } from "lucide-react";
import { useWorkspace } from "../context/auth";
import { timeAgo } from "../lib/format";
import * as service from "../services/agentService";

/**
 * Unread in-app notices from the command desk — broadcasts, assignment and
 * incident alerts. Renders nothing when there is nothing new, so it never
 * pushes the agent's tasks down for no reason.
 */
export default function NoticeBoard() {
  const workspace = useWorkspace();
  const queryClient = useQueryClient();
  const queryKey = ["notices", workspace.campaignId];

  const noticesQuery = useQuery({
    queryKey,
    queryFn: () => service.fetchNotices(workspace.campaignId),
  });

  const readMutation = useMutation({
    mutationFn: service.markNoticeRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const unread = (noticesQuery.data ?? []).filter((notice) => !notice.read);
  if (unread.length === 0) return null;

  return (
    <section className="space-y-2 px-4 pt-4" aria-label="Notices">
      <p className="px-1 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
        Notices · {unread.length} unread
      </p>

      {unread.slice(0, 3).map((notice) => (
        <article
          key={notice.id}
          className="flex items-start gap-3 rounded-sm border border-primary/25 bg-primary/8 px-3 py-2.5"
        >
          <Megaphone className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="truncate text-xs font-bold">{notice.title}</h3>
              <span className="shrink-0 font-mono text-[9px] text-muted-foreground">
                {timeAgo(notice.createdAt)}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
              {notice.body}
            </p>
          </div>
          <button
            type="button"
            onClick={() => readMutation.mutate(notice.id)}
            disabled={readMutation.isPending}
            className="-mr-1 shrink-0 rounded-sm p-1 text-muted-foreground hover:text-foreground disabled:opacity-50"
            aria-label={`Mark "${notice.title}" as read`}
          >
            <X className="size-3.5" />
          </button>
        </article>
      ))}
    </section>
  );
}
