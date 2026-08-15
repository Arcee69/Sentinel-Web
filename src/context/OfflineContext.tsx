import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { OfflineContext, type OfflineValue } from "./offline";
import { enqueue, flushQueue, queueSize } from "../lib/outbox";
import type { OutboxKind } from "../lib/types";

const OUTBOX_KEY = ["outbox", "count"];

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const queryClient = useQueryClient();

  // The queue lives in IndexedDB; react-query owns reading and re-reading it.
  const outboxQuery = useQuery({
    queryKey: OUTBOX_KEY,
    queryFn: () => queueSize(),
    initialData: 0,
  });
  const pending = outboxQuery.data;

  const refreshPending = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: OUTBOX_KEY });
  }, [queryClient]);

  const sync = useCallback(async () => {
    if (!navigator.onLine) return;
    if ((await queueSize().catch(() => 0)) === 0) return;

    const result = await flushQueue();

    if (result.sent > 0) {
      toast.success(
        `${result.sent} queued ${result.sent === 1 ? "submission" : "submissions"} synced`,
      );
      // Server state moved — let every list refetch, the outbox count included.
      await queryClient.invalidateQueries();
      return;
    }

    await refreshPending();

    if (result.failed > 0) {
      toast.error("Couldn't sync queued work. We'll retry automatically.");
    }
  }, [queryClient, refreshPending]);

  const queue = useCallback(
    async (kind: OutboxKind, payload: unknown) => {
      await enqueue(kind, payload);
      await refreshPending();
    },
    [refreshPending],
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      void sync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Coming back to a backgrounded tab is another chance to drain the queue.
    const handleVisible = () => {
      if (document.visibilityState === "visible") void sync();
    };
    document.addEventListener("visibilitychange", handleVisible);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisible);
    };
  }, [sync]);

  const value = useMemo<OfflineValue>(
    () => ({ isOnline, pending, queue, sync, refreshPending }),
    [isOnline, pending, queue, sync, refreshPending],
  );

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}
