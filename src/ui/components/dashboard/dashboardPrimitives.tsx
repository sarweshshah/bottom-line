import { useEffect, useState, type ReactNode, forwardRef } from "react";
import type { SummaryResult } from "@shared/types";
import { formatModelName } from "@ui/ai/cloudProvider";
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Circle,
  CheckCircle2,
  Crosshair,
  Eye,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  RefreshCw,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import type { WorkflowState } from "@shared/types";
import { StatusBadge } from "@ui/components/common/StatusBadge";
import { UserAvatar } from "@ui/components/common/UserAvatar";
import { ScreenHeader, appHeaderBarClass, AppScreenBody, TabSegment } from "@ui/components/common/layout";
import {
  DropdownMenu,
  DropdownMenuItem,
} from "@ui/components/common/overlays";
import { FieldLabel } from "@ui/components/common/typography";
import { Button, IconButton, Input } from "@ui/components/common/uiPrimitives";
import { renderMentions } from "@ui/lib/renderMentions";
import { timeAgo } from "@ui/lib/timeAgo";
import { cn } from "@ui/lib/cn";
import { useAIStore } from "@ui/store/aiStore";

export const WORKFLOW_STATE_CONFIG: Record<
  WorkflowState,
  { label: string; Icon: LucideIcon }
> = {
  open: { label: "Open", Icon: Circle },
  read: { label: "Read", Icon: Eye },
  resolved: { label: "Resolved", Icon: CheckCircle2 },
};

export const WORKFLOW_STATE_ORDER: WorkflowState[] = [
  "open",
  "read",
  "resolved",
];

export function ExpandChevron({ expanded }: { expanded: boolean }) {
  return expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />;
}

export function CollapsibleSectionHeader({
  expanded,
  onToggle,
  children,
  className = "",
  trailing,
}: {
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
  trailing?: ReactNode;
}) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1.5 text-xs font-medium text-figma-text"
      >
        <ExpandChevron expanded={expanded} />
        {children}
      </button>
      {trailing}
    </div>
  );
}

