import { describe, expect, it } from "vitest";
import type { CommentThread } from "@shared/types";
import { parseAIResponse } from "./prompts";

const thread: CommentThread = {
  id: "thread-1",
  fileKey: "FILE123",
  orderNumber: 1,
  author: { id: "u1", handle: "alice", img_url: "" },
  message: "Initial",
  createdAt: "2026-01-01T09:00:00.000Z",
  resolvedAt: null,
  status: "open",
  replies: [],
  replyCount: 0,
  participants: [{ id: "u1", handle: "alice", img_url: "" }],
  clientMeta: null,
  mentions: [],
  lastUpdatedAt: "2026-01-01T09:00:00.000Z",
};

describe("parseAIResponse", () => {
  it("parses valid JSON and normalizes tasks", () => {
    const raw = JSON.stringify({
      summary: "Adjust spacing in header and confirm with design lead.",
      tasks: [
        { description: "Update spacing scale", assignee: "@bob", type: "revision" },
        { description: "Get sign-off", assignee: "Unassigned", type: "unknown" },
      ],
    });

    const result = parseAIResponse(raw, thread.id, thread, "anthropic", "claude");

    expect(result.summary).toContain("Adjust spacing");
    expect(result.tasks).toHaveLength(2);
    expect(result.tasks[0]).toMatchObject({
      threadId: "thread-1",
      assignee: "bob",
      type: "revision",
      status: "pending",
    });
    expect(result.tasks[1]).toMatchObject({
      assignee: null,
      type: "general",
    });
  });

  it("falls back to extracted summary text when JSON is malformed", () => {
    const raw = '"summary": "Partial summary from truncated output';
    const result = parseAIResponse(raw, thread.id, thread, "openai", "gpt");

    expect(result.summary).toContain("Partial summary");
    expect(result.tasks).toEqual([]);
  });
});
