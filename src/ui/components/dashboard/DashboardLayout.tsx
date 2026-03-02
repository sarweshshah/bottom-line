import { useEffect, useState, useCallback } from "react";
import { RefreshCw, MessageSquare, Loader2 } from "lucide-react";
import type { CommentThread } from "@shared/types";
import { useCommentsStore } from "@ui/store/commentsStore";
import { useFilterStore } from "@ui/store/filterStore";
import { FilterBar } from "./FilterBar";
import { ThreadList } from "./ThreadList";
import { ThreadDetail } from "./ThreadDetail";

export function DashboardLayout() {
  const { threads, isLoading, fetchComments, refreshComments, isCacheStale } =
    useCommentsStore();
  const { applyFilters } = useFilterStore();
  const [selectedThread, setSelectedThread] = useState<CommentThread | null>(null);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleRefresh = useCallback(() => {
    refreshComments();
  }, [refreshComments]);

  const handleSelectThread = useCallback((thread: CommentThread) => {
    setSelectedThread(thread);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedThread(null);
  }, []);

  if (selectedThread) {
    const freshThread = threads.find((t) => t.id === selectedThread.id) ?? selectedThread;
    return <ThreadDetail thread={freshThread} onBack={handleBack} />;
  }

  const filteredCount = applyFilters(threads).length;
  const stale = isCacheStale();

  return (
    <div className="flex flex-col h-full bg-figma-bg">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-figma-border">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-figma-icon" />
          <span className="text-sm font-medium text-figma-text">Threads</span>
          <span className="text-2xs text-figma-text-tertiary bg-figma-bg-secondary px-1.5 py-0.5 rounded-full">
            {filteredCount}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {stale && (
            <span className="text-2xs text-figma-text-tertiary mr-1">
              Stale
            </span>
          )}
          <button
            type="button"
            onClick={handleRefresh}
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
        </div>
      </div>

      {/* Filter bar */}
      <FilterBar />

      {/* Thread list */}
      <ThreadList onSelectThread={handleSelectThread} />
    </div>
  );
}
