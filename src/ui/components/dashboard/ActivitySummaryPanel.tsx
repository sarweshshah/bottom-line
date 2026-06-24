import { Clock } from "lucide-react";
import {
  ACTIVITY_WINDOW_LABEL,
  type ActivityFilter,
  type ActivitySummary,
} from "@ui/lib/activitySummary";
import {
  ActivityFilterChip,
  ActivityFilterItem,
  ActivityFilterList,
  ActivityPanelDismissButton,
  ActivityPanelHeader,
  ActivityPanelRow,
  DashboardPanel,
} from "./dashboardPrimitives";

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
    <DashboardPanel>
      <ActivityPanelRow
        content={
          <ActivityPanelHeader icon={Clock} title={ACTIVITY_WINDOW_LABEL}>
            {visibleFilters.length > 0 && (
              <ActivityFilterList>
                {visibleFilters.map(({ key, label, getCount }, index) => {
                  const count = getCount(summary);
                  const isActive = activeFilter === key;

                  return (
                    <ActivityFilterItem
                      key={key}
                      showSeparator={index > 0}
                    >
                      <ActivityFilterChip
                        active={isActive}
                        count={count}
                        label={label}
                        onClick={() => onFilterClick(key)}
                        tooltip={
                          isActive
                            ? "Clear filter"
                            : key === "all"
                              ? "Show all activity"
                              : `Filter by ${label}`
                        }
                      />
                    </ActivityFilterItem>
                  );
                })}
              </ActivityFilterList>
            )}
          </ActivityPanelHeader>
        }
        trailing={<ActivityPanelDismissButton onClick={onDismiss} />}
      />
    </DashboardPanel>
  );
}
