import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@ui/lib/cn";
import { IconButton } from "@ui/components/common/uiPrimitives";
import { SectionLabel } from "@ui/components/common/typography";

/** Fixed 36px chrome bar — keeps header height stable across light/dark themes. */
export function appHeaderBarClass(className?: string) {
  return cn(
    "flex items-stretch shrink-0", // layout
    "h-9", // size
    "bg-figma-bg", // bg
    "border-b border-figma-border", // border
    // className
    className,
  );
}

export function ScreenHeader({
  onBack,
  backIcon,
  title,
  backTooltip,
  trailing,
}: {
  onBack?: () => void;
  backIcon?: ReactNode;
  title: string;
  backTooltip?: string;
  trailing?: ReactNode;
}) {
  return (
    <div className={appHeaderBarClass()}>
      {onBack && (
        <IconButton
          variant="nav"
          onClick={onBack}
          data-tooltip={backTooltip ?? "Back"}
          data-tooltip-align="left"
          data-tooltip-pos="bottom"
        >
          {backIcon}
        </IconButton>
      )}
      <div
        className={cn(
          "flex items-center flex-1 min-w-0 pl-2 pr-2.5", // layout
        )}
      >
        <SectionLabel>{title}</SectionLabel>
      </div>
      {trailing}
    </div>
  );
}

export function TabSegment({
  active,
  onClick,
  label,
  icon,
  count,
  className = "",
}: {
  active: boolean;
  onClick: () => void;
  label: ReactNode;
  icon?: ReactNode;
  count?: number;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-1.5 shrink-0", // layout
        "px-3 h-full", // size
        "font-mono text-[9px] uppercase tracking-widest leading-none", // typography
        "transition-colors", // transition / animation
        active
          ? "bg-accent-subtle text-accent font-semibold"
          : "text-figma-text-secondary font-medium hover:bg-figma-bg-hover hover:text-figma-text", // state variants
        // className
        className,
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="leading-none">{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "px-1.5 py-0.5", // size
            "text-[10px] font-semibold leading-none", // typography
            "rounded-full", // corner radius
            active
              ? "bg-accent-bg text-white"
              : "bg-figma-bg-tertiary text-figma-text-tertiary", // state variants
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export function TabBar({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={appHeaderBarClass(
        cn(
          "overflow-x-auto", // layout
          // className
          className,
        ),
      )}
    >
      <div
        className={cn(
          "flex items-stretch self-stretch min-w-0", // layout
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function StepIndicator({
  /** Zero-based active step; use -1 when no step is active yet (e.g. welcome). */
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-1.5", // layout
      )}
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            "shrink-0", // layout
            "h-1.5", // size
            "rounded-full", // corner radius
            "transition-all duration-300", // transition / animation
            i === current
              ? "w-6 bg-accent-bg"
              : i < current
                ? "w-1.5 bg-accent-bg"
                : "w-1.5 bg-figma-border", // state variants
          )}
        />
      ))}
    </div>
  );
}

export function OnboardingFooter({
  stepIndicator,
  children,
}: {
  stepIndicator?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "w-full shrink-0 px-5 pb-4 pt-3", // layout
        "bg-figma-bg", // bg
        "border-t border-figma-border", // border
      )}
    >
      {stepIndicator ? (
        <div
          className={cn(
            "mb-3 flex justify-center", // layout
          )}
        >
          {stepIndicator}
        </div>
      ) : null}
      <div
        className={cn(
          "flex w-full items-stretch gap-2", // layout
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function CenteredAlertHeader({
  icon: Icon,
  iconClassName = "bg-danger-bg border-danger-border text-danger",
  title,
  description,
}: {
  icon: LucideIcon;
  iconClassName?: string;
  title: string;
  description: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center mb-6", // layout
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center mb-3", // layout
          "w-12 h-12", // size
          "border", // border
          "rounded-full", // corner radius
          // className
          iconClassName,
        )}
      >
        <Icon size={24} />
      </div>
      <h1
        className={cn(
          "mb-1", // layout
          "text-lg font-semibold text-figma-text", // typography
        )}
      >
        {title}
      </h1>
      <p
        className={cn(
          "max-w-[280px]", // size
          "text-sm text-figma-text-secondary", // typography
        )}
      >
        {description}
      </p>
    </div>
  );
}

export function OnboardingStepHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 mb-5", // layout
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center shrink-0", // layout
          "h-9 w-9", // size
          "bg-accent-subtle-opaque", // bg
          "rounded-full", // corner radius
        )}
      >
        <Icon size={18} className="text-accent" />
      </div>
      <div>
        <h2
          className={cn(
            "text-base font-semibold text-figma-text", // typography
          )}
        >
          {title}
        </h2>
        <p
          className={cn(
            "text-xs text-figma-text-tertiary", // typography
          )}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 text-left p-2.5", // layout
        "bg-sem-surface", // bg
        "shadow-sem-card", // shadow
        "rounded-md", // corner radius
      )}
    >
      <div
        className={cn(
          "mt-0.5 p-1.5", // layout
          "bg-accent-subtle", // bg
          "rounded-md", // corner radius
        )}
      >
        <Icon size={14} className="text-accent" />
      </div>
      <div className="min-w-0">
        <p
          className={cn(
            "text-xs font-medium text-figma-text", // typography
          )}
        >
          {title}
        </p>
        <p
          className={cn(
            "mt-0.5", // layout
            "text-[11px] text-figma-text-tertiary leading-snug", // typography
          )}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

export function HeroLayout({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center px-6 py-8 text-center", // layout
        "empty-state-enter", // transition / animation
        // className
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FilterBarShell({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-3", // layout
        "bg-figma-bg", // bg
        "border-b border-figma-border", // border
        // className
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FilterBarSpacer() {
  return <div className="flex-1" />;
}

export function ToolbarDivider() {
  return (
    <span
      className={cn(
        "self-stretch shrink-0", // layout
        "w-px", // size
        "bg-figma-border", // bg
      )}
      aria-hidden
    />
  );
}

export function InlineButtonRow({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex gap-2", // layout
        // className
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AuthScreenBody({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <AppScreenBody
      className={cn(
        "px-5 py-6", // layout
        // className
        className,
      )}
    >
      {children}
    </AppScreenBody>
  );
}

export function AppScreenShell({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col h-full", // layout
        "bg-figma-bg", // bg
        // className
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AppScreenBody({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex-1 min-h-0 overflow-y-auto", // layout
        // className
        className,
      )}
    >
      {children}
    </div>
  );
}
