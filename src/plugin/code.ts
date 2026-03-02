import type {
  SandboxMessage,
  NavigateResultMessage,
  StorageResultMessage,
  InitDataMessage,
} from "@shared/messages";
import type { ClientMeta } from "@shared/types";

figma.showUI(__html__, {
  width: 420,
  height: 720,
  themeColors: true,
});

async function sendInitData() {
  const [pat, fileKey, fileUrl, userName, userAvatarUrl, userId] =
    await Promise.all([
      figma.clientStorage.getAsync("pat"),
      figma.clientStorage.getAsync("fileKey"),
      figma.clientStorage.getAsync("fileUrl"),
      figma.clientStorage.getAsync("userName"),
      figma.clientStorage.getAsync("userAvatarUrl"),
      figma.clientStorage.getAsync("userId"),
    ]);

  const msg: InitDataMessage = {
    type: "INIT_DATA",
    pat: pat ?? null,
    fileKey: fileKey ?? null,
    fileUrl: fileUrl ?? null,
    userName: userName ?? null,
    userAvatarUrl: userAvatarUrl ?? null,
    userId: userId ?? null,
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

async function navigateToComment(clientMeta: ClientMeta) {
  try {
    if ("node_id" in clientMeta) {
      const node = await figma.getNodeByIdAsync(clientMeta.node_id);
      if (!node) {
        const result: NavigateResultMessage = {
          type: "NAVIGATE_RESULT",
          success: false,
          error:
            "The element this comment was attached to no longer exists.",
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
          error:
            err instanceof Error ? err.message : "Storage read failed",
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
          error:
            err instanceof Error ? err.message : "Storage write failed",
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
          error:
            err instanceof Error ? err.message : "Storage delete failed",
        };
        figma.ui.postMessage(result);
      }
      break;
    }

    case "NAVIGATE_TO_COMMENT": {
      await navigateToComment(msg.clientMeta);
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
  }
};

sendInitData();
