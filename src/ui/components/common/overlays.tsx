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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
      onClick={onBackdropClick}
    >
      <div
        className={cn(
          "bg-figma-bg rounded-xl shadow-sem-xl w-[340px] max-w-[90vw] border border-figma-border overflow-hidden",
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
        "flex items-center justify-between px-4 py-3 border-b border-figma-border bg-figma-bg-secondary",
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
    <div className="flex items-center gap-2">
      <Icon size={16} className={iconClassName} />
      <span className="text-sm font-semibold text-figma-text">{children}</span>
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
  return <div className={cn("px-4 py-4 space-y-3", className)}>{children}</div>;
}

export function ModalNoticePanel({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <Panel className={cn("p-3", className)}>
      <p className="text-[11px] text-figma-text-tertiary leading-relaxed">
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
        "flex justify-end gap-2 px-4 py-3 border-t border-figma-border",
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
        "absolute top-full mt-1 bg-figma-bg border border-figma-border rounded-md shadow-sem-lg z-20",
        align === "right" ? "right-0" : "left-0",
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
        "w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-figma-bg-hover transition-colors text-left",
        layout === "split" && "justify-between",
        active ? "text-accent font-medium" : "text-figma-text-secondary",
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
