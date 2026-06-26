import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import type { CommentThread } from "@shared/types";
import { useCommentsStore } from "@ui/store/commentsStore";
import { useFilterStore } from "@ui/store/filterStore";
import { useWorkflowStore } from "@ui/store/workflowStore";
import { useAuthStore } from "@ui/store/authStore";

export function useFilteredThreads(): {
  filteredThreads: CommentThread[];
  isResolvingCurrentPage: boolean;
} {
  const { threads, currentPageThreadIds } = useCommentsStore(
    useShallow((s) => ({
      threads: s.threads,
      currentPageThreadIds: s.currentPageThreadIds,
    })),
  );
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
    activityCategoryFilter,
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
      activityCategoryFilter: s.activityCategoryFilter,
    })),
  );
  const getWorkflowState = useWorkflowStore((s) => s.getState);
  const userHandle = useAuthStore((s) => s.user?.handle ?? null);

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
      userHandle,
    );
  }, [
    isResolvingCurrentPage,
    applyFilters,
    threads,
    currentPageThreadIds,
    getWorkflowState,
    userHandle,
    workflowStateFilter,
    addressedToMe,
    sortField,
    sortDirection,
    commentScope,
    timeFilterPreset,
    customTimeStart,
    customTimeEnd,
    activityCategoryFilter,
  ]);

  return { filteredThreads, isResolvingCurrentPage };
}
