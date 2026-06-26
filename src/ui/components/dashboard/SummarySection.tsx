import { useState, useCallback } from "react";
import {
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  X,
} from "lucide-react";
import type { CommentThread, SummaryResult } from "@shared/types";
import { showToast } from "@ui/components/common/Toast";
import { useAIStore } from "@ui/store/aiStore";
import {
  summarizeThread,
  clearCachedSummary,
  isTooShort,
} from "@ui/ai/summarize";
import { getProviderDisplayName } from "@ui/ai/providerOptions";
import { requestAiConsent } from "@ui/ai/consent";
import { DetailSection } from "@ui/components/common/uiPrimitives";
import {
  AnimatedSummaryContent,
  CollapsibleSectionContent,
  CollapsibleSectionHeader,
  DetailToolbar,
  DetailToolbarButton,
  SummarizeCtaButton,
  SummarizeCtaLabel,
  SummaryErrorPanel,
  SummaryLoadingShimmer,
  SummaryOutdatedPrompt,
  SummaryRegeneratingIndicator,
  SummaryTooShortNotice,
} from "./dashboardPrimitives";

function formatSummaryForCopy(result: SummaryResult): string {
  return `${result.topicHeader}\n\n${result.summary}`;
}

export function SummarySection({ thread }: { thread: CommentThread }) {
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
        requestAiConsent(() => void handleSummarize(skipCache));
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
                providerLabel={getProviderDisplayName(
                  provider,
                  "model",
                  customModelName,
                )}
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
