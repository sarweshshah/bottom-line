import type { Task } from "@shared/types";

export const TASK_TYPE_LABELS: Record<Task["type"], string> = {
  revision: "Revision",
  approval: "Approval",
  blocker: "Blocker",
  question: "Question",
  general: "Task",
};

export const TASK_TYPE_COLORS: Record<Task["type"], string> = {
  revision: "bg-amber-100 text-amber-700",
  approval: "bg-purple-100 text-purple-700",
  blocker: "bg-red-100 text-red-700",
  question: "bg-blue-100 text-blue-700",
  general: "bg-gray-100 text-gray-600",
};
