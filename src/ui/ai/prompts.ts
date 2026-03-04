import type {
  CommentThread,
  Task,
  SummaryResult,
  AIProvider,
} from "@shared/types";

export const SYSTEM_PROMPT = `You are an assistant that analyzes Figma design comment threads.
For each thread, provide:

1. SUMMARY: A 2-4 sentence summary capturing the core feedback,
   current state, decisions made, and key discussion points.
   Write in present tense. Be specific about design elements
   mentioned. If images are attached, describe the relevant
   visual content and how it relates to the feedback.

2. TASKS: Extract any action items, requests, or assignments.
   For each task, provide:
   - description: What needs to be done
   - assignee: The @mentioned person, or "Unassigned" if none
   - type: One of [revision, approval, blocker, question, general]

Respond in JSON format:
{
  "summary": "...",
  "tasks": [
    { "description": "...", "assignee": "...", "type": "..." }
  ]
}

If no tasks are found, return an empty tasks array.
Do not invent tasks that aren't clearly implied by the conversation.`;

const MAX_CHARS = 16000;

export function formatThreadForPrompt(thread: CommentThread): string {
  const lines: string[] = [];
  lines.push(`Thread started by @${thread.author.handle}:`);
  lines.push(`@${thread.author.handle}: ${thread.message}`);

  for (const reply of thread.replies) {
    lines.push(`@${reply.author.handle}: ${reply.message}`);
  }

  let text = lines.join("\n");
  if (text.length > MAX_CHARS) {
    text = text.slice(0, MAX_CHARS) + "\n[...thread truncated due to length]";
  }
  return text;
}

interface RawAITask {
  description?: string;
  assignee?: string;
  type?: string;
}

interface RawAIResponse {
  summary?: string;
  tasks?: RawAITask[];
}

const VALID_TASK_TYPES = new Set([
  "revision",
  "approval",
  "blocker",
  "question",
  "general",
]);

function normalizeAssignee(assignee?: string): string | null {
  if (!assignee) return null;
  const cleaned = assignee.trim().replace(/^@+/, "");
  if (!cleaned || cleaned.toLowerCase() === "unassigned") {
    return null;
  }
  return cleaned;
}
function extractJSON(text: string): RawAIResponse | null {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      /* fall through */
    }
  }

  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      return JSON.parse(braceMatch[0]);
    } catch {
      /* fall through */
    }
  }

  // Handle truncated JSON where closing braces/backticks are missing
  const summaryMatch = text.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (summaryMatch) {
    const summary = summaryMatch[1].replace(/\\"/g, '"').replace(/\\n/g, "\n");
    return { summary };
  }

  return null;
}

function cleanSummaryText(text: string): string {
  let cleaned = text;
  cleaned = cleaned.replace(/```(?:json)?/g, "").replace(/```/g, "");
  cleaned = cleaned.replace(/^\s*\{\s*"summary"\s*:\s*"?/i, "");
  cleaned = cleaned.replace(/"?\s*,?\s*"tasks"\s*:[\s\S]*$/i, "");
  cleaned = cleaned.replace(/\\"/g, '"').replace(/\\n/g, "\n");
  cleaned = cleaned.replace(/"\s*\}\s*$/, "");
  return cleaned.trim();
}

export function parseAIResponse(
  raw: string,
  threadId: string,
  thread: CommentThread,
  provider: AIProvider,
  modelName: string,
): SummaryResult {
  const parsed = extractJSON(raw);

  if (!parsed || !parsed.summary) {
    const fallback =
      cleanSummaryText(raw) ||
      "Summary could not be generated. Please try again.";

    return {
      summary: fallback,
      tasks: [],
      generatedAt: new Date().toISOString(),
      threadLastUpdatedAt: thread.lastUpdatedAt,
      provider,
      modelName,
    };
  }

  const tasks: Task[] = (parsed.tasks ?? [])
    .filter((t): t is RawAITask => !!t?.description)
    .map((t, i) => ({
      id: `task_${threadId}_${i}`,
      threadId,
      description: t.description!,
      assignee: normalizeAssignee(t.assignee),
      status: "pending" as const,
      sourceCommentId: threadId,
      detectedPattern: "cloud_ai",
      type: VALID_TASK_TYPES.has(t.type ?? "")
        ? (t.type as Task["type"])
        : "general",
    }));

  return {
    summary: parsed.summary,
    tasks,
    generatedAt: new Date().toISOString(),
    threadLastUpdatedAt: thread.lastUpdatedAt,
    provider,
    modelName,
  };
}
