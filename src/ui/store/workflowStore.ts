import { create } from "zustand";
import type { WorkflowState, CommentThread } from "@shared/types";
import { getStorage, setStorage } from "@ui/lib/storage";
import { showToast } from "@ui/components/common/Toast";
import { useAIStore } from "./aiStore";

const STORAGE_KEY = "wf_states";

interface WorkflowEntry {
  state: WorkflowState;
  updatedAt: string;
}

type StateMap = Record<string, WorkflowEntry>;

interface WorkflowStoreState {
  states: Map<string, WorkflowState>;
  initialized: boolean;

  initStates: (threads: CommentThread[]) => Promise<void>;
  getState: (threadId: string) => WorkflowState;
  setState: (threadId: string, state: WorkflowState) => Promise<void>;
  bulkSetState: (threadIds: string[], state: WorkflowState) => Promise<void>;
  reconcileWithFigma: (threads: CommentThread[]) => void;
  cleanup: (existingThreadIds: Set<string>) => void;
}

function figmaStatus(thread: CommentThread): "open" | "resolved" {
  return thread.resolvedAt ? "resolved" : "open";
}

function isIntermediate(_s: WorkflowState): boolean {
  return false;
}

async function persistStates(states: Map<string, WorkflowState>) {
  const obj: StateMap = {};
  for (const [id, state] of states) {
    if (state !== "open") {
      obj[id] = { state, updatedAt: new Date().toISOString() };
    }
  }
  await setStorage(STORAGE_KEY, obj);
}

function completeTasksForThread(threadId: string) {
  const { allTasks, updateTaskStatus } = useAIStore.getState();
  for (const task of allTasks) {
    if (task.threadId === threadId && task.status !== "done") {
      updateTaskStatus(task.id, "done");
    }
  }
}

export const useWorkflowStore = create<WorkflowStoreState>((set, get) => ({
  states: new Map(),
  initialized: false,

  initStates: async (threads) => {
    const stored = await getStorage<StateMap>(STORAGE_KEY);
    const states = new Map<string, WorkflowState>();

    for (const t of threads) {
      const native = figmaStatus(t);
      const entry = stored?.[t.id];

      if (entry) {
        if (native === "resolved" && entry.state !== "resolved") {
          states.set(t.id, "resolved");
        } else if (native === "open" && entry.state === "resolved") {
          states.set(t.id, "open");
        } else {
          states.set(t.id, entry.state);
        }
      } else {
        states.set(t.id, native);
      }
    }

    set({ states, initialized: true });
    await persistStates(states);
  },

  getState: (threadId) => {
    return get().states.get(threadId) ?? "open";
  },

  setState: async (threadId, state) => {
    const previous = get().getState(threadId);
    if (previous === state) return;

    const states = new Map(get().states);
    states.set(threadId, state);
    set({ states });
    await persistStates(states);

    if (state === "resolved") {
      completeTasksForThread(threadId);
    }
  },

  bulkSetState: async (threadIds, state) => {
    const states = new Map(get().states);

    for (const id of threadIds) {
      states.set(id, state);
    }

    set({ states });
    await persistStates(states);

    if (state === "resolved") {
      for (const id of threadIds) {
        completeTasksForThread(id);
      }
    }
  },

  reconcileWithFigma: (threads) => {
    const states = new Map(get().states);
    const overridden: string[] = [];

    for (const t of threads) {
      const native = figmaStatus(t);
      const local = states.get(t.id);

      if (!local) {
        states.set(t.id, native);
        continue;
      }

      if (native === "resolved" && isIntermediate(local)) {
        states.set(t.id, "resolved");
        overridden.push(t.id);
      } else if (native === "open" && local === "resolved") {
        states.set(t.id, "open");
        overridden.push(t.id);
      }
    }

    if (overridden.length > 0) {
      set({ states });
      persistStates(states);
      const count = overridden.length;
      showToast(
        `${count} thread${count > 1 ? "s were" : " was"} updated in Figma and ${count > 1 ? "their" : "its"} local state has been synced.`,
        "info",
      );
    }
  },

  cleanup: (existingThreadIds) => {
    const states = new Map(get().states);
    let changed = false;
    for (const id of states.keys()) {
      if (!existingThreadIds.has(id)) {
        states.delete(id);
        changed = true;
      }
    }
    if (changed) {
      set({ states });
      persistStates(states);
    }
  },
}));
