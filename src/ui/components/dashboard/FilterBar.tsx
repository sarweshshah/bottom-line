import { ChevronDown, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { StatusFilter, SortOrder } from "@shared/types";
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

export function FilterBar() {
  const { status, sortBy, setStatus, setSortBy, clearFilters } =
    useFilterStore();
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const hasNonDefault = status !== "open" || sortBy !== "newest";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-figma-border bg-figma-bg">
      {/* Status chips */}
      <div className="flex items-center gap-1 flex-1">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatus(opt.value)}
            className={`px-2.5 py-1 rounded-full text-2xs font-medium transition-colors ${
              status === opt.value
                ? "bg-status-open text-white"
                : "bg-figma-bg-secondary text-figma-text-secondary hover:bg-figma-bg-tertiary"
            }`}
          >
            {opt.label}
          </button>
        ))}

        {hasNonDefault && (
          <button
            type="button"
            onClick={clearFilters}
            className="ml-1 text-figma-text-tertiary hover:text-figma-text-secondary"
            title="Clear all filters"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Sort dropdown */}
      <div className="relative" ref={sortRef}>
        <button
          type="button"
          onClick={() => setSortOpen(!sortOpen)}
          className="flex items-center gap-1 text-2xs text-figma-text-secondary hover:text-figma-text px-2 py-1 rounded bg-figma-bg-secondary"
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
                className={`w-full text-left px-3 py-1.5 text-2xs hover:bg-figma-bg-hover transition-colors ${
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
