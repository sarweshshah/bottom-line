import { describe, expect, it, beforeEach, vi } from "vitest";
import type { CommentThread } from "@shared/types";

vi.mock("@ui/lib/storage", () => ({
  getStorage: vi.fn().mockResolvedValue(null),
  setStorage: vi.fn(),
}));

const { useFilterStore } = await import("./filterStore");

function makeThread(id: string): CommentThread {
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
