import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";
import { Eye, EyeOff, Info, type LucideIcon } from "lucide-react";
import { cn } from "@ui/lib/cn";

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
    const base =
      "flex h-full shrink-0 items-center text-xs font-medium leading-none disabled:opacity-40 border-l border-figma-border transition-all duration-150";
    switch (variant) {
      case "primary":
        return `${base} px-2.5 bg-accent-bg text-white hover:bg-accent-hover`;
      case "secondary":
        return `${base} px-2.5 bg-figma-bg-secondary text-figma-text-secondary hover:text-figma-text`;
      case "icon":
        return "flex h-full shrink-0 items-center justify-center border-l border-figma-border px-2 text-figma-icon-secondary hover:bg-figma-bg-secondary hover:text-figma-icon disabled:opacity-40 transition-colors";
      default:
        return "";
    }
  }

  const sizeClass =
    size === "md"
      ? "px-4 py-2.5 text-sm rounded-md"
      : size === "compact"
        ? "px-3 py-1.5 text-xs rounded-md"
        : "px-2.5 py-2 text-xs rounded-md";

  const base = `${sizeClass} font-medium disabled:opacity-40 transition-all duration-150`;

  switch (variant) {
    case "primary":
      return `${base} bg-accent-bg text-white shadow-sem-sm hover:bg-accent-hover active:scale-[0.98]`;
    case "secondary":
      return `${base} bg-figma-bg-secondary text-figma-text-secondary hover:text-figma-text`;
    case "bordered":
      return `${base} bg-figma-bg-secondary border border-figma-border text-figma-text hover:bg-figma-bg-tertiary hover:border-figma-border-strong disabled:cursor-not-allowed`;
    case "danger":
      return `${base} text-danger bg-danger-bg hover:opacity-90`;
    case "icon":
      return "p-1 rounded-md text-figma-icon-tertiary hover:bg-figma-bg-secondary hover:text-figma-icon transition-colors disabled:opacity-40";
    case "ghost":
      return "p-1.5 rounded-md text-figma-icon-tertiary hover:bg-figma-bg-tertiary hover:text-figma-icon transition-colors";
    default:
      return base;
  }
}

function inputClass(size: ControlSize, joined: boolean): string {
  if (joined) {
    return "h-full min-w-0 flex-1 bg-figma-bg px-2.5 text-xs leading-none text-figma-text placeholder:text-figma-text-tertiary border-0 focus:outline-none focus:ring-0";
  }

  const focus =
    "focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring";

  if (size === "md") {
    return cn(
      "w-full bg-figma-bg-secondary border border-figma-border rounded-md px-3 py-2 text-xs text-figma-text placeholder:text-figma-text-disabled",
      focus,
    );
  }

  return cn(
    "w-full bg-figma-bg text-figma-text border border-figma-border rounded-md px-2.5 py-1.5 text-xs placeholder:text-figma-text-tertiary",
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
        fullWidth && "w-full",
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
    <div className={cn("relative", className)}>
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        controlSize={controlSize}
        className={cn("pr-9", inputClassName)}
        {...props}
      />
      <button
        type="button"
        onClick={onToggleShow}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-figma-icon-tertiary hover:text-figma-icon-secondary"
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
        "bg-figma-bg-secondary border border-figma-border rounded-md p-3",
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
        "pl-4 pr-3.5 pt-3 pb-4 border-b border-figma-border",
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
      className={cn("relative pl-7", !isLast && "pb-3", className)}
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
        "inline-flex items-center gap-1 text-accent hover:text-accent-text-hover hover:underline",
        className,
      )}
      {...props}
    >
      {children}
    </a>
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
    <span className="relative inline-flex group">
      <button
        type="button"
        className="rounded p-0.5 text-figma-icon-tertiary hover:text-figma-icon-secondary focus:outline-none focus-visible:ring-1 focus-visible:ring-accent-ring"
        aria-label={label}
        aria-describedby={id}
      >
        <Info size={13} strokeWidth={2} aria-hidden />
      </button>
      <div
        id={id}
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 top-full z-50 mt-1 w-max max-w-[min(260px,calc(100vw-2.5rem))] -translate-x-1/2",
          "scale-95 opacity-0 transition duration-150",
          "rounded-md border border-sem-border-faint bg-sem-surface py-2 pl-2.5 pr-3.5 text-left text-xs font-normal text-figma-text shadow-sem-tooltip",
          "[html.figma-dark_&]:border-white/10 [html.figma-dark_&]:bg-[var(--bl-sem-tooltip-bg)] [html.figma-dark_&]:text-[var(--bl-sem-tooltip-text)]",
          "group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100",
          "group-focus-within:pointer-events-auto group-focus-within:scale-100 group-focus-within:opacity-100",
        )}
      >
        {content}
      </div>
    </span>
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
          "p-1.5 rounded-md text-figma-icon-secondary hover:bg-danger-bg hover:text-danger transition-colors shrink-0",
        variant === "toolbar" &&
          "p-1 rounded-md text-figma-icon-tertiary hover:bg-figma-bg-secondary hover:text-figma-icon transition-colors disabled:opacity-40",
        variant === "nav" &&
          "flex h-9 w-9 shrink-0 items-center justify-center text-figma-icon-secondary hover:bg-figma-bg-hover transition-colors",
        variant === "default" &&
          "p-1.5 rounded-md text-figma-icon-tertiary hover:bg-figma-bg-tertiary hover:text-figma-icon transition-colors",
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
        "flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md transition-all duration-150",
        active
          ? "bg-accent-bg text-white shadow-sem-sm"
          : tone === "sort"
            ? "bg-figma-bg-secondary text-figma-text-secondary hover:text-figma-text shadow-sem-none"
            : "bg-figma-bg-secondary text-figma-text-secondary hover:text-figma-text",
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
        "flex items-center gap-0.5 p-1.5 rounded-md transition-colors",
        engaged
          ? "bg-accent-bg text-white shadow-sem-sm [&_svg]:text-white"
          : "text-figma-text-secondary hover:text-figma-text bg-figma-bg-secondary",
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
      ? "inline-flex shrink-0 overflow-hidden rounded-md border border-figma-border"
      : "flex items-center gap-1.5";

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
              variant === "inline" && "py-1.5 tabular-nums rounded-none shadow-sem-none",
              variant === "inline" && !isActive && "bg-transparent hover:bg-figma-bg-secondary",
              variant === "spread" && "flex-1 justify-center gap-1.5 py-2.5",
              variant === "inline" && index > 0 && "border-l border-figma-border",
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
        "flex h-8 items-stretch overflow-hidden rounded-md border border-figma-border focus-within:border-accent focus-within:ring-1 focus-within:ring-accent-ring transition-colors",
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
        "flex h-full min-w-0 flex-1 items-center bg-figma-bg px-2.5 text-xs leading-none",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
