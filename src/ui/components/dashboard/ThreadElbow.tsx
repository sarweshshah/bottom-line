/**
 * Comment-thread gutter geometry (ThreadDetail):
 * - 24px avatars → center at 12px (`left-3`)
 * - Replies indent 28px (`pl-7`) → avatar center at 40px
 * - Horizontal branch spans 28px to bridge trunk → reply avatar
 */

const GUTTER_X = "left-3"; // 12px — avatar center column
const BRANCH_W = "w-7"; // 28px — trunk to indented reply avatar center

const LINE = "pointer-events-none absolute z-0 bg-elbow";

function GutterLine({ className }: { className: string }) {
  return <span aria-hidden className={`${LINE} w-px ${className}`} />;
}

/** Single continuous vertical stem from below the root avatar through all replies. */
export function ThreadCentralTrunk() {
  return <GutterLine className={`${GUTTER_X} top-6 bottom-0`} />;
}

/** Horizontal branch at reply avatar midline (top-3). */
export function ReplyThreadBranch() {
  return (
    <span
      aria-hidden
      className={`${LINE} ${GUTTER_X} top-3 h-px ${BRANCH_W}`}
    />
  );
}

/** Hides the stem below the last reply branch without moving the branch endpoint. */
export function LastReplyTrunkCap() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute left-3 top-[13px] bottom-0 w-px z-[1] bg-figma-bg"
    />
  );
}
