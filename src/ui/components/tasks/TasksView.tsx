import { useMemo } from "react";
import { CheckSquare, Square, Sparkles } from "lucide-react";
import type { Task } from "@shared/types";
import { useAIStore } from "@ui/store/aiStore";

const TASK_TYPE_LABELS: Record<Task["type"], string> = {
  revision: "Revision",
  approval: "Approval",
  blocker: "Blocker",
  question: "Question",
  general: "Task",
};

const TASK_TYPE_COLORS: Record<Task["type"], string> = {
  revision: "bg-amber-100 text-amber-700",
  approval: "bg-purple-100 text-purple-700",
  blocker: "bg-red-100 text-red-700",
  question: "bg-blue-100 text-blue-700",
  general: "bg-gray-100 text-gray-600",
};

interface TaskGroup {
  assignee: string;
  tasks: Task[];
}

function groupByAssignee(tasks: Task[]): TaskGroup[] {
  const groups = new Map<string, Task[]>();

  for (const task of tasks) {
    const key = task.assignee ?? "Unassigned";
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

export function TasksView() {
  const allTasks = useAIStore((s) => s.allTasks);
  const updateTaskStatus = useAIStore((s) => s.updateTaskStatus);

  const groups = useMemo(() => groupByAssignee(allTasks), [allTasks]);
  const pendingCount = allTasks.filter((t) => t.status === "pending").length;
  const doneCount = allTasks.filter((t) => t.status === "done").length;

  if (allTasks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <Sparkles size={32} className="text-figma-icon-tertiary mb-3" />
        <p className="text-sm font-medium text-figma-text-secondary mb-1">
          No tasks yet
        </p>
        <p className="text-xs text-figma-text-tertiary">
          Summarize threads to extract tasks. Open a thread and click
          "Summarize" to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-4 py-2.5 border-b border-figma-border">
        <div className="flex items-center gap-3 text-xs text-figma-text-tertiary">
          <span>{pendingCount} pending</span>
          <span>&middot;</span>
          <span>{doneCount} done</span>
        </div>
      </div>

      {groups.map((group) => (
        <div key={group.assignee}>
          <div className="px-4 py-2 bg-figma-bg-secondary border-b border-figma-border">
            <span className="text-xs font-medium text-figma-text-secondary">
              {group.assignee === "Unassigned"
                ? "Unassigned"
                : `@${group.assignee}`}
            </span>
            <span className="text-xs text-figma-text-disabled ml-2">
              ({group.tasks.length})
            </span>
          </div>

          <div className="divide-y divide-figma-border">
            {group.tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-2.5 px-4 py-2.5"
              >
                <button
                  type="button"
                  onClick={() =>
                    updateTaskStatus(
                      task.id,
                      task.status === "done" ? "pending" : "done",
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
                  <span
                    className={`inline-block text-[9px] px-1.5 py-0.5 rounded-full font-medium mt-1 ${TASK_TYPE_COLORS[task.type]}`}
                  >
                    {TASK_TYPE_LABELS[task.type]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
