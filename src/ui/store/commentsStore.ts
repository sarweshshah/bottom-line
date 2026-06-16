import { create } from "zustand";
import type { CacheTTLMinutes, CommentThread } from "@shared/types";
import { hasNodeId } from "@shared/types";
import type { ApiErrorCode } from "@ui/api/figmaApi";
import type {
  BuildThreadPageMapMessage,
  ResolvePageThreadsMessage,
} from "@shared/messages";
import { getComments, FigmaApiError } from "@ui/api/figmaApi";
import { normalizeComments } from "@ui/lib/normalize";
import { setStorage } from "@ui/lib/storage";
import { useAuthStore } from "./authStore";
import { useWorkflowStore } from "./workflowStore";
import { useFilterStore } from "./filterStore";

const DEFAULT_CACHE_TTL_MINUTES: CacheTTLMinutes = 5;

type AnchoredEntry = { threadId: string; nodeId: string };

interface CommentsState {
  threads: CommentThread[];
  lastFetched: number | null;
  isLoading: boolean;
  error: { message: string; code: ApiErrorCode } | null;
  cacheTTLMinutes: CacheTTLMinutes;
  currentPageId: string | null;
  currentPageThreadIds: Set<string> | null;
  lastResolvedPageId: string | null;
  isResolvingPages: boolean;
  threadPageMap: Map<string, string>;
  isBuildingPageMap: boolean;
  pageMapBuildComplete: boolean;

  fetchComments: () => Promise<void>;
  refreshComments: () => Promise<void>;
  initializeCacheTTL: (minutes: CacheTTLMinutes) => void;
  setCacheTTLMinutes: (minutes: CacheTTLMinutes) => void;
  clearComments: () => void;
  setCurrentPageId: (pageId: string) => void;
  setCurrentPageThreadIds: (requestId: string, threadIds: string[]) => void;
  appendThreadPageMapChunk: (
    requestId: string,
    mappings: { threadId: string; pageId: string | null }[],
    done: boolean,
  ) => void;
  resolveCurrentPageThreads: () => void;
  onFilterScopeHydrated: () => void;
}

let resolveCounter = 0;
let pageMapCounter = 0;
let pendingPageResolveRequestId: string | null = null;
let pendingPageMapRequestId: string | null = null;

function isCurrentPageScope(): boolean {
  return useFilterStore.getState().commentScope === "current_page";
}

function collectAnchoredEntries(threads: CommentThread[]): AnchoredEntry[] {
  const entries: AnchoredEntry[] = [];
  for (const t of threads) {
    if (t.clientMeta && hasNodeId(t.clientMeta)) {
      entries.push({ threadId: t.id, nodeId: t.clientMeta.node_id });
    }
  }
  return entries;
}

function threadIdsOnPageFromMap(
  pageId: string,
  threads: CommentThread[],
  map: Map<string, string>,
): { ids: Set<string>; complete: boolean } {
  const entries = collectAnchoredEntries(threads);
  const ids = new Set<string>();
  if (entries.length === 0) return { ids, complete: true };

  let complete = true;
  for (const { threadId } of entries) {
    const threadPageId = map.get(threadId);
    if (threadPageId === undefined) {
      complete = false;
      continue;
    }
    if (threadPageId === pageId) {
      ids.add(threadId);
    }
  }
  return { ids, complete };
}

