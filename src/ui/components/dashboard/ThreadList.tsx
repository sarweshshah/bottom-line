import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useShallow } from "zustand/react/shallow";
import type { CommentThread } from "@shared/types";
import { ThreadCard } from "./ThreadCard";
import { ThreadCardSkeleton } from "./ThreadCardSkeleton";
import { EmptyState } from "@ui/components/common/EmptyState";
import { Button } from "@ui/components/common/uiPrimitives";
import { useCommentsStore } from "@ui/store/commentsStore";
import { useFilterStore, isAddressedToMe } from "@ui/store/filterStore";
import { useWorkflowStore } from "@ui/store/workflowStore";
import { useAuthStore } from "@ui/store/authStore";
import { InlineButtonRow } from "@ui/components/common/layout";
import {
  ThreadListScrollBody,
  ThreadListScrollPlaceholder,
  ThreadListVirtualItem,
  ThreadListVirtualSurface,
} from "./dashboardPrimitives";

interface ThreadListProps {
  filteredThreads: CommentThread[];
  isResolvingCurrentPage: boolean;
  onSelectThread: (thread: CommentThread) => void;
  bulkMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (threadId: string) => void;
}

export function ThreadList({
  filteredThreads,
  isResolvingCurrentPage,
  onSelectThread,
  bulkMode,
  selectedIds,
  onToggleSelect,
}: ThreadListProps) {
  const scrollParentRef = useRef<HTMLDivElement>(null);
  const { threads, isLoading, error } = useCommentsStore(
    useShallow((s) => ({
      threads: s.threads,
      isLoading: s.isLoading,
      error: s.error,
    })),
  );
  const { clearFilters, addressedToMe } = useFilterStore(
    useShallow((s) => ({
      clearFilters: s.clearFilters,
      addressedToMe: s.addressedToMe,
    })),
  );
  const getWorkflowState = useWorkflowStore((s) => s.getState);
  const user = useAuthStore((s) => s.user);

  const rowVirtualizer = useVirtualizer({
    count: filteredThreads.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => 104,
    getItemKey: (index) => filteredThreads[index]?.id ?? index,
    overscan: 8,
  });

  if (isLoading && threads.length === 0) {
    return (
      <ThreadListScrollPlaceholder>
        {Array.from({ length: 5 }, (_, i) => (
          <ThreadCardSkeleton key={i} />
        ))}
      </ThreadListScrollPlaceholder>
    );
  }

  if (error) {
    return (
      <EmptyState
        variant="api-error"
        action={
          <InlineButtonRow>
            <Button
              controlSize="compact"
              variant="primary"
              onClick={() => useCommentsStore.getState().refreshComments()}
            >
              Retry
            </Button>
          </InlineButtonRow>
        }
      />
    );
  }

  if (threads.length === 0) {
    return <EmptyState variant="no-comments" />;
  }

  if (isResolvingCurrentPage) {
    return (
      <ThreadListScrollPlaceholder>
        {Array.from({ length: 3 }, (_, i) => (
          <ThreadCardSkeleton key={i} />
        ))}
      </ThreadListScrollPlaceholder>
    );
  }

  if (filteredThreads.length === 0) {
    if (addressedToMe) {
      return (
        <EmptyState
          variant="addressed-to-me"
          action={
            <Button controlSize="compact" variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      );
    }
    return (
      <EmptyState
        variant="no-matches"
        action={
          <Button controlSize="compact" variant="secondary" onClick={clearFilters}>
            Clear filters
          </Button>
        }
      />
    );
  }

  return (
    <ThreadListScrollBody ref={scrollParentRef}>
      <ThreadListVirtualSurface height={rowVirtualizer.getTotalSize()}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const thread = filteredThreads[virtualRow.index];
          if (!thread) return null;

          return (
            <ThreadListVirtualItem
              key={virtualRow.key}
              index={virtualRow.index}
              start={virtualRow.start}
              measureRef={rowVirtualizer.measureElement}
            >
              <ThreadCard
                thread={thread}
                workflowState={getWorkflowState(thread.id)}
                isAddressed={user ? isAddressedToMe(thread, user.handle) : false}
                bulkMode={bulkMode}
                isSelected={selectedIds.has(thread.id)}
                onSelect={onSelectThread}
                onToggleSelect={onToggleSelect}
              />
            </ThreadListVirtualItem>
          );
        })}
      </ThreadListVirtualSurface>
    </ThreadListScrollBody>
  );
}
