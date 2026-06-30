import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import type { CommentThread, WorkflowState } from "@shared/types";
import { useCommentsStore } from "@ui/store/commentsStore";
import { useFilterStore } from "@ui/store/filterStore";
import { useAuthStore } from "@ui/store/authStore";
import { useAIStore } from "@ui/store/aiStore";
import { useWorkflowStore } from "@ui/store/workflowStore";
import { bulkSummarizeThreads } from "@ui/ai/summarize";
import { requestAiConsent } from "@ui/ai/consent";
import { FilterBar } from "./FilterBar";
import { ThreadList } from "./ThreadList";
import { ThreadDetail } from "./ThreadDetail";
import { ActivitySummaryPanel } from "./ActivitySummaryPanel";
import { useFilteredThreads } from "./useFilteredThreads";
import { AppScreenShell } from "@ui/components/common/layout";
import { TasksView } from "@ui/components/tasks/TasksView";
import {
  BulkActionBar,
  BulkSummaryProgressBar,
  FileNameBar,
} from "./dashboardPrimitives";
import { ViewSwitcherBar, type DashboardTab } from "./ViewSwitcherBar";
import {
  computeActivitySummary,
  ACTIVITY_WINDOW_PRESET,
  type ActivityFilter,
} from "@ui/lib/activitySummary";
import { getTimeRangeBounds } from "@ui/store/filterStore";

export function DashboardLayout() {
  const {
    threads,
    isLoading,
    fetchComments,
    refreshComments,
    cacheTTLMinutes,
    currentPageThreadIds,
    isResolvingPages,
    resolveCurrentPageThreads,
  } = useCommentsStore(
    useShallow((s) => ({
      threads: s.threads,
      isLoading: s.isLoading,
      fetchComments: s.fetchComments,
      refreshComments: s.refreshComments,
      cacheTTLMinutes: s.cacheTTLMinutes,
      currentPageThreadIds: s.currentPageThreadIds,
      isResolvingPages: s.isResolvingPages,
      resolveCurrentPageThreads: s.resolveCurrentPageThreads,
    })),
  );
  const {
    commentScope,
    timeFilterPreset,
    activityCategoryFilter,
    setTimeFilterPreset,
    setActivityCategoryFilter,
  } = useFilterStore(
    useShallow((s) => ({
      commentScope: s.commentScope,
      timeFilterPreset: s.timeFilterPreset,
      activityCategoryFilter: s.activityCategoryFilter,
      setTimeFilterPreset: s.setTimeFilterPreset,
      setActivityCategoryFilter: s.setActivityCategoryFilter,
    })),
  );
  const { showSettings, fileName } = useAuthStore(
    useShallow((s) => ({
      showSettings: s.showSettings,
      fileName: s.fileName,
    })),
  );
  const taskCount = useAIStore((s) => s.allTasks.length);
  const needsConsent = useAIStore((s) => s.needsConsent);
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
  const [activityDismissed, setActivityDismissed] = useState(false);

  const restoreCachedSummaries = useAIStore((s) => s.restoreCachedSummaries);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    if (
      commentScope === "current_page" &&
      threads.length > 0 &&
      currentPageThreadIds === null &&
      !isResolvingPages
    ) {
      resolveCurrentPageThreads();
    }
  }, [
    commentScope,
    threads.length,
    currentPageThreadIds,
    isResolvingPages,
    resolveCurrentPageThreads,
  ]);

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
      requestAiConsent(() => void bulkSummarizeThreads(selectedThreads));
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

  const activitySinceMs = useMemo(
    () =>
      getTimeRangeBounds(ACTIVITY_WINDOW_PRESET, null, null).start ??
      Date.now(),
    [],
  );

  const activitySummary = useMemo(
    () => computeActivitySummary(threads, activitySinceMs),
    [threads, activitySinceMs],
  );

  const isActivityCardVisible =
    !activityDismissed && activitySummary.totalCount > 0;
  const initialActivityTimeFilterSyncDone = useRef(false);

  useEffect(() => {
    if (initialActivityTimeFilterSyncDone.current || isLoading) return;
    initialActivityTimeFilterSyncDone.current = true;
    if (
      !isActivityCardVisible &&
      timeFilterPreset === ACTIVITY_WINDOW_PRESET
    ) {
      setTimeFilterPreset("all");
    }
  }, [
    isLoading,
    isActivityCardVisible,
    timeFilterPreset,
    setTimeFilterPreset,
  ]);

  const handleActivityFilterClick = useCallback(
    (filter: ActivityFilter) => {
      setTimeFilterPreset(ACTIVITY_WINDOW_PRESET);
      setActivityCategoryFilter(
        activityCategoryFilter === filter ? null : filter,
      );
    },
    [
      activityCategoryFilter,
      setTimeFilterPreset,
      setActivityCategoryFilter,
    ],
  );

  const { filteredThreads, isResolvingCurrentPage } = useFilteredThreads();
  const filteredCount = filteredThreads.length;

  if (selectedThread) {
    const freshThread =
      threads.find((t) => t.id === selectedThread.id) ?? selectedThread;
    return <ThreadDetail thread={freshThread} onBack={handleBack} />;
  }

  return (
    <AppScreenShell>
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
          {isActivityCardVisible && (
            <ActivitySummaryPanel
              summary={activitySummary}
              activeFilter={activityCategoryFilter}
              onFilterClick={handleActivityFilterClick}
              onDismiss={() => setActivityDismissed(true)}
            />
          )}
          <BulkSummaryProgressBar />
          <ThreadList
            filteredThreads={filteredThreads}
            isResolvingCurrentPage={isResolvingCurrentPage}
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
        <BulkActionBar
          selectedCount={selectedIds.size}
          onSummarize={handleBulkSummarize}
          onStateChange={handleBulkStateChange}
          onExit={exitBulkMode}
        />
      )}
    </AppScreenShell>
  );
}
