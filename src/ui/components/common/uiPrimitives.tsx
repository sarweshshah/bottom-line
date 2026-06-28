import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";
import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff, Info, type LucideIcon } from "lucide-react";
import { cn } from "@ui/lib/cn";
import { useAnchoredOverlayPosition } from "@ui/hooks/useAnchoredOverlayPosition";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "bordered"
  | "danger"
  | "icon"
  | "ghost";

export type ControlSize = "sm" | "md" | "compact";

export type IconButtonVariant = "default" | "danger" | "toolbar" | "nav";

function buttonClass(
  variant: ButtonVariant,
  size: ControlSize,
  joined: boolean,
): string {
  if (joined) {
    switch (variant) {
      case "primary":
        return cn(
          "flex h-full shrink-0 items-center", // layout
          "px-2.5", // size
          "text-xs font-medium leading-none text-white", // typography
          "bg-accent-bg", // bg
          "border-l border-figma-border", // border
          "transition-all duration-150", // transition / animation
          "hover:bg-accent-hover disabled:opacity-40", // interactive states
        );
      case "secondary":
        return cn(
          "flex h-full shrink-0 items-center", // layout
          "px-2.5", // size
          "text-xs font-medium leading-none text-figma-text-secondary", // typography
          "bg-figma-bg-secondary", // bg
          "border-l border-figma-border", // border
          "transition-all duration-150", // transition / animation
          "hover:text-figma-text disabled:opacity-40", // interactive states
        );
      case "icon":
        return cn(
          "flex h-full shrink-0 items-center justify-center", // layout
          "px-2", // size
          "text-figma-icon-secondary", // typography
          "border-l border-figma-border", // border
          "transition-colors", // transition / animation
          "hover:bg-figma-bg-secondary hover:text-figma-icon disabled:opacity-40", // interactive states
        );
      default:
        return "";
    }
  }

  const sizeClass = cn(
    size === "md" ? "px-4 py-2.5" : size === "compact" ? "px-3 py-1.5" : "px-2.5 py-2", // size
    size === "md" ? "text-sm" : "text-xs", // typography
    "rounded-md", // corner radius
  );

  const base = cn(
    sizeClass,
    "font-medium", // typography
    "transition-all duration-150", // transition / animation
    "disabled:opacity-40", // interactive states
  );

  switch (variant) {
    case "primary":
      return cn(
        base,
        "text-white", // typography
        "bg-accent-bg", // bg
        "shadow-sem-sm", // shadow
        "active:scale-[0.98]", // transition / animation
        "hover:bg-accent-hover", // interactive states
      );
    case "secondary":
      return cn(
        base,
        "text-figma-text-secondary", // typography
        "bg-figma-bg-secondary", // bg
        "hover:text-figma-text", // interactive states
      );
    case "bordered":
      return cn(
        base,
        "text-figma-text", // typography
        "bg-figma-bg-secondary", // bg
        "border border-figma-border", // border
        "hover:bg-figma-bg-tertiary hover:border-figma-border-strong disabled:cursor-not-allowed", // interactive states
      );
    case "danger":
      return cn(
        base,
        "text-danger", // typography
        "bg-danger-bg", // bg
        "hover:opacity-90", // interactive states
      );
    case "icon":
      return cn(
        "p-1", // size
        "text-figma-icon-tertiary", // typography
        "rounded-md", // corner radius
        "transition-colors", // transition / animation
        "hover:bg-figma-bg-secondary hover:text-figma-icon disabled:opacity-40", // interactive states
      );
    case "ghost":
      return cn(
        "p-1.5", // size
        "text-figma-icon-tertiary", // typography
        "rounded-md", // corner radius
        "transition-colors", // transition / animation
        "hover:bg-figma-bg-tertiary hover:text-figma-icon", // interactive states
      );
    default:
      return base;
  }
}

function inputClass(size: ControlSize, joined: boolean): string {
  if (joined) {
    return cn(
      "h-full min-w-0 flex-1", // layout
      "px-2.5", // size
      "text-xs leading-none text-figma-text placeholder:text-figma-text-tertiary", // typography
      "bg-figma-bg", // bg
      "border-0", // border
      "focus:outline-none focus:ring-0", // interactive states
    );
  }

  const focus = cn(
    "focus:border-accent", // border
    "focus:outline-none focus:ring-1 focus:ring-accent-ring", // interactive states
  );

  if (size === "md") {
    return cn(
      "w-full", // layout
      "px-3 py-2", // size
      "text-xs text-figma-text placeholder:text-figma-text-disabled", // typography
      "bg-figma-bg-secondary", // bg
      "border border-figma-border", // border
      "rounded-md", // corner radius
      focus,
    );
  }

  return cn(
    "w-full", // layout
    "px-2.5 py-1.5", // size
    "text-xs text-figma-text placeholder:text-figma-text-tertiary", // typography
    "bg-figma-bg", // bg
    "border border-figma-border", // border
    "rounded-md", // corner radius
    focus,
  );
}

