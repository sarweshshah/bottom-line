import { useState } from "react";
import type { CommentThread } from "@shared/types";
import { AvatarGroup } from "@ui/components/common/AvatarGroup";
import { TaskTypeBadge } from "@ui/components/common/taskTypeConfig";
import { AppScreenBody, AppScreenShell } from "@ui/components/common/layout";
import { BodyText } from "@ui/components/common/typography";
import { useNavigateToComment } from "@ui/lib/useNavigateToComment";
import { normalizeAssignee } from "@ui/lib/assignee";
import { useAuthStore } from "@ui/store/authStore";
import { useAIStore } from "@ui/store/aiStore";
import { useWorkflowStore } from "@ui/store/workflowStore";
import {
  ReplyThreadItem,
} from "@ui/components/common/uiPrimitives";
import {
  ThreadCentralTrunk,
  ReplyThreadBranch,
  LastReplyTrunkCap,
} from "./ThreadElbow";
import {
  CollapsibleSectionContent,
  CollapsibleSectionHeader,
  CommentBubble,
  CommentReplyList,
  CommentThreadContainer,
  CommentThreadRoot,
  CommentsSection,
  DashboardSection,
  NavigateToCommentFooterButton,
  TaskAssigneeLabel,
  TaskListStack,
  ThreadDetailFooter,
  ThreadDetailHeader,
  ThreadDetailMetaBar,
  WorkflowStateSelector,
} from "./dashboardPrimitives";
import { SummarySection } from "./SummarySection";
import { TaskRow } from "@ui/components/tasks/tasksPrimitives";

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
  const showThreadElbows = useAuthStore((s) => s.showThreadElbows);
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