export function DashboardPanel({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "shrink-0 px-4 py-3 border-b border-figma-border bg-figma-bg-secondary",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DashboardSection({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("px-4 py-3 border-b border-figma-border", className)}>
      {children}
    </div>
  );
}

export function ThreadDetailHeader({
  title,
  onBack,
  trailing,
}: {
  title: string;
  onBack: () => void;
  trailing?: ReactNode;
}) {
  return (
    <ScreenHeader
      onBack={onBack}
      backIcon={<ArrowLeft size={15} />}
      backTooltip="Back to dashboard"
      title={title}
      trailing={
        trailing ? (
          <div className="flex items-center pr-2.5 shrink-0">{trailing}</div>
        ) : undefined
      }
    />
  );
}

export function ThreadDetailMetaBar({
  dateLabel,
  authorLabel,
  children,
}: {
  dateLabel: string;
  authorLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="sticky top-0 z-20 px-4 py-3 border-b border-figma-border bg-accent-subtle-opaque">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-figma-text-secondary">{dateLabel}</span>
        <span className="text-xs text-figma-text-disabled">&middot;</span>
        <span className="text-xs text-figma-text-secondary">{authorLabel}</span>
      </div>
      {children}
    </div>
  );
}

export function ThreadDetailFooter({ children }: { children: ReactNode }) {
  return (
    <div className="px-4 py-3 border-t border-figma-border">{children}</div>
  );
}

export function DetailToolbar({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

export function DetailToolbarButton({
  onClick,
  disabled,
  tooltip,
  tooltipAlign = "right",
  variant = "toolbar",
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  tooltip?: string;
  tooltipAlign?: "left" | "right" | "center";
  variant?: "toolbar" | "danger";
  children: ReactNode;
}) {
  return (
    <IconButton
      variant={variant}
      onClick={onClick}
      disabled={disabled}
      data-tooltip={tooltip}
      data-tooltip-align={tooltipAlign}
      data-tooltip-pos="bottom"
    >
      {children}
    </IconButton>
  );
}

export function CommentBubble({
  author,
  message,
  createdAt,
}: {
  author: { handle: string; img_url: string };
  message: string;
  createdAt: string;
}) {
  return (
    <div className="relative z-10 flex gap-2">
      <UserAvatar
        handle={author.handle}
        imgUrl={author.img_url}
        size={20}
        className="relative z-10 ring-1 ring-figma-border bg-figma-bg"
      />
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

export function WorkflowStateSelector({
  value,
  onChange,
}: {
  value: WorkflowState;
  onChange: (state: WorkflowState) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu
      open={open}
      onClose={() => setOpen(false)}
      align="right"
      panelClassName="min-w-[160px] z-30"
      trigger={
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 cursor-pointer"
        >
          <StatusBadge status={value} />
          <ChevronDown size={10} className="text-figma-text-tertiary" />
        </button>
      }
    >
      {WORKFLOW_STATE_ORDER.map((state) => {
        const cfg = WORKFLOW_STATE_CONFIG[state];
        return (
          <DropdownMenuItem
            key={state}
            active={value === state}
            icon={cfg.Icon}
            onClick={() => {
              setOpen(false);
              if (state !== value) onChange(state);
            }}
          >
            {cfg.label}
          </DropdownMenuItem>
        );
      })}
    </DropdownMenu>
  );
}

export function WorkflowStateDropdown({
  onSelect,
  trigger,
  align = "right",
  placement = "below",
}: {
  onSelect: (state: WorkflowState) => void;
  trigger: ReactNode;
  align?: "left" | "right";
  placement?: "above" | "below";
}) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu
      open={open}
      onClose={() => setOpen(false)}
      align={align}
      panelClassName={cn(
        "min-w-[150px] z-30",
        placement === "above" && "top-auto bottom-full mb-1 mt-0",
      )}
      trigger={
        <span onClick={() => setOpen(!open)} className="inline-flex">
          {trigger}
        </span>
      }
    >
      {WORKFLOW_STATE_ORDER.map((state) => {
        const cfg = WORKFLOW_STATE_CONFIG[state];
        return (
          <DropdownMenuItem
            key={state}
            icon={cfg.Icon}
            onClick={() => {
              setOpen(false);
              onSelect(state);
            }}
          >
            {cfg.label}
          </DropdownMenuItem>
        );
      })}
    </DropdownMenu>
  );
}

export function BulkSelectCheckbox({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        "w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors",
        selected
          ? "bg-accent-bg border-accent-bg"
          : "border-figma-border-strong",
      )}
    >
      {selected && (
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
  );
}

export function SummarizeCtaButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="summarize-cta-button flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium bg-ai-shimmer-cta text-figma-text shadow-sem-none hover:opacity-90 active:opacity-85 transition-opacity duration-150 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function FileNameBar({ fileName }: { fileName: string }) {
  return (
    <div
      className="shrink-0 flex h-9 items-center gap-2 min-w-0 px-4 border-b border-figma-border bg-accent-subtle"
      title={fileName}
    >
      <span className="shrink-0 font-mono text-[9px] font-bold tracking-widest text-accent uppercase leading-snug">
        File
      </span>
      <span
        className="shrink-0 w-px h-3.5 bg-figma-border self-center"
        aria-hidden
      />
      <span className="text-[11px] text-figma-text-primary truncate min-w-0 leading-snug">
        {fileName}
      </span>
    </div>
  );
}

export function ThreadListItemShell({
  selected = false,
  onClick,
  interactive = true,
  className = "",
  children,
}: {
  selected?: boolean;
  onClick?: () => void;
  interactive?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const shellClass = cn(
    "group relative w-full text-left px-4 py-3 border-b border-figma-border transition-colors duration-150",
    interactive &&
      "cursor-pointer outline-none hover:bg-figma-bg-hover focus-visible:bg-figma-bg-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-ring",
    selected && "bg-accent-subtle",
    className,
  );

  const content = (
    <>
      {interactive && (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute left-0 top-0 -bottom-px w-[3px] origin-top bg-accent-bg transition-transform duration-200 ease-out",
            selected ? "scale-y-100" : "scale-y-0 group-hover:scale-y-100",
          )}
        />
      )}
      {children}
    </>
  );

  if (interactive) {
    return (
      <button type="button" onClick={onClick} className={shellClass}>
        {content}
      </button>
    );
  }

  return <div className={shellClass}>{content}</div>;
}

export function ThreadCardLayout({
  bulkMode,
  isSelected,
  leading,
  children,
}: {
  bulkMode?: boolean;
  isSelected?: boolean;
  leading?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-2.5">
      {bulkMode && (
        <div className="shrink-0 flex items-start pt-0.5">
          {leading ?? <BulkSelectCheckbox selected={!!isSelected} />}
        </div>
      )}
      <div className="flex flex-col gap-2 flex-1 min-w-0">{children}</div>
    </div>
  );
}

export function ThreadCardMetaRow({
  threadLabel,
  timeLabel,
  addressed,
  trailing,
}: {
  threadLabel: string;
  timeLabel: string;
  addressed?: boolean;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-1.5">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-[11px] text-figma-text-tertiary font-medium">
          {threadLabel}
        </span>
        <span className="text-[10px] text-figma-text-disabled">&middot;</span>
        <span className="text-[11px] text-figma-text-tertiary">{timeLabel}</span>
        {addressed && <AddressedBadge />}
      </div>
      {trailing}
    </div>
  );
}

export function AddressedBadge() {
  return (
    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-accent-subtle text-accent tracking-wide">
      FOR ME
    </span>
  );
}

export function ThreadCardPreview({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] text-figma-text leading-snug line-clamp-3">
      {children}
    </p>
  );
}

