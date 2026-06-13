import type {
  SandboxMessage,
  NavigateResultMessage,
  StorageResultMessage,
  InitDataMessage,
  PageChangedMessage,
  PageThreadsResolvedMessage,
} from "@shared/messages";
import type { ClientMeta, CacheTTLMinutes } from "@shared/types";
import { DEFAULT_UI_WIDTH, DEFAULT_UI_HEIGHT, clampUiSize } from "@shared/constants";

const DEFAULT_CACHE_TTL_MINUTES: CacheTTLMinutes = 5;
const CACHE_TTL_OPTIONS: CacheTTLMinutes[] = [5, 10, 15, 30];

figma.showUI(__html__, {
  width: DEFAULT_UI_WIDTH,
  height: DEFAULT_UI_HEIGHT,
  themeColors: true,
});

function normalizeCacheTTL(value: unknown): CacheTTLMinutes {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return DEFAULT_CACHE_TTL_MINUTES;
  }

  if (CACHE_TTL_OPTIONS.includes(value as CacheTTLMinutes)) {
    return value as CacheTTLMinutes;
  }

  // Support legacy persisted values in milliseconds.
  const asMinutes = Math.round(value / 60_000);
  if (CACHE_TTL_OPTIONS.includes(asMinutes as CacheTTLMinutes)) {
    return asMinutes as CacheTTLMinutes;
  }

  return DEFAULT_CACHE_TTL_MINUTES;
}

function isAllowedExternalUrl(href: string): boolean {
  if (href.startsWith("https://")) return true;
  if (
    href.startsWith("http://localhost/") ||
    href.startsWith("http://localhost:") ||
    href.startsWith("http://127.0.0.1/") ||
    href.startsWith("http://127.0.0.1:")
  ) {
    return true;
  }
  return false;
}

async function sendInitData() {
  const [
    pat,
    figmaAccessToken,
    figmaRefreshToken,
    figmaTokenExpiresAt,
    authMethodRaw,
    fileKey,
    fileUrl,
    userName,
    userAvatarUrl,
    userId,
    autoOpenComment,
    showThreadElbows,
    themePreference,
    cacheTTL,
  ] = await Promise.all([
    figma.clientStorage.getAsync("pat"),
    figma.clientStorage.getAsync("figmaAccessToken"),
    figma.clientStorage.getAsync("figmaRefreshToken"),
    figma.clientStorage.getAsync("figmaTokenExpiresAt"),
    figma.clientStorage.getAsync("authMethod"),
    figma.clientStorage.getAsync("fileKey"),
    figma.clientStorage.getAsync("fileUrl"),
    figma.clientStorage.getAsync("userName"),
    figma.clientStorage.getAsync("userAvatarUrl"),
    figma.clientStorage.getAsync("userId"),
    figma.clientStorage.getAsync("autoOpenComment"),
    figma.clientStorage.getAsync("showThreadElbows"),
    figma.clientStorage.getAsync("themePreference"),
    figma.clientStorage.getAsync("cacheTTL"),
  ]);

  let authMethod: "pat" | "oauth" | null =
    authMethodRaw === "oauth" || authMethodRaw === "pat" ? authMethodRaw : null;
  if (!authMethod && pat) authMethod = "pat";
  if (!authMethod && figmaAccessToken) authMethod = "oauth";

  const msg: InitDataMessage = {
    type: "INIT_DATA",
    pat: authMethod === "pat" ? pat ?? null : null,
    figmaAccessToken: authMethod === "oauth" ? figmaAccessToken ?? null : null,
    figmaRefreshToken: authMethod === "oauth" ? figmaRefreshToken ?? null : null,
    figmaTokenExpiresAt:
      authMethod === "oauth" && typeof figmaTokenExpiresAt === "number"
        ? figmaTokenExpiresAt
        : null,
    authMethod,
    fileKey: fileKey ?? null,
    fileUrl: fileUrl ?? null,
    userName: userName ?? null,
    userAvatarUrl: userAvatarUrl ?? null,
    userId: userId ?? null,
    autoOpenComment: autoOpenComment !== false,
    showThreadElbows: showThreadElbows === true,
    themePreference: (["system", "light", "dark"].includes(themePreference) ? themePreference : "system") as "system" | "light" | "dark",
    cacheTTLMinutes: normalizeCacheTTL(cacheTTL),
    currentPageId: figma.currentPage.id,
  };
  figma.ui.postMessage(msg);
}

function findPageForNode(node: BaseNode): PageNode | null {
  let current: BaseNode | null = node;
  while (current) {
    if (current.type === "PAGE") return current as PageNode;
    current = current.parent;
  }
  return null;
}

