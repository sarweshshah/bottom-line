import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { StatusFilter, SortOrder, CommentScope } from "@shared/types";
import { useFilterStore } from "@ui/store/filterStore";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
];

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

const SCOPE_OPTIONS: { value: CommentScope; label: string }[] = [
  { value: "current_page", label: "Current page" },
  { value: "full_file", label: "Document" },
];

export function FilterBar() {
  const { status, sortBy, commentScope, setStatus, setSortBy, setCommentScope } =
    useFilterStore();
  const [sortOpen, setSortOpen] = useState(false);
  const [scopeOpen, setScopeOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const scopeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (sortRef.current && !sortRef.current.contains(target)) {
        setSortOpen(false);
      }
      if (scopeRef.current && !scopeRef.current.contains(target)) {
        setScopeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside, { passive: true });
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-figma-border bg-figma-bg">
      {/* Status chips */}
      <div className="flex items-center gap-1 flex-1">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatus(opt.value)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              status === opt.value
                ? "bg-status-open text-white"
                : "bg-figma-bg-secondary text-figma-text-secondary hover:bg-figma-bg-tertiary"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Scope dropdown */}
      <div className="relative" ref={scopeRef}>
        <button
          type="button"
          onClick={() => {
            setScopeOpen(!scopeOpen);
            setSortOpen(false);
          }}
          className="flex items-center gap-1 text-xs text-figma-text-secondary hover:text-figma-text px-2 py-1 rounded bg-figma-bg-secondary"
        >
          {SCOPE_OPTIONS.find((o) => o.value === commentScope)?.label}
          <ChevronDown size={10} />
        </button>

        {scopeOpen && (
          <div className="absolute right-0 top-full mt-1 bg-figma-bg border border-figma-border rounded-md shadow-lg z-20 min-w-[130px]">
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
                    ? "text-status-open font-medium"
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
          }}
          className="flex items-center gap-1 text-xs text-figma-text-secondary hover:text-figma-text px-2 py-1 rounded bg-figma-bg-secondary"
        >
          {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
          <ChevronDown size={10} />
        </button>

        {sortOpen && (
          <div className="absolute right-0 top-full mt-1 bg-figma-bg border border-figma-border rounded-md shadow-lg z-20 min-w-[120px]">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setSortBy(opt.value);
                  setSortOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-figma-bg-hover transition-colors ${
                  sortBy === opt.value
                    ? "text-status-open font-medium"
                    : "text-figma-text-secondary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
