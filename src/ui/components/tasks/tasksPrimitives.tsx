import type { ReactNode } from "react";
import {
  CheckSquare,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Sparkles,
  Square,
} from "lucide-react";
import type { TaskStatus } from "@shared/types";
import { HeroLayout, FilterBarShell, AppScreenBody } from "@ui/components/common/layout";
import { IconButton, FilterChip } from "@ui/components/common/uiPrimitives";
import { cn } from "@ui/lib/cn";

export function TasksViewShell({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <AppScreenBody
      className={cn(
        "min-h-0", // layout
        className,
      )}
    >
      {children}
    </AppScreenBody>
  );
}

export function TaskCheckbox({
  done,
  onToggle,
  className = "",
}: {
  done: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "shrink-0", // layout
        "mt-0.5", // size
        "text-figma-icon-secondary", // typography
        "transition-colors", // transition / animation
        "hover:text-figma-icon", // interactive states
        className,
      )}
    >
      {done ? (
        <CheckSquare size={14} className="text-status-resolved" />
      ) : (
        <Square size={14} />
      )}
    </button>
  );
}

export function TaskDescription({
  done,
  children,
}: {
  done: boolean;
  children: ReactNode;
}) {
  return (
    <p
      className={cn(
        "text-[11px] leading-relaxed", // typography
        done
          ? "text-figma-text-disabled line-through"
          : "text-figma-text", // state variants
      )}
    >
      {children}
    </p>
  );
}

export function TaskRow({
  done,
  description,
  onToggle,
  meta,
  trailing,
  className = "flex items-start gap-2",
}: {
  done: boolean;
  description: string;
  onToggle: () => void;
  meta?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <TaskCheckbox done={done} onToggle={onToggle} />
      <div className="flex-1 min-w-0">
        <TaskDescription done={done}>{description}</TaskDescription>
        {meta || trailing ? (
          <div
            className={cn(
              "flex items-center", // layout
              "mt-0.5", // size
              trailing ? "justify-between gap-2" : "gap-2", // state variants
            )}
          >
            {meta && (
              <div className="flex items-center gap-1.5 min-w-0">{meta}</div>
            )}
            {trailing}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function TaskGroupHeader({
  label,
  count,
  collapsed,
  onToggle,
}: {
  label: string;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "w-full flex items-center text-left", // layout
        "px-4 py-2", // size
        "bg-figma-bg-secondary", // bg
        "border-b border-figma-border", // border
        "transition-colors", // transition / animation
        "hover:bg-figma-bg-tertiary", // interactive states
      )}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        {collapsed ? (
          <ChevronRight
            size={12}
            className="shrink-0 text-figma-icon-secondary"
          />
        ) : (
          <ChevronDown size={12} className="shrink-0 text-figma-icon-secondary" />
        )}
        <span className="text-xs font-medium text-figma-text-secondary truncate">
          {label}
          <span className="font-normal text-figma-text-disabled">
            {" "}
            ({count})
          </span>
        </span>
      </div>
    </button>
  );
}

export function TaskStatusFilterBar({
  pendingCount,
  doneCount,
  statusFilter,
  onToggle,
}: {
  pendingCount: number;
  doneCount: number;
  statusFilter: Set<TaskStatus>;
  onToggle: (status: TaskStatus) => void;
}) {
  return (
    <FilterBarShell>
      <FilterChip
        active={statusFilter.has("pending")}
        onClick={() => onToggle("pending")}
      >
        {pendingCount} pending
      </FilterChip>
      <FilterChip
        active={statusFilter.has("done")}
        onClick={() => onToggle("done")}
      >
        {doneCount} done
      </FilterChip>
    </FilterBarShell>
  );
}

export function TaskThreadLinkButton({ onClick }: { onClick: () => void }) {
  return (
    <IconButton
      variant="toolbar"
      onClick={onClick}
      data-tooltip="Open thread"
      data-tooltip-align="right"
      data-tooltip-pos="bottom"
      className="shrink-0"
    >
      <MessageSquare size={11} />
    </IconButton>
  );
}

export function TasksEmptyState() {
  return (
    <HeroLayout className="flex-1">
      <div
        className={cn(
          "w-10 h-10 flex items-center justify-center", // layout
          "mb-3", // size
          "bg-accent-subtle", // bg
          "rounded-full", // corner radius
        )}
      >
        <Sparkles size={20} className="text-accent" />
      </div>
      <p className="text-sm font-medium text-figma-text mb-1">No tasks yet</p>
      <p className="text-xs text-figma-text-tertiary leading-relaxed">
        Summarize threads to extract tasks. <br /> Open a thread and click
        &ldquo;Summarize&rdquo; to get started.
      </p>
    </HeroLayout>
  );
}

export function TaskMultiAssigneeNames({ names }: { names: string[] }) {
  return (
    <span className="text-[9px] text-figma-text-tertiary">
      {names.join(", ")}
    </span>
  );
}

export function TaskList({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-figma-border">{children}</div>;
}

export function TaskListItem({
  children,
  className = "flex items-start gap-2.5 px-4 py-2.5",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
