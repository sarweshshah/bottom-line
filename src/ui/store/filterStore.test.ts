import { describe, expect, it, beforeEach, vi } from "vitest";
import type { CommentThread } from "@shared/types";

vi.mock("@ui/lib/storage", () => ({
  getStorage: vi.fn().mockResolvedValue(null),
  setStorage: vi.fn(),
}));

const { useFilterStore } = await import("./filterStore");

function makeThread(
  id: string,
  lastUpdatedAt = "2026-01-01T00:00:00.000Z",
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
    lastUpdatedAt,
  };
}

describe("applyFilters workflow state", () => {
  beforeEach(() => {
    useFilterStore.setState({
      commentScope: "full_file",
      workflowStateFilter: null,
    });
  });

  it("shows all threads when no state filter is set", () => {
    const threads = [makeThread("a"), makeThread("b")];
    const getState = (id: string) => (id === "a" ? "open" : "resolved");

    const filtered = useFilterStore
      .getState()
      .applyFilters(threads, null, getState);

    expect(filtered.map((t) => t.id)).toEqual(["a", "b"]);
  });

  it("filters to a single workflow state", () => {
    useFilterStore.setState({ workflowStateFilter: "open" });
    const threads = [makeThread("a"), makeThread("b")];
    const getState = (id: string) => (id === "a" ? "open" : "resolved");

    const filtered = useFilterStore
      .getState()
      .applyFilters(threads, null, getState);

    expect(filtered.map((t) => t.id)).toEqual(["a"]);
  });
});

describe("applyFilters current page scope", () => {
  beforeEach(() => {
    useFilterStore.setState({
      commentScope: "full_file",
      workflowStateFilter: null,
    });
  });

  it("filters to threads on the current page", () => {
    useFilterStore.setState({ commentScope: "current_page" });
    const threads = [makeThread("a"), makeThread("b"), makeThread("c")];
    const currentPageThreadIds = new Set(["a", "c"]);

    const filtered = useFilterStore
      .getState()
      .applyFilters(threads, currentPageThreadIds, () => "open");

    expect(filtered.map((t) => t.id)).toEqual(["a", "c"]);
  });

  it("returns no threads while current page membership is unresolved", () => {
    useFilterStore.setState({ commentScope: "current_page" });
    const threads = [makeThread("a"), makeThread("b")];

    const filtered = useFilterStore
      .getState()
      .applyFilters(threads, null, () => "open");

    expect(filtered).toEqual([]);
  });

  it("shows all threads when scope is full file", () => {
    const threads = [makeThread("a"), makeThread("b")];
    const currentPageThreadIds = new Set(["a"]);

    const filtered = useFilterStore
      .getState()
      .applyFilters(threads, currentPageThreadIds, () => "open");

    expect(filtered.map((t) => t.id)).toEqual(["a", "b"]);
  });
});

describe("applyFilters time range", () => {
  beforeEach(() => {
    useFilterStore.setState({
      commentScope: "full_file",
      workflowStateFilter: null,
      timeFilterPreset: "all",
      customTimeStart: null,
      customTimeEnd: null,
    });
  });

  it("shows all threads when time filter is all", () => {
    const threads = [
      makeThread("a", "2020-01-01T00:00:00.000Z"),
      makeThread("b", new Date().toISOString()),
    ];

    const filtered = useFilterStore
      .getState()
      .applyFilters(threads, null, () => "open");

    expect(filtered.map((t) => t.id)).toEqual(["a", "b"]);
  });

  it("filters to threads updated in the last 24 hours", () => {
    const now = Date.now();
    const recent = new Date(now - 2 * 60 * 60 * 1000).toISOString();
    const old = new Date(now - 48 * 60 * 60 * 1000).toISOString();
    useFilterStore.setState({ timeFilterPreset: "24h" });
    const threads = [makeThread("recent", recent), makeThread("old", old)];

    const filtered = useFilterStore
      .getState()
      .applyFilters(threads, null, () => "open");

    expect(filtered.map((t) => t.id)).toEqual(["recent"]);
  });

  it("filters to a custom date range", () => {
    useFilterStore.setState({
      timeFilterPreset: "custom",
      customTimeStart: "2026-06-10",
      customTimeEnd: "2026-06-12",
    });
    const threads = [
      makeThread("in-range", "2026-06-11T12:00:00.000Z"),
      makeThread("before", "2026-06-09T12:00:00.000Z"),
      makeThread("after", "2026-06-13T12:00:00.000Z"),
    ];

    const filtered = useFilterStore
      .getState()
      .applyFilters(threads, null, () => "open");

    expect(filtered.map((t) => t.id)).toEqual(["in-range"]);
  });
});
