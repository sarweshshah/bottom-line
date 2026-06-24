import { useState, useCallback } from "react";
import {
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  X,
} from "lucide-react";
import type { CommentThread, SummaryResult } from "@shared/types";
import { AvatarGroup } from "@ui/components/common/AvatarGroup";
import { TaskTypeBadge } from "@ui/components/common/taskTypeConfig";
import { showToast } from "@ui/components/common/Toast";
import { AppScreenBody, AppScreenShell } from "@ui/components/common/layout";
import { BodyText } from "@ui/components/common/typography";
import { useNavigateToComment } from "@ui/lib/useNavigateToComment";
import { useAuthStore } from "@ui/store/authStore";
import { useAIStore } from "@ui/store/aiStore";
import { useWorkflowStore } from "@ui/store/workflowStore";
import {
  summarizeThread,
  clearCachedSummary,
  isTooShort,
} from "@ui/ai/summarize";
import { PROVIDER_MODEL_LABELS } from "@ui/ai/cloudProvider";
import {
  DetailSection,
  ReplyThreadItem,
} from "@ui/components/common/uiPrimitives";
import {
  ThreadCentralTrunk,
  ReplyThreadBranch,
  LastReplyTrunkCap,
} from "./ThreadElbow";
import {
  AnimatedSummaryContent,
  CollapsibleSectionContent,
  CollapsibleSectionHeader,
  CommentBubble,
  CommentReplyList,
  CommentThreadContainer,
  CommentThreadRoot,
  CommentsSection,
  DashboardSection,
  DetailToolbar,
  DetailToolbarButton,
  NavigateToCommentFooterButton,
  SummarizeCtaButton,
  SummarizeCtaLabel,
  SummaryErrorPanel,
  SummaryLoadingShimmer,
  SummaryOutdatedPrompt,
  SummaryRegeneratingIndicator,
  SummaryTooShortNotice,
  TaskAssigneeLabel,
  TaskListStack,
  ThreadDetailFooter,
  ThreadDetailHeader,
  ThreadDetailMetaBar,
  WorkflowStateSelector,
} from "./dashboardPrimitives";
import { TaskRow } from "@ui/components/tasks/tasksPrimitives";

function formatSummaryForCopy(result: SummaryResult): string {
  return `${result.topicHeader}\n\n${result.summary}`;
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

interface ThreadDetailProps {
  thread: CommentThread;
  onBack: () => void;
}

function normalizeAssignee(assignee: string | null): string | null {
  if (!assignee) return null;
  const cleaned = assignee.trim().replace(/^@+/, "");
  return cleaned || null;
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
    const text = formatSummaryForCopy(result);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
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
      <SummaryTooShortNotice message="Thread too short to summarize (fewer than 3 comments)." />
    );
  }

  return (
    <DetailSection>
      <CollapsibleSectionHeader
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
        trailing={
          result && expanded ? (
            <DetailToolbar>
              <DetailToolbarButton
                onClick={handleCopySummary}
                tooltip={copiedSummary ? "Copied" : "Copy summary"}
              >
                {copiedSummary ? <Check size={12} /> : <Copy size={12} />}
              </DetailToolbarButton>
              <DetailToolbarButton
                onClick={() => handleSummarize(true)}
                disabled={isLoading}
                tooltip="Regenerate summary"
              >
                <RefreshCw
                  size={12}
                  className={isLoading ? "animate-spin" : ""}
                />
              </DetailToolbarButton>
              <DetailToolbarButton
                variant="danger"
                onClick={() => {
                  clearCachedSummary(thread.id, thread.lastUpdatedAt);
                  clearThreadSummary(thread.id);
                }}
                tooltip="Clear summary"
              >
                <X size={12} />
              </DetailToolbarButton>
            </DetailToolbar>
          ) : undefined
        }
      >
        <Sparkles size={12} />
        AI Summary
      </CollapsibleSectionHeader>

      {expanded && (
        <CollapsibleSectionContent>
          {!result && !isLoading && !error && (
            <SummarizeCtaButton
              onClick={() => handleSummarize()}
              disabled={isLoading}
            >
              <SummarizeCtaLabel
                commentCount={thread.replyCount + 1}
                providerLabel={
                  provider === "custom"
                    ? customModelName || "custom"
                    : (PROVIDER_MODEL_LABELS[provider] ?? provider)
                }
              />
            </SummarizeCtaButton>
          )}

          {isLoading && !result && <SummaryLoadingShimmer />}

          {isLoading && result && <SummaryRegeneratingIndicator />}

          {error && (
            <SummaryErrorPanel error={error} onRetry={() => handleSummarize()} />
          )}

          {result && (
            <div>
              {isOutdated && (
                <SummaryOutdatedPrompt onRegenerate={() => handleSummarize(true)} />
              )}
              <AnimatedSummaryContent result={result} />
            </div>
          )}
        </CollapsibleSectionContent>
      )}
    </DetailSection>
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
    <DashboardSection>
      <CollapsibleSectionHeader
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
      >
        Tasks ({doneCount}/{tasks.length})
      </CollapsibleSectionHeader>

      {expanded && (
        <CollapsibleSectionContent>
          {tasks.length === 0 ? (
            <BodyText>No tasks detected.</BodyText>
          ) : (
            <TaskListStack>
              {tasks.map((task) => {
                const assignee = normalizeAssignee(task.assignee);
                return (
                  <TaskRow
                    key={task.id}
                    done={task.status === "done"}
                    description={task.description}
                    onToggle={() =>
                      updateTaskStatus(
                        task.id,
                        task.status === "done" ? "pending" : "done",
                      )
                    }
                    className="group"
                    meta={
                      <>
                        {assignee && (
                          <TaskAssigneeLabel>{assignee}</TaskAssigneeLabel>
                        )}
                        <TaskTypeBadge type={task.type} />
                      </>
                    }
                  />
                );
              })}
            </TaskListStack>
          )}
        </CollapsibleSectionContent>
      )}
    </DashboardSection>
  );
}