export function ThreadCardFooter({
  leading,
  trailing,
}: {
  leading: ReactNode;
  trailing: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      {leading}
      <div className="flex items-center gap-2">{trailing}</div>
    </div>
  );
}

export function ThreadNavigateAction({
  navigating,
  onNavigate,
}: {
  navigating: boolean;
  onNavigate: () => void;
}) {
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onNavigate();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onNavigate();
        }
      }}
      aria-disabled={navigating}
      className="p-1 rounded-md text-figma-icon-tertiary hover:text-accent hover:bg-accent-subtle aria-disabled:opacity-40 transition-colors cursor-pointer"
      data-tooltip="Navigate to comment"
      data-tooltip-align="right"
    >
      {navigating ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <Crosshair size={12} />
      )}
    </span>
  );
}

export function ThreadCardSkeletonBody() {
  return (
    <ThreadCardLayout>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-8 rounded bg-figma-bg-tertiary" />
          <span className="h-3 w-12 rounded bg-figma-bg-tertiary" />
        </div>
        <span className="h-4 w-14 rounded-full bg-figma-bg-tertiary" />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="h-3 w-full rounded bg-figma-bg-tertiary" />
        <span className="h-3 w-4/5 rounded bg-figma-bg-tertiary" />
        <span className="h-3 w-3/5 rounded bg-figma-bg-tertiary" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex -space-x-1.5">
          {Array.from({ length: 3 }, (_, i) => (
            <span
              key={i}
              className="w-6 h-6 rounded-full bg-figma-bg-tertiary ring-2 ring-figma-bg"
            />
          ))}
        </div>
        <span className="h-3 w-8 rounded bg-figma-bg-tertiary" />
      </div>
    </ThreadCardLayout>
  );
}

export function ActivityFilterChip({
  active,
  count,
  label,
  onClick,
  tooltip,
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
  tooltip: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "tabular-nums transition-colors",
        active
          ? "font-semibold text-accent"
          : "font-medium text-figma-text-secondary hover:text-figma-text",
      )}
      aria-pressed={active}
      data-tooltip={tooltip}
      data-tooltip-align="left"
      data-tooltip-pos="bottom"
    >
      {count} {label}
    </button>
  );
}

