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
  connectsBelow: boolean;
}

function ViewSwitcherSegment({
  active,
  onClick,
  icon,
  label,
  count,
  connectsBelow,
}: ViewSwitcherSegmentProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-1.5 px-4 h-full font-mono text-[9px] uppercase tracking-widest leading-none transition-colors ${
        active
          ? connectsBelow
            ? "border border-b-0 border-figma-border bg-accent-subtle text-accent font-semibold hover:border-figma-border-strong"
            : "border border-b-figma-bg bg-figma-bg text-accent font-semibold -mb-px hover:border-figma-border-strong"
          : "text-figma-text-secondary font-medium hover:bg-figma-bg-hover hover:text-figma-text border-b border-transparent"
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="leading-none">{label}</span>
      {count !== undefined && (
        <span
          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none ${
            active
              ? "bg-accent text-white"
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
      className={`flex items-stretch justify-between h-9  pr-2.5 bg-figma-bg ${
        hasFileName ? "" : "border-b border-figma-border"
      }`}
    >
      <div className="flex items-stretch self-stretch -mb-px">
        <ViewSwitcherSegment
          active={activeTab === "threads"}
          onClick={() => onTabChange("threads")}
          icon={<MessageSquare size={13} />}
          label="Threads"
          count={threadCount}
          connectsBelow={hasFileName}
        />
        <ViewSwitcherSegment
          active={activeTab === "tasks"}
          onClick={() => onTabChange("tasks")}
          icon={<CheckSquare size={13} />}
          label="Tasks"
          count={taskCount > 0 ? taskCount : undefined}
          connectsBelow={hasFileName}
        />
      </div>

      <div className="flex items-center gap-1 self-center">
        {showThreadActions && (
          <>
            <button
              type="button"
              onClick={onToggleBulk}
              className={`p-1.5 rounded-lg transition-colors ${
                bulkMode
                  ? "bg-accent-subtle text-accent"
                  : "text-figma-icon-secondary hover:bg-figma-bg-secondary hover:text-figma-icon"
              }`}
              data-tooltip={bulkMode ? "Exit select mode" : "Select threads"}
              data-tooltip-align="right"
              data-tooltip-pos="bottom"
            >
              <ListChecks size={14} />
            </button>
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-figma-icon-secondary hover:bg-figma-bg-secondary hover:text-figma-icon disabled:opacity-40 transition-colors"
              data-tooltip="Refresh comments"
              data-tooltip-align="right"
              data-tooltip-pos="bottom"
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
            </button>
            <span className="w-px h-4 bg-figma-border shrink-0" aria-hidden />
          </>
        )}
        <button
          type="button"
          onClick={onShowSettings}
          className="p-1.5 rounded-lg text-figma-icon-secondary hover:bg-figma-bg-secondary hover:text-figma-icon transition-colors"
          data-tooltip="Settings"
          data-tooltip-align="right"
          data-tooltip-pos="bottom"
        >
          <Settings size={14} />
        </button>
      </div>
    </div>
  );
}
