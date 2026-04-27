import type {
  CommentThread,
  Task,
  SummaryResult,
  AIProvider,
  SummaryWordLimit,
} from "@shared/types";

export function buildSystemPrompt(summaryWordLimit: SummaryWordLimit): string {
  return `You are an assistant that analyzes Figma design comment threads.
For each thread, provide:

1. SUMMARY: A concise 2-4 bullet summary capturing the core feedback,
   current state, decisions made, and key discussion points.
   Use "-" for each bullet and keep each bullet to one sentence.
   Put each bullet on its own line. Do not chain multiple bullets
   within a single line using inline " - " separators.
   Write in present tense. Be specific about design elements
   mentioned. If images are attached, describe the relevant
   visual content and how it relates to the feedback.
   Keep the summary at or below ${summaryWordLimit} words.

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
}

const MAX_CHARS = 16000;
const SUMMARY_SOFT_OVERAGE_WORDS = 10;

function truncateToWordLimit(text: string, limit: SummaryWordLimit): string {
  const normalized = text
    .trim()
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n");
  if (!normalized) return normalized;

  const words = normalized.match(/\S+/g) ?? [];
  if (words.length <= limit + SUMMARY_SOFT_OVERAGE_WORDS) return normalized;

  const sentences = normalized.split(/(?<=[.!?])\s+/).filter(Boolean);
  const keptSentences: string[] = [];
  let runningWords = 0;
  for (const sentence of sentences) {
    const sentenceWordCount = (sentence.match(/\S+/g) ?? []).length;
    if (runningWords + sentenceWordCount > limit) break;
    keptSentences.push(sentence);
    runningWords += sentenceWordCount;
  }

  if (keptSentences.length > 0) {
    return `${keptSentences.join(" ")}...`;
  }

  return `${words.slice(0, limit).join(" ")}...`;
}

function ensureBulletedSummary(text: string): string {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return text;

  if (lines.every((line) => /^[-*•]\s+/.test(line))) {
    const expandedBullets = lines.flatMap((line) => {
      const cleaned = line.replace(/^[-*•]\s+/, "").trim();
      return cleaned
        .split(/\s[-*•]\s+/)
        .map((segment) => segment.trim())
        .filter(Boolean);
    });
    return expandedBullets.map((line) => `- ${line}`).join("\n");
  }

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length === 0) {
    return `- ${text.trim()}`;
  }

  const bulletCount = Math.min(4, sentences.length);
  return sentences
    .slice(0, bulletCount)
    .map((sentence) => `- ${sentence}`)
    .join("\n");
}

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
  summaryWordLimit: SummaryWordLimit,
): SummaryResult {
  const parsed = extractJSON(raw);

  if (!parsed || !parsed.summary) {
    const fallback =
      cleanSummaryText(raw) ||
      "Summary could not be generated. Please try again.";

    return {
      summary: ensureBulletedSummary(
        truncateToWordLimit(fallback, summaryWordLimit),
      ),
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
    summary: ensureBulletedSummary(
      truncateToWordLimit(parsed.summary, summaryWordLimit),
    ),
    tasks,
    generatedAt: new Date().toISOString(),
    threadLastUpdatedAt: thread.lastUpdatedAt,
    provider,
    modelName,
  };
}
