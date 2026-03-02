import { create } from "zustand";
import type { StatusFilter, SortOrder, CommentScope, CommentThread } from "@shared/types";
import { setStorage } from "@ui/lib/storage";

interface FilterState {
  status: StatusFilter;
  sortBy: SortOrder;
  commentScope: CommentScope;

  setStatus: (status: StatusFilter) => void;
  setSortBy: (sortBy: SortOrder) => void;
  setCommentScope: (scope: CommentScope) => void;
  clearFilters: () => void;
  applyFilters: (threads: CommentThread[], currentPageThreadIds?: Set<string> | null) => CommentThread[];
}

export const useFilterStore = create<FilterState>((set, get) => ({
  status: "all",
  sortBy: "newest",
  commentScope: "full_file",

  setStatus: (status) => {
    set({ status });
    setStorage("filterStatus", status);
  },

  setSortBy: (sortBy) => {
    set({ sortBy });
    setStorage("sortOrder", sortBy);
  },

  setCommentScope: (commentScope) => {
    set({ commentScope });
  },

  clearFilters: () => {
    set({ status: "all", sortBy: "newest", commentScope: "full_file" });
    setStorage("filterStatus", "all");
    setStorage("sortOrder", "newest");
  },

  applyFilters: (threads, currentPageThreadIds) => {
    const { status, sortBy, commentScope } = get();

    let filtered = threads;

    if (commentScope === "current_page" && currentPageThreadIds) {
      filtered = filtered.filter((t) => currentPageThreadIds.has(t.id));
    }

    if (status !== "all") {
      filtered = filtered.filter((t) => t.status === status);
    }

    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.lastUpdatedAt).getTime();
      const dateB = new Date(b.lastUpdatedAt).getTime();
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

    return sorted;
  },
}));
