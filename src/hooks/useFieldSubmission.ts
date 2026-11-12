import { useState } from "react";
import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import { useWorkspace } from "../context/auth";
import { useOffline } from "../context/offline";
import * as service from "../services/agentService";
import { errorMessage } from "../services/instance";
import type { OutboxKind } from "../lib/types";

interface Options {
  kind: OutboxKind;
  /** Toast once the server has the record. */
  sentMessage: string;
  /** Lists that should refetch afterwards. */
  invalidate: QueryKey[];
  onDone: () => void;
}

interface Variables {
  draft: unknown;
  /** Close out this task once the submission lands. */
  completeTaskId?: string;
}

/**
 * Shared send path for the report forms: deliver or queue the draft, close
 * out the linked task when asked, and tell the agent exactly where their
 * submission stands — sent, parked on the device, or sent with attachments
 * still uploading. A queued record is never presented as delivered.
 */
export function useFieldSubmission({ kind, sentMessage, invalidate, onDone }: Options) {
  const workspace = useWorkspace();
  const queryClient = useQueryClient();
  const { submit } = useOffline();
  const [progress, setProgress] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: async ({ draft, completeTaskId }: Variables) => {
      setProgress(0);
      const outcome = await submit(kind, draft, setProgress);

      if (completeTaskId && outcome !== "queued") {
        try {
          await service.completeTaskIfOpen(completeTaskId, workspace);
        } catch (error) {
          toast.warning(
            `Filed, but the task couldn't be marked complete: ${errorMessage(error)} Finish it from the task screen.`,
          );
        }
      }

      return outcome;
    },
    onSuccess: async (outcome) => {
      if (outcome === "sent") toast.success(sentMessage);
      if (outcome === "queued") {
        toast.success("Saved offline — it'll be sent the moment you have signal");
      }
      if (outcome === "evidence-queued") {
        toast.warning(
          "Filed. Some attachments didn't upload — they're queued and will retry automatically.",
        );
      }

      await Promise.all(
        [...invalidate, ["tasks", workspace.campaignId], ["task"]].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      );
      onDone();
    },
    onError: (error) => {
      setProgress(null);
      toast.error(errorMessage(error, "Couldn't submit. Check the form and try again."));
    },
  });

  return { mutation, progress };
}
