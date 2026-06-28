import type { Task } from "@shared/types";
import { cn } from "@ui/lib/cn";

export const TASK_TYPE_LABELS: Record<Task["type"], string> = {
  revision: "Revision",
  approval: "Approval",
  blocker: "Blocker",
  question: "Question",
  general: "Task",
};

const TASK_TYPE_STYLES: Record<Task["type"], string> = {
  revision: "bg-tag-revision-bg text-tag-revision-text",
  approval: "bg-tag-approval-bg text-tag-approval-text",
  blocker: "bg-tag-blocker-bg text-tag-blocker-text",
  question: "bg-tag-question-bg text-tag-question-text",
  general: "bg-figma-bg-secondary text-figma-text-secondary",
};

export function TaskTypeBadge({
  type,
  className = "",
}: {
  type: Task["type"];
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block", // layout
        "px-1.5 py-0.5", // size
        "text-[9px] font-medium", // typography
        "rounded-full", // corner radius
        TASK_TYPE_STYLES[type], // state variants
        // className
        className,
      )}
    >
      {TASK_TYPE_LABELS[type]}
    </span>
  );
}
