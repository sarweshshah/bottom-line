import { create } from "zustand";
import type {
  AIProvider,
  CommentThread,
  CustomProviderConfig,
  SummaryResult,
  SummaryWordLimit,
  Task,
  TaskStatus,
} from "@shared/types";
import {
  SUMMARY_WORD_LIMIT_DEFAULT,
  normalizeSummaryWordLimit,
} from "@shared/types";
import { getStorage, setStorage } from "@ui/lib/storage";
import { getCachedSummary, isTooShort } from "@ui/ai/summarize";

interface ThreadSummaryState {
  isLoading: boolean;
  result: SummaryResult | null;
  error: string | null;
}

interface BulkSummaryProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: boolean;
}

interface AIState {
  provider: AIProvider;
  anthropicApiKey: string;
  openaiApiKey: string;
  geminiApiKey: string;
  customConfig: CustomProviderConfig;
  summaryWordLimit: SummaryWordLimit;
  imageAnalysisEnabled: boolean;
  cloudAiConsented: boolean;
  cloudAiConsentIncludesImages: boolean;

  threadSummaries: Map<string, ThreadSummaryState>;
  allTasks: Task[];
  bulkSummaryProgress: BulkSummaryProgress | null;

  setProvider: (provider: AIProvider) => void;
  setAnthropicApiKey: (key: string) => void;
  setOpenaiApiKey: (key: string) => void;
  setGeminiApiKey: (key: string) => void;
  setCustomConfig: (config: CustomProviderConfig) => void;
  setSummaryWordLimit: (limit: SummaryWordLimit) => void;
  setImageAnalysisEnabled: (enabled: boolean) => void;
  setCloudAiConsented: (consented: boolean, includesImages: boolean) => void;

  getApiKeyForProvider: (provider?: AIProvider) => string;
  needsConsent: () => boolean;

  setThreadLoading: (threadId: string) => void;
  setThreadResult: (threadId: string, result: SummaryResult) => void;
  setThreadError: (threadId: string, error: string) => void;
  clearThreadSummary: (threadId: string) => void;
  clearAllSummaries: () => void;
  getThreadSummary: (threadId: string) => ThreadSummaryState | undefined;

  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  refreshAllTasks: () => void;

  startBulkSummary: (total: number) => void;
  recordBulkSummaryProgress: (success: boolean) => void;
  finishBulkSummary: () => void;
  dismissBulkSummary: () => void;

  initFromStorage: () => Promise<void>;
  restoreCachedSummaries: (threads: CommentThread[]) => Promise<void>;
}

const DEFAULT_CUSTOM_CONFIG: CustomProviderConfig = {
  baseUrl: "",
  apiKey: "",
  modelName: "",
};