export function BulkSummaryProgressBar() {
  const progress = useAIStore((s) => s.bulkSummaryProgress);
  const dismissBulkSummary = useAIStore((s) => s.dismissBulkSummary);

  const isComplete = progress ? !progress.inProgress : false;
  const hasFailures = progress ? progress.failed > 0 : false;

  useEffect(() => {
    if (!isComplete || hasFailures) return;
    const timeoutId = window.setTimeout(dismissBulkSummary, 300);
    return () => window.clearTimeout(timeoutId);
  }, [isComplete, hasFailures, dismissBulkSummary]);

  if (!progress) return null;

  const { total, completed, failed, inProgress } = progress;
  const done = completed + failed;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const allFailed = !inProgress && completed === 0 && failed > 0;
  const showErrorOnly = !inProgress && failed > 0;

  const title = inProgress
    ? "Summarizing threads"
    : allFailed
      ? "Couldn't summarize"
      : "Summaries ready";

  const errorMessage = allFailed
    ? "Summary generation failed for all selected threads"
    : `${failed} ${failed === 1 ? "thread" : "threads"} failed`;

  return (
    <DashboardPanel>
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "shrink-0 flex items-center justify-center w-7 h-7 rounded-md",
            showErrorOnly ? "bg-danger-bg" : "bg-accent-subtle",
          )}
        >
          {showErrorOnly ? (
            <AlertCircle size={14} className="text-danger" />
          ) : (
            <Sparkles size={14} className="text-accent" />
          )}
        </span>

        <div className="flex-1 min-w-0">
          {showErrorOnly ? (
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-figma-text truncate min-w-0">
                {title}
              </span>
              <span className="text-[10px] font-medium text-danger">
                {errorMessage}
              </span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-figma-text truncate min-w-0">
                  {title}
                </span>
                <span className="ml-auto shrink-0 text-[10px] font-semibold tabular-nums text-figma-text-tertiary">
                  {done}/{total}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-figma-bg-tertiary overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent-bg transition-[width] duration-300 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </>
          )}
        </div>

        {!inProgress && (
          <IconButton
            variant="default"
            onClick={dismissBulkSummary}
            className={showErrorOnly ? "self-center" : "self-start"}
            data-tooltip="Dismiss"
            data-tooltip-align="right"
            data-tooltip-pos="bottom"
          >
            <X size={12} />
          </IconButton>
        )}
      </div>
    </DashboardPanel>
  );
}

export function BulkActionBar({
  selectedCount,
  onSummarize,
  onStateChange,
  onExit,
}: {
  selectedCount: number;
  onSummarize: () => void;
  onStateChange: (state: WorkflowState) => void;
  onExit: () => void;
}) {
  return (
    <div className="pl-4 pr-2 py-2.5 border-t border-figma-border bg-accent-subtle flex items-center justify-between">
      <span className="text-xs font-medium text-accent">
        {selectedCount} selected
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          controlSize="compact"
          onClick={onSummarize}
          className="flex items-center gap-1"
        >
          <Sparkles size={12} />
          Summarize
        </Button>
        <WorkflowStateDropdown
          placement="above"
          onSelect={onStateChange}
          trigger={
            <Button
              controlSize="compact"
              variant="primary"
              className="flex items-center gap-1"
            >
              Set state
              <ChevronDown size={10} />
            </Button>
          }
        />
        <IconButton variant="default" onClick={onExit} aria-label="Exit bulk mode">
          <X size={14} />
        </IconButton>
      </div>
    </div>
  );
}

export function SummaryLoadingShimmer() {
  return (
    <div className="space-y-2">
      <div className="h-3 w-full rounded bg-ai-shimmer overflow-hidden" />
      <div className="h-3 w-4/5 rounded bg-ai-shimmer overflow-hidden" />
      <div className="h-3 w-3/5 rounded bg-ai-shimmer overflow-hidden" />
    </div>
  );
}

export function SummaryRegeneratingIndicator() {
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-figma-text-secondary mb-2">
      <Loader2 size={11} className="animate-spin shrink-0" />
      Regenerating summary…
    </div>
  );
}

export function SummaryErrorPanel({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-md bg-danger-bg border border-danger-border">
      <AlertCircle size={14} className="text-danger shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0 flex flex-col">
        <p className="text-xs text-danger leading-relaxed">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 text-xs font-medium text-danger underline hover:opacity-80 transition-colors self-start"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export function SummaryOutdatedPrompt({ onRegenerate }: { onRegenerate: () => void }) {
  return (
    <button
      type="button"
      onClick={onRegenerate}
      className="flex items-center gap-1.5 text-xs text-warning mb-2 hover:opacity-80"
    >
      <RefreshCw size={11} className="text-warning" />
      Summary outdated — regenerate?
    </button>
  );
}

const SUMMARY_LINE_STAGGER_MS = 80;

function splitSummarySegments(summary: string): string[] {
  const lines = summary
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length > 1) return lines;

  const sentences =
    summary
      .match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)
      ?.map((sentence) => sentence.trim())
      .filter(Boolean) ?? [];
  return sentences.length > 0 ? sentences : [summary];
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

