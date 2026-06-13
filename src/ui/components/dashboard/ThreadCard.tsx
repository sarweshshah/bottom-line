import {
  MessageCircle,
  Crosshair,
  Loader2,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import type { CommentThread, WorkflowState } from "@shared/types";
import { StatusBadge } from "@ui/components/common/StatusBadge";
import { AvatarGroup } from "@ui/components/common/AvatarGroup";
import { timeAgo } from "@ui/lib/timeAgo";
import { renderMentions } from "@ui/lib/renderMentions";
import { useNavigateToComment } from "@ui/lib/useNavigateToComment";
import { threadHasImages } from "@ui/ai/imageProcessor";
import { useAIStore } from "@ui/store/aiStore";

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
    <button
      type="button"
      onClick={handleClick}
      className={`group relative w-full text-left px-4 py-3 border-b border-figma-border transition-colors duration-150 cursor-pointer outline-none hover:bg-figma-bg-hover focus-visible:bg-figma-bg-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-ring ${
        isSelected ? "bg-accent-subtle" : ""
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-0 left-0 w-[3px] origin-center rounded-r-full bg-accent transition-transform duration-200 ease-out ${
          isSelected ? "scale-y-100" : "scale-y-0 group-hover:scale-y-100"
        }`}
      />
      <div className="flex gap-2.5">
        {bulkMode && (
          <div className="shrink-0 flex items-start pt-0.5">
            <span
              className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                isSelected
                  ? "bg-accent border-accent"
                  : "border-figma-border-strong"
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
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-figma-text-tertiary font-medium">
                #{thread.orderNumber ?? thread.id.slice(0, 8)}
              </span>
              <span className="text-[10px] text-figma-text-disabled">&middot;</span>
              <span className="text-[11px] text-figma-text-tertiary">
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

          <p className="text-[11px] text-figma-text leading-snug line-clamp-3">
            {renderMentions(thread.message)}
          </p>

          <div className="flex items-center justify-between">
            <AvatarGroup users={thread.participants} max={10} size={18} />
            <div className="flex items-center gap-2">
              {threadHasImages(thread) && (
                <ImageIcon size={11} className="text-figma-text-tertiary" />
              )}
              {hasSummary && (
                <span
                  className="flex items-center text-figma-icon-tertiary"
                  data-tooltip="Summary available"
                  data-tooltip-align="right"
                >
                  <Sparkles size={11} />
                </span>
              )}
              <span className="flex items-center gap-1 text-[11px] text-figma-text-tertiary">
                <MessageCircle size={10} />
                {thread.replyCount + 1}
              </span>
              {thread.clientMeta && !bulkMode && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigate();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      handleNavigate();
                    }
                  }}
                  aria-disabled={navigating}
                  className="p-1 rounded-lg text-figma-icon-tertiary hover:text-accent hover:bg-accent-subtle aria-disabled:opacity-40 transition-colors cursor-pointer"
                  data-tooltip="Navigate to comment"
                  data-tooltip-align="right"
                >
                  {navigating ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Crosshair size={12} />
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
