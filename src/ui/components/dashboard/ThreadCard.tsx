import type { CommentThread, WorkflowState } from "@shared/types";
import { StatusBadge } from "@ui/components/common/StatusBadge";
import { AvatarGroup } from "@ui/components/common/AvatarGroup";
import { timeAgo } from "@ui/lib/timeAgo";
import { renderMentions } from "@ui/lib/renderMentions";
import { useNavigateToComment } from "@ui/lib/useNavigateToComment";
import { threadHasImages } from "@ui/ai/imageProcessor";
import { useAIStore } from "@ui/store/aiStore";
import {
  ThreadCardFooter,
  ThreadCardImageIndicator,
  ThreadCardLayout,
  ThreadCardMetaRow,
  ThreadCardPreview,
  ThreadCardSummaryIndicator,
  ThreadListItemShell,
  ThreadNavigateAction,
  ThreadReplyCount,
} from "./dashboardPrimitives";

interface ThreadCardProps {
  thread: CommentThread;
  workflowState: WorkflowState;
  isAddressed: boolean;
  bulkMode: boolean;
  isSelected: boolean;
  onSelect: (thread: CommentThread) => void;
  onToggleSelect: (threadId: string) => void;
}

export function ThreadCard({
  thread,
  workflowState,
  isAddressed,
  bulkMode,
  isSelected,
  onSelect,
  onToggleSelect,
}: ThreadCardProps) {
  const { navigating, navigate: handleNavigate } = useNavigateToComment(
    thread.clientMeta,
    thread.id,
  );
  const hasSummary = useAIStore((s) =>
    Boolean(s.threadSummaries.get(thread.id)?.result),
  );

  const handleClick = () => {
    if (bulkMode) {
      onToggleSelect(thread.id);
    } else {
      onSelect(thread);
    }
  };

  return (
    <ThreadListItemShell
      selected={isSelected}
      onClick={handleClick}
    >
      <ThreadCardLayout bulkMode={bulkMode} isSelected={isSelected}>
        <ThreadCardMetaRow
          threadLabel={`#${thread.orderNumber ?? thread.id.slice(0, 8)}`}
          timeLabel={timeAgo(thread.lastUpdatedAt)}
          addressed={isAddressed}
          trailing={<StatusBadge status={workflowState} />}
        />

        <ThreadCardPreview>{renderMentions(thread.message)}</ThreadCardPreview>

        <ThreadCardFooter
          leading={<AvatarGroup users={thread.participants} max={10} size={18} />}
          trailing={
            <>
              {threadHasImages(thread) && <ThreadCardImageIndicator />}
              {hasSummary && <ThreadCardSummaryIndicator />}
              <ThreadReplyCount count={thread.replyCount + 1} />
              {thread.clientMeta && !bulkMode && (
                <ThreadNavigateAction
                  navigating={navigating}
                  onNavigate={handleNavigate}
                />
              )}
            </>
          }
        />
      </ThreadCardLayout>
    </ThreadListItemShell>
  );
}
