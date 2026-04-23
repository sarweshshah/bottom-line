import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SummaryResult } from "@shared/types";
import { getCachedSummary } from "./summarize";

const { getStorageMock } = vi.hoisted(() => ({
  getStorageMock: vi.fn(),
}));

vi.mock("@ui/lib/storage", () => ({
  getStorage: getStorageMock,
  setStorage: vi.fn(),
  deleteStorage: vi.fn(),
}));

vi.mock("@ui/store/aiStore", () => ({
  useAIStore: { getState: () => ({ clearAllSummaries: vi.fn() }) },
}));

vi.mock("@ui/store/workflowStore", () => ({
  useWorkflowStore: { getState: () => ({ getState: () => "open" }) },
}));

vi.mock("./cloudProvider", () => ({
  cloudSummarize: vi.fn(),
  supportsVision: vi.fn(() => false),
  CloudAIError: class CloudAIError extends Error {},
  formatModelName: (name: string) => name,
}));

vi.mock("./imageProcessor", () => ({
  processThreadImages: vi.fn(async () => ({ images: [] })),
}));

vi.mock("@ui/components/common/Toast", () => ({
  showToast: vi.fn(),
}));

describe("getCachedSummary", () => {
  beforeEach(() => {
    getStorageMock.mockReset();
  });

  it("returns null for cached summaries with invalid provider", async () => {
    getStorageMock.mockResolvedValueOnce({
      summary: "stale",
      provider: "not-a-provider",
      tasks: [],
    });

    const result = await getCachedSummary("thread-1", "2026-01-01T00:00:00.000Z");
    expect(result).toBeNull();
    expect(getStorageMock).toHaveBeenCalledTimes(1);
    expect(getStorageMock).toHaveBeenCalledWith(
      "summary:thread-1:2026-01-01T00:00:00.000Z",
    );
  });

  it("rehydrates persisted task statuses when summary cache is loaded", async () => {
    const cached: SummaryResult = {
      summary: "Do the thing",
      generatedAt: "2026-01-01T00:00:00.000Z",
      threadLastUpdatedAt: "2026-01-01T00:00:00.000Z",
      provider: "anthropic",
      modelName: "claude",
      tasks: [
        {
          id: "task_1",
          threadId: "thread-1",
          description: "A",
          assignee: null,
          status: "pending",
          sourceCommentId: "thread-1",
          detectedPattern: "cloud_ai",
          type: "general",
        },
        {
          id: "task_2",
          threadId: "thread-1",
          description: "B",
          assignee: null,
          status: "pending",
          sourceCommentId: "thread-1",
          detectedPattern: "cloud_ai",
          type: "general",
        },
      ],
    };

    getStorageMock
      .mockResolvedValueOnce(cached)
      .mockResolvedValueOnce("done")
      .mockResolvedValueOnce(null);

    const result = await getCachedSummary("thread-1", "2026-01-01T00:00:00.000Z");

    expect(result).not.toBeNull();
    expect(result?.tasks[0].status).toBe("done");
    expect(result?.tasks[1].status).toBe("pending");
    expect(getStorageMock).toHaveBeenNthCalledWith(
      1,
      "summary:thread-1:2026-01-01T00:00:00.000Z",
    );
    expect(getStorageMock).toHaveBeenNthCalledWith(2, "taskStatus:task_1");
    expect(getStorageMock).toHaveBeenNthCalledWith(3, "taskStatus:task_2");
  });
});
