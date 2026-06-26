import type { PointerEvent as ReactPointerEvent } from "react";
import { UI_RESIZE_HIT_AREA_PX } from "@ui/hooks/useUiResize";

type UiResizeHandlesProps = {
  onStartResize: (
    event: ReactPointerEvent<HTMLDivElement>,
    direction: "width" | "height" | "both",
  ) => void;
};

export function UiResizeHandles({ onStartResize }: UiResizeHandlesProps) {
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute right-0 top-0 z-50"
        onPointerDown={(event) => onStartResize(event, "width")}
        style={{
          width: UI_RESIZE_HIT_AREA_PX,
          height: `calc(100% - ${UI_RESIZE_HIT_AREA_PX}px)`,
          cursor: "ew-resize",
          touchAction: "none",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 z-50"
        onPointerDown={(event) => onStartResize(event, "height")}
        style={{
          width: `calc(100% - ${UI_RESIZE_HIT_AREA_PX}px)`,
          height: UI_RESIZE_HIT_AREA_PX,
          cursor: "ns-resize",
          touchAction: "none",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 right-0 z-50"
        onPointerDown={(event) => onStartResize(event, "both")}
        style={{
          width: UI_RESIZE_HIT_AREA_PX * 2,
          height: UI_RESIZE_HIT_AREA_PX * 2,
          cursor: "nwse-resize",
          touchAction: "none",
        }}
      />
    </>
  );
}
