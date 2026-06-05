export function ThreadCardSkeleton() {
  return (
    <div className="w-full px-4 py-3 border-b border-figma-border animate-pulse">
      <div className="flex flex-col gap-2">
        {/* Row 1: # + timestamp + badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-8 rounded bg-figma-bg-tertiary" />
            <span className="h-3 w-12 rounded bg-figma-bg-tertiary" />
          </div>
          <span className="h-4 w-14 rounded-full bg-figma-bg-tertiary" />
        </div>

        {/* Row 2: Message lines */}
        <div className="flex flex-col gap-1.5">
          <span className="h-3 w-full rounded bg-figma-bg-tertiary" />
          <span className="h-3 w-4/5 rounded bg-figma-bg-tertiary" />
          <span className="h-3 w-3/5 rounded bg-figma-bg-tertiary" />
        </div>

        {/* Row 3: Avatars + reply count */}
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
      </div>
    </div>
  );
}
