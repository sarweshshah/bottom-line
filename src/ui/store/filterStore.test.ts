import { describe, expect, it, beforeEach, vi } from "vitest";
import type { CommentThread, ClientMeta } from "@shared/types";

vi.mock("@ui/lib/storage", () => ({
  getStorage: vi.fn().mockResolvedValue(null),
  setStorage: vi.fn(),
}));

const { useFilterStore, sortByRelatedness } = await import("./filterStore");

function resetFilterDefaults() {
  useFilterStore.setState({
    workflowStateFilter: null,
    addressedToMe: false,
    sortField: "replies",
    sortDirection: "desc",
    commentScope: "full_file",
    timeFilterPreset: "all",
    customTimeStart: null,
    customTimeEnd: null,
  });
}

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

describe("default sort", () => {
  beforeEach(() => {
    resetFilterDefaults();
  });

  it("defaults to replies descending", () => {
    expect(useFilterStore.getState().sortField).toBe("replies");
    expect(useFilterStore.getState().sortDirection).toBe("desc");
  });

  it("sorts threads by reply count when no sort field is set", () => {
    const threads = [
      makeThread("few", { replyCount: 1 }),
      makeThread("many", { replyCount: 10 }),
      makeThread("none", { replyCount: 0 }),
    ];

    const sorted = useFilterStore
      .getState()
      .applyFilters(threads, null, () => "open");

    expect(sorted.map((t) => t.id)).toEqual(["many", "few", "none"]);
  });

  it("restores replies sort when filters are cleared", () => {
    useFilterStore.setState({ sortField: "last_updated", sortDirection: "asc" });

    useFilterStore.getState().clearFilters();

    expect(useFilterStore.getState().sortField).toBe("replies");
    expect(useFilterStore.getState().sortDirection).toBe("desc");
  });
});

describe("applyFilters workflow state", () => {
  beforeEach(() => {
    resetFilterDefaults();
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
    resetFilterDefaults();
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
    resetFilterDefaults();
  });

  it("shows all threads when time filter is all", () => {
    const threads = [
      makeThread("a", { lastUpdatedAt: "2020-01-01T00:00:00.000Z" }),
      makeThread("b", { lastUpdatedAt: new Date().toISOString() }),
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
    const threads = [
      makeThread("recent", { lastUpdatedAt: recent }),
      makeThread("old", { lastUpdatedAt: old }),
    ];

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
      makeThread("in-range", { lastUpdatedAt: "2026-06-11T12:00:00.000Z" }),
      makeThread("before", { lastUpdatedAt: "2026-06-09T12:00:00.000Z" }),
      makeThread("after", { lastUpdatedAt: "2026-06-13T12:00:00.000Z" }),
    ];

    const filtered = useFilterStore
      .getState()
      .applyFilters(threads, null, () => "open");

    expect(filtered.map((t) => t.id)).toEqual(["in-range"]);
  });
});

describe("sortByRelatedness", () => {
  beforeEach(() => {
    resetFilterDefaults();
  });

  const nodeA = (x: number, y: number): ClientMeta => ({
    node_id: "nodeA",
    node_offset: { x, y },
  });
  const nodeB = (x: number, y: number): ClientMeta => ({
    node_id: "nodeB",
    node_offset: { x, y },
  });
  const canvas = (x: number, y: number): ClientMeta => ({ x, y });

  it("groups threads on the same node_id adjacently", () => {
    const threads = [
      makeThread("a1", { clientMeta: nodeA(0, 0) }),
      makeThread("b1", { clientMeta: nodeB(0, 0) }),
      makeThread("a2", { clientMeta: nodeA(10, 10) }),
      makeThread("b2", { clientMeta: nodeB(10, 10) }),
    ];

    const sorted = sortByRelatedness(threads, "desc");
    const ids = sorted.map((t) => t.id);

    const a1Idx = ids.indexOf("a1");
    const a2Idx = ids.indexOf("a2");
    const b1Idx = ids.indexOf("b1");
    const b2Idx = ids.indexOf("b2");

    expect(Math.abs(a1Idx - a2Idx)).toBe(1);
    expect(Math.abs(b1Idx - b2Idx)).toBe(1);
  });

  it("orders within a node group by position (y-primary, x-secondary)", () => {
    const threads = [
      makeThread("bottom", { clientMeta: nodeA(0, 100) }),
      makeThread("top", { clientMeta: nodeA(0, 0) }),
      makeThread("mid", { clientMeta: nodeA(50, 50) }),
    ];

    const sorted = sortByRelatedness(threads, "desc");
    expect(sorted.map((t) => t.id)).toEqual(["top", "mid", "bottom"]);
  });

  it("orders canvas threads by spatial proximity (nearest-neighbor)", () => {
    const threads = [
      makeThread("origin", { clientMeta: canvas(0, 0) }),
      makeThread("far", { clientMeta: canvas(1000, 1000) }),
      makeThread("near-origin", { clientMeta: canvas(5, 5) }),
      makeThread("near-far", { clientMeta: canvas(990, 990) }),
    ];

    const sorted = sortByRelatedness(threads, "desc");
    const ids = sorted.map((t) => t.id);

    expect(Math.abs(ids.indexOf("origin") - ids.indexOf("near-origin"))).toBe(
      1,
    );
    expect(Math.abs(ids.indexOf("far") - ids.indexOf("near-far"))).toBe(1);
  });

  it("places threads without clientMeta at the end", () => {
    const threads = [
      makeThread("orphan"),
      makeThread("pinned", { clientMeta: canvas(0, 0) }),
      makeThread("node", { clientMeta: nodeA(0, 0) }),
    ];

    const sorted = sortByRelatedness(threads, "desc");
    const ids = sorted.map((t) => t.id);
    expect(ids[ids.length - 1]).toBe("orphan");
  });

  it("asc reverses the order", () => {
    const threads = [
      makeThread("orphan"),
      makeThread("pinned", { clientMeta: canvas(0, 0) }),
      makeThread("node", { clientMeta: nodeA(0, 0) }),
    ];

    const desc = sortByRelatedness(threads, "desc");
    const asc = sortByRelatedness(threads, "asc");

    expect(asc.map((t) => t.id)).toEqual(
      [...desc].reverse().map((t) => t.id),
    );
  });

  it("larger node groups appear first in desc mode", () => {
    const threads = [
      makeThread("b1", { clientMeta: nodeB(0, 0) }),
      makeThread("a1", { clientMeta: nodeA(0, 0) }),
      makeThread("a2", { clientMeta: nodeA(10, 0) }),
      makeThread("a3", { clientMeta: nodeA(20, 0) }),
    ];

    const sorted = sortByRelatedness(threads, "desc");
    const ids = sorted.map((t) => t.id);

    expect(ids.indexOf("a1")).toBeLessThan(ids.indexOf("b1"));
  });

  it("integrates with applyFilters when sort field is relatedness", () => {
    useFilterStore.setState({
      sortField: "relatedness",
      sortDirection: "desc",
      commentScope: "full_file",
      workflowStateFilter: null,
      addressedToMe: false,
      timeFilterPreset: "all",
      customTimeStart: null,
      customTimeEnd: null,
    });

    const threads = [
      makeThread("orphan"),
      makeThread("node1", { clientMeta: nodeA(0, 0) }),
      makeThread("node2", { clientMeta: nodeA(10, 10) }),
    ];

    const result = useFilterStore
      .getState()
      .applyFilters(threads, null, () => "open");

    expect(result.map((t) => t.id)).toEqual(["node1", "node2", "orphan"]);
  });
});
