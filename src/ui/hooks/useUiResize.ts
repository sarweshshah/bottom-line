import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import {
  MIN_UI_WIDTH,
  MAX_UI_WIDTH,
  MIN_UI_HEIGHT,
  MAX_UI_HEIGHT,
} from "@shared/constants";

export const UI_RESIZE_HIT_AREA_PX = 8;

type ResizeDirection = "width" | "height" | "both";

interface ResizeDragState {
  pointerId: number;
  direction: ResizeDirection;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
}

export function useUiResize() {
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

  return { startResize };
}
