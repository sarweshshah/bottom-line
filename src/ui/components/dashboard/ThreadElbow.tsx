/**
 * Comment-thread gutter geometry (ThreadDetail):
 * - 20px avatars → center at 10px (`left-2.5`)
 * - Replies indent 28px (`pl-7`) → avatar center at 38px
 * - Horizontal branch spans 28px to bridge trunk → reply avatar
 */

const GUTTER_X = "left-2.5"; // 10px — avatar center column
const BRANCH_W = "w-7"; // 28px — trunk to indented reply avatar center

const LINE = "pointer-events-none absolute z-0 bg-elbow";

function GutterLine({ className }: { className: string }) {
  return <span aria-hidden className={`${LINE} w-px ${className}`} />;
}

/** Single continuous vertical stem from below the root avatar through all replies. */
export function ThreadCentralTrunk() {
  return <GutterLine className={`${GUTTER_X} top-5 bottom-0`} />;
}

/** Horizontal branch at reply avatar midline (top-2.5). */
export function ReplyThreadBranch() {
  return (
    <span
      aria-hidden
      className={`${LINE} ${GUTTER_X} top-2.5 h-px ${BRANCH_W}`}
    />
  );
}

/** Hides the stem below the last reply branch without moving the branch endpoint. */
export function LastReplyTrunkCap() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute left-2.5 top-[11px] bottom-0 w-px z-[1] bg-figma-bg"
    />
  );
}