export function AnimatedSummaryContent({ result }: { result: SummaryResult }) {
  const bullets = parseSummaryBullets(result.summary);
  const segments = bullets ?? splitSummarySegments(result.summary);
  const headerOffset = 1;
  const footerDelay =
    (headerOffset + segments.length) * SUMMARY_LINE_STAGGER_MS + 40;

  return (
    <>
      <p
        key={`${result.generatedAt}-topic`}
        className="text-[11px] font-semibold text-figma-text leading-snug mb-1.5 ai-summary-line-enter"
      >
        {result.topicHeader}
      </p>
      {bullets ? (
        <ul
          key={result.generatedAt}
          className="list-disc pl-4 space-y-1 text-[11px] text-figma-text leading-relaxed"
        >
          {bullets.map((bullet, index) => (
            <li
              key={`${index}-${bullet}`}
              className="ai-summary-line-enter"
              style={{
                animationDelay: `${(headerOffset + index) * SUMMARY_LINE_STAGGER_MS}ms`,
              }}
            >
              {bullet}
            </li>
          ))}
        </ul>
      ) : segments.length === 1 ? (
        <p
          key={result.generatedAt}
          className="text-[11px] text-figma-text leading-relaxed whitespace-pre-line ai-summary-line-enter"
          style={{
            animationDelay: `${headerOffset * SUMMARY_LINE_STAGGER_MS}ms`,
          }}
        >
          {result.summary}
        </p>
      ) : (
        <div
          key={result.generatedAt}
          className="text-[11px] text-figma-text leading-relaxed space-y-1"
        >
          {segments.map((segment, index) => (
            <p
              key={`${index}-${segment}`}
              className="ai-summary-line-enter"
              style={{
                animationDelay: `${(headerOffset + index) * SUMMARY_LINE_STAGGER_MS}ms`,
              }}
            >
              {segment}
            </p>
          ))}
        </div>
      )}
      <span
        className="text-[10px] text-figma-text-disabled mt-1.5 block ai-summary-line-enter"
        style={{ animationDelay: `${footerDelay}ms` }}
      >
        Generated by {formatModelName(result.modelName ?? result.provider)}{" "}
        &middot; {timeAgo(result.generatedAt)}
      </span>
    </>
  );
}

export function SummaryTooShortNotice({ message }: { message: string }) {
  return (
    <DashboardSection className="!py-3">
      <div className="flex items-center gap-1.5 text-xs text-figma-text-secondary">
        <Sparkles size={12} />
        {message}
      </div>
    </DashboardSection>
  );
}

export function ThreadReplyCount({ count }: { count: number }) {
  return (
    <span className="flex items-center gap-1 text-[11px] text-figma-text-tertiary">
      <MessageCircle size={10} />
      {count}
    </span>
  );
}

export function TaskAssigneeLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[10px] text-figma-text-secondary">{children}</span>
  );
}

export function ActivityPanelHeader({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
}) {
  return (
    <>
      <span className="flex items-center gap-1.5 text-xs font-semibold text-figma-text truncate">
        <Icon size={12} className="shrink-0 text-figma-icon-secondary" />
        {title}
      </span>
      {children}
    </>
  );
}

export function ActivityFilterList({ children }: { children: ReactNode }) {
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] leading-none">
      {children}
    </div>
  );
}

export function ActivityPanelRow({
  content,
  trailing,
}: {
  content: ReactNode;
  trailing: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="flex-1 min-w-0">{content}</div>
      {trailing}
    </div>
  );
}

export function ActivityFilterSeparator() {
  return (
    <span className="text-figma-text-disabled select-none" aria-hidden>
      ·
    </span>
  );
}

export function ActivityFilterItem({
  showSeparator = false,
  children,
}: {
  showSeparator?: boolean;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      {showSeparator && <ActivityFilterSeparator />}
      {children}
    </span>
  );
}

export function ActivityPanelDismissButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <IconButton
      variant="default"
      onClick={onClick}
      className="-mr-1 -mt-px"
      data-tooltip="Dismiss"
      data-tooltip-align="right"
      data-tooltip-pos="bottom"
    >
      <X size={12} />
    </IconButton>
  );
}

export function ThreadCardImageIndicator() {
  return <ImageIcon size={11} className="text-figma-text-tertiary" />;
}

export function CommentsSection({
  expanded,
  onToggle,
  title,
  children,
}: {
  expanded: boolean;
  onToggle: () => void;
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <DashboardSection className="!border-b-0">
      <CollapsibleSectionHeader
        expanded={expanded}
        onToggle={onToggle}
        className="mb-3"
      >
        {title}
      </CollapsibleSectionHeader>
      {children}
    </DashboardSection>
  );
}

