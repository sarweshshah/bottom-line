import { create } from "zustand";
import type {
  WorkflowState,
  SortField,
  SortDirection,
  CommentScope,
  CommentThread,
} from "@shared/types";
import { getStorage, setStorage } from "@ui/lib/storage";

const DEFAULT_SORT_FIELD: SortField = "replies";
const DEFAULT_SORT_DIR: SortDirection = "desc";

const ALL_WORKFLOW_STATES: WorkflowState[] = [
  "open",
  "in_progress",
  "blocked",
  "resolved",
];

const DEFAULT_DIRECTIONS: Record<SortField, SortDirection> = {
  replies: "desc",
  participants: "desc",
  last_updated: "desc",
  created_at: "desc",
};

export function isAddressedToMe(
  thread: CommentThread,
  userHandle: string,
): boolean {
  const handle = userHandle.toLowerCase().trim();
  if (thread.mentions.some((m) => m.toLowerCase().trim() === handle))
    return true;
  if (
    thread.author.handle.toLowerCase().trim() === handle &&
    thread.replyCount > 0
  )
    return true;
  return false;
}

interface FilterState {
  workflowFilter: WorkflowState[];
  addressedToMe: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
  commentScope: CommentScope;

  setWorkflowFilter: (states: WorkflowState[]) => void;
  toggleWorkflowState: (state: WorkflowState) => void;
  setAddressedToMe: (enabled: boolean) => void;
  toggleSort: (field: SortField) => void;
  setCommentScope: (scope: CommentScope) => void;
  clearFilters: () => void;
  initFromStorage: () => Promise<void>;
  applyFilters: (
    threads: CommentThread[],
    currentPageThreadIds?: Set<string> | null,
    getWorkflowState?: (threadId: string) => WorkflowState,
    userHandle?: string | null,
  ) => CommentThread[];
}

function compare(
  a: CommentThread,
  b: CommentThread,
  field: SortField,
  dir: SortDirection,
): number {
  let diff: number;
  switch (field) {
    case "replies":
      diff = a.replyCount - b.replyCount;
      break;
    case "participants":
      diff = a.participants.length - b.participants.length;
      break;
    case "last_updated":
      diff =
        new Date(a.lastUpdatedAt).getTime() -
        new Date(b.lastUpdatedAt).getTime();
      break;
    case "created_at":
      diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      break;
  }
  return dir === "desc" ? -diff : diff;
}

export const useFilterStore = create<FilterState>((set, get) => ({
  workflowFilter: ALL_WORKFLOW_STATES,
  addressedToMe: false,
  sortField: DEFAULT_SORT_FIELD,
  sortDirection: DEFAULT_SORT_DIR,
  commentScope: "full_file",

  setWorkflowFilter: (states) => {
    set({ workflowFilter: states });
    setStorage("workflowFilter", states);
  },

  toggleWorkflowState: (state) => {
    const current = get().workflowFilter;
    const next = current.includes(state)
      ? current.filter((s) => s !== state)
      : [...current, state];
    set({ workflowFilter: next });
    setStorage("workflowFilter", next);
  },

  setAddressedToMe: (enabled) => {
    set({ addressedToMe: enabled });
    setStorage("addressedToMe", enabled);
  },

  toggleSort: (field) => {
    const { sortField, sortDirection } = get();
    const newDir =
      field === sortField
        ? sortDirection === "asc"
          ? "desc"
          : "asc"
        : DEFAULT_DIRECTIONS[field];
    set({ sortField: field, sortDirection: newDir });
    setStorage("sortField", field);
    setStorage("sortDirection", newDir);
  },

  setCommentScope: (commentScope) => {
    set({ commentScope });
  },

  clearFilters: () => {
    set({
      workflowFilter: ALL_WORKFLOW_STATES,
      addressedToMe: false,
      sortField: DEFAULT_SORT_FIELD,
      sortDirection: DEFAULT_SORT_DIR,
      commentScope: "full_file",
    });
    setStorage("workflowFilter", ALL_WORKFLOW_STATES);
    setStorage("addressedToMe", false);
    setStorage("sortField", DEFAULT_SORT_FIELD);
    setStorage("sortDirection", DEFAULT_SORT_DIR);
  },

  initFromStorage: async () => {
    const [wf, atm, sf, sd] = await Promise.all([
      getStorage<WorkflowState[]>("workflowFilter"),
      getStorage<boolean>("addressedToMe"),
      getStorage<SortField>("sortField"),
      getStorage<SortDirection>("sortDirection"),
    ]);
    set({
      workflowFilter: wf ?? ALL_WORKFLOW_STATES,
      addressedToMe: atm ?? false,
      sortField: sf ?? DEFAULT_SORT_FIELD,
      sortDirection: sd ?? DEFAULT_SORT_DIR,
    });
  },

  applyFilters: (
    threads,
    currentPageThreadIds,
    getWorkflowState,
    userHandle,
  ) => {
    const {
      workflowFilter,
      addressedToMe,
      sortField,
      sortDirection,
      commentScope,
    } = get();

    let filtered = threads;

    if (commentScope === "current_page" && currentPageThreadIds) {
      filtered = filtered.filter((t) => currentPageThreadIds.has(t.id));
    }

    if (workflowFilter.length > 0 && getWorkflowState) {
      filtered = filtered.filter((t) =>
        workflowFilter.includes(getWorkflowState(t.id)),
      );
    }

    if (addressedToMe && userHandle) {
      filtered = filtered.filter((t) => isAddressedToMe(t, userHandle));
    }

    return [...filtered].sort((a, b) =>
      compare(a, b, sortField, sortDirection),
    );
  },
}));
