import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@ui/lib/cn";
import { IconButton } from "@ui/components/common/uiPrimitives";
import { SectionLabel } from "@ui/components/common/typography";

/** Fixed 36px chrome bar — keeps header height stable across light/dark themes. */
export function appHeaderBarClass(className?: string) {
  return cn(
    "flex items-stretch h-9 shrink-0 border-b border-figma-border bg-figma-bg",
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
      <div className="flex items-center flex-1 min-w-0 pl-2 pr-2.5">
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
        "relative flex items-center gap-1.5 px-3 h-full font-mono text-[9px] uppercase tracking-widest leading-none shrink-0 transition-colors",
        active
          ? "bg-accent-subtle text-accent font-semibold"
          : "text-figma-text-secondary font-medium hover:bg-figma-bg-hover hover:text-figma-text",
        className,
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="leading-none">{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none",
            active
              ? "bg-accent-bg text-white"
              : "bg-figma-bg-tertiary text-figma-text-tertiary",
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
    <div className={appHeaderBarClass(cn("overflow-x-auto", className))}>
      <div className="flex items-stretch self-stretch min-w-0">{children}</div>
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
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 shrink-0 rounded-full transition-all duration-300",
            i === current
              ? "w-6 bg-accent-bg"
              : i < current
                ? "w-1.5 bg-accent-bg"
                : "w-1.5 bg-figma-border",
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
    <div className="w-full shrink-0 border-t border-figma-border bg-figma-bg px-5 pb-4 pt-3">
      {stepIndicator ? (
        <div className="mb-3 flex justify-center">{stepIndicator}</div>
      ) : null}
      <div className="flex w-full items-stretch gap-2">{children}</div>
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
    <div className="flex flex-col items-center text-center mb-6">
      <div
        className={cn(
          "w-12 h-12 rounded-full border flex items-center justify-center mb-3",
          iconClassName,
        )}
      >
        <Icon size={24} />
      </div>
      <h1 className="text-lg font-semibold text-figma-text mb-1">{title}</h1>
      <p className="text-sm text-figma-text-secondary max-w-[280px]">
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
    <div className="flex items-center gap-3 mb-5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-subtle-opaque">
        <Icon size={18} className="text-accent" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-figma-text">{title}</h2>
        <p className="text-xs text-figma-text-tertiary">{subtitle}</p>
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
    <div className="flex items-start gap-3 text-left p-2.5 rounded-md bg-sem-surface shadow-sem-card">
      <div className="mt-0.5 p-1.5 rounded-md bg-accent-subtle">
        <Icon size={14} className="text-accent" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-figma-text">{title}</p>
        <p className="text-[11px] text-figma-text-tertiary leading-snug mt-0.5">
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
        "empty-state-enter flex flex-1 flex-col items-center justify-center px-6 py-8 text-center",
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
        "flex items-center gap-1.5 px-2.5 py-3 border-b border-figma-border bg-figma-bg",
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
      className="w-px self-stretch bg-figma-border shrink-0"
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
    <div className={cn("flex gap-2", className)}>{children}</div>
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
    <AppScreenBody className={cn("px-5 py-6", className)}>
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
    <div className={cn("flex flex-col h-full bg-figma-bg", className)}>
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
    <div className={cn("flex-1 min-h-0 overflow-y-auto", className)}>
      {children}
    </div>
  );
}
