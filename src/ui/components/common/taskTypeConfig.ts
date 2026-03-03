import type { Task } from "@shared/types";

export const TASK_TYPE_LABELS: Record<Task["type"], string> = {
  revision: "Revision",
  approval: "Approval",
  blocker: "Blocker",
  question: "Question",
  general: "Task",
};

export const TASK_TYPE_COLORS: Record<Task["type"], string> = {
  revision: "bg-amber-500/10 text-amber-500",
  approval: "bg-purple-500/10 text-purple-500",
  blocker: "bg-red-500/10 text-red-500",
  question: "bg-blue-500/10 text-blue-500",
  general: "bg-figma-bg-secondary text-figma-text-secondary",
};
