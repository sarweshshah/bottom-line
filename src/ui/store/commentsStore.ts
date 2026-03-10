import { create } from "zustand";
import type { CacheTTLMinutes, CommentThread } from "@shared/types";
import { hasNodeId } from "@shared/types";
import type { ApiErrorCode } from "@ui/api/figmaApi";
import type { ResolvePageThreadsMessage } from "@shared/messages";
import { getComments, FigmaApiError } from "@ui/api/figmaApi";
import { normalizeComments } from "@ui/lib/normalize";
import { setStorage } from "@ui/lib/storage";
import { useAuthStore } from "./authStore";
import { useWorkflowStore } from "./workflowStore";

const DEFAULT_CACHE_TTL_MINUTES: CacheTTLMinutes = 5;

interface CommentsState {
  threads: CommentThread[];
  lastFetched: number | null;
  isLoading: boolean;
  error: { message: string; code: ApiErrorCode } | null;
  cacheTTLMinutes: CacheTTLMinutes;
  currentPageId: string | null;
  currentPageThreadIds: Set<string> | null;
  isResolvingPages: boolean;

  fetchComments: () => Promise<void>;
  refreshComments: () => Promise<void>;
  initializeCacheTTL: (minutes: CacheTTLMinutes) => void;
  setCacheTTLMinutes: (minutes: CacheTTLMinutes) => void;
  clearComments: () => void;
  setCurrentPageId: (pageId: string) => void;
  setCurrentPageThreadIds: (threadIds: string[]) => void;
  resolveCurrentPageThreads: () => void;
}

let resolveCounter = 0;

export const useCommentsStore = create<CommentsState>((set, get) => ({
  threads: [],
  lastFetched: null,
  isLoading: false,
  error: null,
  cacheTTLMinutes: DEFAULT_CACHE_TTL_MINUTES,
  currentPageId: null,
  currentPageThreadIds: null,
  isResolvingPages: false,

  fetchComments: async () => {
    const { lastFetched, cacheTTLMinutes, isLoading } = get();
    if (isLoading) return;
    const cacheTTLMs = cacheTTLMinutes * 60_000;
    if (lastFetched && Date.now() - lastFetched < cacheTTLMs) return;
    await get().refreshComments();
  },

  refreshComments: async () => {
    const { pat, fileKey } = useAuthStore.getState();
    if (!pat || !fileKey) return;
    if (get().isLoading) return;

    set({ isLoading: true, error: null });

    try {
      const rawComments = await getComments(fileKey, pat);
      const threads = normalizeComments(rawComments);
      set({ threads, lastFetched: Date.now(), isLoading: false });
      get().resolveCurrentPageThreads();

      const wfStore = useWorkflowStore.getState();
      if (wfStore.initialized) {
        wfStore.reconcileWithFigma(threads);
        wfStore.cleanup(new Set(threads.map((t) => t.id)));
      }
    } catch (err) {
      if (err instanceof FigmaApiError) {
        if (err.code === "TOKEN_INVALID") {
          useAuthStore.getState().showReconnect();
        }
        set({
          isLoading: false,
          error: { message: err.message, code: err.code },
        });
      } else {
        set({
          isLoading: false,
          error: {
            message: "An unexpected error occurred while fetching comments.",
            code: "UNKNOWN",
          },
        });
      }
    }
  },

  initializeCacheTTL: (minutes: CacheTTLMinutes) => {
    set({ cacheTTLMinutes: minutes });
  },

  setCacheTTLMinutes: (minutes: CacheTTLMinutes) => {
    set({ cacheTTLMinutes: minutes });
    setStorage("cacheTTL", minutes);
  },

  clearComments: () => {
    set({ threads: [], lastFetched: null, error: null, currentPageThreadIds: null });
  },

  setCurrentPageId: (pageId: string) => {
    set({ currentPageId: pageId, currentPageThreadIds: null });
    get().resolveCurrentPageThreads();
  },

  setCurrentPageThreadIds: (threadIds: string[]) => {
    set({ currentPageThreadIds: new Set(threadIds), isResolvingPages: false });
  },

  resolveCurrentPageThreads: () => {
    const { threads, currentPageId } = get();
    if (!currentPageId || threads.length === 0) return;

    const entries: { threadId: string; nodeId: string }[] = [];
    for (const t of threads) {
      if (t.clientMeta && hasNodeId(t.clientMeta)) {
        entries.push({ threadId: t.id, nodeId: t.clientMeta.node_id });
      }
    }

    if (entries.length === 0) {
      set({ currentPageThreadIds: new Set(), isResolvingPages: false });
      return;
    }

    set({ isResolvingPages: true });
    const requestId = `page_resolve_${++resolveCounter}`;
    const msg: ResolvePageThreadsMessage = {
      type: "RESOLVE_PAGE_THREADS",
      requestId,
      threads: entries,
    };
    parent.postMessage({ pluginMessage: msg }, "*");
  },
}));