export function Button({
  variant = "secondary",
  controlSize = "sm",
  joined = false,
  fullWidth = false,
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  controlSize?: ControlSize;
  joined?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        buttonClass(variant, controlSize, joined),
        fullWidth && "w-full", // state variants
        (variant === "primary" || variant === "bordered") &&
          controlSize === "md" &&
          "flex items-center justify-center gap-2",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({
  controlSize = "sm",
  joined = false,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  controlSize?: ControlSize;
  joined?: boolean;
}) {
  return (
    <input
      className={cn(inputClass(controlSize, joined), className)}
      {...props}
    />
  );
}

export function SecretField({
  value,
  onChange,
  show,
  onToggleShow,
  controlSize = "md",
  className = "",
  inputClassName = "",
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  show: boolean;
  onToggleShow: () => void;
  controlSize?: ControlSize;
  inputClassName?: string;
}) {
  const iconSize = controlSize === "md" ? 14 : 12;

  return (
    <div
      className={cn(
        "relative", // layout
        className,
      )}
    >
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        controlSize={controlSize}
        className={cn(
          "pr-9", // size
          inputClassName,
        )}
        {...props}
      />
      <button
        type="button"
        onClick={onToggleShow}
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2", // layout
          "text-figma-icon-tertiary", // typography
          "hover:text-figma-icon-secondary", // interactive states
        )}
      >
        {show ? <EyeOff size={iconSize} /> : <Eye size={iconSize} />}
      </button>
    </div>
  );
}