export const useAIStore = create<AIState>((set, get) => ({
  provider: "anthropic",
  anthropicApiKey: "",
  openaiApiKey: "",
  geminiApiKey: "",
  customConfig: { ...DEFAULT_CUSTOM_CONFIG },
  summaryWordLimit: SUMMARY_WORD_LIMIT_DEFAULT,
  imageAnalysisEnabled: false,
  cloudAiConsented: false,
  cloudAiConsentIncludesImages: false,

  threadSummaries: new Map(),
  allTasks: [],
  bulkSummaryProgress: null,

  setProvider: (provider) => {
    set({ provider });
    setStorage("aiProvider", provider);
  },

  setAnthropicApiKey: (key) => {
    set({ anthropicApiKey: key });
    setStorage("anthropicApiKey", key);
  },

  setOpenaiApiKey: (key) => {
    set({ openaiApiKey: key });
    setStorage("openaiApiKey", key);
  },

  setGeminiApiKey: (key) => {
    set({ geminiApiKey: key });
    setStorage("geminiApiKey", key);
  },

  setCustomConfig: (config) => {
    set({ customConfig: config });
    setStorage("customProviderConfig", config);
  },

  setSummaryWordLimit: (limit) => {
    const normalized = normalizeSummaryWordLimit(limit);
    set({ summaryWordLimit: normalized });
    setStorage("summaryWordLimit", normalized);
  },

  setImageAnalysisEnabled: (enabled) => {
    set({ imageAnalysisEnabled: enabled });
    setStorage("imageAnalysisEnabled", enabled);
  },

  setCloudAiConsented: (consented, includesImages) => {
    set({ cloudAiConsented: consented, cloudAiConsentIncludesImages: includesImages });
    setStorage("cloudAiConsented", consented);
    setStorage("cloudAiConsentIncludesImages", includesImages);
  },

  getApiKeyForProvider: (provider) => {
    const p = provider ?? get().provider;
    switch (p) {
      case "anthropic":
        return (get().anthropicApiKey || "").trim();
      case "openai":
        return (get().openaiApiKey || "").trim();
      case "gemini":
        return (get().geminiApiKey || "").trim();
      case "custom":
        return (get().customConfig.apiKey || "").trim();
      default:
        return "";
    }
  },

  needsConsent: () => {
    const { cloudAiConsented, cloudAiConsentIncludesImages, imageAnalysisEnabled } = get();
    if (!cloudAiConsented) return true;
    if (imageAnalysisEnabled && !cloudAiConsentIncludesImages) return true;
    return false;
  },

  setThreadLoading: (threadId) => {
    set((state) => {
      const next = new Map(state.threadSummaries);
      const existing = next.get(threadId);
      next.set(threadId, {
        isLoading: true,
        result: existing?.result ?? null,
        error: null,
      });
      return { threadSummaries: next };
    });
  },

  setThreadResult: (threadId, result) => {
    set((state) => {
      const next = new Map(state.threadSummaries);
      next.set(threadId, { isLoading: false, result, error: null });
      return { threadSummaries: next };
    });
    get().refreshAllTasks();
  },

  setThreadError: (threadId, error) => {
    set((state) => {
      const next = new Map(state.threadSummaries);
      next.set(threadId, { isLoading: false, result: null, error });
      return { threadSummaries: next };
    });
  },

  clearThreadSummary: (threadId) => {
    set((state) => {
      const next = new Map(state.threadSummaries);
      next.delete(threadId);
      return { threadSummaries: next };
    });
    get().refreshAllTasks();
  },

  clearAllSummaries: () => {
    set({ threadSummaries: new Map(), allTasks: [] });
  },

  getThreadSummary: (threadId) => {
    return get().threadSummaries.get(threadId);
  },

  updateTaskStatus: (taskId, status) => {
    set((state) => {
      const updated = state.allTasks.map((t) =>
        t.id === taskId ? { ...t, status } : t,
      );

      const threadSummaries = new Map(state.threadSummaries);
      for (const [tid, entry] of threadSummaries) {
        if (entry.result) {
          const hasTask = entry.result.tasks.some((t) => t.id === taskId);
          if (hasTask) {
            threadSummaries.set(tid, {
              ...entry,
              result: {
                ...entry.result,
                tasks: entry.result.tasks.map((t) =>
                  t.id === taskId ? { ...t, status } : t,
                ),
              },
            });
          }
        }
      }

      return { allTasks: updated, threadSummaries };
    });
    setStorage(`taskStatus:${taskId}`, status);
  },

  refreshAllTasks: () => {
    const tasks: Task[] = [];
    for (const entry of get().threadSummaries.values()) {
      if (entry.result) {
        tasks.push(...entry.result.tasks);
      }
    }
    set({ allTasks: tasks });
  },

  startBulkSummary: (total) => {
    set({
      bulkSummaryProgress: {
        total,
        completed: 0,
        failed: 0,
        inProgress: true,
      },
    });
  },

  recordBulkSummaryProgress: (success) => {
    set((state) => {
      const current = state.bulkSummaryProgress;
      if (!current) return {};
      return {
        bulkSummaryProgress: {
          ...current,
          completed: success ? current.completed + 1 : current.completed,
          failed: success ? current.failed : current.failed + 1,
        },
      };
    });
  },

  finishBulkSummary: () => {
    set((state) => {
      const current = state.bulkSummaryProgress;
      if (!current) return {};
      return { bulkSummaryProgress: { ...current, inProgress: false } };
    });
  },

  dismissBulkSummary: () => {
    set({ bulkSummaryProgress: null });
  },

  initFromStorage: async () => {
    const [
      provider,
      anthropicKey,
      openaiKey,
      geminiKey,
      customConfig,
      summaryWordLimit,
      imageEnabled,
      consented,
      consentImages,
    ] = await Promise.all([
      getStorage<AIProvider>("aiProvider"),
      getStorage<string>("anthropicApiKey"),
      getStorage<string>("openaiApiKey"),
      getStorage<string>("geminiApiKey"),
      getStorage<CustomProviderConfig>("customProviderConfig"),
      getStorage<SummaryWordLimit>("summaryWordLimit"),
      getStorage<boolean>("imageAnalysisEnabled"),
      getStorage<boolean>("cloudAiConsented"),
      getStorage<boolean>("cloudAiConsentIncludesImages"),
    ]);

    set({
      provider: provider ?? "anthropic",
      anthropicApiKey: anthropicKey ?? "",
      openaiApiKey: openaiKey ?? "",
      geminiApiKey: geminiKey ?? "",
      customConfig: customConfig ?? { ...DEFAULT_CUSTOM_CONFIG },
      summaryWordLimit: normalizeSummaryWordLimit(
        summaryWordLimit ?? SUMMARY_WORD_LIMIT_DEFAULT,
      ),
      imageAnalysisEnabled: imageEnabled ?? false,
      cloudAiConsented: consented ?? false,
      cloudAiConsentIncludesImages: consentImages ?? false,
    });
  },

  restoreCachedSummaries: async (threads) => {
    const eligible = threads.filter((t) => !isTooShort(t));
    const existing = get().threadSummaries;
    const toFetch = eligible.filter((t) => !existing.has(t.id));
    if (toFetch.length === 0) return;

    const results = await Promise.all(
      toFetch.map((t) => getCachedSummary(t.id, t.lastUpdatedAt)),
    );

    const next = new Map(get().threadSummaries);
    for (let i = 0; i < toFetch.length; i++) {
      const cached = results[i];
      if (cached) {
        next.set(toFetch[i].id, { isLoading: false, result: cached, error: null });
      }
    }

    set({ threadSummaries: next });
    get().refreshAllTasks();
  },
}));
