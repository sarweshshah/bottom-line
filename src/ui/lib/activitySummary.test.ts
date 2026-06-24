import { describe, expect, it } from "vitest";
import type { CommentThread } from "@shared/types";
import {
  computeActivitySummary,
  getActivityCategory,
} from "./activitySummary";

const SINCE = new Date("2026-06-22T12:00:00.000Z").getTime();

function makeThread(
  id: string,
  overrides?: Partial<CommentThread>,
): CommentThread {
  return {
    id,
    fileKey: "file",
    orderNumber: null,
    author: { id: "u1", handle: "alice", img_url: "" },
    message: "hello",
    createdAt: "2026-01-01T00:00:00.000Z",
    resolvedAt: null,
    status: "open",
    replies: [],
    replyCount: 0,
    participants: [],
    clientMeta: null,
    mentions: [],
    lastUpdatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("getActivityCategory", () => {
  it("returns new when created within window", () => {
    const thread = makeThread("t1", {
      createdAt: "2026-06-23T10:00:00.000Z",
      lastUpdatedAt: "2026-06-23T10:00:00.000Z",
    });
    expect(getActivityCategory(thread, SINCE)).toBe("new");
  });

  it("returns updated when reply is recent but thread is older", () => {
    const thread = makeThread("t2", {
      createdAt: "2026-01-01T00:00:00.000Z",
      lastUpdatedAt: "2026-06-23T10:00:00.000Z",
    });
    expect(getActivityCategory(thread, SINCE)).toBe("updated");
  });

  it("returns resolved when resolved recently and not new", () => {
    const thread = makeThread("t3", {
      createdAt: "2026-01-01T00:00:00.000Z",
      lastUpdatedAt: "2026-01-15T00:00:00.000Z",
      resolvedAt: "2026-06-23T08:00:00.000Z",
      status: "resolved",
    });
    expect(getActivityCategory(thread, SINCE)).toBe("resolved");
  });

  it("prioritizes new over resolved when both are recent", () => {
    const thread = makeThread("t4", {
      createdAt: "2026-06-23T09:00:00.000Z",
      lastUpdatedAt: "2026-06-23T09:00:00.000Z",
      resolvedAt: "2026-06-23T10:00:00.000Z",
      status: "resolved",
    });
    expect(getActivityCategory(thread, SINCE)).toBe("new");
  });

  it("returns null when no activity in window", () => {
    const thread = makeThread("t5", {
      createdAt: "2026-01-01T00:00:00.000Z",
      lastUpdatedAt: "2026-01-15T00:00:00.000Z",
    });
    expect(getActivityCategory(thread, SINCE)).toBeNull();
  });
});

describe("computeActivitySummary", () => {
  it("buckets threads without overlap", () => {
    const threads = [
      makeThread("new", {
        createdAt: "2026-06-23T10:00:00.000Z",
        lastUpdatedAt: "2026-06-23T10:00:00.000Z",
      }),
      makeThread("updated", {
        createdAt: "2026-01-01T00:00:00.000Z",
        lastUpdatedAt: "2026-06-23T11:00:00.000Z",
      }),
      makeThread("resolved", {
        createdAt: "2026-01-01T00:00:00.000Z",
        lastUpdatedAt: "2026-01-15T00:00:00.000Z",
        resolvedAt: "2026-06-23T09:00:00.000Z",
        status: "resolved",
      }),
      makeThread("inactive", {
        createdAt: "2026-01-01T00:00:00.000Z",
        lastUpdatedAt: "2026-01-15T00:00:00.000Z",
      }),
    ];

    const summary = computeActivitySummary(threads, SINCE);

    expect(summary.newThreads.map((t) => t.id)).toEqual(["new"]);
    expect(summary.updatedThreads.map((t) => t.id)).toEqual(["updated"]);
    expect(summary.resolvedThreads.map((t) => t.id)).toEqual(["resolved"]);
    expect(summary.totalCount).toBe(3);
  });

  it("sorts buckets by relevant timestamp descending", () => {
    const threads = [
      makeThread("new-old", {
        createdAt: "2026-06-22T14:00:00.000Z",
        lastUpdatedAt: "2026-06-22T14:00:00.000Z",
      }),
      makeThread("new-new", {
        createdAt: "2026-06-23T10:00:00.000Z",
        lastUpdatedAt: "2026-06-23T10:00:00.000Z",
      }),
    ];

    const summary = computeActivitySummary(threads, SINCE);
    expect(summary.newThreads.map((t) => t.id)).toEqual([
      "new-new",
      "new-old",
    ]);
  });

  it("returns zero counts for empty input", () => {
    const summary = computeActivitySummary([], SINCE);
    expect(summary.totalCount).toBe(0);
    expect(summary.newThreads).toEqual([]);
    expect(summary.updatedThreads).toEqual([]);
    expect(summary.resolvedThreads).toEqual([]);
  });
});