export function Panel({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "p-3", // size
        "bg-figma-bg-secondary", // bg
        "border border-figma-border", // border
        "rounded-md", // corner radius
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DetailSection({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "pl-4 pr-3.5 pt-3 pb-4", // size
        "border-b border-figma-border", // border
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function ReplyThreadItem({
  isLast = false,
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { isLast?: boolean }) {
  return (
    <div
      className={cn(
        "relative", // layout
        "pl-7", // size
        !isLast && "pb-3", // state variants
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function TextLink({
  className = "",
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      className={cn(
        "inline-flex items-center gap-1", // layout
        "text-accent", // typography
        "hover:text-accent-text-hover hover:underline", // interactive states
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
}

const dataTooltipPanelClass = cn(
  "w-max max-w-[min(280px,calc(100vw-2rem))] py-3 px-3", // size
  "text-xs font-normal text-figma-text text-left", // typography
  "bg-sem-surface", // bg
  "shadow-sem-tooltip", // shadow
  "border border-sem-border-faint", // border
  "rounded-md", // corner radius
  "transition duration-150", // transition / animation
  "[html.figma-dark_&]:border-white/10 [html.figma-dark_&]:bg-[var(--bl-sem-tooltip-bg)] [html.figma-dark_&]:text-[var(--bl-sem-tooltip-text)]", // theme overrides
);

const TOOLTIP_HOVER_BRIDGE_MS = 80;

export function DataTooltip({
  content,
  align = "center",
  position = "top",
  className = "",
  tooltipId,
  children,
}: {
  content: ReactNode;
  align?: "left" | "right" | "center";
  position?: "top" | "bottom";
  className?: string;
  tooltipId?: string;
  children: ReactNode;
}) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | undefined>(undefined);
  const [open, setOpen] = useState(false);

  const coords = useAnchoredOverlayPosition({
    open,
    triggerRef,
    overlayRef: tooltipRef,
    align,
    placement: position,
  });

  const showTooltip = useCallback(() => {
    window.clearTimeout(closeTimerRef.current);
    setOpen(true);
  }, []);

  const hideTooltip = useCallback(() => {
    closeTimerRef.current = window.setTimeout(() => setOpen(false), TOOLTIP_HOVER_BRIDGE_MS);
  }, []);

  return (
    <>
      <span
        ref={triggerRef}
        className={cn(
          "relative inline-flex", // layout
          className,
        )}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            hideTooltip();
          }
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </span>
      {open &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            style={{
              position: "fixed",
              top: coords?.top ?? -9999,
              left: coords?.left ?? -9999,
              zIndex: 9999,
              visibility: coords ? "visible" : "hidden",
            }}
            className={cn(
              dataTooltipPanelClass,
              coords ? "scale-100 opacity-100" : "scale-95 opacity-0", // state variants
            )}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  );
}

export function InfoTooltip({
  id,
  label,
  content,
}: {
  id: string;
  label: string;
  content: ReactNode;
}) {
  return (
    <DataTooltip
      align="center"
      position="bottom"
      tooltipId={id}
      content={content}
    >
      <button
        type="button"
        className={cn(
          "p-0.5", // size
          "text-figma-icon-tertiary", // typography
          "rounded", // corner radius
          "hover:text-figma-icon-secondary focus:outline-none focus-visible:ring-1 focus-visible:ring-accent-ring", // interactive states
        )}
        aria-label={label}
        aria-describedby={id}
      >
        <Info size={13} strokeWidth={2} aria-hidden />
      </button>
    </DataTooltip>
  );
}

export function IconButton({
  variant = "default",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: IconButtonVariant;
}) {
  return (
    <button
      type="button"
      className={cn(
        variant === "danger" &&
          cn(
            "shrink-0", // layout
            "p-1.5", // size
            "text-figma-icon-secondary", // typography
            "rounded-md", // corner radius
            "transition-colors", // transition / animation
            "hover:bg-danger-bg hover:text-danger", // interactive states
          ),
        variant === "toolbar" &&
          cn(
            "p-1", // size
            "text-figma-icon-tertiary", // typography
            "rounded-md", // corner radius
            "transition-colors", // transition / animation
            "hover:bg-figma-bg-secondary hover:text-figma-icon disabled:opacity-40", // interactive states
          ),
        variant === "nav" &&
          cn(
            "flex shrink-0 items-center justify-center", // layout
            "h-9 w-9", // size
            "text-figma-icon-secondary", // typography
            "transition-colors", // transition / animation
            "hover:bg-figma-bg-hover", // interactive states
          ),
        variant === "default" &&
          cn(
            "p-1.5", // size
            "text-figma-icon-tertiary", // typography
            "rounded-md", // corner radius
            "transition-colors", // transition / animation
            "hover:bg-figma-bg-tertiary hover:text-figma-icon", // interactive states
          ),
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function FilterChip({
  active = false,
  tone = "filter",
  onClick,
  icon,
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  tone?: "filter" | "sort";
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1", // layout
        "px-2.5 py-1", // size
        "text-xs font-medium", // typography
        "rounded-md", // corner radius
        "transition-all duration-150", // transition / animation
        active
          ? cn( // state variants
              "bg-accent-bg", // bg
              "text-white", // typography
              "shadow-sem-sm", // shadow
            )
          : tone === "sort"
            ? cn(
                "bg-figma-bg-secondary", // bg
                "text-figma-text-secondary", // typography
                "shadow-sem-none", // shadow
                "hover:text-figma-text", // interactive states
              )
            : cn(
                "bg-figma-bg-secondary", // bg
                "text-figma-text-secondary", // typography
                "hover:text-figma-text", // interactive states
              ),
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

export function IconFilterChip({
  active = false,
  loading = false,
  onClick,
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  loading?: boolean;
}) {
  const engaged = active || loading;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-0.5", // layout
        "p-1.5", // size
        "rounded-md", // corner radius
        "transition-colors", // transition / animation
        engaged
          ? cn( // state variants
              "bg-accent-bg", // bg
              "text-white [&_svg]:text-white", // typography
              "shadow-sem-sm", // shadow
            )
          : cn(
              "text-figma-text-secondary", // typography
              "bg-figma-bg-secondary", // bg
              "hover:text-figma-text", // interactive states
            ),
        loading && "cursor-wait",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function SegmentedControl<T extends string | number>({
  value,
  onChange,
  options,
  variant = "spread",
  className = "",
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: ReactNode; icon?: LucideIcon }[];
  variant?: "spread" | "inline";
  className?: string;
}) {
  const wrapperClass =
    variant === "inline"
      ? cn(
          "inline-flex shrink-0 overflow-hidden", // layout
          "border border-figma-border", // border
          "rounded-md", // corner radius
        )
      : cn(
          "flex items-center gap-1.5", // layout
        );

  return (
    <div className={cn(wrapperClass, className)}>
      {options.map((opt, index) => {
        const Icon = opt.icon;
        const isActive = value === opt.value;
        return (
          <FilterChip
            key={String(opt.value)}
            active={isActive}
            onClick={() => onChange(opt.value)}
            icon={Icon ? <Icon size={12} /> : undefined}
            className={cn(
              variant === "inline" &&
                cn( // state variants
                  "py-1.5", // size
                  "tabular-nums", // typography
                  "shadow-sem-none", // shadow
                  "rounded-none", // corner radius
                ),
              variant === "inline" &&
                !isActive &&
                cn(
                  "bg-transparent", // bg
                  "hover:bg-figma-bg-secondary", // interactive states
                ),
              variant === "spread" &&
                cn(
                  "flex-1 justify-center gap-1.5", // layout
                  "py-2.5", // size
                ),
              variant === "inline" &&
                index > 0 &&
                cn(
                  "border-l border-figma-border", // border
                ),
            )}
          >
            {opt.label}
          </FilterChip>
        );
      })}
    </div>
  );
}

export function InputGroup({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-stretch overflow-hidden", // layout
        "h-8", // size
        "border border-figma-border", // border
        "rounded-md", // corner radius
        "transition-colors", // transition / animation
        "focus-within:border-accent focus-within:ring-1 focus-within:ring-accent-ring", // interactive states
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function InputDisplay({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex h-full min-w-0 flex-1 items-center", // layout
        "px-2.5", // size
        "text-xs leading-none", // typography
        "bg-figma-bg", // bg
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
