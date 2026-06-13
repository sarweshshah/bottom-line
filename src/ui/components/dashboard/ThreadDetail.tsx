import { useState, useCallback, useRef, useEffect } from "react";
import {
  ArrowLeft,
  User,
  Crosshair,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckSquare,
  Square,
  X,
  Circle,
  CheckCircle2,
} from "lucide-react";
import type { CommentThread, WorkflowState } from "@shared/types";
import { StatusBadge } from "@ui/components/common/StatusBadge";
import { AvatarGroup } from "@ui/components/common/AvatarGroup";
import {
  TASK_TYPE_LABELS,
  TASK_TYPE_COLORS,
} from "@ui/components/common/taskTypeConfig";
import { showToast } from "@ui/components/common/Toast";
import { timeAgo } from "@ui/lib/timeAgo";
import { renderMentions } from "@ui/lib/renderMentions";
import { useNavigateToComment } from "@ui/lib/useNavigateToComment";
import { useAuthStore } from "@ui/store/authStore";
import { useAIStore } from "@ui/store/aiStore";
import { useWorkflowStore } from "@ui/store/workflowStore";
import {
  summarizeThread,
  clearCachedSummary,
  isTooShort,
} from "@ui/ai/summarize";
import { PROVIDER_MODEL_LABELS, formatModelName } from "@ui/ai/cloudProvider";

const WORKFLOW_STATE_CONFIG: Record<
  WorkflowState,
  { label: string; Icon: typeof Circle }
> = {
  open: { label: "Open", Icon: Circle },
  resolved: { label: "Resolved", Icon: CheckCircle2 },
};

const STATE_ORDER: WorkflowState[] = ["open", "resolved"];

const SUMMARY_SECTION_CLASS =
  "pl-4 pr-3.5 pt-3 pb-4 border-b border-figma-border";

function ExpandChevron({ expanded }: { expanded: boolean }) {
  return expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />;
}