async function navigateToComment(clientMeta: ClientMeta, commentId: string) {
  try {
    if ("node_id" in clientMeta) {
      const node = await figma.getNodeByIdAsync(clientMeta.node_id);
      if (!node) {
        const result: NavigateResultMessage = {
          type: "NAVIGATE_RESULT",
          success: false,
          error: "The element this comment was attached to no longer exists.",
        };
        figma.ui.postMessage(result);
        return;
      }

      const targetPage = findPageForNode(node);
      if (targetPage && targetPage !== figma.currentPage) {
        await figma.setCurrentPageAsync(targetPage);
      }

      figma.viewport.scrollAndZoomIntoView([node]);
    } else if ("x" in clientMeta && "y" in clientMeta) {
      figma.viewport.center = { x: clientMeta.x, y: clientMeta.y };
      figma.viewport.zoom = 1;
    }

    const autoOpen = await figma.clientStorage.getAsync("autoOpenComment");
    if (autoOpen !== false) {
      figma.notify("Click the comment pin on the canvas to open the thread", {
        timeout: 4000,
      });
    }

    const result: NavigateResultMessage = {
      type: "NAVIGATE_RESULT",
      success: true,
    };
    figma.ui.postMessage(result);
  } catch (err) {
    const result: NavigateResultMessage = {
      type: "NAVIGATE_RESULT",
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to navigate to comment",
    };
    figma.ui.postMessage(result);
  }
}

figma.ui.onmessage = async (msg: SandboxMessage) => {
  switch (msg.type) {
    case "GET_STORAGE": {
      try {
        const value = await figma.clientStorage.getAsync(msg.key);
        const result: StorageResultMessage = {
          type: "STORAGE_RESULT",
          requestId: msg.requestId,
          value: value ?? null,
        };
        figma.ui.postMessage(result);
      } catch (err) {
        const result: StorageResultMessage = {
          type: "STORAGE_RESULT",
          requestId: msg.requestId,
          value: null,
          error: err instanceof Error ? err.message : "Storage read failed",
        };
        figma.ui.postMessage(result);
      }
      break;
    }

    case "SET_STORAGE": {
      try {
        await figma.clientStorage.setAsync(msg.key, msg.value);
        const result: StorageResultMessage = {
          type: "STORAGE_RESULT",
          requestId: msg.requestId,
          value: msg.value,
        };
        figma.ui.postMessage(result);
      } catch (err) {
        const result: StorageResultMessage = {
          type: "STORAGE_RESULT",
          requestId: msg.requestId,
          value: null,
          error: err instanceof Error ? err.message : "Storage write failed",
        };
        figma.ui.postMessage(result);
      }
      break;
    }

    case "DELETE_STORAGE": {
      try {
        await figma.clientStorage.deleteAsync(msg.key);
        const result: StorageResultMessage = {
          type: "STORAGE_RESULT",
          requestId: msg.requestId,
          value: null,
        };
        figma.ui.postMessage(result);
      } catch (err) {
        const result: StorageResultMessage = {
          type: "STORAGE_RESULT",
          requestId: msg.requestId,
          value: null,
          error: err instanceof Error ? err.message : "Storage delete failed",
        };
        figma.ui.postMessage(result);
      }
      break;
    }

    case "NAVIGATE_TO_COMMENT": {
      await navigateToComment(msg.clientMeta, msg.commentId);
      break;
    }

    case "NOTIFY": {
      figma.notify(msg.message, { error: msg.error });
      break;
    }

    case "REQUEST_INIT": {
      await sendInitData();
      break;
    }

    case "OPEN_EXTERNAL": {
      if (!isAllowedExternalUrl(msg.url)) {
        figma.notify("This link cannot be opened from the plugin.", {
          error: true,
        });
        break;
      }
      figma.openExternal(msg.url);
      break;
    }

    case "RESIZE_UI": {
      const next = clampUiSize(msg.width, msg.height);
      figma.ui.resize(next.width, next.height);
      break;
    }

    case "RESOLVE_PAGE_THREADS": {
      const pageNodeIds = new Set<string>([figma.currentPage.id]);
      for (const node of figma.currentPage.findAll()) {
        pageNodeIds.add(node.id);
      }

      const matched: string[] = [];
      for (const entry of msg.threads) {
        if (pageNodeIds.has(entry.nodeId)) {
          matched.push(entry.threadId);
        }
      }
      const resolved: PageThreadsResolvedMessage = {
        type: "PAGE_THREADS_RESOLVED",
        requestId: msg.requestId,
        threadIds: matched,
      };
      figma.ui.postMessage(resolved);
      break;
    }
  }
};

figma.on("currentpagechange", () => {
  const changed: PageChangedMessage = {
    type: "PAGE_CHANGED",
    pageId: figma.currentPage.id,
  };
  figma.ui.postMessage(changed);
});

sendInitData();
