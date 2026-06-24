import type { CommentThread, TimeFilterPreset } from "@shared/types";

export type ActivityCategory = "new" | "updated" | "resolved";
export type ActivityFilter = ActivityCategory | "all";

export const ACTIVITY_WINDOW_PRESET: TimeFilterPreset = "24h";

const ACTIVITY_WINDOW_LABELS: Partial<Record<TimeFilterPreset, string>> = {
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
};

export const ACTIVITY_WINDOW_LABEL =
  ACTIVITY_WINDOW_LABELS[ACTIVITY_WINDOW_PRESET] ?? "Last 24 hours";

export interface ActivitySummary {
  newThreads: CommentThread[];
  updatedThreads: CommentThread[];
  resolvedThreads: CommentThread[];
  totalCount: number;
}

function ts(iso: string | null): number | null {
  if (!iso) return null;
  return new Date(iso).getTime();
}

export function getActivityCategory(
  thread: CommentThread,
  sinceMs: number,
): ActivityCategory | null {
  const created = ts(thread.createdAt);
  if (created !== null && created >= sinceMs) {
    return "new";
  }

  const resolved = ts(thread.resolvedAt);
  if (resolved !== null && resolved >= sinceMs) {
    return "resolved";
  }

  const updated = ts(thread.lastUpdatedAt);
  if (updated !== null && updated >= sinceMs) {
    return "updated";
  }

  return null;
}

function sortByTimestamp(
  threads: CommentThread[],
  getTime: (t: CommentThread) => string,
): CommentThread[] {
  return [...threads].sort(
    (a, b) => new Date(getTime(b)).getTime() - new Date(getTime(a)).getTime(),
  );
}

export function computeActivitySummary(
  threads: CommentThread[],
  sinceMs: number,
): ActivitySummary {
  const newThreads: CommentThread[] = [];
  const updatedThreads: CommentThread[] = [];
  const resolvedThreads: CommentThread[] = [];

  for (const thread of threads) {
    const category = getActivityCategory(thread, sinceMs);
    if (category === "new") {
      newThreads.push(thread);
    } else if (category === "updated") {
      updatedThreads.push(thread);
    } else if (category === "resolved") {
      resolvedThreads.push(thread);
    }
  }

  return {
    newThreads: sortByTimestamp(newThreads, (t) => t.createdAt),
    updatedThreads: sortByTimestamp(updatedThreads, (t) => t.lastUpdatedAt),
    resolvedThreads: sortByTimestamp(
      resolvedThreads,
      (t) => t.resolvedAt ?? t.lastUpdatedAt,
    ),
    totalCount: newThreads.length + updatedThreads.length + resolvedThreads.length,
  };
}
