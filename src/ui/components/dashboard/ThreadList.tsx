import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import type { CommentThread } from "@shared/types";
import { ThreadCard } from "./ThreadCard";
import { ThreadCardSkeleton } from "./ThreadCardSkeleton";
import { EmptyState } from "@ui/components/common/EmptyState";
import { useCommentsStore } from "@ui/store/commentsStore";
import { useFilterStore, isAddressedToMe } from "@ui/store/filterStore";
import { useWorkflowStore } from "@ui/store/workflowStore";
import { useAuthStore } from "@ui/store/authStore";

interface ThreadListProps {
  onSelectThread: (thread: CommentThread) => void;
  bulkMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (threadId: string) => void;
}

export function ThreadList({
  onSelectThread,
  bulkMode,
  selectedIds,
  onToggleSelect,
}: ThreadListProps) {
  const { threads, isLoading, error, currentPageThreadIds } =
    useCommentsStore(
      useShallow((s) => ({
        threads: s.threads,
        isLoading: s.isLoading,
        error: s.error,
        currentPageThreadIds: s.currentPageThreadIds,
      })),
    );
  const {
    applyFilters,
    clearFilters,
    addressedToMe,
    commentScope,
    workflowStateFilter,
    sortField,
    sortDirection,
  } = useFilterStore(
    useShallow((s) => ({
      applyFilters: s.applyFilters,
      clearFilters: s.clearFilters,
      addressedToMe: s.addressedToMe,
      commentScope: s.commentScope,
      workflowStateFilter: s.workflowStateFilter,
      sortField: s.sortField,
      sortDirection: s.sortDirection,
    })),
  );
  const getWorkflowState = useWorkflowStore((s) => s.getState);
  const user = useAuthStore((s) => s.user);

  const isResolvingCurrentPage =
    commentScope === "current_page" &&
    currentPageThreadIds === null &&
    threads.length > 0;

  const filtered = useMemo(
    () => {
      if (isResolvingCurrentPage) return [];
      return applyFilters(
        threads,
        currentPageThreadIds,
        getWorkflowState,
        user?.handle ?? null,
      );
    },
    [
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
    ],
  );

  if (isLoading && threads.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        {Array.from({ length: 5 }, (_, i) => (
          <ThreadCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        variant="api-error"
        action={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => useCommentsStore.getState().refreshComments()}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-bg text-white hover:bg-accent-hover"
            >
              Retry
            </button>
          </div>
        }
      />
    );
  }

  if (threads.length === 0) {
    return <EmptyState variant="no-comments" />;
  }

  if (isResolvingCurrentPage) {
    return (
      <div className="flex-1 overflow-y-auto">
        {Array.from({ length: 3 }, (_, i) => (
          <ThreadCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    if (addressedToMe) {
      return (
        <EmptyState
          variant="addressed-to-me"
          action={
            <button
              type="button"
              onClick={clearFilters}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-figma-bg-secondary text-figma-text-secondary hover:bg-figma-bg-tertiary"
            >
              Clear filters
            </button>
          }
        />
      );
    }
    return (
      <EmptyState
        variant="no-matches"
        action={
          <button
            type="button"
            onClick={clearFilters}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-figma-bg-secondary text-figma-text-secondary hover:bg-figma-bg-tertiary"
          >
            Clear filters
          </button>
        }
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {filtered.map((thread) => (
        <ThreadCard
          key={thread.id}
          thread={thread}
          workflowState={getWorkflowState(thread.id)}
          isAddressed={user ? isAddressedToMe(thread, user.handle) : false}
          bulkMode={bulkMode}
          isSelected={selectedIds.has(thread.id)}
          onSelect={onSelectThread}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  );
}
