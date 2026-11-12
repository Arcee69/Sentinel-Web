import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { OfflineContext, type OfflineValue, type SubmitOutcome } from "./offline";
import { forgetMedia } from "../lib/media";
import { deliver, discardItem, enqueue, flushQueue, listQueue, retryItem } from "../lib/outbox";
import { toApiError } from "../services/errors";
import { getToken } from "../services/session";
import type { ProgressHandler } from "../services/agentService";
import type { MediaItem, OutboxItem, OutboxKind } from "../lib/types";

const OUTBOX_KEY = ["outbox"];

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const queryClient = useQueryClient();

  // The queue lives in IndexedDB; react-query owns reading and re-reading it.
  const outboxQuery = useQuery({
    queryKey: OUTBOX_KEY,
    queryFn: () => listQueue(),
    initialData: [],
  });
  const items = outboxQuery.data;
  const pending = items.filter((item) => !item.failed).length;
  const rejected = useMemo(() => items.filter((item) => item.failed), [items]);

  const refreshQueue = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: OUTBOX_KEY });
  }, [queryClient]);

  const sync = useCallback(async () => {
    // Signed out: replaying now would 401 and park every item as rejected.
    if (!navigator.onLine || !getToken()) return;
    if ((await listQueue()).every((item) => item.failed)) return;

    const result = await flushQueue();

    if (result.sent > 0) {
      toast.success(
        `${result.sent} queued ${result.sent === 1 ? "submission" : "submissions"} synced`,
      );
      // Server state moved — let every list refetch, the outbox included.
      await queryClient.invalidateQueries();
      return;
    }

    await refreshQueue();

    if (result.failed > 0) {
      toast.error("Couldn't sync queued work. Check Profile for anything that needs attention.");
    }
  }, [queryClient, refreshQueue]);

  const submit = useCallback(
    async (kind: OutboxKind, payload: unknown, onProgress?: ProgressHandler) => {
      const park = async (): Promise<SubmitOutcome> => {
        await enqueue(kind, payload);
        await refreshQueue();
        return "queued";
      };

      if (!navigator.onLine) return park();

      try {
        const outcome = await deliver(kind, payload, onProgress);
        if (outcome === "evidence-queued") await refreshQueue();
        return outcome;
      } catch (error) {
        // Signal dropped mid-send: the payload carries its own idempotency
        // keys, so replaying it later is safe.
        if (toApiError(error).isNetwork) return park();
        throw error;
      }
    },
    [refreshQueue],
  );

  const retry = useCallback(
    async (item: OutboxItem) => {
      await retryItem(item);
      await refreshQueue();
      await sync();
    },
    [refreshQueue, sync],
  );

  const discard = useCallback(
    async (item: OutboxItem) => {
      await discardItem(item.id);
      const media = (item.payload as { media?: MediaItem[] } | null)?.media ?? [];
      await Promise.all(media.map((m) => forgetMedia(m.id)));
      await refreshQueue();
    },
    [refreshQueue],
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
    () => ({ isOnline, pending, rejected, submit, sync, retry, discard }),
    [isOnline, pending, rejected, submit, sync, retry, discard],
  );

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}
