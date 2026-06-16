import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CommentThread } from "@shared/types";

vi.mock("@ui/lib/storage", () => ({
  getStorage: vi.fn().mockResolvedValue(null),
  setStorage: vi.fn(),
}));

vi.mock("@ui/components/common/Toast", () => ({
  showToast: vi.fn(),
}));

vi.mock("./aiStore", () => ({
  useAIStore: {
    getState: () => ({
      allTasks: [],
      updateTaskStatus: vi.fn(),
    }),
  },
}));

const { useWorkflowStore } = await import("./workflowStore");
const { showToast } = await import("@ui/components/common/Toast");

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

describe("useWorkflowStore.reconcileWithFigma", () => {
  beforeEach(() => {
    useWorkflowStore.setState({
      states: new Map(),
      initialized: true,
    });
    vi.mocked(showToast).mockClear();
  });

  it("syncs open local state to resolved when Figma thread is resolved", () => {
    const thread = makeThread("t1", {
      resolvedAt: "2026-01-02T09:00:00.000Z",
      status: "resolved",
    });

    useWorkflowStore.setState({
      states: new Map([["t1", "open"]]),
    });

    useWorkflowStore.getState().reconcileWithFigma([thread]);

    expect(useWorkflowStore.getState().getState("t1")).toBe("resolved");
    expect(showToast).toHaveBeenCalledOnce();
  });

  it("syncs read local state to resolved when Figma thread is resolved", () => {
    const thread = makeThread("t1", {
      resolvedAt: "2026-01-02T09:00:00.000Z",
      status: "resolved",
    });

    useWorkflowStore.setState({
      states: new Map([["t1", "read"]]),
    });

    useWorkflowStore.getState().reconcileWithFigma([thread]);

    expect(useWorkflowStore.getState().getState("t1")).toBe("resolved");
  });

  it("syncs resolved local state to open when Figma thread is reopened", () => {
    const thread = makeThread("t1");

    useWorkflowStore.setState({
      states: new Map([["t1", "resolved"]]),
    });

    useWorkflowStore.getState().reconcileWithFigma([thread]);

    expect(useWorkflowStore.getState().getState("t1")).toBe("open");
    expect(showToast).toHaveBeenCalledOnce();
  });

  it("persists native state for newly seen threads", () => {
    const thread = makeThread("t1", {
      resolvedAt: "2026-01-02T09:00:00.000Z",
      status: "resolved",
    });

    useWorkflowStore.getState().reconcileWithFigma([thread]);

    expect(useWorkflowStore.getState().getState("t1")).toBe("resolved");
  });

  it("leaves read state unchanged when Figma thread is still open", () => {
    const thread = makeThread("t1");

    useWorkflowStore.setState({
      states: new Map([["t1", "read"]]),
    });

    useWorkflowStore.getState().reconcileWithFigma([thread]);

    expect(useWorkflowStore.getState().getState("t1")).toBe("read");
    expect(showToast).not.toHaveBeenCalled();
  });
});
