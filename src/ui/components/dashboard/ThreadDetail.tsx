import { useState, useCallback } from "react";
import {
  ArrowLeft,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import type { CommentThread, CommentReply } from "@shared/types";
import type { NavigateToCommentMessage } from "@shared/messages";
import type { NavigateResultMessage } from "@shared/messages";
import { StatusBadge } from "@ui/components/common/StatusBadge";
import { AvatarGroup } from "@ui/components/common/AvatarGroup";
import { showToast } from "@ui/components/common/Toast";
import { timeAgo } from "@ui/lib/timeAgo";

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

function CommentBubble({
  author,
  message,
  createdAt,
  isRoot,
}: {
  author: { handle: string; img_url: string };
  message: string;
  createdAt: string;
  isRoot?: boolean;
}) {
  return (
    <div className={`flex gap-2.5 ${isRoot ? "" : "ml-4"}`}>
      <div className="shrink-0 mt-0.5">
        {author.img_url ? (
          <img
            src={author.img_url}
            alt={author.handle}
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-figma-bg-tertiary flex items-center justify-center text-2xs font-medium text-figma-text-secondary">
            {author.handle[0]?.toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-xs font-medium text-figma-text">
            {author.handle}
          </span>
          <span className="text-2xs text-figma-text-tertiary">
            {timeAgo(createdAt)}
          </span>
        </div>
        <p className="text-xs text-figma-text-secondary leading-relaxed whitespace-pre-wrap break-words">
          {message}
        </p>
      </div>
    </div>
  );
}

export function ThreadDetail({ thread, onBack }: ThreadDetailProps) {
  const [threadExpanded, setThreadExpanded] = useState(true);
  const [navigating, setNavigating] = useState(false);

  const handleNavigate = useCallback(() => {
    if (!thread.clientMeta || navigating) return;
    setNavigating(true);

    const handler = (event: MessageEvent) => {
      const msg = event.data?.pluginMessage as NavigateResultMessage | undefined;
      if (!msg || msg.type !== "NAVIGATE_RESULT") return;

      window.removeEventListener("message", handler);
      setNavigating(false);

      if (!msg.success && msg.error) {
        showToast(msg.error, "error");
      }
    };

    window.addEventListener("message", handler);

    const navMsg: NavigateToCommentMessage = {
      type: "NAVIGATE_TO_COMMENT",
      clientMeta: thread.clientMeta!,
    };
    parent.postMessage({ pluginMessage: navMsg }, "*");

    setTimeout(() => {
      window.removeEventListener("message", handler);
      setNavigating(false);
    }, 5000);
  }, [thread.clientMeta, navigating]);

  return (
    <div className="flex flex-col h-full bg-figma-bg">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-figma-border">
        <button
          type="button"
          onClick={onBack}
          className="p-1 rounded-md text-figma-icon-secondary hover:bg-figma-bg-secondary hover:text-figma-icon transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <span className="text-xs text-figma-text-secondary truncate block">
            Thread #{thread.orderNumber ?? thread.id.slice(0, 8)}
          </span>
        </div>
        <StatusBadge status={thread.status} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Meta */}
        <div className="px-4 py-3 border-b border-figma-border">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xs text-figma-text-tertiary">
              {formatDate(thread.createdAt)}
            </span>
            <span className="text-2xs text-figma-text-disabled">&middot;</span>
            <span className="text-2xs text-figma-text-tertiary">
              Started by {thread.author.handle}
            </span>
          </div>
          <AvatarGroup users={thread.participants} max={8} size={24} />
        </div>

        {/* Full comment thread */}
        <div className="px-4 py-3">
          <button
            type="button"
            onClick={() => setThreadExpanded(!threadExpanded)}
            className="flex items-center gap-1.5 text-xs font-medium text-figma-text-secondary mb-3 hover:text-figma-text"
          >
            {threadExpanded ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronRight size={12} />
            )}
            Comments ({thread.replyCount + 1})
          </button>

          {threadExpanded && (
            <div className="space-y-4">
              <CommentBubble
                author={thread.author}
                message={thread.message}
                createdAt={thread.createdAt}
                isRoot
              />
              {thread.replies.map((reply: CommentReply) => (
                <CommentBubble
                  key={reply.id}
                  author={reply.author}
                  message={reply.message}
                  createdAt={reply.createdAt}
                />
              ))}
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
            className="w-full flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium bg-figma-bg-secondary text-figma-text-secondary hover:bg-figma-bg-tertiary hover:text-figma-text disabled:opacity-40 transition-colors"
          >
            {navigating ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <ExternalLink size={13} />
            )}
            Navigate to comment
          </button>
        </div>
      )}
    </div>
  );
}
