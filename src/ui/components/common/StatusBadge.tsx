import { Circle, CheckCircle2 } from "lucide-react";
import type { ThreadStatus } from "@shared/types";

const config: Record<ThreadStatus, { label: string; className: string; Icon: typeof Circle }> = {
  open: {
    label: "Open",
    className: "bg-blue-50 text-status-open border-blue-200",
    Icon: Circle,
  },
  resolved: {
    label: "Resolved",
    className: "bg-green-50 text-status-resolved border-green-200",
    Icon: CheckCircle2,
  },
};

interface StatusBadgeProps {
  status: ThreadStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, className, Icon } = config[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-2xs font-medium border ${className}`}
    >
      <Icon size={10} />
      {label}
    </span>
  );
}
