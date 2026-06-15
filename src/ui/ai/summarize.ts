import type { CommentThread, SummaryResult } from "@shared/types";
import { useAIStore } from "@ui/store/aiStore";
import { useWorkflowStore } from "@ui/store/workflowStore";
import {
  cloudSummarize,
  supportsVision,
  CloudAIError,
  formatModelName,
} from "./cloudProvider";
import { processThreadImages } from "./imageProcessor";
import { getStorage, setStorage, deleteStorage } from "@ui/lib/storage";
import { showToast } from "@ui/components/common/Toast";

const MIN_COMMENTS_FOR_SUMMARY = 3;
const VALID_PROVIDERS = new Set<string>([
  "anthropic",
  "openai",
  "gemini",
  "custom",
]);

function cacheKey(threadId: string, lastUpdatedAt: string): string {
  return `summary:${threadId}:${lastUpdatedAt}`;
}

async function applyStoredTaskStatuses(
  result: SummaryResult,
): Promise<SummaryResult> {
  if (result.tasks.length === 0) {
    return result;
  }

  const statuses = await Promise.all(
    result.tasks.map((task) => getStorage<"pending" | "done">(`taskStatus:${task.id}`)),
  );

  let changed = false;
  const tasks = result.tasks.map((task, index) => {
    const persisted = statuses[index];
    if (persisted && persisted !== task.status) {
      changed = true;
      return { ...task, status: persisted };
    }
    return task;
  });

  return changed ? { ...result, tasks } : result;
}

export function isTooShort(thread: CommentThread): boolean {
  return thread.replyCount + 1 < MIN_COMMENTS_FOR_SUMMARY;
}

export async function getCachedSummary(
  threadId: string,
  lastUpdatedAt: string,
): Promise<SummaryResult | null> {
  const key = cacheKey(threadId, lastUpdatedAt);
  const cached = await getStorage<SummaryResult>(key);
  if (cached && cached.summary && VALID_PROVIDERS.has(cached.provider)) {
    return applyStoredTaskStatuses(cached);
  }
  return null;
}

async function cacheSummary(
  result: SummaryResult,
  threadId: string,
): Promise<void> {
  const key = cacheKey(threadId, result.threadLastUpdatedAt);
  await setStorage(key, result);
}

export async function clearCachedSummary(
  threadId: string,
  lastUpdatedAt: string,
): Promise<void> {
  const key = cacheKey(threadId, lastUpdatedAt);
  await deleteStorage(key);
}

export async function clearAllCachedSummaries(
  threads: CommentThread[],
): Promise<void> {
  await Promise.all(
    threads.map((t) => deleteStorage(cacheKey(t.id, t.lastUpdatedAt))),
  );
  useAIStore.getState().clearAllSummaries();
}

export async function summarizeThread(
  thread: CommentThread,
  skipCache = false,
): Promise<SummaryResult> {
  const store = useAIStore.getState();
  const { provider, imageAnalysisEnabled, summaryWordLimit } = store;

  if (!skipCache) {
    const cached = await getCachedSummary(thread.id, thread.lastUpdatedAt);
    if (cached) {
      return cached;
    }
  }

  const apiKey = store.getApiKeyForProvider(provider);
  if (!apiKey) {
    throw new CloudAIError(
      "No API key configured. Add one in Settings > Summary.",
    );
  }

  let images: Awaited<ReturnType<typeof processThreadImages>>["images"] = [];
  if (imageAnalysisEnabled && supportsVision(provider)) {
    const processed = await processThreadImages(thread);
    images = processed.images;
  }

  const result = await cloudSummarize(
    thread,
    provider,
    apiKey,
    summaryWordLimit,
    images,
    provider === "custom" ? store.customConfig : undefined,
  );

  if (provider === "gemini" && result.modelName !== "gemini-2.5-flash") {
    showToast(
      `Gemini 2.5 Flash unavailable — used ${formatModelName(result.modelName)} instead`,
      "info",
    );
  }

  if (imageAnalysisEnabled && !supportsVision(provider) && result.summary) {
    result.summary += ` Thread includes image(s) not analyzed — switch to a vision-capable provider for image context.`;
  }

  const workflowState = useWorkflowStore.getState().getState(thread.id);
  const threadIsDone =
    thread.status === "resolved" || workflowState === "resolved";
  const finalResult: SummaryResult =
    threadIsDone && result.tasks.length > 0
      ? {
          ...result,
          tasks: result.tasks.map((t) => ({ ...t, status: "done" as const })),
        }
      : result;

  const resultWithPersistedTaskState = await applyStoredTaskStatuses(finalResult);
  await cacheSummary(resultWithPersistedTaskState, thread.id);
  return resultWithPersistedTaskState;
}

export async function bulkSummarizeThreads(
  threads: CommentThread[],
): Promise<void> {
  const eligible = threads.filter((t) => !isTooShort(t));
  const skipped = threads.length - eligible.length;

  if (eligible.length === 0) {
    showToast(
      "Selected threads are too short to summarize (need 3+ comments).",
      "info",
    );
    return;
  }

  const store = useAIStore.getState();
  store.startBulkSummary(eligible.length);

  for (const thread of eligible) {
    const ai = useAIStore.getState();
    ai.setThreadLoading(thread.id);
    try {
      const result = await summarizeThread(thread);
      ai.setThreadResult(thread.id, result);
      ai.recordBulkSummaryProgress(true);
    } catch (err) {
      ai.setThreadError(
        thread.id,
        err instanceof Error ? err.message : "Summary generation failed",
      );
      ai.recordBulkSummaryProgress(false);
    }
  }

  const finalProgress = useAIStore.getState().bulkSummaryProgress;
  useAIStore.getState().finishBulkSummary();

  if (finalProgress) {
    const { completed, failed } = finalProgress;
    if (failed === 0) {
      showToast(
        `Summarized ${completed} thread${completed === 1 ? "" : "s"}` +
          (skipped > 0 ? ` (${skipped} too short)` : ""),
        "success",
      );
    } else {
      showToast(
        `Summarized ${completed} threads, ${failed} failed`,
        completed > 0 ? "info" : "error",
      );
    }
  }
}
