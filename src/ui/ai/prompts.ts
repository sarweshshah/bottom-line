import type {
  CommentThread,
  Task,
  SummaryResult,
  AIProvider,
  SummaryWordLimit,
} from "@shared/types";
import { normalizeAssignee } from "@ui/lib/assignee";

export function buildSystemPrompt(summaryWordLimit: SummaryWordLimit): string {
  return `You are an assistant that analyzes Figma design comment threads.
For each thread, provide:

1. TOPIC_HEADER (required): A short 5-10 word phrase naming the main topic
   of the discussion (e.g. "Header spacing and alignment feedback").
   Always include topicHeader in the JSON response. This field is separate
   from the summary and does not count toward the summary word limit.

2. SUMMARY: A concise 2-4 bullet summary capturing the core feedback,
   current state, decisions made, and key discussion points.
   Use "-" for each bullet and keep each bullet to one sentence.
   Put each bullet on its own line. Do not chain multiple bullets
   within a single line using inline " - " separators.
   Write in present tense. Be specific about design elements
   mentioned. If images are attached, describe the relevant
   visual content and how it relates to the feedback.
   Keep only the summary bullets at or below ${summaryWordLimit} words.
   Do not include the topic header in the summary word count.

3. TASKS: Extract any action items, requests, or assignments.
   For each task, provide:
   - description: What needs to be done
   - assignee: The @mentioned person, or "Unassigned" if none
   - type: One of [revision, approval, blocker, question, general]

Respond in JSON format:
{
  "topicHeader": "Header spacing and alignment feedback",
  "summary": "- Header spacing needs adjustment before handoff.\n- The team is waiting on design lead confirmation.",
  "tasks": [
    { "description": "Update the header spacing", "assignee": "maya", "type": "revision" }
  ]
}

If no tasks are found, return an empty tasks array.
Do not invent tasks that aren't clearly implied by the conversation.
Do not use placeholders such as "...", "[]", "{}", "null", or "N/A".`;
}

const MAX_CHARS = 16000;
const SUMMARY_SOFT_OVERAGE_WORDS = 10;

function countWords(text: string): number {
  return (text.match(/\S+/g) ?? []).length;
}

function truncateToWordLimit(text: string, limit: SummaryWordLimit): string {
  const normalized = text
    .trim()
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n");
  if (!normalized) return normalized;

  const words = normalized.match(/\S+/g) ?? [];
  if (words.length <= limit + SUMMARY_SOFT_OVERAGE_WORDS) return normalized;

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const isBulleted =
    lines.length > 0 && lines.every((line) => /^[-*•]\s+/.test(line));

  if (isBulleted) {
    const keptLines: string[] = [];
    let runningWords = 0;
    for (const line of lines) {
      const lineWords = countWords(line);
      if (keptLines.length > 0 && runningWords + lineWords > limit) break;
      keptLines.push(line);
      runningWords += lineWords;
    }
    if (keptLines.length > 0) {
      if (keptLines.length < lines.length) {
        const lastIndex = keptLines.length - 1;
        keptLines[lastIndex] = `${keptLines[lastIndex].replace(/\.\.\.$/, "")} ...`;
      }
      return keptLines.join("\n");
    }
  }

  const sentences = normalized.split(/(?<=[.!?])\s+/).filter(Boolean);
  const keptSentences: string[] = [];
  let runningWords = 0;
  for (const sentence of sentences) {
    const sentenceWordCount = countWords(sentence);
    if (runningWords + sentenceWordCount > limit) break;
    keptSentences.push(sentence);
    runningWords += sentenceWordCount;
  }

  if (keptSentences.length > 0) {
    return `${keptSentences.join(" ")}...`;
  }

  return `${words.slice(0, limit).join(" ")}...`;
}

function toBulletedLines(segments: string[]): string {
  return segments
    .map((segment) => segment.trim())
    .filter(isMeaningfulText)
    .map((segment) => `- ${segment}`)
    .join("\n");
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
    return toBulletedLines(expandedBullets);
  }

  if (lines.length > 1) {
    const bulletCount = Math.min(4, lines.length);
    const segments = lines.slice(0, bulletCount).map((line) =>
      line.replace(/^[-*•]\s+/, "").trim(),
    );
    return toBulletedLines(segments);
  }

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length === 0) {
    return toBulletedLines([text.trim()]);
  }

  const bulletCount = Math.min(4, sentences.length);
  return toBulletedLines(sentences.slice(0, bulletCount));
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
  topicHeader?: string;
  summary?: string;
  tasks?: RawAITask[];
}

const TOPIC_HEADER_MIN_WORDS = 5;
const TOPIC_HEADER_MAX_WORDS = 10;

function normalizeTopicHeader(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const words = value.trim().replace(/\s+/g, " ").split(" ").filter(Boolean);
  if (words.length === 0) return undefined;
  if (!isMeaningfulText(words.join(" "))) return undefined;
  if (words.length < TOPIC_HEADER_MIN_WORDS) return words.join(" ");
  return words.slice(0, TOPIC_HEADER_MAX_WORDS).join(" ");
}

function stripMentions(text: string): string {
  return text.replace(/@[\w.-]+/g, "").replace(/\s+/g, " ").trim();
}

