import { useQuery } from "@tanstack/react-query";
import { useWorkspace } from "../context/auth";
import * as service from "../services/agentService";

/** The agent's assigned tasks in the current campaign. */
export function useTasks() {
  const workspace = useWorkspace();

  return useQuery({
    queryKey: ["tasks", workspace.campaignId],
    queryFn: () => service.fetchTasks(workspace),
  });
}