export const useCommentsStore = create<CommentsState>((set, get) => {
  function cancelPendingPageWork() {
    pendingPageResolveRequestId = null;
    pendingPageMapRequestId = null;
  }

  function tryApplyPageFromMap(pageId?: string): boolean {
    const targetPageId = pageId ?? get().currentPageId;
    if (!targetPageId) return false;

    const { threads, threadPageMap } = get();
    if (threads.length === 0) return false;

    const { ids, complete } = threadIdsOnPageFromMap(
      targetPageId,
      threads,
      threadPageMap,
    );
    if (!complete) return false;

    set({
      currentPageThreadIds: ids,
      lastResolvedPageId: targetPageId,
      isResolvingPages: false,
    });
    return true;
  }

  function updateCurrentPageFromMapIfNeeded() {
    if (!isCurrentPageScope()) return;
    tryApplyPageFromMap();
  }

  function startBackgroundPageMapBuild() {
    if (pendingPageMapRequestId !== null) return;

    const entries = collectAnchoredEntries(get().threads);
    if (entries.length === 0) {
      set({ isBuildingPageMap: false, pageMapBuildComplete: true });
      return;
    }

    if (get().pageMapBuildComplete && get().isBuildingPageMap === false) {
      const { complete } = threadIdsOnPageFromMap(
        get().currentPageId ?? "",
        get().threads,
        get().threadPageMap,
      );
      if (complete) return;
    }

    pendingPageMapRequestId = null;
    const requestId = `page_map_${++pageMapCounter}`;
    pendingPageMapRequestId = requestId;
    set({ isBuildingPageMap: true, pageMapBuildComplete: false });

    const msg: BuildThreadPageMapMessage = {
      type: "BUILD_THREAD_PAGE_MAP",
      requestId,
      threads: entries,
    };
    parent.postMessage({ pluginMessage: msg }, "*");
  }

  function syncPageIndexingAfterThreadsUpdate() {
    if (tryApplyPageFromMap()) {
      startBackgroundPageMapBuild();
      return;
    }
    if (isCurrentPageScope()) {
      get().resolveCurrentPageThreads();
    }
    startBackgroundPageMapBuild();
  }

  return {
    threads: [],
    lastFetched: null,
    isLoading: false,
    error: null,
    cacheTTLMinutes: DEFAULT_CACHE_TTL_MINUTES,
    currentPageId: null,
    currentPageThreadIds: null,
    lastResolvedPageId: null,
    isResolvingPages: false,
    threadPageMap: new Map(),
    isBuildingPageMap: false,
    pageMapBuildComplete: false,

    fetchComments: async () => {
      const { lastFetched, cacheTTLMinutes, isLoading } = get();
      if (isLoading) return;
      const cacheTTLMs = cacheTTLMinutes * 60_000;
      if (lastFetched && Date.now() - lastFetched < cacheTTLMs) return;
      await get().refreshComments();
    },

    refreshComments: async () => {
      if (get().isLoading) return;

      const tryProactiveRefresh = async () => {
        const { authMethod, tokenExpiresAt, tryRefreshOAuthToken } =
          useAuthStore.getState();
        if (
          authMethod === "oauth" &&
          tokenExpiresAt != null &&
          Date.now() > tokenExpiresAt - 60_000
        ) {
          await tryRefreshOAuthToken();
        }
      };

      await tryProactiveRefresh();

      const { fileKey } = useAuthStore.getState();
      const auth = useAuthStore.getState().getRestAuth();
      if (!auth || !fileKey) return;

      set({ isLoading: true, error: null });

      const load = async (isRetry: boolean) => {
        const authNow = useAuthStore.getState().getRestAuth();
        const fk = useAuthStore.getState().fileKey;
        if (!authNow || !fk) {
          set({ isLoading: false });
          return;
        }

        try {
          const rawComments = await getComments(fk, authNow.token, authNow.mode);
          const threads = normalizeComments(rawComments);
          cancelPendingPageWork();
          set({
            threads,
            lastFetched: Date.now(),
            isLoading: false,
            lastResolvedPageId: null,
            currentPageThreadIds: null,
            threadPageMap: new Map(),
            isBuildingPageMap: false,
            pageMapBuildComplete: false,
          });
          syncPageIndexingAfterThreadsUpdate();

          const wfStore = useWorkflowStore.getState();
          if (wfStore.initialized) {
            wfStore.reconcileWithFigma(threads);
            wfStore.cleanup(new Set(threads.map((t) => t.id)));
          }
        } catch (err) {
          if (err instanceof FigmaApiError) {
            if (
              err.code === "TOKEN_INVALID" &&
              !isRetry &&
              useAuthStore.getState().authMethod === "oauth"
            ) {
              const refreshed =
                await useAuthStore.getState().tryRefreshOAuthToken();
              if (refreshed) {
                await load(true);
                return;
              }
            }
            if (err.code === "TOKEN_INVALID") {
              void useAuthStore.getState().showReconnect();
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
      };

      await load(false);
    },

    initializeCacheTTL: (minutes: CacheTTLMinutes) => {
      set({ cacheTTLMinutes: minutes });
    },

    setCacheTTLMinutes: (minutes: CacheTTLMinutes) => {
      set({ cacheTTLMinutes: minutes });
      setStorage("cacheTTL", minutes);
    },

    clearComments: () => {
      cancelPendingPageWork();
      set({
        threads: [],
        lastFetched: null,
        error: null,
        currentPageThreadIds: null,
        lastResolvedPageId: null,
        threadPageMap: new Map(),
        isBuildingPageMap: false,
        pageMapBuildComplete: false,
      });
    },

    setCurrentPageId: (pageId: string) => {
      const { currentPageId, lastResolvedPageId, currentPageThreadIds } = get();
      if (
        currentPageId === pageId &&
        lastResolvedPageId === pageId &&
        currentPageThreadIds !== null
      ) {
        return;
      }

      set({
        currentPageId: pageId,
        currentPageThreadIds: null,
        lastResolvedPageId: null,
      });

      if (tryApplyPageFromMap(pageId)) {
        return;
      }

      if (isCurrentPageScope()) {
        get().resolveCurrentPageThreads();
      }
    },

    setCurrentPageThreadIds: (requestId: string, threadIds: string[]) => {
      if (requestId !== pendingPageResolveRequestId) return;
      pendingPageResolveRequestId = null;

      const { currentPageId, threadPageMap } = get();
      const map = new Map(threadPageMap);
      if (currentPageId) {
        for (const id of threadIds) {
          map.set(id, currentPageId);
        }
      }

      set({
        currentPageThreadIds: new Set(threadIds),
        lastResolvedPageId: currentPageId,
        isResolvingPages: false,
        threadPageMap: map,
      });
    },

    appendThreadPageMapChunk: (requestId, mappings, done) => {
      if (requestId !== pendingPageMapRequestId) return;

      const map = new Map(get().threadPageMap);
      for (const entry of mappings) {
        if (entry.pageId) {
          map.set(entry.threadId, entry.pageId);
        }
      }

      set({
        threadPageMap: map,
        isBuildingPageMap: !done,
        pageMapBuildComplete: done,
      });

      if (done) {
        pendingPageMapRequestId = null;
      }

      updateCurrentPageFromMapIfNeeded();
    },

    resolveCurrentPageThreads: () => {
      if (!isCurrentPageScope()) return;

      const { threads, currentPageId, lastResolvedPageId, currentPageThreadIds } =
        get();
      if (!currentPageId || threads.length === 0) return;

      if (
        lastResolvedPageId === currentPageId &&
        currentPageThreadIds !== null
      ) {
        return;
      }

      if (tryApplyPageFromMap(currentPageId)) {
        return;
      }

      const entries = collectAnchoredEntries(threads);

      if (entries.length === 0) {
        pendingPageResolveRequestId = null;
        set({
          currentPageThreadIds: new Set(),
          lastResolvedPageId: currentPageId,
          isResolvingPages: false,
        });
        return;
      }

      pendingPageResolveRequestId = null;
      const requestId = `page_resolve_${++resolveCounter}`;
      pendingPageResolveRequestId = requestId;
      set({
        isResolvingPages: true,
        currentPageThreadIds: null,
      });

      const msg: ResolvePageThreadsMessage = {
        type: "RESOLVE_PAGE_THREADS",
        requestId,
        threads: entries,
      };
      parent.postMessage({ pluginMessage: msg }, "*");
    },

    onFilterScopeHydrated: () => {
      if (get().threads.length === 0) return;
      if (tryApplyPageFromMap()) {
        if (!get().pageMapBuildComplete) {
          startBackgroundPageMapBuild();
        }
        return;
      }
      if (isCurrentPageScope()) {
        get().resolveCurrentPageThreads();
      }
      if (!get().pageMapBuildComplete) {
        startBackgroundPageMapBuild();
      }
    },
  };
});