interface ThreadDetailProps {
  thread: CommentThread;
  onBack: () => void;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StateSelector({ thread }: { thread: CommentThread }) {
  const workflowState = useWorkflowStore((s) => s.getState(thread.id));
  const setWorkflowState = useWorkflowStore((s) => s.setState);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick, { passive: true });
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (state: WorkflowState) => {
    setOpen(false);
    if (state === workflowState) return;
    setWorkflowState(thread.id, state);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 cursor-pointer"
      >
        <StatusBadge status={workflowState} />
        <ChevronDown size={10} className="text-figma-text-tertiary" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-figma-bg border border-figma-border rounded-lg shadow-lg z-30 min-w-[160px]">
          {STATE_ORDER.map((state) => {
            const cfg = WORKFLOW_STATE_CONFIG[state];
            const Icon = cfg.Icon;
            const isActive = workflowState === state;
            return (
              <button
                key={state}
                type="button"
                onClick={() => handleSelect(state)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-figma-bg-hover transition-colors ${
                  isActive
                    ? "text-accent font-medium"
                    : "text-figma-text-secondary"
                }`}
              >
                <Icon size={12} />
                {cfg.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Comment thread layout: w-6 avatar; trunk/corner align to avatar center (12px). */
const ELBOW_TRUNK_LEFT = "left-3";
const ELBOW_CORNER_TOP = "top-0";
const REPLY_THREAD_INDENT = "pl-7";

function CommentBubble({
  author,
  message,
  createdAt,
}: {
  author: { handle: string; img_url: string };
  message: string;
  createdAt: string;
}) {
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const showImage = Boolean(author.img_url) && !avatarLoadFailed;

  return (
    <div className="flex gap-2">
      <div className="shrink-0 w-6 h-6 rounded-full bg-figma-bg-tertiary overflow-hidden flex items-center justify-center ring-1 ring-figma-border">
        {showImage ? (
          <img
            src={author.img_url}
            alt={author.handle}
            className="w-full h-full object-cover"
            onError={() => setAvatarLoadFailed(true)}
          />
        ) : (
          <User size={12} className="text-figma-icon-tertiary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-sm font-medium text-figma-text">
            {author.handle}
          </span>
          <span className="text-[10px] text-figma-text-tertiary">
            {timeAgo(createdAt)}
          </span>
        </div>
        <p className="text-[11px] text-figma-text-secondary leading-relaxed whitespace-pre-wrap break-words">
          {renderMentions(message)}
        </p>
      </div>
    </div>
  );
}

function normalizeAssignee(assignee: string | null): string | null {
  if (!assignee) return null;
  const cleaned = assignee.trim().replace(/^@+/, "");
  return cleaned || null;
}

function parseSummaryBullets(summary: string): string[] | null {
  const lines = summary
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;
  if (!lines.every((line) => /^[-*•]\s+/.test(line))) return null;
  return lines.map((line) => line.replace(/^[-*•]\s+/, "").trim());
}

function SummarySection({ thread }: { thread: CommentThread }) {
  const threadState = useAIStore((s) => s.threadSummaries.get(thread.id));
  const setThreadLoading = useAIStore((s) => s.setThreadLoading);
  const setThreadResult = useAIStore((s) => s.setThreadResult);
  const setThreadError = useAIStore((s) => s.setThreadError);
  const clearThreadSummary = useAIStore((s) => s.clearThreadSummary);
  const needsConsent = useAIStore((s) => s.needsConsent);
  const provider = useAIStore((s) => s.provider);
  const customModelName = useAIStore((s) => s.customConfig.modelName);
  const [expanded, setExpanded] = useState(true);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const tooShort = isTooShort(thread);
  const isLoading = threadState?.isLoading ?? false;
  const result = threadState?.result ?? null;
  const error = threadState?.error ?? null;

  const isOutdated =
    result && result.threadLastUpdatedAt !== thread.lastUpdatedAt;

  const handleSummarize = useCallback(
    async (skipCache = false) => {
      if (needsConsent()) {
        const event = new CustomEvent("show-ai-consent", {
          detail: { onConsent: () => handleSummarize(skipCache) },
        });
        window.dispatchEvent(event);
        return;
      }

      if (skipCache) {
        await clearCachedSummary(thread.id, thread.lastUpdatedAt);
      }

      setThreadLoading(thread.id);
      try {
        const summaryResult = await summarizeThread(thread, skipCache);
        setThreadResult(thread.id, summaryResult);
      } catch (err) {
        setThreadError(
          thread.id,
          err instanceof Error ? err.message : "Summary generation failed",
        );
      }
    },
    [thread, setThreadLoading, setThreadResult, setThreadError, needsConsent],
  );

  const handleCopySummary = useCallback(async () => {
    if (!result?.summary) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(result.summary);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = result.summary;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedSummary(true);
      showToast("Summary copied", "success");
      window.setTimeout(() => setCopiedSummary(false), 1500);
    } catch {
      showToast("Could not copy summary", "error");
    }
  }, [result?.summary]);

  if (tooShort) {
    return (
      <div className={SUMMARY_SECTION_CLASS}>
        <div className="flex items-center gap-1.5 text-xs text-figma-text-secondary">
          <Sparkles size={12} />
          Thread too short to summarize (fewer than 3 comments).
        </div>
      </div>
    );
  }

  return (
    <div className={SUMMARY_SECTION_CLASS}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs font-medium text-figma-text"
        >
          <ExpandChevron expanded={expanded} />
          <Sparkles size={12} />
          AI Summary
        </button>
        {result && expanded && (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={handleCopySummary}
              className="p-1 rounded-lg text-figma-icon-tertiary hover:bg-figma-bg-secondary hover:text-figma-icon transition-colors"
              data-tooltip={copiedSummary ? "Copied" : "Copy summary"}
              data-tooltip-align="right"
              data-tooltip-pos="bottom"
            >
              {copiedSummary ? <Check size={12} /> : <Copy size={12} />}
            </button>
            <button
              type="button"
              onClick={() => handleSummarize(true)}
              disabled={isLoading}
              className="p-1 rounded-lg text-figma-icon-tertiary hover:bg-figma-bg-secondary hover:text-figma-icon transition-colors"
              data-tooltip="Regenerate summary"
              data-tooltip-align="right"
              data-tooltip-pos="bottom"
            >
              <RefreshCw
                size={12}
                className={isLoading ? "animate-spin" : ""}
              />
            </button>
            <button
              type="button"
              onClick={() => {
                clearCachedSummary(thread.id, thread.lastUpdatedAt);
                clearThreadSummary(thread.id);
              }}
              className="p-1 rounded-lg text-figma-icon-tertiary hover:bg-danger-bg hover:text-danger transition-colors"
              data-tooltip="Clear summary"
              data-tooltip-align="right"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="mt-2">
          {!result && !isLoading && !error && (
            <button
              type="button"
              onClick={() => handleSummarize()}
              disabled={isLoading}
              className="summarize-cta-button flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-ai-shimmer-cta bg-ai-shimmer-static text-figma-text border border-figma-border-strong/80 overflow-hidden hover:brightness-[0.96] active:brightness-[0.92] transition-[filter] duration-150"
            >
              <span className="inline-flex min-w-0 flex-wrap items-baseline gap-x-1 gap-y-0.5">
                <span>Summarize ({thread.replyCount + 1} comments)</span>
                <span className="text-figma-text-secondary whitespace-nowrap">
                  via{" "}
                  {provider === "custom"
                    ? customModelName || "custom"
                    : (PROVIDER_MODEL_LABELS[provider] ?? provider)}
                </span>
              </span>
            </button>
          )}

          {isLoading && (
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-ai-shimmer overflow-hidden" />
              <div className="h-3 w-4/5 rounded bg-ai-shimmer overflow-hidden" />
              <div className="h-3 w-3/5 rounded bg-ai-shimmer overflow-hidden" />
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-danger-bg border border-danger-border">
              <AlertCircle size={14} className="text-danger shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 flex flex-col">
                <p className="text-xs text-danger leading-relaxed">{error}</p>
                <button
                  type="button"
                  onClick={() => handleSummarize()}
                  className="mt-1 text-xs font-medium text-danger underline hover:opacity-80 transition-colors self-start"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {result && (
            <div>
              {isOutdated && (
                <button
                  type="button"
                  onClick={() => handleSummarize(true)}
                  className="flex items-center gap-1.5 text-xs text-warning mb-2 hover:opacity-80"
                >
                  <RefreshCw size={11} className="text-warning" />
                  Summary outdated — regenerate?
                </button>
              )}
              {(() => {
                const bullets = parseSummaryBullets(result.summary);
                if (bullets) {
                  return (
                    <ul className="list-disc pl-4 space-y-1 text-[11px] text-figma-text leading-relaxed">
                      {bullets.map((bullet, index) => (
                        <li key={`${index}-${bullet}`}>{bullet}</li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p className="text-[11px] text-figma-text leading-relaxed whitespace-pre-line">
                    {result.summary}
                  </p>
                );
              })()}
              <span className="text-[10px] text-figma-text-disabled mt-1.5 block">
                Generated by{" "}
                {formatModelName(result.modelName ?? result.provider)} &middot;{" "}
                {timeAgo(result.generatedAt)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TasksSection({ thread }: { thread: CommentThread }) {
  const threadState = useAIStore((s) => s.threadSummaries.get(thread.id));
  const updateTaskStatus = useAIStore((s) => s.updateTaskStatus);
  const [expanded, setExpanded] = useState(true);

  const result = threadState?.result ?? null;
  if (!result) return null;

  const tasks = result.tasks;
  const doneCount = tasks.filter((t) => t.status === "done").length;

  return (
    <div className="px-4 py-3 border-b border-figma-border">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs font-medium text-figma-text"
      >
        <ExpandChevron expanded={expanded} />
        Tasks ({doneCount}/{tasks.length})
      </button>

      {expanded && (
        <div className="mt-2">
          {tasks.length === 0 ? (
            <p className="text-[11px] text-figma-text-secondary">
              No tasks detected.
            </p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => {
                const assignee = normalizeAssignee(task.assignee);
                return (
                  <div key={task.id} className="flex items-start gap-2 group">
                    <button
                      type="button"
                      onClick={() =>
                        updateTaskStatus(
                          task.id,
                          task.status === "done" ? "pending" : "done",
                        )
                      }
                      className="shrink-0 mt-0.5 text-figma-icon-secondary hover:text-figma-icon transition-colors"
                    >
                      {task.status === "done" ? (
                        <CheckSquare
                          size={14}
                          className="text-status-resolved"
                        />
                      ) : (
                        <Square size={14} />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-[11px] leading-relaxed ${
                          task.status === "done"
                            ? "text-figma-text-disabled line-through"
                            : "text-figma-text"
                        }`}
                      >
                        {task.description}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {assignee && (
                          <span className="text-[10px] text-figma-text-secondary">
                            {assignee}
                          </span>
                        )}
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${TASK_TYPE_COLORS[task.type]}`}
                        >
                          {TASK_TYPE_LABELS[task.type]}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ThreadDetail({ thread, onBack }: ThreadDetailProps) {
  const [threadExpanded, setThreadExpanded] = useState(true);
  const { showThreadElbows } = useAuthStore();
  const { navigating, navigate: handleNavigate } = useNavigateToComment(
    thread.clientMeta,
    thread.id,
  );

  return (
    <div className="flex flex-col h-full bg-figma-bg">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-figma-border">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-lg text-figma-icon-secondary hover:bg-figma-bg-secondary hover:text-figma-icon transition-colors"
        >
          <ArrowLeft size={15} />
        </button>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-figma-text-secondary truncate block">
            Thread #{thread.orderNumber ?? thread.id.slice(0, 8)}
          </span>
        </div>
        <StateSelector thread={thread} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Meta */}
        <div className="px-4 py-3 border-b border-figma-border">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-figma-text-secondary">
              {formatDate(thread.createdAt)}
            </span>
            <span className="text-xs text-figma-text-disabled">&middot;</span>
            <span className="text-xs text-figma-text-secondary">
              Started by {thread.author.handle}
            </span>
          </div>
          <AvatarGroup users={thread.participants} max={8} size={30} />
        </div>

        {/* AI Summary */}
        <SummarySection thread={thread} />

        {/* Extracted Tasks */}
        <TasksSection thread={thread} />

        {/* Full comment thread */}
        <div className="px-4 py-3">
          <button
            type="button"
            onClick={() => setThreadExpanded(!threadExpanded)}
            className="flex items-center gap-1.5 text-xs font-medium text-figma-text mb-3"
          >
            <ExpandChevron expanded={threadExpanded} />
            Comments ({thread.replyCount + 1})
          </button>

          {threadExpanded && (
            <div>
              {/* Root comment — pb-3 keeps the gap INSIDE the element so the trunk
                  reaches bottom-0 without negative offsets */}
              <div
                className={`relative ${thread.replies.length > 0 ? "pb-3" : ""}`}
              >
                {showThreadElbows && thread.replies.length > 0 && (
                  <span
                    aria-hidden
                    className={`pointer-events-none absolute ${ELBOW_TRUNK_LEFT} top-6 bottom-0 border-l-[1.5px] border-elbow`}
                  />
                )}
                <CommentBubble
                  author={thread.author}
                  message={thread.message}
                  createdAt={thread.createdAt}
                />
              </div>
              {thread.replies.length > 0 && (
                <div className="mb-3">
                  {thread.replies.map((reply, index) => {
                    const isLast = index === thread.replies.length - 1;
                    return (
                      <div
                        key={reply.id}
                        className={`relative ${REPLY_THREAD_INDENT} ${!isLast ? "pb-3" : ""}`}
                      >
                        {showThreadElbows && (
                          <>
                            <span
                              aria-hidden
                              className={`pointer-events-none absolute ${ELBOW_TRUNK_LEFT} ${ELBOW_CORNER_TOP} h-3 w-4 rounded-bl-xl border-l-[1.5px] border-b-[1.5px] border-elbow`}
                            />
                            {!isLast && (
                              <span
                                aria-hidden
                                className={`pointer-events-none absolute ${ELBOW_TRUNK_LEFT} top-3 bottom-0 border-l-[1.5px] border-elbow`}
                              />
                            )}
                          </>
                        )}
                        <CommentBubble
                          author={reply.author}
                          message={reply.message}
                          createdAt={reply.createdAt}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions footer */}
      {thread.clientMeta && (
        <div className="px-4 py-3 border-t border-figma-border">
          <button
            type="button"
            onClick={handleNavigate}
            disabled={navigating}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium bg-accent-bg text-white hover:bg-accent-hover active:scale-[0.98] disabled:opacity-40 transition-all duration-150"
          >
            {navigating ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Crosshair size={13} />
            )}
            Navigate to comment
          </button>
        </div>
      )}
    </div>
  );
}