export function DashboardToolbarShell({
  hasFileName,
  tabs,
  actions,
}: {
  hasFileName: boolean;
  tabs: ReactNode;
  actions: ReactNode;
}) {
  return (
    <div
      className={appHeaderBarClass(
        cn("justify-between", hasFileName && "border-b-0"),
      )}
    >
      <div className="flex items-stretch self-stretch">{tabs}</div>
      <div className="flex items-stretch self-stretch">{actions}</div>
    </div>
  );
}

export const ThreadListScrollBody = forwardRef<
  HTMLDivElement,
  { className?: string; children: ReactNode }
>(function ThreadListScrollBody({ className = "", children }, ref) {
  return (
    <div
      ref={ref}
      className={cn("thread-list flex-1 overflow-y-auto min-h-0", className)}
    >
      {children}
    </div>
  );
});

export function ThreadListScrollPlaceholder({
  children,
}: {
  children: ReactNode;
}) {
  return <AppScreenBody className="min-h-0">{children}</AppScreenBody>;
}

export function ThreadListVirtualSurface({
  height,
  children,
}: {
  height: number;
  children: ReactNode;
}) {
  return (
    <div className="relative w-full" style={{ height }}>
      {children}
    </div>
  );
}

export function ThreadListVirtualItem({
  index,
  start,
  measureRef,
  children,
}: {
  index: number;
  start: number;
  measureRef: (node: HTMLDivElement | null) => void;
  children: ReactNode;
}) {
  return (
    <div
      ref={measureRef}
      data-index={index}
      className="absolute left-0 top-0 w-full"
      style={{ transform: `translateY(${start}px)` }}
    >
      {children}
    </div>
  );
}

export function DashboardTabSegment({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <TabSegment
      active={active}
      onClick={onClick}
      icon={icon}
      label={label}
      count={count}
      className="px-4"
    />
  );
}

export function CollapsibleSectionContent({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("mt-2", className)}>{children}</div>;
}

export function SummarizeCtaLabel({
  commentCount,
  providerLabel,
}: {
  commentCount: number;
  providerLabel: string;
}) {
  return (
    <span className="inline-flex min-w-0 flex-wrap items-baseline gap-x-1 gap-y-0.5">
      <span>Summarize ({commentCount} comments)</span>
      <span className="text-figma-text-secondary whitespace-nowrap">
        via {providerLabel}
      </span>
    </span>
  );
}

export function NavigateToCommentFooterButton({
  navigating,
  onClick,
  disabled,
}: {
  navigating: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="primary"
      controlSize="compact"
      fullWidth
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-2 py-2.5 active:scale-[0.98]"
    >
      {navigating ? (
        <Loader2 size={13} className="animate-spin" />
      ) : (
        <Crosshair size={13} />
      )}
      Navigate to comment
    </Button>
  );
}

export function FilterCustomDateRangePanel({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
}: {
  startValue: string | null;
  endValue: string | null;
  onStartChange: (value: string | null) => void;
  onEndChange: (value: string | null) => void;
}) {
  return (
    <div className="flex flex-col gap-2 px-3 pt-2 pb-3.5 bg-figma-bg-secondary border-t border-figma-border">
      <label className="flex flex-col gap-1">
        <FieldLabel>From</FieldLabel>
        <Input
          type="date"
          value={startValue ?? ""}
          onChange={(e) => onStartChange(e.target.value || null)}
          className="px-2 py-1 rounded"
        />
      </label>
      <label className="flex flex-col gap-1">
        <FieldLabel>To</FieldLabel>
        <Input
          type="date"
          value={endValue ?? ""}
          onChange={(e) => onEndChange(e.target.value || null)}
          className="px-2 py-1 rounded"
        />
      </label>
    </div>
  );
}

export function ThreadCardSummaryIndicator() {
  return (
    <span
      className="flex items-center text-figma-icon-tertiary"
      data-tooltip="Summary available"
      data-tooltip-align="right"
    >
      <Sparkles size={11} />
    </span>
  );
}

export function CommentThreadContainer({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("relative", className)}>{children}</div>;
}

export function CommentThreadRoot({
  hasReplies,
  children,
}: {
  hasReplies: boolean;
  children: ReactNode;
}) {
  return <div className={hasReplies ? "pb-3" : ""}>{children}</div>;
}

export function CommentReplyList({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("mb-3", className)}>{children}</div>;
}

export function TaskListStack({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("space-y-2", className)}>{children}</div>;
}
