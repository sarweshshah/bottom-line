import { ChevronDown, ArrowUp, ArrowDown, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { SortField, CommentScope, WorkflowState } from "@shared/types";
import { useFilterStore } from "@ui/store/filterStore";

const WORKFLOW_OPTIONS: { value: WorkflowState; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "WIP" },
  { value: "blocked", label: "Blocked" },
  { value: "resolved", label: "Done" },
];

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "replies", label: "Replies" },
  { value: "participants", label: "Participants" },
  { value: "last_updated", label: "Last updated" },
  { value: "created_at", label: "Created" },
];

const SCOPE_OPTIONS: { value: CommentScope; label: string }[] = [
  { value: "current_page", label: "Current page" },
  { value: "full_file", label: "Document" },
];

export function FilterBar() {
  const {
    workflowFilter,
    addressedToMe,
    sortField,
    sortDirection,
    commentScope,
    toggleWorkflowState,
    setWorkflowFilter,
    setAddressedToMe,
    toggleSort,
    setCommentScope,
  } = useFilterStore();
  const [statusOpen, setStatusOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const scopeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (statusRef.current && !statusRef.current.contains(target)) setStatusOpen(false);
      if (sortRef.current && !sortRef.current.contains(target)) setSortOpen(false);
      if (scopeRef.current && !scopeRef.current.contains(target)) setScopeOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside, { passive: true });
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeSort = SORT_OPTIONS.find((o) => o.value === sortField);
  const DirIcon = sortDirection === "asc" ? ArrowUp : ArrowDown;

  const statusLabel = workflowFilter.length === 0
    ? "All"
    : workflowFilter.length === 1
      ? WORKFLOW_OPTIONS.find((o) => o.value === workflowFilter[0])?.label ?? "1 state"
      : `${workflowFilter.length} states`;

  return (
    <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-figma-border bg-figma-bg">
      {/* Status dropdown (multi-select) */}
      <div className="relative" ref={statusRef}>
        <button
          type="button"
          onClick={() => {
            setStatusOpen(!statusOpen);
            setSortOpen(false);
            setScopeOpen(false);
          }}
          className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-all duration-150 ${
            workflowFilter.length > 0
              ? "bg-accent-bg text-white shadow-sm"
              : "bg-figma-bg-secondary text-figma-text-secondary hover:text-figma-text"
          }`}
        >
          {statusLabel}
          <ChevronDown size={10} />
        </button>

        {statusOpen && (
          <div className="absolute left-0 top-full mt-1 bg-figma-bg border border-figma-border rounded-lg shadow-lg z-20 min-w-[140px]">
            <button
              type="button"
              onClick={() => {
                setWorkflowFilter([]);
                setStatusOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-figma-bg-hover transition-colors ${
                workflowFilter.length === 0 ? "text-accent font-medium" : "text-figma-text-secondary"
              }`}
            >
              All
            </button>
            <div className="border-t border-figma-border" />
            {WORKFLOW_OPTIONS.map((opt) => {
              const checked = workflowFilter.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleWorkflowState(opt.value)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-figma-bg-hover transition-colors text-figma-text-secondary"
                >
                  <span
                    className={`w-3 h-3 rounded border flex items-center justify-center shrink-0 ${
                      checked
                        ? "bg-accent border-accent"
                        : "border-figma-border"
                    }`}
                  >
                    {checked && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* "For me" toggle */}
      <button
        type="button"
        onClick={() => setAddressedToMe(!addressedToMe)}
        className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-all duration-150 ${
          addressedToMe
            ? "bg-accent-bg text-white shadow-sm"
            : "bg-figma-bg-secondary text-figma-text-secondary hover:text-figma-text"
        }`}
      >
        <User size={10} />
        For me
      </button>

      <div className="flex-1" />

      {/* Scope dropdown */}
      <div className="relative" ref={scopeRef}>
        <button
          type="button"
          onClick={() => {
            setScopeOpen(!scopeOpen);
            setSortOpen(false);
            setStatusOpen(false);
          }}
          className="flex items-center gap-1 text-xs text-figma-text-secondary hover:text-figma-text px-2.5 py-1 rounded-lg bg-figma-bg-secondary transition-colors"
        >
          {SCOPE_OPTIONS.find((o) => o.value === commentScope)?.label}
          <ChevronDown size={10} />
        </button>

        {scopeOpen && (
          <div className="absolute right-0 top-full mt-1 bg-figma-bg border border-figma-border rounded-lg shadow-lg z-20 min-w-[130px]">
            {SCOPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setCommentScope(opt.value);
                  setScopeOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-figma-bg-hover transition-colors ${
                  commentScope === opt.value
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

      {/* Sort dropdown */}
      <div className="relative" ref={sortRef}>
        <button
          type="button"
          onClick={() => {
            setSortOpen(!sortOpen);
            setScopeOpen(false);
            setStatusOpen(false);
          }}
          className="flex items-center gap-1 text-xs text-figma-text-secondary hover:text-figma-text px-2.5 py-1 rounded-lg bg-figma-bg-secondary transition-colors"
        >
          {activeSort?.label}
          <DirIcon size={10} />
        </button>

        {sortOpen && (
          <div className="absolute right-0 top-full mt-1 bg-figma-bg border border-figma-border rounded-lg shadow-lg z-20 min-w-[140px]">
            {SORT_OPTIONS.map((opt) => {
              const isActive = sortField === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    toggleSort(opt.value);
                    if (!isActive) setSortOpen(false);
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
