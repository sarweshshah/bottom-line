import { useMemo, useState } from "react";
import {
  CheckSquare,
  Square,
  Sparkles,
  MessageSquare,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { Task, TaskStatus, CommentThread } from "@shared/types";
import { useAIStore } from "@ui/store/aiStore";
import {
  TASK_TYPE_LABELS,
  TASK_TYPE_COLORS,
} from "@ui/components/common/taskTypeConfig";
import { useCommentsStore } from "@ui/store/commentsStore";

interface TaskGroup {
  assignee: string;
  tasks: DisplayTask[];
}

function normalizeAssignee(assignee: string | null): string | null {
  if (!assignee || typeof assignee !== "string") return null;
  const cleaned = assignee.trim().replace(/^@+/, "");
  return cleaned || null;
}

interface DisplayTask {
  id: string;
  threadId: string;
  description: string;
  type: Task["type"];
  status: TaskStatus;
  assignees: string[];
  sourceTaskIds: string[];
}

function mergeDuplicateTasks(tasks: Task[]): DisplayTask[] {
  const merged = new Map<string, DisplayTask>();

  for (const task of tasks) {
    const normalizedAssignee = normalizeAssignee(task.assignee);
    const desc =
      typeof task.description === "string"
        ? task.description
        : String(task.description ?? "");
    const mergeKey = `${task.threadId}::${task.type}::${desc.trim().toLowerCase()}`;
    const existing = merged.get(mergeKey);
    if (!existing) {
      merged.set(mergeKey, {
        id: mergeKey,
        threadId: task.threadId,
        description: task.description,
        type: task.type,
        status: task.status,
        assignees: normalizedAssignee ? [normalizedAssignee] : [],
        sourceTaskIds: [task.id],
      });
      continue;
    }

    existing.sourceTaskIds.push(task.id);
    if (task.status === "pending") {
      existing.status = "pending";
    }
    if (
      normalizedAssignee &&
      !existing.assignees.includes(normalizedAssignee)
    ) {
      existing.assignees.push(normalizedAssignee);
      existing.assignees.sort((a, b) => a.localeCompare(b));
    }
  }

  return Array.from(merged.values());
}

function assigneeGroupKey(task: DisplayTask): string {
  if (task.assignees.length === 0) return "Unassigned";
  if (task.assignees.length === 1) return task.assignees[0];
  return "Multiple assignees";
}

function groupByAssignee(tasks: DisplayTask[]): TaskGroup[] {
  const groups = new Map<string, DisplayTask[]>();

  for (const task of tasks) {
    const key = assigneeGroupKey(task);
    const existing = groups.get(key);
    if (existing) {
      existing.push(task);
    } else {
      groups.set(key, [task]);
    }
  }

  const sorted = Array.from(groups.entries())
    .map(([assignee, tasks]) => ({ assignee, tasks }))
    .sort((a, b) => {
      if (a.assignee === "Unassigned") return 1;
      if (b.assignee === "Unassigned") return -1;
      return a.assignee.localeCompare(b.assignee);
    });

  return sorted;
}

interface TasksViewProps {
  onSelectThread: (thread: CommentThread) => void;
}

export function TasksView({ onSelectThread }: TasksViewProps) {
  const allTasks = useAIStore((s) => s.allTasks);
  const updateTaskStatus = useAIStore((s) => s.updateTaskStatus);
  const threads = useCommentsStore((s) => s.threads);

  const [statusFilter, setStatusFilter] = useState<Set<TaskStatus>>(
    () => new Set(["pending", "done"]),
  );
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    () => new Set(),
  );

  const pendingCount = allTasks.filter((t) => t.status === "pending").length;
  const doneCount = allTasks.filter((t) => t.status === "done").length;

  const mergedTasks = useMemo(() => mergeDuplicateTasks(allTasks), [allTasks]);

  const filteredTasks = useMemo(
    () => mergedTasks.filter((t) => statusFilter.has(t.status)),
    [mergedTasks, statusFilter],
  );
  const groups = useMemo(() => groupByAssignee(filteredTasks), [filteredTasks]);

  const toggleFilter = (status: TaskStatus) => {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        if (next.size > 1) next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  const toggleGroup = (assignee: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(assignee)) {
        next.delete(assignee);
      } else {
        next.add(assignee);
      }
      return next;
    });
  };

  if (allTasks.length === 0) {
    return (
      <div
        className="flex-1 flex flex-col items-center px-6 text-center"
        style={{ paddingTop: "33%" }}
      >
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mb-3">
          <Sparkles size={20} className="text-accent" />
        </div>
        <p className="text-sm font-medium text-figma-text mb-1">No tasks yet</p>
        <p className="text-xs text-figma-text-tertiary leading-relaxed">
          Summarize threads to extract tasks. <br /> Open a thread and click
          &ldquo;Summarize&rdquo; to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center gap-1.5 px-2.5 py-3 border-b border-figma-border bg-figma-bg">
        <button
          type="button"
          onClick={() => toggleFilter("pending")}
          className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-all duration-150 ${
            statusFilter.has("pending")
              ? "bg-accent-bg text-white shadow-sm"
              : "bg-figma-bg-secondary text-figma-text-secondary hover:text-figma-text"
          }`}
        >
          {pendingCount} pending
        </button>
        <button
          type="button"
          onClick={() => toggleFilter("done")}
          className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-all duration-150 ${
            statusFilter.has("done")
              ? "bg-accent-bg text-white shadow-sm"
              : "bg-figma-bg-secondary text-figma-text-secondary hover:text-figma-text"
          }`}
        >
          {doneCount} done
        </button>
      </div>

      {groups.map((group) => (
        <div key={group.assignee}>
          <button
            type="button"
            onClick={() => toggleGroup(group.assignee)}
            className="w-full flex items-center justify-between px-4 py-2 bg-figma-bg-secondary border-b border-figma-border text-left hover:bg-figma-bg-tertiary transition-colors"
          >
            <div className="flex items-center gap-1.5">
              {collapsedGroups.has(group.assignee) ? (
                <ChevronRight size={12} className="text-figma-icon-secondary" />
              ) : (
                <ChevronDown size={12} className="text-figma-icon-secondary" />
              )}
              <span className="text-xs font-medium text-figma-text-secondary">
                {group.assignee === "Unassigned"
                  ? "Unassigned"
                  : group.assignee}
              </span>
              <span className="text-xs text-figma-text-disabled ml-2">
                ({group.tasks.length})
              </span>
            </div>
          </button>

          {!collapsedGroups.has(group.assignee) && (
            <div className="divide-y divide-figma-border">
              {group.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-2.5 px-4 py-2.5"
                >
                  <button
                    type="button"
                    onClick={() =>
                      task.sourceTaskIds.forEach((sourceTaskId) =>
                        updateTaskStatus(
                          sourceTaskId,
                          task.status === "done" ? "pending" : "done",
                        ),
                      )
                    }
                    className="shrink-0 mt-0.5 text-figma-icon-secondary hover:text-figma-icon transition-colors"
                  >
                    {task.status === "done" ? (
                      <CheckSquare size={14} className="text-status-resolved" />
                    ) : (
                      <Square size={14} />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[11px] leading-relaxed ${
                        task.status === "done"
                          ? "text-figma-text-disabled line-through"
                          : "text-figma-text"
                      }`}
                    >
                      {task.description}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-block text-[9px] px-1.5 py-0.5 rounded-full font-medium ${TASK_TYPE_COLORS[task.type]}`}
                        >
                          {TASK_TYPE_LABELS[task.type]}
                        </span>
                        {task.assignees.length > 1 && (
                          <span className="text-[9px] text-figma-text-tertiary">
                            {task.assignees.join(", ")}
                          </span>
                        )}
                      </div>
                      {threads.find((t) => t.id === task.threadId) && (
                        <button
                          type="button"
                          onClick={() => {
                            const thread = threads.find(
                              (t) => t.id === task.threadId,
                            );
                            if (thread) onSelectThread(thread);
                          }}
                          className="ml-2 shrink-0 p-1 rounded-md text-figma-icon-tertiary hover:bg-figma-bg-secondary hover:text-figma-icon transition-colors"
                          data-tooltip="Open thread"
                          data-tooltip-align="right"
                          data-tooltip-pos="bottom"
                        >
                          <MessageSquare size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
