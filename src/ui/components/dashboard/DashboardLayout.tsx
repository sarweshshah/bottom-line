import { useEffect, useMemo, useState, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  X,
  ChevronDown,
  Circle,
  CheckCircle2,
  Eye,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import type { CommentThread, WorkflowState } from "@shared/types";
import { useCommentsStore } from "@ui/store/commentsStore";
import { useFilterStore } from "@ui/store/filterStore";
import { useAuthStore } from "@ui/store/authStore";
import { useAIStore } from "@ui/store/aiStore";
import { useWorkflowStore } from "@ui/store/workflowStore";
import { bulkSummarizeThreads } from "@ui/ai/summarize";
import { FilterBar } from "./FilterBar";
import { ThreadList } from "./ThreadList";
import { ThreadDetail } from "./ThreadDetail";
import { TasksView } from "@ui/components/tasks/TasksView";
import { FileNameBar } from "@ui/components/common/FileNameBar";
import { ViewSwitcherBar, type DashboardTab } from "./ViewSwitcherBar";

const BULK_STATE_OPTIONS: {
  value: WorkflowState;
  label: string;
  Icon: typeof Circle;
}[] = [
  { value: "open", label: "Open", Icon: Circle },
  { value: "read", label: "Read", Icon: Eye },
  { value: "resolved", label: "Resolved", Icon: CheckCircle2 },
];

function BulkStateDropdown({
  onSelect,
}: {
  onSelect: (state: WorkflowState) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClick, { passive: true });
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-accent-bg text-white hover:bg-accent-hover transition-colors"
      >
        Set state
        <ChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute right-0 bottom-full mb-1 bg-figma-bg border border-figma-border rounded-md shadow-lg z-30 min-w-[150px]">
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

function BulkSummaryProgressBar() {
  const progress = useAIStore((s) => s.bulkSummaryProgress);
  const dismissBulkSummary = useAIStore((s) => s.dismissBulkSummary);

  const isComplete = progress ? !progress.inProgress : false;
  const hasFailures = progress ? progress.failed > 0 : false;

  // Auto-dismiss once summarizing finishes (keep visible if any failed so the
  // user can see what went wrong).
  useEffect(() => {
    if (!isComplete || hasFailures) return;
    const timeoutId = window.setTimeout(dismissBulkSummary, 300);
    return () => window.clearTimeout(timeoutId);
  }, [isComplete, hasFailures, dismissBulkSummary]);

  if (!progress) return null;

  const { total, completed, failed, inProgress } = progress;
  const done = completed + failed;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const allFailed = !inProgress && completed === 0 && failed > 0;
  const showErrorOnly = !inProgress && failed > 0;

  const title = inProgress
    ? "Summarizing threads"
    : allFailed
      ? "Couldn't summarize"
      : "Summaries ready";

  const errorMessage = allFailed
    ? "Summary generation failed for all selected threads"
    : `${failed} ${failed === 1 ? "thread" : "threads"} failed`;

  return (
    <div className="shrink-0 px-4 py-3 border-b border-figma-border bg-figma-bg-secondary">
      <div className="flex items-center gap-2.5">
        <span
          className={`shrink-0 flex items-center justify-center w-7 h-7 rounded-md ${
            showErrorOnly
              ? "bg-danger-bg"
              : inProgress
                ? "bg-accent-subtle"
                : "bg-accent-subtle"
          }`}
        >
          {showErrorOnly ? (
            <AlertCircle size={14} className="text-danger" />
          ) : (
            <Sparkles size={14} className="text-accent" />
          )}
        </span>

        <div className="flex-1 min-w-0">
          {showErrorOnly ? (
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-figma-text truncate min-w-0">
                {title}
              </span>
              <span className="text-[10px] font-medium text-danger">
                {errorMessage}
              </span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-figma-text truncate min-w-0">
                  {title}
                </span>
                <span className="ml-auto shrink-0 text-[10px] font-semibold tabular-nums text-figma-text-tertiary">
                  {done}/{total}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-figma-bg-tertiary overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent-bg transition-[width] duration-300 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </>
          )}
        </div>

        {!inProgress && (
          <button
            type="button"
            onClick={dismissBulkSummary}
            className={`shrink-0 p-1 rounded-md text-figma-icon-tertiary hover:bg-figma-bg-tertiary hover:text-figma-icon transition-colors ${
              showErrorOnly ? "self-center" : "self-start"
            }`}
            data-tooltip="Dismiss"
            data-tooltip-align="right"
            data-tooltip-pos="bottom"
          >
            <X size={12} />
          </button>
        )}
      </div>
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
  } = useCommentsStore();
  const {
    applyFilters,
    commentScope,
    workflowStateFilter,
    addressedToMe,
    sortField,
    sortDirection,
    timeFilterPreset,
    customTimeStart,
    customTimeEnd,
  } = useFilterStore(
    useShallow((s) => ({
      applyFilters: s.applyFilters,
      commentScope: s.commentScope,
      workflowStateFilter: s.workflowStateFilter,
      addressedToMe: s.addressedToMe,
      sortField: s.sortField,
      sortDirection: s.sortDirection,
      timeFilterPreset: s.timeFilterPreset,
      customTimeStart: s.customTimeStart,
      customTimeEnd: s.customTimeEnd,
    })),
  );
  const { showSettings, user, fileName } = useAuthStore();
  const taskCount = useAIStore((s) => s.allTasks.length);
  const needsConsent = useAIStore((s) => s.needsConsent);
  const getWorkflowState = useWorkflowStore((s) => s.getState);
  const initStates = useWorkflowStore((s) => s.initStates);
  const reconcileWithFigma = useWorkflowStore((s) => s.reconcileWithFigma);
  const cleanup = useWorkflowStore((s) => s.cleanup);
  const bulkSetState = useWorkflowStore((s) => s.bulkSetState);
  const workflowInitialized = useWorkflowStore((s) => s.initialized);
  const [selectedThread, setSelectedThread] = useState<CommentThread | null>(
    null,
  );
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

  const handleBulkSummarize = async () => {
    const selectedThreads = threads.filter((t) => selectedIds.has(t.id));
    if (needsConsent()) {
      window.dispatchEvent(
        new CustomEvent("show-ai-consent", {
          detail: {
            onConsent: () => void bulkSummarizeThreads(selectedThreads),
          },
        }),
      );
      setBulkMode(false);
      setSelectedIds(new Set());
      return;
    }
    setBulkMode(false);
    setSelectedIds(new Set());
    await bulkSummarizeThreads(selectedThreads);
  };

  const exitBulkMode = () => {
    setBulkMode(false);
    setSelectedIds(new Set());
  };

  const isResolvingCurrentPage =
    commentScope === "current_page" &&
    currentPageThreadIds === null &&
    threads.length > 0;

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
    timeFilterPreset,
    customTimeStart,
    customTimeEnd,
  ]);
  const filteredCount = filteredThreads.length;

  if (selectedThread) {
    const freshThread =
      threads.find((t) => t.id === selectedThread.id) ?? selectedThread;
    return <ThreadDetail thread={freshThread} onBack={handleBack} />;
  }

  return (
    <div className="flex flex-col h-full bg-figma-bg">
      <ViewSwitcherBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        threadCount={filteredCount}
        taskCount={taskCount}
        bulkMode={bulkMode}
        onToggleBulk={() => {
          if (bulkMode) {
            exitBulkMode();
          } else {
            setBulkMode(true);
          }
        }}
        onRefresh={refreshComments}
        isLoading={isLoading}
        onShowSettings={showSettings}
        hasFileName={!!fileName}
      />

      {fileName && <FileNameBar fileName={fileName} />}

      {activeTab === "threads" && (
        <>
          <FilterBar />
          <BulkSummaryProgressBar />
          <ThreadList
            onSelectThread={handleSelectThread}
            bulkMode={bulkMode}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
          />
        </>
      )}

      {activeTab === "tasks" && (
        <TasksView onSelectThread={handleSelectThread} />
      )}

      {/* Bulk action bar */}
      {bulkMode && selectedIds.size > 0 && (
        <div className="pl-4 pr-2 py-2.5 border-t border-figma-border bg-accent-subtle flex items-center justify-between">
          <span className="text-xs font-medium text-accent">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBulkSummarize}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-figma-bg-secondary text-figma-text-secondary hover:text-figma-text hover:bg-figma-bg-tertiary transition-colors"
            >
              <Sparkles size={12} />
              Summarize
            </button>
            <BulkStateDropdown onSelect={handleBulkStateChange} />
            <button
              type="button"
              onClick={exitBulkMode}
              className="p-1.5 rounded-md text-figma-icon-secondary hover:bg-figma-bg-secondary hover:text-figma-icon transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
