import type { CommentThread } from "@shared/types";
import { ThreadCard } from "./ThreadCard";
import { EmptyState } from "@ui/components/common/EmptyState";
import { LoadingSpinner } from "@ui/components/common/LoadingSpinner";
import { useCommentsStore } from "@ui/store/commentsStore";
import { useFilterStore } from "@ui/store/filterStore";

interface ThreadListProps {
  onSelectThread: (thread: CommentThread) => void;
}

export function ThreadList({ onSelectThread }: ThreadListProps) {
  const { threads, isLoading, error, currentPageThreadIds } = useCommentsStore();
  const { applyFilters, clearFilters } = useFilterStore();

  if (isLoading && threads.length === 0) {
    return <LoadingSpinner message="Fetching comments..." />;
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
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-status-open text-white hover:bg-blue-600"
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

  const filtered = applyFilters(threads, currentPageThreadIds);

  if (filtered.length === 0) {
    return (
      <EmptyState
        variant="no-matches"
        action={
          <button
            type="button"
            onClick={clearFilters}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-figma-bg-secondary text-figma-text-secondary hover:bg-figma-bg-tertiary"
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
          onSelect={onSelectThread}
        />
      ))}
    </div>
  );
}
