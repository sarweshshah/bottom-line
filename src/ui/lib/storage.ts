import type {
  GetStorageMessage,
  SetStorageMessage,
  DeleteStorageMessage,
  StorageResultMessage,
} from "@shared/messages";

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
};

const pending = new Map<string, PendingRequest>();
let counter = 0;

function nextRequestId(): string {
  return `storage_${++counter}_${Date.now()}`;
}

type StorageMessage = GetStorageMessage | SetStorageMessage | DeleteStorageMessage;

function postToSandbox(msg: StorageMessage) {
  parent.postMessage({ pluginMessage: msg }, "*");
}

window.addEventListener("message", (event) => {
  const msg = event.data?.pluginMessage as StorageResultMessage | undefined;
  if (!msg || msg.type !== "STORAGE_RESULT") return;

  const req = pending.get(msg.requestId);
  if (!req) return;
  pending.delete(msg.requestId);

  if (msg.error) {
    req.reject(new Error(msg.error));
  } else {
    req.resolve(msg.value);
  }
});

function sendRequest(msg: StorageMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    pending.set(msg.requestId, { resolve, reject });
    postToSandbox(msg);

    setTimeout(() => {
      if (pending.has(msg.requestId)) {
        pending.delete(msg.requestId);
        reject(new Error("Storage request timed out"));
      }
    }, 5000);
  });
}

export async function getStorage<T = unknown>(key: string): Promise<T | null> {
  const value = await sendRequest({ type: "GET_STORAGE", key, requestId: nextRequestId() });
  return (value as T) ?? null;
}

export async function setStorage(key: string, value: unknown): Promise<void> {
  await sendRequest({ type: "SET_STORAGE", key, value, requestId: nextRequestId() });
}

export async function deleteStorage(key: string): Promise<void> {
  await sendRequest({ type: "DELETE_STORAGE", key, requestId: nextRequestId() });
}
