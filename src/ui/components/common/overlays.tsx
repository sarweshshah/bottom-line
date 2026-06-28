import { useRef, type ReactNode } from "react";
import { cn } from "@ui/lib/cn";
import { useClickOutside } from "@ui/hooks/useClickOutside";
import { Panel } from "@ui/components/common/uiPrimitives";
import type { LucideIcon } from "lucide-react";

export function Modal({
  className = "",
  children,
  onBackdropClick,
}: {
  className?: string;
  children: ReactNode;
  onBackdropClick?: () => void;
}) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center", // layout
        "bg-black/50", // bg
      )}
      onClick={onBackdropClick}
    >
      <div
        className={cn(
          "overflow-hidden", // layout
          "w-[340px] max-w-[90vw]", // size
          "bg-figma-bg", // bg
          "shadow-sem-xl", // shadow
          "border border-figma-border", // border
          "rounded-xl", // corner radius
          // className
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3", // layout
        "bg-figma-bg-secondary", // bg
        "border-b border-figma-border", // border
        // className
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ModalTitle({
  icon: Icon,
  iconClassName = "",
  children,
}: {
  icon: LucideIcon;
  iconClassName?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2", // layout
      )}
    >
      <Icon size={16} className={iconClassName} />
      <span
        className={cn(
          "text-sm font-semibold text-figma-text", // typography
        )}
      >
        {children}
      </span>
    </div>
  );
}

export function ModalBody({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "px-4 py-4 space-y-3", // layout
        // className
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ModalNoticePanel({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <Panel
      className={cn(
        "p-3", // layout
        // className
        className,
      )}
    >
      <p
        className={cn(
          "text-[11px] text-figma-text-tertiary leading-relaxed", // typography
        )}
      >
        {children}
      </p>
    </Panel>
  );
}

export function ModalFooter({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex justify-end gap-2 px-4 py-3", // layout
        "border-t border-figma-border", // border
        // className
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuPanel({
  className = "",
  children,
  align = "left",
}: {
  className?: string;
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "absolute top-full mt-1 z-20 py-1", // layout
        "w-max", // size
        "bg-figma-bg", // bg
        "shadow-sem-lg", // shadow
        "border border-figma-border", // border
        "rounded-md", // corner radius
        align === "right" ? "right-0" : "left-0", // state variants
        // className
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  active = false,
  onClick,
  icon: Icon,
  layout = "default",
  className = "",
  children,
}: {
  active?: boolean;
  onClick: () => void;
  icon?: LucideIcon;
  layout?: "default" | "split";
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-1.5 text-left", // layout
        "text-xs whitespace-nowrap", // typography
        "transition-colors", // transition / animation
        "hover:bg-figma-bg-hover", // interactive states
        layout === "split" && "justify-between", // state variants
        active ? "text-accent font-medium" : "text-figma-text-secondary",
        // className
        className,
      )}
    >
      {Icon && <Icon size={12} />}
      {children}
    </button>
  );
}

export function DropdownMenu({
  open,
  onClose,
  align = "left",
  panelClassName = "",
  trigger,
  children,
}: {
  open: boolean;
  onClose: () => void;
  align?: "left" | "right";
  panelClassName?: string;
  trigger: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, onClose, open);

  return (
    <div className="relative" ref={ref}>
      {trigger}
      {open && (
        <DropdownMenuPanel align={align} className={panelClassName}>
          {children}
        </DropdownMenuPanel>
      )}
    </div>
  );
}
