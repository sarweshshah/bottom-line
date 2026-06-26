import {
  ChevronDown,
  ArrowUp,
  ArrowDown,
  User,
  File,
  Files,
  Calendar,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import type {
  SortField,
  CommentScope,
  WorkflowState,
  TimeFilterPreset,
} from "@shared/types";
import { useFilterStore } from "@ui/store/filterStore";
import { useCommentsStore } from "@ui/store/commentsStore";
import { FilterBarShell, FilterBarSpacer } from "@ui/components/common/layout";
import {
  DropdownMenu,
  DropdownMenuItem,
} from "@ui/components/common/overlays";
import {
  FilterChip,
  IconFilterChip,
} from "@ui/components/common/uiPrimitives";
import { FilterCustomDateRangePanel } from "./dashboardPrimitives";

const STATE_FILTER_OPTIONS: { value: WorkflowState | null; label: string }[] = [
  { value: null, label: "All" },
  { value: "open", label: "Open" },
  { value: "read", label: "Read" },
  { value: "resolved", label: "Done" },
];

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "replies", label: "Replies" },
  { value: "participants", label: "Participants" },
  { value: "last_updated", label: "Last updated" },
  { value: "created_at", label: "Created" },
];

const SCOPE_OPTIONS: {
  value: CommentScope;
  label: string;
  Icon: typeof File;
}[] = [
  { value: "current_page", label: "Current page", Icon: File },
  { value: "full_file", label: "Document", Icon: Files },
];

const TIME_FILTER_OPTIONS: { value: TimeFilterPreset; label: string }[] = [
  { value: "all", label: "All" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "custom", label: "Custom" },
];

type MenuId = "status" | "time" | "scope" | "sort";

