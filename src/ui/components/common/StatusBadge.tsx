import type { ThreadStatus } from "@shared/types";

const config: Record<ThreadStatus, { label: string; dotClass: string; bgClass: string }> = {
  open: {
    label: "OPEN",
    dotClass: "bg-status-open shadow-[0_0_6px_rgba(59,130,246,0.6)]",
    bgClass: "bg-blue-500/8 text-status-open",
  },
  resolved: {
    label: "DONE",
    dotClass: "bg-status-resolved shadow-[0_0_6px_rgba(34,197,94,0.6)]",
    bgClass: "bg-green-500/8 text-status-resolved",
  },
};

interface StatusBadgeProps {
  status: ThreadStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, dotClass, bgClass } = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 py-0.5 rounded ${bgClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      <span className="font-mono text-[10px] font-semibold tracking-widest leading-none">
        {label}
      </span>
    </span>
  );
}
