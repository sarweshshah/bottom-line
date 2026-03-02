import { MessageCircle } from "lucide-react";
import type { CommentThread } from "@shared/types";
import { StatusBadge } from "@ui/components/common/StatusBadge";
import { AvatarGroup } from "@ui/components/common/AvatarGroup";
import { timeAgo } from "@ui/lib/timeAgo";

interface ThreadCardProps {
  thread: CommentThread;
  onSelect: (thread: CommentThread) => void;
}

export function ThreadCard({ thread, onSelect }: ThreadCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(thread)}
      className="w-full text-left px-4 py-3 border-b border-figma-border hover:bg-figma-bg-hover transition-colors cursor-pointer"
    >
      {/* Row 1: Timestamp + Status */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-2xs text-figma-text-tertiary">
          {timeAgo(thread.lastUpdatedAt)}
        </span>
        <StatusBadge status={thread.status} />
      </div>

      {/* Row 2: Message preview */}
      <p className="text-xs text-figma-text leading-snug mb-2 line-clamp-2">
        {thread.message}
      </p>

      {/* Row 3: Avatars + Reply count */}
      <div className="flex items-center justify-between">
        <AvatarGroup users={thread.participants} max={5} size={20} />
        {thread.replyCount > 0 && (
          <span className="flex items-center gap-1 text-2xs text-figma-text-tertiary">
            <MessageCircle size={11} />
            {thread.replyCount}
          </span>
        )}
      </div>
    </button>
  );
}
