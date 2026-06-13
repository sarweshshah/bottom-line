import type { WorkflowState } from "@shared/types";

const config: Record<
  WorkflowState,
  { label: string; dotClass: string; bgClass: string }
> = {
  open: {
    label: "OPEN",
    dotClass: "bg-status-open shadow-status-open",
    bgClass: "bg-status-open-bg text-status-open-text",
  },
  resolved: {
    label: "DONE",
    dotClass: "bg-status-resolved shadow-status-done",
    bgClass: "bg-status-resolved-bg text-status-resolved-text",
  },
};

interface StatusBadgeProps {
  status: WorkflowState;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, dotClass, bgClass } = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md ${bgClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      <span className="font-mono text-[9px] font-bold tracking-widest leading-none uppercase">
        {label}
      </span>
    </span>
  );
}
