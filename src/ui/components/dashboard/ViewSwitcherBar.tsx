import {
  RefreshCw,
  MessageSquare,
  CheckSquare,
  Loader2,
  Settings,
  ListChecks,
} from "lucide-react";

export type DashboardTab = "threads" | "tasks";

interface ViewSwitcherSegmentProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}

function ViewSwitcherSegment({
  active,
  onClick,
  icon,
  label,
  count,
}: ViewSwitcherSegmentProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-1.5 px-4 h-full font-mono text-[9px] uppercase tracking-widest leading-none transition-colors ${
        active
          ? "bg-accent-subtle text-accent font-semibold"
          : "text-figma-text-secondary font-medium hover:bg-figma-bg-hover hover:text-figma-text"
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="leading-none">{label}</span>
      {count !== undefined && (
        <span
          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none ${
            active
              ? "bg-accent-bg text-white"
              : "bg-figma-bg-tertiary text-figma-text-tertiary"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

interface ViewSwitcherBarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  threadCount: number;
  taskCount: number;
  bulkMode: boolean;
  onToggleBulk: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  onShowSettings: () => void;
  hasFileName: boolean;
}

export function ViewSwitcherBar({
  activeTab,
  onTabChange,
  threadCount,
  taskCount,
  bulkMode,
  onToggleBulk,
  onRefresh,
  isLoading,
  onShowSettings,
  hasFileName,
}: ViewSwitcherBarProps) {
  const showThreadActions = activeTab === "threads";

  return (
    <div
      className={`flex items-stretch justify-between h-9 bg-figma-bg ${
        hasFileName ? "" : "border-b border-figma-border"
      }`}
    >
      <div className="flex items-stretch self-stretch">
        <ViewSwitcherSegment
          active={activeTab === "threads"}
          onClick={() => onTabChange("threads")}
          icon={<MessageSquare size={13} />}
          label="Threads"
          count={threadCount}
        />
        <ViewSwitcherSegment
          active={activeTab === "tasks"}
          onClick={() => onTabChange("tasks")}
          icon={<CheckSquare size={13} />}
          label="Tasks"
          count={taskCount > 0 ? taskCount : undefined}
        />
      </div>

      <div className="flex items-stretch self-stretch">
        {showThreadActions && (
          <>
            <button
              type="button"
              onClick={onToggleBulk}
              className={`flex items-center justify-center w-9 shrink-0 transition-colors ${
                bulkMode
                  ? "bg-accent-subtle text-accent"
                  : "text-figma-icon-secondary hover:bg-figma-bg-hover"
              }`}
              data-tooltip={bulkMode ? "Exit select mode" : "Select threads"}
              data-tooltip-align="right"
              data-tooltip-pos="bottom"
            >
              <ListChecks size={15} />
            </button>
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center justify-center w-9 shrink-0 text-figma-icon-secondary hover:bg-figma-bg-hover disabled:opacity-40 transition-colors"
              data-tooltip="Refresh comments"
              data-tooltip-align="right"
              data-tooltip-pos="bottom"
            >
              {isLoading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <RefreshCw size={15} />
              )}
            </button>
            <span className="w-px self-stretch bg-figma-border shrink-0" aria-hidden />
          </>
        )}
        <button
          type="button"
          onClick={onShowSettings}
          className="flex items-center justify-center w-9 shrink-0 text-figma-icon-secondary hover:bg-figma-bg-hover transition-colors"
          data-tooltip="Settings"
          data-tooltip-align="right"
          data-tooltip-pos="bottom"
        >
          <Settings size={15} />
        </button>
      </div>
    </div>
  );
}
