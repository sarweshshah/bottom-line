import { MessageCircle, Crosshair, Loader2, Image } from "lucide-react";
import type { CommentThread, WorkflowState } from "@shared/types";
import { StatusBadge } from "@ui/components/common/StatusBadge";
import { AvatarGroup } from "@ui/components/common/AvatarGroup";
import { timeAgo } from "@ui/lib/timeAgo";
import { renderMentions } from "@ui/lib/renderMentions";
import { useNavigateToComment } from "@ui/lib/useNavigateToComment";
import { threadHasImages } from "@ui/ai/imageProcessor";

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

  const handleClick = () => {
    if (bulkMode) {
      onToggleSelect(thread.id);
    } else {
      onSelect(thread);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-full text-left px-4 py-3 border-b border-figma-border hover:bg-figma-bg-hover transition-colors cursor-pointer ${
        isSelected ? "bg-accent-subtle" : ""
      }`}
    >
      <div className="flex gap-2.5">
        {bulkMode && (
          <div className="shrink-0 flex items-start pt-0.5">
            <span
              className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                isSelected ? "bg-accent border-accent" : "border-figma-border"
              }`}
            >
              {isSelected && (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path
                    d="M1.5 4L3.2 5.7L6.5 2.3"
                    stroke="white"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {/* Row 1: Timestamp + badges */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-figma-text-tertiary">
                #{thread.orderNumber ?? thread.id.slice(0, 8)} &middot;{" "}
                {timeAgo(thread.lastUpdatedAt)}
              </span>
              {isAddressed && (
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-accent-subtle text-accent tracking-wide">
                  FOR ME
                </span>
              )}
            </div>
            <StatusBadge status={workflowState} />
          </div>

          {/* Row 2: Message preview */}
          <p className="text-[11px] text-figma-text leading-snug opacity-80 line-clamp-3">
            {renderMentions(thread.message)}
          </p>

          {/* Row 3: Avatars + Reply count + Navigate */}
          <div className="flex items-center justify-between">
            <AvatarGroup users={thread.participants} max={5} size={26} />
            <div className="flex items-center gap-2">
              {threadHasImages(thread) && (
                <Image size={11} className="text-figma-text-tertiary" />
              )}
              <span className="flex items-center gap-1 text-xs text-figma-text-tertiary">
                <MessageCircle size={11} />
                {thread.replyCount + 1}
              </span>
              {thread.clientMeta && !bulkMode && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigate();
                  }}
                  disabled={navigating}
                  className="p-1 rounded-md text-figma-icon-tertiary hover:text-accent hover:bg-figma-bg-secondary disabled:opacity-40 transition-colors"
                  data-tooltip="Navigate to comment"
                  data-tooltip-align="right"
                >
                  {navigating ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Crosshair size={13} />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
