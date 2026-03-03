import type { Task } from "@shared/types";

export const TASK_TYPE_LABELS: Record<Task["type"], string> = {
  revision: "Revision",
  approval: "Approval",
  blocker: "Blocker",
  question: "Question",
  general: "Task",
};

export const TASK_TYPE_COLORS: Record<Task["type"], string> = {
  revision: "bg-tag-revision-bg text-tag-revision-text",
  approval: "bg-tag-approval-bg text-tag-approval-text",
  blocker: "bg-tag-blocker-bg text-tag-blocker-text",
  question: "bg-tag-question-bg text-tag-question-text",
  general: "bg-figma-bg-secondary text-figma-text-secondary",
};
