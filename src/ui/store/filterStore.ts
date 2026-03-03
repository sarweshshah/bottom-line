import { create } from "zustand";
import type { StatusFilter, SortField, SortDirection, CommentScope, CommentThread } from "@shared/types";
import { setStorage } from "@ui/lib/storage";

const DEFAULT_SORT_FIELD: SortField = "replies";
const DEFAULT_SORT_DIR: SortDirection = "desc";

const DEFAULT_DIRECTIONS: Record<SortField, SortDirection> = {
  replies: "desc",
  participants: "desc",
  last_updated: "desc",
  created_at: "desc",
};

interface FilterState {
  status: StatusFilter;
  sortField: SortField;
  sortDirection: SortDirection;
  commentScope: CommentScope;

  setStatus: (status: StatusFilter) => void;
  toggleSort: (field: SortField) => void;
  setCommentScope: (scope: CommentScope) => void;
  clearFilters: () => void;
  applyFilters: (threads: CommentThread[], currentPageThreadIds?: Set<string> | null) => CommentThread[];
}

function compare(a: CommentThread, b: CommentThread, field: SortField, dir: SortDirection): number {
  let diff: number;
  switch (field) {
    case "replies":
      diff = a.replyCount - b.replyCount;
      break;
    case "participants":
      diff = a.participants.length - b.participants.length;
      break;
    case "last_updated":
      diff = new Date(a.lastUpdatedAt).getTime() - new Date(b.lastUpdatedAt).getTime();
      break;
    case "created_at":
      diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      break;
  }
  return dir === "desc" ? -diff : diff;
}

export const useFilterStore = create<FilterState>((set, get) => ({
  status: "all",
  sortField: DEFAULT_SORT_FIELD,
  sortDirection: DEFAULT_SORT_DIR,
  commentScope: "full_file",

  setStatus: (status) => {
    set({ status });
    setStorage("filterStatus", status);
  },

  toggleSort: (field) => {
    const { sortField, sortDirection } = get();
    const newDir = field === sortField
      ? (sortDirection === "asc" ? "desc" : "asc")
      : DEFAULT_DIRECTIONS[field];
    set({ sortField: field, sortDirection: newDir });
    setStorage("sortField", field);
    setStorage("sortDirection", newDir);
  },

  setCommentScope: (commentScope) => {
    set({ commentScope });
  },

  clearFilters: () => {
    set({ status: "all", sortField: DEFAULT_SORT_FIELD, sortDirection: DEFAULT_SORT_DIR, commentScope: "full_file" });
    setStorage("filterStatus", "all");
    setStorage("sortField", DEFAULT_SORT_FIELD);
    setStorage("sortDirection", DEFAULT_SORT_DIR);
  },

  applyFilters: (threads, currentPageThreadIds) => {
    const { status, sortField, sortDirection, commentScope } = get();

    let filtered = threads;

    if (commentScope === "current_page" && currentPageThreadIds) {
      filtered = filtered.filter((t) => currentPageThreadIds.has(t.id));
    }

    if (status !== "all") {
      filtered = filtered.filter((t) => t.status === status);
    }

    return [...filtered].sort((a, b) => compare(a, b, sortField, sortDirection));
  },
}));
