const MAX_REQUESTS_PER_MINUTE = 28; // slightly under Figma's ~30 to stay safe
const WINDOW_MS = 60_000;

const timestamps: number[] = [];
const queue: Array<{ execute: () => void }> = [];
let draining = false;

function cleanOldTimestamps() {
  const cutoff = Date.now() - WINDOW_MS;
  while (timestamps.length > 0 && timestamps[0] < cutoff) {
    timestamps.shift();
  }
}

function tryDrainQueue() {
  if (draining) return;
  draining = true;

  const drain = () => {
    cleanOldTimestamps();
    while (queue.length > 0 && timestamps.length < MAX_REQUESTS_PER_MINUTE) {
      const item = queue.shift()!;
      timestamps.push(Date.now());
      item.execute();
    }

    if (queue.length > 0) {
      const oldestTimestamp = timestamps[0];
      const waitMs = oldestTimestamp + WINDOW_MS - Date.now() + 50;
      setTimeout(drain, Math.max(waitMs, 100));
    } else {
      draining = false;
    }
  };

  drain();
}

export function rateLimitedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    queue.push({
      execute: () => {
        fetch(input, init).then(resolve, reject);
      },
    });
    tryDrainQueue();
  });
}
