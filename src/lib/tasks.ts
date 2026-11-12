import { isOverdue } from "./format";
import type { Task, TaskStatus } from "./types";

/** Tasks the agent can still act on. */
export function isActionable(status: TaskStatus): boolean {
  return status === "Pending" || status === "In Progress";
}

/** Past due and still open — cancelled and completed work is never overdue. */
export function isTaskOverdue(task: Task): boolean {
  return task.dueAt !== null && isOverdue(task.dueAt) && isActionable(task.status);
}
