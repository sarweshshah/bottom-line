import { MessageSquare, Filter, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

type EmptyVariant = "no-comments" | "no-matches" | "api-error" | "all-resolved" | "addressed-to-me";

const variants: Record<
  EmptyVariant,
  { Icon: typeof MessageSquare; title: string; description: string }
> = {
  "no-comments": {
    Icon: MessageSquare,
    title: "No comments yet",
    description: "This file has no comments yet. Start the conversation!",
  },
  "no-matches": {
    Icon: Filter,
    title: "No threads match",
    description: "No threads match your current filters.",
  },
  "api-error": {
    Icon: AlertCircle,
    title: "Couldn't fetch comments",
    description: "Check your connection and token.",
  },
  "all-resolved": {
    Icon: CheckCircle2,
    title: "All caught up!",
    description: "All threads have been resolved.",
  },
  "addressed-to-me": {
    Icon: Sparkles,
    title: "You're all caught up!",
    description: "No threads need your attention right now.",
  },
};

interface EmptyStateProps {
  variant: EmptyVariant;
  action?: ReactNode;
}

export function EmptyState({ variant, action }: EmptyStateProps) {
  const { Icon, title, description } = variants[variant];
  const isError = variant === "api-error";

  return (
    <div
      className="flex flex-col items-center px-6 text-center"
      style={{ paddingTop: "33%" }}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${
        isError ? "bg-danger-bg" : "bg-accent/10"
      }`}>
        <Icon size={20} className={isError ? "text-danger" : "text-accent"} />
      </div>
      <h3 className="text-sm font-medium text-figma-text mb-1">{title}</h3>
      <p className="text-sm text-figma-text-tertiary mb-4 max-w-[240px]">
        {description}
      </p>
      {action}
    </div>
  );
}
