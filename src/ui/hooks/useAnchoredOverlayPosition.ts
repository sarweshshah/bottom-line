import { useLayoutEffect, useState, type RefObject } from "react";

type Align = "left" | "right" | "center";
type Placement = "top" | "bottom";

interface UseAnchoredOverlayPositionOptions {
  open: boolean;
  triggerRef: RefObject<HTMLElement | null>;
  overlayRef: RefObject<HTMLElement | null>;
  align: Align;
  placement: Placement;
  offset?: number;
  padding?: number;
  flip?: boolean;
}

export function useAnchoredOverlayPosition({
  open,
  triggerRef,
  overlayRef,
  align,
  placement,
  offset = 6,
  padding = 8,
  flip = true,
}: UseAnchoredOverlayPositionOptions) {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }

    const update = () => {
      const trigger = triggerRef.current;
      const overlay = overlayRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const overlayRect = overlay?.getBoundingClientRect();
      const overlayWidth = overlayRect?.width ?? 0;
      const overlayHeight = overlayRect?.height ?? 0;

      let resolvedPlacement = placement;
      if (flip && overlayHeight > 0) {
        const topSpace = rect.top - padding;
        const bottomSpace = window.innerHeight - rect.bottom - padding;
        if (
          placement === "top" &&
          overlayHeight + offset > topSpace &&
          bottomSpace > topSpace
        ) {
          resolvedPlacement = "bottom";
        } else if (
          placement === "bottom" &&
          overlayHeight + offset > bottomSpace &&
          topSpace > bottomSpace
        ) {
          resolvedPlacement = "top";
        }
      }

      const measuredWidth = overlayWidth || 280;
      const measuredHeight = overlayHeight || 0;

      let top =
        resolvedPlacement === "top"
          ? rect.top - offset - measuredHeight
          : rect.bottom + offset;

      let left: number;
      if (align === "right") {
        left = rect.right - measuredWidth;
      } else if (align === "left") {
        left = rect.left;
      } else {
        left = rect.left + rect.width / 2 - measuredWidth / 2;
      }

      left = Math.max(
        padding,
        Math.min(left, window.innerWidth - measuredWidth - padding),
      );

      if (measuredHeight > 0) {
        top = Math.max(
          padding,
          Math.min(top, window.innerHeight - measuredHeight - padding),
        );
      }

      setCoords({ top, left });
    };

    update();
    const raf = requestAnimationFrame(update);

    const overlay = overlayRef.current;
    const resizeObserver =
      overlay && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(update)
        : null;
    if (overlay) {
      resizeObserver?.observe(overlay);
    }

    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      resizeObserver?.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, align, placement, offset, padding, flip, triggerRef, overlayRef]);

  return coords;
}
