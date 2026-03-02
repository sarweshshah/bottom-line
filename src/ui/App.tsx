import {
  useCallback,
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { InitDataMessage, UIMessage } from "@shared/messages";
import { useAuthStore } from "@ui/store/authStore";
import { useCommentsStore } from "@ui/store/commentsStore";
import { SetupScreen } from "@ui/components/setup/SetupScreen";
import { ReconnectScreen } from "@ui/components/reconnect/ReconnectScreen";
import { DashboardLayout } from "@ui/components/dashboard/DashboardLayout";
import { SettingsScreen } from "@ui/components/settings/SettingsScreen";
import { ToastContainer } from "@ui/components/common/Toast";
import { LoadingSpinner } from "@ui/components/common/LoadingSpinner";

const MIN_UI_WIDTH = 420;
const MAX_UI_WIDTH = 540;
const MIN_UI_HEIGHT = 640;
const MAX_UI_HEIGHT = 800;
const RESIZE_HIT_AREA_PX = 8;

type ResizeDirection = "width" | "height" | "both";

interface ResizeDragState {
  pointerId: number;
  direction: ResizeDirection;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
}

export function App() {
  const { screen, initFromSandbox, showDashboard } = useAuthStore();
  const resizeDragStateRef = useRef<ResizeDragState | null>(null);

  const sendResize = useCallback((width: number, height: number) => {
    parent.postMessage(
      {
        pluginMessage: {
          type: "RESIZE_UI",
          width: Math.min(
            MAX_UI_WIDTH,
            Math.max(MIN_UI_WIDTH, Math.round(width)),
          ),
          height: Math.min(
            MAX_UI_HEIGHT,
            Math.max(MIN_UI_HEIGHT, Math.round(height)),
          ),
        },
      },
      "*",
    );
  }, []);

  const stopResize = useCallback(() => {
    resizeDragStateRef.current = null;
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  }, []);

  const handleResizeMove = useCallback(
    (event: PointerEvent) => {
      const drag = resizeDragStateRef.current;
      if (!drag) return;
      if (event.pointerId !== drag.pointerId) return;

      const deltaX = event.clientX - drag.startX;
      const deltaY = event.clientY - drag.startY;

      const width =
        drag.direction === "height"
          ? drag.startWidth
          : Math.min(
              MAX_UI_WIDTH,
              Math.max(MIN_UI_WIDTH, drag.startWidth + deltaX),
            );
      const unclampedHeight =
        drag.direction === "width"
          ? drag.startHeight
          : Math.max(MIN_UI_HEIGHT, drag.startHeight + deltaY);
      const height = Math.min(MAX_UI_HEIGHT, unclampedHeight);

      sendResize(width, height);
    },
    [sendResize],
  );

  useEffect(() => {
    window.addEventListener("pointermove", handleResizeMove);
    window.addEventListener("pointerup", stopResize);
    window.addEventListener("pointercancel", stopResize);
    return () => {
      window.removeEventListener("pointermove", handleResizeMove);
      window.removeEventListener("pointerup", stopResize);
      window.removeEventListener("pointercancel", stopResize);
      stopResize();
    };
  }, [handleResizeMove, stopResize]);

  const startResize = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>, direction: ResizeDirection) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      resizeDragStateRef.current = {
        pointerId: event.pointerId,
        direction,
        startX: event.clientX,
        startY: event.clientY,
        startWidth: window.innerWidth,
        startHeight: window.innerHeight,
      };
      document.body.style.userSelect = "none";
      document.body.style.cursor =
        direction === "both"
          ? "nwse-resize"
          : direction === "width"
            ? "ew-resize"
            : "ns-resize";
    },
    [],
  );

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const msg = event.data?.pluginMessage as UIMessage | undefined;
      if (!msg) return;

      switch (msg.type) {
        case "INIT_DATA":
          initFromSandbox(msg as InitDataMessage);
          useCommentsStore
            .getState()
            .initializeCacheTTL(msg.cacheTTLMinutes);
          useCommentsStore.getState().setCurrentPageId(msg.currentPageId);
          break;
        case "PAGE_CHANGED":
          useCommentsStore.getState().setCurrentPageId(msg.pageId);
          break;
        case "PAGE_THREADS_RESOLVED":
          useCommentsStore.getState().setCurrentPageThreadIds(msg.threadIds);
          break;
      }
    }

    window.addEventListener("message", handleMessage);
    parent.postMessage({ pluginMessage: { type: "REQUEST_INIT" } }, "*");
    return () => window.removeEventListener("message", handleMessage);
  }, [initFromSandbox]);

  return (
    <div className="relative h-full w-full">
      {screen === "loading" && <LoadingSpinner message="Initializing..." />}
      {screen === "setup" && <SetupScreen />}
      {screen === "reconnect" && <ReconnectScreen />}
      {screen === "dashboard" && <DashboardLayout />}
      {screen === "settings" && <SettingsScreen onBack={showDashboard} />}
      <ToastContainer />
      <div
        aria-hidden="true"
        className="absolute right-0 top-0 z-50"
        onPointerDown={(event) => startResize(event, "width")}
        style={{
          width: RESIZE_HIT_AREA_PX,
          height: `calc(100% - ${RESIZE_HIT_AREA_PX}px)`,
          cursor: "ew-resize",
          touchAction: "none",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 z-50"
        onPointerDown={(event) => startResize(event, "height")}
        style={{
          width: `calc(100% - ${RESIZE_HIT_AREA_PX}px)`,
          height: RESIZE_HIT_AREA_PX,
          cursor: "ns-resize",
          touchAction: "none",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 right-0 z-50"
        onPointerDown={(event) => startResize(event, "both")}
        style={{
          width: RESIZE_HIT_AREA_PX * 2,
          height: RESIZE_HIT_AREA_PX * 2,
          cursor: "nwse-resize",
          touchAction: "none",
        }}
      />
    </div>
  );
}
