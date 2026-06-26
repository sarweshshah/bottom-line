export function normalizeAssignee(
  assignee: string | null | undefined,
  options?: { rejectUnassigned?: boolean },
): string | null {
  if (!assignee || typeof assignee !== "string") return null;
  const cleaned = assignee.trim().replace(/^@+/, "");
  if (!cleaned) return null;
  if (options?.rejectUnassigned && cleaned.toLowerCase() === "unassigned") {
    return null;
  }
  return cleaned;
}