function deriveTopicHeaderFallback(
  thread: CommentThread,
  summary?: string,
): string {
  const fromMessage = stripMentions(thread.message);
  if (fromMessage) {
    const words = fromMessage.split(" ").filter(Boolean);
    if (words.length > 0) {
      return words.slice(0, TOPIC_HEADER_MAX_WORDS).join(" ");
    }
  }

  if (summary) {
    const firstLine = summary
      .split("\n")
      .map((line) => line.trim())
      .find(Boolean);
    if (firstLine) {
      const cleaned = firstLine.replace(/^[-*•]\s+/, "").trim();
      const words = cleaned.split(/\s+/).filter(Boolean);
      if (words.length > 0) {
        return words.slice(0, TOPIC_HEADER_MAX_WORDS).join(" ");
      }
    }
  }

  return "Design feedback discussion thread";
}

function resolveTopicHeader(
  value: unknown,
  thread: CommentThread,
  summary: string,
): string {
  return (
    normalizeTopicHeader(value) ?? deriveTopicHeaderFallback(thread, summary)
  );
}

export function ensureTopicHeader(
  result: SummaryResult,
  thread: CommentThread,
): SummaryResult {
  return {
    ...result,
    topicHeader: resolveTopicHeader(result.topicHeader, thread, result.summary),
  };
}

function extractTopicHeaderFromText(text: string): string | undefined {
  const match = text.match(/"topicHeader"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (!match) return undefined;
  return match[1].replace(/\\"/g, '"').replace(/\\n/g, "\n");
}

const VALID_TASK_TYPES = new Set([
  "revision",
  "approval",
  "blocker",
  "question",
  "general",
]);

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
  const topicHeader = extractTopicHeaderFromText(text);
  const summaryMatch = text.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (summaryMatch) {
    const summary = summaryMatch[1].replace(/\\"/g, '"').replace(/\\n/g, "\n");
    return { ...(topicHeader ? { topicHeader } : {}), summary };
  }

  const unclosedSummaryMatch = text.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*)/);
  if (unclosedSummaryMatch?.[1]) {
    const summary = unclosedSummaryMatch[1]
      .replace(/\\"/g, '"')
      .replace(/\\n/g, "\n");
    return { ...(topicHeader ? { topicHeader } : {}), summary };
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

function isMeaningfulText(text: string): boolean {
  const normalized = text
    .trim()
    .replace(/^[-*•]\s+/gm, "")
    .replace(/[()[\]{}"'`.,;:!?…\s\\/_|-]+/g, "")
    .toLowerCase();

  if (!normalized) return false;
  return !new Set(["null", "undefined", "na", "none", "empty"]).has(
    normalized,
  );
}

function normalizeSummaryValue(value: unknown): string | null {
  if (typeof value === "string") {
    const cleaned = cleanSummaryText(value);
    return isMeaningfulText(cleaned) ? cleaned : null;
  }

  if (Array.isArray(value)) {
    const lines = value
      .map((item) => cleanSummaryText(String(item)))
      .filter(isMeaningfulText);
    return lines.length > 0 ? lines.join("\n") : null;
  }

  return null;
}

function fallbackSummaryFromRaw(raw: string): string {
  const cleaned = cleanSummaryText(raw);
  return isMeaningfulText(cleaned)
    ? cleaned
    : "Summary could not be generated. Please try again.";
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

  const summary = normalizeSummaryValue(parsed?.summary);

  if (!summary) {
    const fallback = parsed
      ? "Summary could not be generated. Please try again."
      : fallbackSummaryFromRaw(raw);

    const summaryText = ensureBulletedSummary(
      truncateToWordLimit(fallback, summaryWordLimit),
    );

    return {
      topicHeader: resolveTopicHeader(parsed?.topicHeader, thread, summaryText),
      summary: summaryText,
      tasks: [],
      generatedAt: new Date().toISOString(),
      threadLastUpdatedAt: thread.lastUpdatedAt,
      provider,
      modelName,
    };
  }

  const summaryText = ensureBulletedSummary(
    truncateToWordLimit(summary, summaryWordLimit),
  );
  const topicHeader = resolveTopicHeader(parsed?.topicHeader, thread, summaryText);

  const rawTasks = Array.isArray(parsed?.tasks) ? parsed.tasks : [];
  const tasks: Task[] = rawTasks
    .filter(
      (t): t is RawAITask =>
        !!t?.description && typeof t.description === "string",
    )
    .map((t, i) => ({
      id: `task_${threadId}_${i}`,
      threadId,
      description: t.description!,
      assignee: normalizeAssignee(
        typeof t.assignee === "string" ? t.assignee : undefined,
        { rejectUnassigned: true },
      ),
      status: "pending" as const,
      sourceCommentId: threadId,
      detectedPattern: "cloud_ai",
      type: VALID_TASK_TYPES.has(t.type ?? "")
        ? (t.type as Task["type"])
        : "general",
    }));

  return {
    topicHeader,
    summary: summaryText,
    tasks,
    generatedAt: new Date().toISOString(),
    threadLastUpdatedAt: thread.lastUpdatedAt,
    provider,
    modelName,
  };
}
