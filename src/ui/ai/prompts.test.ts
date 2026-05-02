import { describe, expect, it } from "vitest";
import type { CommentThread } from "@shared/types";
import {
  SUMMARY_WORD_LIMIT_DEFAULT,
  SUMMARY_WORD_LIMIT_MAX,
} from "@shared/types";
import { buildSystemPrompt, parseAIResponse } from "./prompts";

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

function countSummaryWords(summary: string): number {
  return summary
    .replace(/^[-*•]\s+/gm, "")
    .split(/\s+/)
    .filter(Boolean).length;
}

describe("parseAIResponse", () => {
  it("parses valid JSON and normalizes tasks", () => {
    const raw = JSON.stringify({
      summary: "Adjust spacing in header and confirm with design lead.",
      tasks: [
        { description: "Update spacing scale", assignee: "@bob", type: "revision" },
        { description: "Get sign-off", assignee: "Unassigned", type: "unknown" },
      ],
    });

    const result = parseAIResponse(
      raw,
      thread.id,
      thread,
      "anthropic",
      "claude",
      SUMMARY_WORD_LIMIT_DEFAULT,
    );

    expect(result.summary).toContain("Adjust spacing");
    expect(result.summary.startsWith("- ")).toBe(true);
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
    const result = parseAIResponse(
      raw,
      thread.id,
      thread,
      "openai",
      "gpt",
      SUMMARY_WORD_LIMIT_DEFAULT,
    );

    expect(result.summary).toContain("Partial summary");
    expect(result.summary.startsWith("- ")).toBe(true);
    expect(result.tasks).toEqual([]);
  });

  it("normalizes plain summary text into bullet lines", () => {
    const raw = JSON.stringify({
      summary: "First point. Second point. Third point.",
      tasks: [],
    });

    const result = parseAIResponse(
      raw,
      thread.id,
      thread,
      "openai",
      "gpt",
      SUMMARY_WORD_LIMIT_DEFAULT,
    );
    const lines = result.summary.split("\n");
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.every((line) => line.startsWith("- "))).toBe(true);
  });

  it("splits chained inline bullet segments into separate bullet lines", () => {
    const raw = JSON.stringify({
      summary:
        "- Akshay identifies missing Audit Trail designs. - Reshma requests that changes be captured. - Sarwesh asks for context across workloads.",
      tasks: [],
    });

    const result = parseAIResponse(
      raw,
      thread.id,
      thread,
      "openai",
      "gpt",
      SUMMARY_WORD_LIMIT_DEFAULT,
    );
    const lines = result.summary.split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain("Akshay identifies");
    expect(lines[1]).toContain("Reshma requests");
    expect(lines[2]).toContain("Sarwesh asks");
    expect(lines.every((line) => line.startsWith("- "))).toBe(true);
  });

  it("truncates summary to configured word limit", () => {
    const words = Array.from({ length: 130 }, (_, i) => `w${i + 1}`);
    const raw = JSON.stringify({
      summary: words.join(" "),
      tasks: [],
    });

    const result = parseAIResponse(raw, thread.id, thread, "openai", "gpt", 100);
    expect(countSummaryWords(result.summary)).toBeLessThanOrEqual(100);
    expect(result.summary.endsWith("...")).toBe(true);
  });

  it("allows a small overage to avoid clipping coherent summary output", () => {
    const words = Array.from({ length: 105 }, (_, i) => `w${i + 1}`);
    const raw = JSON.stringify({
      summary: words.join(" "),
      tasks: [],
    });

    const result = parseAIResponse(raw, thread.id, thread, "openai", "gpt", 100);
    expect(countSummaryWords(result.summary)).toBe(105);
    expect(result.summary.endsWith("...")).toBe(false);
  });
});

describe("buildSystemPrompt", () => {
  it("includes configured summary word limit instruction", () => {
    const prompt = buildSystemPrompt(SUMMARY_WORD_LIMIT_MAX);
    expect(prompt).toContain(
      `Keep the summary at or below ${SUMMARY_WORD_LIMIT_MAX} words.`,
    );
    expect(prompt).toContain("A concise 2-4 bullet summary");
    expect(prompt).toContain("Put each bullet on its own line.");
  });
});
