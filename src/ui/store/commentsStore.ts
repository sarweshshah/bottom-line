import { create } from "zustand";
import type { CommentThread } from "@shared/types";
import type { ApiErrorCode } from "@ui/api/figmaApi";
import { getComments, FigmaApiError } from "@ui/api/figmaApi";
import { normalizeComments } from "@ui/lib/normalize";
import { useAuthStore } from "./authStore";

const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

interface CommentsState {
  threads: CommentThread[];
  lastFetched: number | null;
  isLoading: boolean;
  error: { message: string; code: ApiErrorCode } | null;
  cacheTTL: number;

  fetchComments: () => Promise<void>;
  refreshComments: () => Promise<void>;
  isCacheStale: () => boolean;
  clearComments: () => void;
}

export const useCommentsStore = create<CommentsState>((set, get) => ({
  threads: [],
  lastFetched: null,
  isLoading: false,
  error: null,
  cacheTTL: DEFAULT_CACHE_TTL_MS,

  fetchComments: async () => {
    const { lastFetched, cacheTTL, isLoading } = get();
    if (isLoading) return;
    if (lastFetched && Date.now() - lastFetched < cacheTTL) return;
    await get().refreshComments();
  },

  refreshComments: async () => {
    const { pat, fileKey } = useAuthStore.getState();
    if (!pat || !fileKey) return;

    set({ isLoading: true, error: null });

    try {
      const rawComments = await getComments(fileKey, pat);
      const threads = normalizeComments(rawComments);
      set({ threads, lastFetched: Date.now(), isLoading: false });
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

  isCacheStale: () => {
    const { lastFetched, cacheTTL } = get();
    if (!lastFetched) return true;
    return Date.now() - lastFetched >= cacheTTL;
  },

  clearComments: () => {
    set({ threads: [], lastFetched: null, error: null });
  },
}));
