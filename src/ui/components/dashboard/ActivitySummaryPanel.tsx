import { Clock, X } from "lucide-react";
import {
  ACTIVITY_WINDOW_LABEL,
  type ActivityFilter,
  type ActivitySummary,
} from "@ui/lib/activitySummary";

interface ActivitySummaryPanelProps {
  summary: ActivitySummary;
  activeFilter: ActivityFilter | null;
  onFilterClick: (filter: ActivityFilter) => void;
  onDismiss: () => void;
}

const FILTERS: {
  key: ActivityFilter;
  label: string;
  getCount: (summary: ActivitySummary) => number;
}[] = [
  { key: "new", label: "new", getCount: (s) => s.newThreads.length },
  { key: "updated", label: "replies", getCount: (s) => s.updatedThreads.length },
  { key: "resolved", label: "resolved", getCount: (s) => s.resolvedThreads.length },
  { key: "all", label: "total", getCount: (s) => s.totalCount },
];

export function ActivitySummaryPanel({
  summary,
  activeFilter,
  onFilterClick,
  onDismiss,
}: ActivitySummaryPanelProps) {
  const visibleFilters = FILTERS.filter(({ getCount }) => getCount(summary) > 0);

  return (
    <div className="shrink-0 px-4 py-3 border-b border-figma-border bg-figma-bg-secondary">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-figma-text truncate">
            <Clock size={12} className="shrink-0 text-figma-icon-secondary" />
            {ACTIVITY_WINDOW_LABEL}
          </span>

          {visibleFilters.length > 0 && (
            <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] leading-none">
              {visibleFilters.map(({ key, label, getCount }, index) => {
                const count = getCount(summary);
                const isActive = activeFilter === key;

                return (
                  <span key={key} className="inline-flex items-center gap-1">
                    {index > 0 && (
                      <span
                        className="text-figma-text-disabled select-none"
                        aria-hidden
                      >
                        ·
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onFilterClick(key)}
                      className={`tabular-nums transition-colors ${
                        isActive
                          ? "font-semibold text-accent"
                          : "font-medium text-figma-text-secondary hover:text-figma-text"
                      }`}
                      aria-pressed={isActive}
                      data-tooltip={
                        isActive
                          ? "Clear filter"
                          : key === "all"
                            ? "Show all activity"
                            : `Filter by ${label}`
                      }
                      data-tooltip-align="center"
                      data-tooltip-pos="bottom"
                    >
                      {count} {label}
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 -mr-1 -mt-px p-1 rounded-md text-figma-icon-tertiary hover:bg-figma-bg-tertiary hover:text-figma-icon transition-colors"
          data-tooltip="Dismiss"
          data-tooltip-align="right"
          data-tooltip-pos="bottom"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
