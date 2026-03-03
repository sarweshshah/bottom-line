import { MessageCircle, Crosshair, Loader2 } from "lucide-react";
import type { CommentThread } from "@shared/types";
import { StatusBadge } from "@ui/components/common/StatusBadge";
import { AvatarGroup } from "@ui/components/common/AvatarGroup";
import { timeAgo } from "@ui/lib/timeAgo";
import { renderMentions } from "@ui/lib/renderMentions";
import { useNavigateToComment } from "@ui/lib/useNavigateToComment";

interface ThreadCardProps {
  thread: CommentThread;
  onSelect: (thread: CommentThread) => void;
}

export function ThreadCard({ thread, onSelect }: ThreadCardProps) {
  const { navigating, navigate: handleNavigate } = useNavigateToComment(
    thread.clientMeta,
    thread.id,
  );

  return (
    <button
      type="button"
      onClick={() => onSelect(thread)}
      className="w-full text-left px-4 py-3 border-b border-figma-border hover:bg-figma-bg-hover transition-colors cursor-pointer"
    >
      <div className="flex flex-col gap-2">
        {/* Row 1: Timestamp + Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-figma-text-tertiary">
            {timeAgo(thread.lastUpdatedAt)}
          </span>
          <StatusBadge status={thread.status} />
        </div>

        {/* Row 2: Message preview */}
        <p className="text-[11px] text-figma-text leading-snug opacity-80 line-clamp-3">
          {renderMentions(thread.message)}
        </p>

        {/* Row 3: Avatars + Reply count + Navigate */}
        <div className="flex items-center justify-between">
          <AvatarGroup users={thread.participants} max={5} size={26} />
          <div className="flex items-center gap-2">
            {thread.replyCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-figma-text-tertiary">
                <MessageCircle size={11} />
                {thread.replyCount}
              </span>
            )}
            {thread.clientMeta && (
              <button
                type="button"
                onClick={handleNavigate}
                disabled={navigating}
                className="p-1 rounded-md text-figma-icon-tertiary hover:text-status-open hover:bg-figma-bg-secondary disabled:opacity-40 transition-colors"
                title="Navigate to comment"
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
    </button>
  );
}
