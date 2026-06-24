import {
  ThreadCardSkeletonBody,
  ThreadListItemShell,
} from "./dashboardPrimitives";

export function ThreadCardSkeleton() {
  return (
    <ThreadListItemShell interactive={false} className="animate-pulse">
      <ThreadCardSkeletonBody />
    </ThreadListItemShell>
  );
}
