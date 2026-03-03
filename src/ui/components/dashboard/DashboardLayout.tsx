import { useEffect, useState } from "react";
import {
  RefreshCw,
  MessageSquare,
  CheckSquare,
  Loader2,
  Settings,
} from "lucide-react";
import type { CommentThread } from "@shared/types";
import { useCommentsStore } from "@ui/store/commentsStore";
import { useFilterStore } from "@ui/store/filterStore";
import { useAuthStore } from "@ui/store/authStore";
import { useAIStore } from "@ui/store/aiStore";
import { FilterBar } from "./FilterBar";
import { ThreadList } from "./ThreadList";
import { ThreadDetail } from "./ThreadDetail";
import { TasksView } from "@ui/components/tasks/TasksView";

type DashboardTab = "threads" | "tasks";

export function DashboardLayout() {
  const {
    threads,
    isLoading,
    fetchComments,
    refreshComments,
    cacheTTLMinutes,
    currentPageThreadIds,
  } = useCommentsStore();
  const { applyFilters } = useFilterStore();
  const { showSettings } = useAuthStore();
  const taskCount = useAIStore((s) => s.allTasks.length);
  const [selectedThread, setSelectedThread] = useState<CommentThread | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<DashboardTab>("threads");

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refreshComments();
    }, cacheTTLMinutes * 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [cacheTTLMinutes, refreshComments]);

  const handleSelectThread = (thread: CommentThread) => {
    setSelectedThread(thread);
  };

  const handleBack = () => {
    setSelectedThread(null);
  };

  if (selectedThread) {
    const freshThread =
      threads.find((t) => t.id === selectedThread.id) ?? selectedThread;
    return <ThreadDetail thread={freshThread} onBack={handleBack} />;
  }

  const filteredCount = applyFilters(threads, currentPageThreadIds).length;

  return (
    <div className="flex flex-col h-full bg-figma-bg">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-figma-border">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("threads")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === "threads"
                ? "bg-figma-bg-secondary text-figma-text"
                : "text-figma-text-tertiary hover:text-figma-text-secondary"
            }`}
          >
            <MessageSquare size={13} />
            Threads
            <span className="text-[10px] bg-figma-bg-tertiary px-1.5 py-0.5 rounded-full">
              {filteredCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tasks")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === "tasks"
                ? "bg-figma-bg-secondary text-figma-text"
                : "text-figma-text-tertiary hover:text-figma-text-secondary"
            }`}
          >
            <CheckSquare size={13} />
            Tasks
            {taskCount > 0 && (
              <span className="text-[10px] bg-figma-bg-tertiary px-1.5 py-0.5 rounded-full">
                {taskCount}
              </span>
            )}
          </button>
        </div>
        <div className="flex items-center gap-1">
          {activeTab === "threads" && (
            <button
              type="button"
              onClick={refreshComments}
              disabled={isLoading}
              className="p-1.5 rounded-md text-figma-icon-secondary hover:bg-figma-bg-secondary hover:text-figma-icon disabled:opacity-40 transition-colors"
              title="Refresh comments"
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={showSettings}
            className="p-1.5 rounded-md text-figma-icon-secondary hover:bg-figma-bg-secondary hover:text-figma-icon transition-colors"
            title="Settings"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {activeTab === "threads" && (
        <>
          <FilterBar />
          <ThreadList onSelectThread={handleSelectThread} />
        </>
      )}

      {activeTab === "tasks" && <TasksView />}
    </div>
  );
}
