import { create } from "zustand";
import type {
  WorkflowState,
  SortField,
  SortDirection,
  CommentScope,
  TimeFilterPreset,
  CommentThread,
} from "@shared/types";
import { getStorage, setStorage } from "@ui/lib/storage";
import { useCommentsStore } from "@ui/store/commentsStore";

const DEFAULT_SORT_FIELD: SortField = "replies";
const DEFAULT_SORT_DIR: SortDirection = "desc";
const DEFAULT_COMMENT_SCOPE: CommentScope = "full_file";

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
  if (
    thread.participants.some(
      (p) => p.handle.toLowerCase().trim() === handle,
    )
  )
    return true;
  return false;
}

function normalizeStoredWorkflowFilter(
  stored: WorkflowState | WorkflowState[] | null | undefined,
): WorkflowState | null {
  if (stored == null) return null;
  if (Array.isArray(stored)) {
    return stored.length === 1 ? stored[0] : null;
  }
  return stored;
}

export function getTimeRangeBounds(
  preset: TimeFilterPreset,
  customStart: string | null,
  customEnd: string | null,
): { start: number | null; end: number | null } {
  const now = Date.now();
  switch (preset) {
    case "all":
      return { start: null, end: null };
    case "24h":
      return { start: now - 24 * 60 * 60 * 1000, end: null };
    case "7d":
      return { start: now - 7 * 24 * 60 * 60 * 1000, end: null };
    case "30d":
      return { start: now - 30 * 24 * 60 * 60 * 1000, end: null };
    case "custom": {
      if (!customStart || !customEnd) return { start: null, end: null };
      const start = new Date(customStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
      return { start: start.getTime(), end: end.getTime() };
    }
  }
}

interface FilterState {
  workflowStateFilter: WorkflowState | null;
  addressedToMe: boolean;
  sortField: SortField;
  sortDirection: SortDirection;
  commentScope: CommentScope;
  timeFilterPreset: TimeFilterPreset;
  customTimeStart: string | null;
  customTimeEnd: string | null;

  setWorkflowStateFilter: (state: WorkflowState | null) => void;
  setAddressedToMe: (enabled: boolean) => void;
  toggleSort: (field: SortField) => void;
  setCommentScope: (scope: CommentScope) => void;
  setTimeFilterPreset: (preset: TimeFilterPreset) => void;
  setCustomTimeRange: (start: string | null, end: string | null) => void;
  clearFilters: () => void;
  initFromStorage: () => Promise<void>;
  applyFilters: (
    threads: CommentThread[],
    currentPageThreadIds: Set<string> | null | undefined,
    getWorkflowState: (threadId: string) => WorkflowState,
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
  workflowStateFilter: null,
  addressedToMe: false,
  sortField: DEFAULT_SORT_FIELD,
  sortDirection: DEFAULT_SORT_DIR,
  commentScope: DEFAULT_COMMENT_SCOPE,
  timeFilterPreset: "all",
  customTimeStart: null,
  customTimeEnd: null,

  setWorkflowStateFilter: (state) => {
    set({ workflowStateFilter: state });
    setStorage("workflowFilter", state);
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
    setStorage("commentScope", commentScope);
    if (commentScope === "current_page") {
      useCommentsStore.getState().resolveCurrentPageThreads();
    }
  },

  setTimeFilterPreset: (timeFilterPreset) => {
    set({ timeFilterPreset });
    setStorage("timeFilterPreset", timeFilterPreset);
  },

  setCustomTimeRange: (customTimeStart, customTimeEnd) => {
    set({ customTimeStart, customTimeEnd });
    setStorage("customTimeStart", customTimeStart);
    setStorage("customTimeEnd", customTimeEnd);
  },

  clearFilters: () => {
    set({
      workflowStateFilter: null,
      addressedToMe: false,
      sortField: DEFAULT_SORT_FIELD,
      sortDirection: DEFAULT_SORT_DIR,
      commentScope: DEFAULT_COMMENT_SCOPE,
      timeFilterPreset: "all",
      customTimeStart: null,
      customTimeEnd: null,
    });
    setStorage("workflowFilter", null);
    setStorage("addressedToMe", false);
    setStorage("sortField", DEFAULT_SORT_FIELD);
    setStorage("sortDirection", DEFAULT_SORT_DIR);
    setStorage("commentScope", DEFAULT_COMMENT_SCOPE);
    setStorage("timeFilterPreset", "all");
    setStorage("customTimeStart", null);
    setStorage("customTimeEnd", null);
  },

  initFromStorage: async () => {
    const [wf, atm, sf, sd, cs, tfp, cts, cte] = await Promise.all([
      getStorage<WorkflowState | WorkflowState[] | null>("workflowFilter"),
      getStorage<boolean>("addressedToMe"),
      getStorage<SortField>("sortField"),
      getStorage<SortDirection>("sortDirection"),
      getStorage<CommentScope>("commentScope"),
      getStorage<TimeFilterPreset>("timeFilterPreset"),
      getStorage<string | null>("customTimeStart"),
      getStorage<string | null>("customTimeEnd"),
    ]);
    set({
      workflowStateFilter: normalizeStoredWorkflowFilter(wf),
      addressedToMe: atm ?? false,
      sortField: sf ?? DEFAULT_SORT_FIELD,
      sortDirection: sd ?? DEFAULT_SORT_DIR,
      commentScope: cs ?? DEFAULT_COMMENT_SCOPE,
      timeFilterPreset: tfp ?? "all",
      customTimeStart: cts ?? null,
      customTimeEnd: cte ?? null,
    });
    useCommentsStore.getState().onFilterScopeHydrated();
  },

  applyFilters: (
    threads,
    currentPageThreadIds,
    getWorkflowState,
    userHandle,
  ) => {
    const {
      workflowStateFilter,
      addressedToMe,
      sortField,
      sortDirection,
      commentScope,
      timeFilterPreset,
      customTimeStart,
      customTimeEnd,
    } = get();

    let filtered = threads;

    const { start: timeStart, end: timeEnd } = getTimeRangeBounds(
      timeFilterPreset,
      customTimeStart,
      customTimeEnd,
    );
    if (timeStart !== null || timeEnd !== null) {
      filtered = filtered.filter((t) => {
        const ts = new Date(t.lastUpdatedAt).getTime();
        if (timeStart !== null && ts < timeStart) return false;
        if (timeEnd !== null && ts > timeEnd) return false;
        return true;
      });
    }

    if (commentScope === "current_page") {
      if (!currentPageThreadIds) {
        filtered = [];
      } else {
        filtered = filtered.filter((t) => currentPageThreadIds.has(t.id));
      }
    }

    if (workflowStateFilter) {
      filtered = filtered.filter(
        (t) => getWorkflowState(t.id) === workflowStateFilter,
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
