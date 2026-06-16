import {
  useCallback,
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { InitDataMessage, UIMessage } from "@shared/messages";
import {
  MIN_UI_WIDTH,
  MAX_UI_WIDTH,
  MIN_UI_HEIGHT,
  MAX_UI_HEIGHT,
} from "@shared/constants";
import { useAuthStore } from "@ui/store/authStore";
import { useCommentsStore } from "@ui/store/commentsStore";
import { SetupScreen } from "@ui/components/setup/SetupScreen";
import { ReconnectScreen } from "@ui/components/reconnect/ReconnectScreen";
import { DashboardLayout } from "@ui/components/dashboard/DashboardLayout";
import { SettingsScreen } from "@ui/components/settings/SettingsScreen";
import { ToastContainer } from "@ui/components/common/Toast";
import { ConsentDialog } from "@ui/components/common/ConsentDialog";
import { LoadingSpinner } from "@ui/components/common/LoadingSpinner";
import { useAIStore } from "@ui/store/aiStore";
import { useFilterStore } from "@ui/store/filterStore";

const THEME_COLORS_LIGHT: Record<string, string> = {
  "--figma-color-bg": "#ffffff",
  "--figma-color-bg-secondary": "#f6f5f8",
  "--figma-color-bg-tertiary": "#ebe9ef",
  "--figma-color-bg-hover": "#f0f0f7",
  "--figma-color-bg-selected": "#ebebf6",
  "--figma-color-text": "#333333",
  "--figma-color-text-secondary": "#6f6b78",
  "--figma-color-text-tertiary": "#9a96a3",
  "--figma-color-text-disabled": "#c4c0ca",
  "--figma-color-border": "#e8e6ec",
  "--figma-color-border-strong": "#d4d0da",
  "--figma-color-icon": "#333333",
  "--figma-color-icon-secondary": "#6f6b78",
  "--figma-color-icon-tertiary": "#b0acb8",
};

const THEME_COLORS_DARK: Record<string, string> = {
  "--figma-color-bg": "#222226",
  "--figma-color-bg-secondary": "#323238",
  "--figma-color-bg-tertiary": "#404048",
  "--figma-color-bg-hover": "#3a3a42",
  "--figma-color-bg-selected": "#454562",
  "--figma-color-text": "#f2f0f5",
  "--figma-color-text-secondary": "#d1d3e5",
  "--figma-color-text-tertiary": "#b7b8d1",
  "--figma-color-text-disabled": "#9495b4",
  "--figma-color-border": "#45454c",
  "--figma-color-border-strong": "#5c5866",
  "--figma-color-icon": "#f2f0f5",
  "--figma-color-icon-secondary": "#d1d3e5",
  "--figma-color-icon-tertiary": "#b7b8d1",
};

const ALL_THEME_VARS = Object.keys(THEME_COLORS_LIGHT);

let figmaOriginalThemeClass: "figma-dark" | "figma-light" | null = null;

function snapshotFigmaTheme() {
  if (figmaOriginalThemeClass !== null) return;
  const root = document.documentElement;
  if (root.classList.contains("figma-dark")) {
    figmaOriginalThemeClass = "figma-dark";
  } else {
    figmaOriginalThemeClass = "figma-light";
  }
}

function applyTheme(pref: "system" | "light" | "dark") {
  const root = document.documentElement;
  snapshotFigmaTheme();

  if (pref === "system") {
    ALL_THEME_VARS.forEach((v) => root.style.removeProperty(v));
    root.classList.remove("theme-override");
    root.classList.remove("figma-dark", "figma-light");
    if (figmaOriginalThemeClass) {
      root.classList.add(figmaOriginalThemeClass);
    }
    return;
  }

  const colors = pref === "dark" ? THEME_COLORS_DARK : THEME_COLORS_LIGHT;
  for (const [prop, value] of Object.entries(colors)) {
    root.style.setProperty(prop, value);
  }

  root.classList.add("theme-override");
  if (pref === "dark") {
    root.classList.add("figma-dark");
    root.classList.remove("figma-light");
  } else {
    root.classList.add("figma-light");
    root.classList.remove("figma-dark");
  }
}

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

function applyMotion(pref: "system" | "reduce" | "allow") {
  const root = document.documentElement;
  if (pref === "system") {
    root.removeAttribute("data-motion");
  } else {
    root.setAttribute("data-motion", pref);
  }
}

export function App() {
  const { screen, initFromSandbox, showDashboard, themePreference, motionPreference } =
    useAuthStore();
  const resizeDragStateRef = useRef<ResizeDragState | null>(null);

  useEffect(() => {
    applyTheme(themePreference);
  }, [themePreference]);

  useEffect(() => {
    applyMotion(motionPreference);
  }, [motionPreference]);

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
    window.addEventListener("pointermove", handleResizeMove, { passive: true });
    window.addEventListener("pointerup", stopResize, { passive: true });
    window.addEventListener("pointercancel", stopResize, { passive: true });
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
          useCommentsStore.getState().initializeCacheTTL(msg.cacheTTLMinutes);
          useCommentsStore.getState().setCurrentPageId(msg.currentPageId);
          useAIStore.getState().initFromStorage();
          useFilterStore.getState().initFromStorage();
          useAuthStore.getState().fetchFileName();
          break;
        case "PAGE_CHANGED":
          useCommentsStore.getState().setCurrentPageId(msg.pageId);
          break;
        case "PAGE_THREADS_RESOLVED":
          useCommentsStore
            .getState()
            .setCurrentPageThreadIds(msg.requestId, msg.threadIds);
          break;
        case "THREAD_PAGE_MAP_CHUNK":
          useCommentsStore
            .getState()
            .appendThreadPageMapChunk(
              msg.requestId,
              msg.mappings,
              msg.done,
            );
          break;
      }
    }

    window.addEventListener("message", handleMessage);
    parent.postMessage({ pluginMessage: { type: "REQUEST_INIT" } }, "*");
    return () => window.removeEventListener("message", handleMessage);
  }, [initFromSandbox]);

  return (
    <div className="relative h-full w-full flex flex-col">
      <div className="flex-1 min-h-0 flex flex-col relative">
        {screen === "loading" && <LoadingSpinner message="Initializing..." />}
        {screen === "setup" && <SetupScreen />}
        {screen === "reconnect" && <ReconnectScreen />}
        {screen === "dashboard" && <DashboardLayout />}
        {screen === "settings" && <SettingsScreen onBack={showDashboard} />}
      </div>
      <ToastContainer />
      <ConsentDialog />
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
