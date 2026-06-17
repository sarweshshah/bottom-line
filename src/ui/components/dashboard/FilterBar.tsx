import {
  ChevronDown,
  ArrowUp,
  ArrowDown,
  User,
  File,
  Files,
  Calendar,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type {
  SortField,
  CommentScope,
  WorkflowState,
  TimeFilterPreset,
} from "@shared/types";
import { useFilterStore } from "@ui/store/filterStore";

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
  { value: "relatedness", label: "Relatedness" },
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
  } = useFilterStore();
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);
  const scopeRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenu) return;

    function handleClickOutside(e: MouseEvent) {
      let container: HTMLDivElement | null = null;
      if (openMenu === "status") container = statusRef.current;
      else if (openMenu === "time") container = timeRef.current;
      else if (openMenu === "scope") container = scopeRef.current;
      else if (openMenu === "sort") container = sortRef.current;

      if (container && !container.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside, {
      passive: true,
    });
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenu]);

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
  const isScopeFilterActive = commentScope === "current_page";

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-3 border-b border-figma-border bg-figma-bg">
      <div className="relative" ref={statusRef}>
        <button
          type="button"
          onClick={() => toggleMenu("status")}
          className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md transition-all duration-150 ${
            workflowStateFilter
              ? "bg-accent-bg text-white shadow-sm"
              : "bg-figma-bg-secondary text-figma-text-secondary hover:text-figma-text"
          }`}
        >
          {statusLabel}
          <ChevronDown size={10} />
        </button>

        {openMenu === "status" && (
          <div className="absolute left-0 top-full mt-1 bg-figma-bg border border-figma-border rounded-md shadow-lg z-20 min-w-[140px]">
            {STATE_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => {
                  setWorkflowStateFilter(opt.value);
                  closeMenu();
                }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-figma-bg-hover transition-colors ${
                  workflowStateFilter === opt.value
                    ? "text-accent font-medium"
                    : "text-figma-text-secondary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setAddressedToMe(!addressedToMe)}
        className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md transition-all duration-150 ${
          addressedToMe
            ? "bg-accent-bg text-white shadow-sm"
            : "bg-figma-bg-secondary text-figma-text-secondary hover:text-figma-text"
        }`}
      >
        <User size={10} />
        For me
      </button>

      <div className="flex-1" />

      <div className="relative" ref={timeRef}>
        <button
          type="button"
          onClick={() => toggleMenu("time")}
          className={`flex items-center gap-0.5 p-1.5 rounded-md transition-colors ${
            isTimeFilterActive
              ? "bg-accent-bg text-white shadow-sm"
              : "text-figma-text-secondary hover:text-figma-text bg-figma-bg-secondary"
          }`}
          data-tooltip={activeTimeFilter?.label}
          data-tooltip-align="right"
          data-tooltip-pos="bottom"
        >
          <Calendar size={12} />
          <ChevronDown size={10} />
        </button>

        {openMenu === "time" && (
          <div className="absolute right-0 top-full mt-1 bg-figma-bg border border-figma-border rounded-md shadow-lg z-20 min-w-[160px] overflow-hidden">
            {TIME_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setTimeFilterPreset(opt.value);
                  if (opt.value !== "custom") closeMenu();
                }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-figma-bg-hover transition-colors ${
                  timeFilterPreset === opt.value
                    ? "text-accent font-medium"
                    : "text-figma-text-secondary"
                }`}
              >
                {opt.label}
              </button>
            ))}
            {timeFilterPreset === "custom" && (
              <div className="flex flex-col gap-2 px-3 pt-2 pb-3.5 bg-figma-bg-secondary border-t border-figma-border">
                <label className="flex flex-col gap-1 text-[10px] text-figma-text-tertiary">
                  From
                  <input
                    type="date"
                    value={customTimeStart ?? ""}
                    onChange={(e) =>
                      setCustomTimeRange(e.target.value || null, customTimeEnd)
                    }
                    className="w-full px-2 py-1 text-xs rounded border border-figma-border bg-figma-bg text-figma-text"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[10px] text-figma-text-tertiary">
                  To
                  <input
                    type="date"
                    value={customTimeEnd ?? ""}
                    onChange={(e) =>
                      setCustomTimeRange(customTimeStart, e.target.value || null)
                    }
                    className="w-full px-2 py-1 text-xs rounded border border-figma-border bg-figma-bg text-figma-text"
                  />
                </label>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative" ref={scopeRef}>
        <button
          type="button"
          onClick={() => toggleMenu("scope")}
          className={`flex items-center gap-0.5 p-1.5 rounded-md transition-colors ${
            isScopeFilterActive
              ? "bg-accent-bg text-white shadow-sm"
              : "text-figma-text-secondary hover:text-figma-text bg-figma-bg-secondary"
          }`}
          data-tooltip={activeScope?.label}
          data-tooltip-align="right"
          data-tooltip-pos="bottom"
        >
          <ScopeIcon size={12} />
          <ChevronDown size={10} />
        </button>

        {openMenu === "scope" && (
          <div className="absolute right-0 top-full mt-1 bg-figma-bg border border-figma-border rounded-md shadow-lg z-20 min-w-[130px]">
            {SCOPE_OPTIONS.map((opt) => {
              const Icon = opt.Icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setCommentScope(opt.value);
                    closeMenu();
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-figma-bg-hover transition-colors ${
                    commentScope === opt.value
                      ? "text-accent font-medium"
                      : "text-figma-text-secondary"
                  }`}
                >
                  <Icon size={12} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="relative" ref={sortRef}>
        <button
          type="button"
          onClick={() => toggleMenu("sort")}
          className="flex items-center gap-1 text-xs text-figma-text-secondary hover:text-figma-text px-2.5 py-1 rounded-md bg-figma-bg-secondary transition-colors"
        >
          {activeSort?.label}
          <DirIcon size={10} />
        </button>

        {openMenu === "sort" && (
          <div className="absolute right-0 top-full mt-1 bg-figma-bg border border-figma-border rounded-md shadow-lg z-20 min-w-[140px]">
            {SORT_OPTIONS.map((opt) => {
              const isActive = sortField === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    toggleSort(opt.value);
                    if (!isActive) closeMenu();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-figma-bg-hover transition-colors ${
                    isActive
                      ? "text-accent font-medium"
                      : "text-figma-text-secondary"
                  }`}
                >
                  {opt.label}
                  {isActive && <DirIcon size={10} className="text-accent" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
