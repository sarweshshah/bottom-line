import { useMemo, useState } from "react";
import type { TaskStatus, CommentThread } from "@shared/types";
import { useAIStore } from "@ui/store/aiStore";
import { TaskTypeBadge } from "@ui/components/common/taskTypeConfig";
import { useCommentsStore } from "@ui/store/commentsStore";
import {
  TaskGroupHeader,
  TaskList,
  TaskListItem,
  TaskMultiAssigneeNames,
  TaskRow,
  TasksEmptyState,
  TaskStatusFilterBar,
  TasksViewShell,
  TaskThreadLinkButton,
} from "@ui/components/tasks/tasksPrimitives";

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
  type: import("@shared/types").Task["type"];
  status: TaskStatus;
  assignees: string[];
  sourceTaskIds: string[];
}

function mergeDuplicateTasks(
  tasks: import("@shared/types").Task[],
): DisplayTask[] {
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
    return <TasksEmptyState />;
  }

  return (
    <TasksViewShell>
      <TaskStatusFilterBar
        pendingCount={pendingCount}
        doneCount={doneCount}
        statusFilter={statusFilter}
        onToggle={toggleFilter}
      />

      {groups.map((group) => (
        <div key={group.assignee}>
          <TaskGroupHeader
            label={
              group.assignee === "Unassigned" ? "Unassigned" : group.assignee
            }
            count={group.tasks.length}
            collapsed={collapsedGroups.has(group.assignee)}
            onToggle={() => toggleGroup(group.assignee)}
          />

          {!collapsedGroups.has(group.assignee) && (
            <TaskList>
              {group.tasks.map((task) => (
                <TaskListItem key={task.id}>
                  <TaskRow
                    done={task.status === "done"}
                    description={task.description}
                    onToggle={() =>
                      task.sourceTaskIds.forEach((sourceTaskId) =>
                        updateTaskStatus(
                          sourceTaskId,
                          task.status === "done" ? "pending" : "done",
                        ),
                      )
                    }
                    meta={
                      <>
                        <TaskTypeBadge type={task.type} />
                        {task.assignees.length > 1 && (
                          <TaskMultiAssigneeNames names={task.assignees} />
                        )}
                      </>
                    }
                    trailing={
                      threads.find((t) => t.id === task.threadId) ? (
                        <TaskThreadLinkButton
                          onClick={() => {
                            const thread = threads.find(
                              (t) => t.id === task.threadId,
                            );
                            if (thread) onSelectThread(thread);
                          }}
                        />
                      ) : undefined
                    }
                  />
                </TaskListItem>
              ))}
            </TaskList>
          )}
        </div>
      ))}
    </TasksViewShell>
  );
}