export function ThreadDetail({ thread, onBack }: ThreadDetailProps) {
  const [threadExpanded, setThreadExpanded] = useState(true);
  const workflowState = useWorkflowStore((s) => s.getState(thread.id));
  const setWorkflowState = useWorkflowStore((s) => s.setState);
  const { showThreadElbows } = useAuthStore();
  const { navigating, navigate: handleNavigate } = useNavigateToComment(
    thread.clientMeta,
    thread.id,
  );

  return (
    <AppScreenShell>
      <ThreadDetailHeader
        title={`Thread #${thread.orderNumber ?? thread.id.slice(0, 8)}`}
        onBack={onBack}
        trailing={
          <WorkflowStateSelector
            value={workflowState}
            onChange={(state) => setWorkflowState(thread.id, state)}
          />
        }
      />

      <AppScreenBody>
        <ThreadDetailMetaBar
          dateLabel={formatDate(thread.createdAt)}
          authorLabel={`Started by ${thread.author.handle}`}
        >
          <AvatarGroup users={thread.participants} max={8} size={24} />
        </ThreadDetailMetaBar>
        <SummarySection thread={thread} />

        {/* Extracted Tasks */}
        <TasksSection thread={thread} />

        <CommentsSection
          expanded={threadExpanded}
          onToggle={() => setThreadExpanded(!threadExpanded)}
          title={<>Comments ({thread.replyCount + 1})</>}
        >
          {threadExpanded && (
            <CommentThreadContainer>
              {showThreadElbows && thread.replies.length > 0 && (
                <ThreadCentralTrunk />
              )}
              <CommentThreadRoot hasReplies={thread.replies.length > 0}>
                <CommentBubble
                  author={thread.author}
                  message={thread.message}
                  createdAt={thread.createdAt}
                />
              </CommentThreadRoot>
              {thread.replies.length > 0 && (
                <CommentReplyList>
                  {thread.replies.map((reply, index) => {
                    const isLast = index === thread.replies.length - 1;
                    return (
                      <ReplyThreadItem key={reply.id} isLast={isLast}>
                        {showThreadElbows && (
                          <>
                            <ReplyThreadBranch />
                            {isLast && <LastReplyTrunkCap />}
                          </>
                        )}
                        <CommentBubble
                          author={reply.author}
                          message={reply.message}
                          createdAt={reply.createdAt}
                        />
                      </ReplyThreadItem>
                    );
                  })}
                </CommentReplyList>
              )}
            </CommentThreadContainer>
          )}
        </CommentsSection>
      </AppScreenBody>

      {thread.clientMeta && (
        <ThreadDetailFooter>
          <NavigateToCommentFooterButton
            navigating={navigating}
            onClick={handleNavigate}
            disabled={navigating}
          />
        </ThreadDetailFooter>
      )}
    </AppScreenShell>
  );
}
