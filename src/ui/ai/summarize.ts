import type { CommentThread, SummaryResult } from "@shared/types";
import { useAIStore } from "@ui/store/aiStore";
import { cloudSummarize, supportsVision, CloudAIError } from "./cloudProvider";
import { processThreadImages } from "./imageProcessor";
import { getStorage, setStorage } from "@ui/lib/storage";

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

export function isTooShort(thread: CommentThread): boolean {
  return thread.replyCount + 1 < MIN_COMMENTS_FOR_SUMMARY;
}

async function getCachedSummary(
  threadId: string,
  lastUpdatedAt: string,
): Promise<SummaryResult | null> {
  const key = cacheKey(threadId, lastUpdatedAt);
  const cached = await getStorage<SummaryResult>(key);
  if (cached && cached.summary && VALID_PROVIDERS.has(cached.provider)) {
    return cached;
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

export async function summarizeThread(
  thread: CommentThread,
): Promise<SummaryResult> {
  const store = useAIStore.getState();
  const { provider, imageAnalysisEnabled } = store;

  const cached = await getCachedSummary(thread.id, thread.lastUpdatedAt);
  if (cached) {
    return cached;
  }

  const apiKey = store.getApiKeyForProvider(provider);
  if (!apiKey) {
    throw new CloudAIError(
      "No API key configured. Add one in Settings > AI & Summarization.",
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
    images,
    provider === "custom" ? store.customConfig : undefined,
  );

  if (imageAnalysisEnabled && !supportsVision(provider) && result.summary) {
    result.summary += ` Thread includes image(s) not analyzed — switch to a vision-capable provider for image context.`;
  }

  await cacheSummary(result, thread.id);
  return result;
}
