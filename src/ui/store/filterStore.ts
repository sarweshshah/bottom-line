import { create } from "zustand";
import type { StatusFilter, SortOrder, CommentThread } from "@shared/types";
import { setStorage } from "@ui/lib/storage";

interface FilterState {
  status: StatusFilter;
  sortBy: SortOrder;

  setStatus: (status: StatusFilter) => void;
  setSortBy: (sortBy: SortOrder) => void;
  clearFilters: () => void;
  applyFilters: (threads: CommentThread[]) => CommentThread[];
}

export const useFilterStore = create<FilterState>((set, get) => ({
  status: "open",
  sortBy: "newest",

  setStatus: (status) => {
    set({ status });
    setStorage("filterStatus", status);
  },

  setSortBy: (sortBy) => {
    set({ sortBy });
    setStorage("sortOrder", sortBy);
  },

  clearFilters: () => {
    set({ status: "open", sortBy: "newest" });
    setStorage("filterStatus", "open");
    setStorage("sortOrder", "newest");
  },

  applyFilters: (threads) => {
    const { status, sortBy } = get();

    let filtered = threads;
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