export function FilterBar() {
  const {
    workflowStateFilter,
    addressedToMe,
    sortField,
    sortDirection,
    commentScope,
    timeFilterPreset,
    customTimeStart,
    customTimeEnd,
    setWorkflowStateFilter,
    setAddressedToMe,
    toggleSort,
    setCommentScope,
    setTimeFilterPreset,
    setCustomTimeRange,
  } = useFilterStore(
    useShallow((s) => ({
      workflowStateFilter: s.workflowStateFilter,
      addressedToMe: s.addressedToMe,
      sortField: s.sortField,
      sortDirection: s.sortDirection,
      commentScope: s.commentScope,
      timeFilterPreset: s.timeFilterPreset,
      customTimeStart: s.customTimeStart,
      customTimeEnd: s.customTimeEnd,
      setWorkflowStateFilter: s.setWorkflowStateFilter,
      setAddressedToMe: s.setAddressedToMe,
      toggleSort: s.toggleSort,
      setCommentScope: s.setCommentScope,
      setTimeFilterPreset: s.setTimeFilterPreset,
      setCustomTimeRange: s.setCustomTimeRange,
    })),
  );
  const { threads, currentPageThreadIds } = useCommentsStore(
    useShallow((s) => ({
      threads: s.threads,
      currentPageThreadIds: s.currentPageThreadIds,
    })),
  );
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null);

  function toggleMenu(menu: MenuId) {
    setOpenMenu((current) => (current === menu ? null : menu));
  }

  function closeMenu() {
    setOpenMenu(null);
  }

  const activeSort = SORT_OPTIONS.find((o) => o.value === sortField);
  const activeScope = SCOPE_OPTIONS.find((o) => o.value === commentScope);
  const ScopeIcon = activeScope?.Icon ?? Files;
  const DirIcon = sortDirection === "asc" ? ArrowUp : ArrowDown;
  const statusLabel =
    STATE_FILTER_OPTIONS.find((o) => o.value === workflowStateFilter)?.label ??
    "All";
  const activeTimeFilter = TIME_FILTER_OPTIONS.find(
    (o) => o.value === timeFilterPreset,
  );
  const isTimeFilterActive = timeFilterPreset !== "all";
  const isResolvingCurrentPage =
    commentScope === "current_page" &&
    currentPageThreadIds === null &&
    threads.length > 0;
  const isScopeFilterActive = commentScope === "current_page";

  return (
    <FilterBarShell>
      <DropdownMenu
        open={openMenu === "status"}
        onClose={closeMenu}
        panelClassName="min-w-[140px]"
        trigger={
          <FilterChip
            active={Boolean(workflowStateFilter)}
            onClick={() => toggleMenu("status")}
            icon={<ChevronDown size={10} />}
          >
            {statusLabel}
          </FilterChip>
        }
      >
        {STATE_FILTER_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.label}
            active={workflowStateFilter === opt.value}
            onClick={() => {
              setWorkflowStateFilter(opt.value);
              closeMenu();
            }}
          >
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenu>

      <FilterChip
        active={addressedToMe}
        onClick={() => setAddressedToMe(!addressedToMe)}
        icon={<User size={10} />}
      >
        For me
      </FilterChip>

      <FilterBarSpacer />

      <DropdownMenu
        open={openMenu === "time"}
        onClose={closeMenu}
        align="right"
        panelClassName="min-w-[160px] overflow-hidden"
        trigger={
          <IconFilterChip
            active={isTimeFilterActive}
            onClick={() => toggleMenu("time")}
            data-tooltip={activeTimeFilter?.label}
            data-tooltip-align="right"
            data-tooltip-pos="bottom"
          >
            <Calendar size={12} />
            <ChevronDown size={10} />
          </IconFilterChip>
        }
      >
        {TIME_FILTER_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            active={timeFilterPreset === opt.value}
            onClick={() => {
              setTimeFilterPreset(opt.value);
              if (opt.value !== "custom") closeMenu();
            }}
          >
            {opt.label}
          </DropdownMenuItem>
        ))}
        {timeFilterPreset === "custom" && (
          <FilterCustomDateRangePanel
            startValue={customTimeStart}
            endValue={customTimeEnd}
            onStartChange={(value) =>
              setCustomTimeRange(value, customTimeEnd)
            }
            onEndChange={(value) =>
              setCustomTimeRange(customTimeStart, value)
            }
          />
        )}
      </DropdownMenu>

      <DropdownMenu
        open={openMenu === "scope"}
        onClose={closeMenu}
        align="right"
        panelClassName="min-w-[130px]"
        trigger={
          <IconFilterChip
            active={isScopeFilterActive}
            loading={isResolvingCurrentPage}
            onClick={() => toggleMenu("scope")}
            data-tooltip={activeScope?.label}
            data-tooltip-align="right"
            data-tooltip-pos="bottom"
          >
            {isResolvingCurrentPage ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <ScopeIcon size={12} />
            )}
            <ChevronDown size={10} />
          </IconFilterChip>
        }
      >
        {SCOPE_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            active={commentScope === opt.value}
            icon={opt.Icon}
            onClick={() => {
              setCommentScope(opt.value);
              closeMenu();
            }}
          >
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenu>

      <DropdownMenu
        open={openMenu === "sort"}
        onClose={closeMenu}
        align="right"
        panelClassName="min-w-[140px]"
        trigger={
          <FilterChip
            tone="sort"
            active={false}
            onClick={() => toggleMenu("sort")}
            icon={<DirIcon size={10} />}
          >
            {activeSort?.label}
          </FilterChip>
        }
      >
        {SORT_OPTIONS.map((opt) => {
          const isActive = sortField === opt.value;
          return (
            <DropdownMenuItem
              key={opt.value}
              active={isActive}
              layout="split"
              onClick={() => {
                toggleSort(opt.value);
                if (!isActive) closeMenu();
              }}
            >
              {opt.label}
              {isActive && <DirIcon size={10} className="text-accent" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenu>
    </FilterBarShell>
  );
}
