import { useEffect, useMemo, useState, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  RefreshCw,
  MessageSquare,
  CheckSquare,
  Loader2,
  Settings,
  ListChecks,
  X,
  ChevronDown,
  Circle,
  CheckCircle2,
  FileText,
} from "lucide-react";
import type { CommentThread, WorkflowState } from "@shared/types";
import { useCommentsStore } from "@ui/store/commentsStore";
import { useFilterStore } from "@ui/store/filterStore";
import { useAuthStore } from "@ui/store/authStore";
import { useAIStore } from "@ui/store/aiStore";
import { useWorkflowStore } from "@ui/store/workflowStore";
import { FilterBar } from "./FilterBar";
import { ThreadList } from "./ThreadList";
import { ThreadDetail } from "./ThreadDetail";
import { TasksView } from "@ui/components/tasks/TasksView";

type DashboardTab = "threads" | "tasks";

const BULK_STATE_OPTIONS: { value: WorkflowState; label: string; Icon: typeof Circle }[] = [
  { value: "open", label: "Open", Icon: Circle },
  { value: "resolved", label: "Resolved", Icon: CheckCircle2 },
];

function BulkStateDropdown({ onSelect }: { onSelect: (state: WorkflowState) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick, { passive: true });
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-accent-bg text-white hover:bg-accent-hover transition-colors"
      >
        Set state
        <ChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute right-0 bottom-full mb-1 bg-figma-bg border border-figma-border rounded-lg shadow-lg z-30 min-w-[150px]">
          {BULK_STATE_OPTIONS.map((opt) => {
            const Icon = opt.Icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onSelect(opt.value);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-figma-text-secondary hover:bg-figma-bg-hover transition-colors"
              >
                <Icon size={12} />
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DashboardLayout() {
  const {
    threads,
    isLoading,
    fetchComments,
    refreshComments,
    cacheTTLMinutes,
    currentPageThreadIds,
    isResolvingPages,
  } = useCommentsStore();
  const {
    applyFilters,
    commentScope,
    workflowStateFilter,
    addressedToMe,
    sortField,
    sortDirection,
  } = useFilterStore(
    useShallow((s) => ({
      applyFilters: s.applyFilters,
      commentScope: s.commentScope,
      workflowStateFilter: s.workflowStateFilter,
      addressedToMe: s.addressedToMe,
      sortField: s.sortField,
      sortDirection: s.sortDirection,
    })),
  );
  const { showSettings, user, fileName } = useAuthStore();
  const taskCount = useAIStore((s) => s.allTasks.length);
  const getWorkflowState = useWorkflowStore((s) => s.getState);
  const initStates = useWorkflowStore((s) => s.initStates);
  const reconcileWithFigma = useWorkflowStore((s) => s.reconcileWithFigma);
  const cleanup = useWorkflowStore((s) => s.cleanup);
  const bulkSetState = useWorkflowStore((s) => s.bulkSetState);
  const workflowInitialized = useWorkflowStore((s) => s.initialized);
  const [selectedThread, setSelectedThread] = useState<CommentThread | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>("threads");
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const restoreCachedSummaries = useAIStore((s) => s.restoreCachedSummaries);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    if (threads.length > 0) {
      restoreCachedSummaries(threads);
    }
  }, [threads, restoreCachedSummaries]);

  useEffect(() => {
    if (threads.length > 0) {
      if (!workflowInitialized) {
        initStates(threads);
      } else {
        reconcileWithFigma(threads);
        cleanup(new Set(threads.map((t) => t.id)));
      }
    }
  }, [threads, workflowInitialized, initStates, reconcileWithFigma, cleanup]);

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

  const handleToggleSelect = (threadId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(threadId)) {
        next.delete(threadId);
      } else {
        next.add(threadId);
      }
      return next;
    });
  };

  const handleBulkStateChange = async (state: WorkflowState) => {
    await bulkSetState([...selectedIds], state);
    setBulkMode(false);
    setSelectedIds(new Set());
  };

  const exitBulkMode = () => {
    setBulkMode(false);
    setSelectedIds(new Set());
  };

  const isResolvingCurrentPage =
    commentScope === "current_page" &&
    (isResolvingPages || currentPageThreadIds === null);

  const filteredThreads = useMemo(() => {
    if (isResolvingCurrentPage) return [];
    return applyFilters(
      threads,
      currentPageThreadIds,
      getWorkflowState,
      user?.handle ?? null,
    );
  }, [
    isResolvingCurrentPage,
    applyFilters,
    threads,
    currentPageThreadIds,
    getWorkflowState,
    user?.handle,
    workflowStateFilter,
    addressedToMe,
    sortField,
    sortDirection,
    commentScope,
  ]);
  const filteredCount = filteredThreads.length;

  if (selectedThread) {
    const freshThread =
      threads.find((t) => t.id === selectedThread.id) ?? selectedThread;
    return <ThreadDetail thread={freshThread} onBack={handleBack} />;
  }

  return (
    <div className="flex flex-col h-full bg-figma-bg">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-figma-border">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("threads")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === "threads"
                ? "bg-accent-subtle text-accent"
                : "text-figma-text-tertiary hover:text-figma-text-secondary"
            }`}
          >
            <MessageSquare size={13} />
            Threads
            <span
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                activeTab === "threads"
                  ? "bg-accent-bg text-white"
                  : "bg-figma-bg-tertiary"
              }`}
            >
              {filteredCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tasks")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === "tasks"
                ? "bg-accent-subtle text-accent"
                : "text-figma-text-tertiary hover:text-figma-text-secondary"
            }`}
          >
            <CheckSquare size={13} />
            Tasks
            {taskCount > 0 && (
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  activeTab === "tasks"
                    ? "bg-accent-bg text-white"
                    : "bg-figma-bg-tertiary"
                }`}
              >
                {taskCount}
              </span>
            )}
          </button>
        </div>
        <div className="flex items-center gap-1">
          {activeTab === "threads" && (
            <>
              <button
                type="button"
                onClick={() => {
                  if (bulkMode) {
                    exitBulkMode();
                  } else {
                    setBulkMode(true);
                  }
                }}
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
                onClick={refreshComments}
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
            </>
          )}
          <button
            type="button"
            onClick={showSettings}
            className="p-1.5 rounded-lg text-figma-icon-secondary hover:bg-figma-bg-secondary hover:text-figma-icon transition-colors"
            data-tooltip="Settings"
            data-tooltip-align="right"
            data-tooltip-pos="bottom"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {fileName && (
        <div
          className="shrink-0 px-4 py-2 border-b border-figma-border bg-figma-bg-secondary flex items-center gap-1.5 min-h-2"
          title={fileName}
        >
          <FileText size={14} className="shrink-0 text-figma-icon-secondary" />
          <span className="text-[11px] text-figma-text-primary truncate min-w-0">
            {fileName}
          </span>
        </div>
      )}

      {activeTab === "threads" && (
        <>
          <FilterBar />
          <ThreadList
            onSelectThread={handleSelectThread}
            bulkMode={bulkMode}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
          />
        </>
      )}

      {activeTab === "tasks" && <TasksView onSelectThread={handleSelectThread} />}

      {/* Bulk action bar */}
      {bulkMode && selectedIds.size > 0 && (
        <div className="px-4 py-2.5 border-t border-figma-border bg-accent-subtle flex items-center justify-between">
          <span className="text-xs font-medium text-accent">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            <BulkStateDropdown onSelect={handleBulkStateChange} />
            <button
              type="button"
              onClick={exitBulkMode}
              className="p-1.5 rounded-lg text-figma-icon-secondary hover:bg-figma-bg-secondary hover:text-figma-icon transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
