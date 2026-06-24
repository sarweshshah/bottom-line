import {
  RefreshCw,
  MessageSquare,
  CheckSquare,
  Loader2,
  Settings,
  ListChecks,
} from "lucide-react";
import { ToolbarDivider } from "@ui/components/common/layout";
import { IconButton } from "@ui/components/common/uiPrimitives";
import { cn } from "@ui/lib/cn";
import { DashboardTabSegment, DashboardToolbarShell } from "./dashboardPrimitives";

export type DashboardTab = "threads" | "tasks";

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
    <DashboardToolbarShell
      hasFileName={hasFileName}
      tabs={
        <>
          <DashboardTabSegment
            active={activeTab === "threads"}
            onClick={() => onTabChange("threads")}
            icon={<MessageSquare size={13} />}
            label="Threads"
            count={threadCount}
          />
          <DashboardTabSegment
            active={activeTab === "tasks"}
            onClick={() => onTabChange("tasks")}
            icon={<CheckSquare size={13} />}
            label="Tasks"
            count={taskCount > 0 ? taskCount : undefined}
          />
        </>
      }
      actions={
        <>
          {showThreadActions && (
            <>
              <IconButton
                variant="nav"
                onClick={onToggleBulk}
                className={cn(
                  bulkMode && "bg-accent-subtle text-accent",
                  !bulkMode && "text-figma-icon-secondary",
                )}
                data-tooltip={bulkMode ? "Exit select mode" : "Select threads"}
                data-tooltip-align="right"
                data-tooltip-pos="bottom"
              >
                <ListChecks size={14} />
              </IconButton>
              <IconButton
                variant="nav"
                onClick={onRefresh}
                disabled={isLoading}
                className="disabled:opacity-40"
                data-tooltip="Refresh comments"
                data-tooltip-align="right"
                data-tooltip-pos="bottom"
              >
                {isLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <RefreshCw size={14} />
                )}
              </IconButton>
              <ToolbarDivider />
            </>
          )}
          <IconButton
            variant="nav"
            onClick={onShowSettings}
            data-tooltip="Settings"
            data-tooltip-align="right"
            data-tooltip-pos="bottom"
          >
            <Settings size={14} />
          </IconButton>
        </>
      }
    />
  );
}
