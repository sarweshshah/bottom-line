import type { MouseEvent, ReactNode } from "react";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { FIGMA_PAT_REQUIRED_SCOPES } from "@shared/figmaPat";
import { UserAvatar } from "@ui/components/common/UserAvatar";
import { BodyText, MetaText } from "@ui/components/common/typography";
import {
  Button,
  IconButton,
  Panel,
  TextLink,
} from "@ui/components/common/uiPrimitives";
import { cn } from "@ui/lib/cn";

export function PatScopesList({ className = "" }: { className?: string }) {
  return (
    <BodyText className={className}>
      <p className="leading-snug mb-0.5">
        When generating a token, enable these permissions:
      </p>
      <ul className="list-disc list-inside space-y-0 leading-snug">
        {FIGMA_PAT_REQUIRED_SCOPES.map((scope) => (
          <li key={scope}>
            <code className="font-mono text-[10px]">{scope}</code>
          </li>
        ))}
      </ul>
    </BodyText>
  );
}

export function ValidatingIndicator({
  label = "Validating token...",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 text-xs text-figma-text-secondary ${className}`}
    >
      <Loader2 size={12} className="animate-spin" />
      {label}
    </div>
  );
}

export function ExpandableDisclosure({
  open,
  onToggle,
  children,
  align = "start",
  className = "",
}: {
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  align?: "start" | "center";
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex items-center gap-1 text-[11px] text-accent hover:text-accent-text-hover hover:underline",
        align === "center" && "w-full justify-center",
        className,
      )}
    >
      {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      {children}
    </button>
  );
}

export function OAuthSignInButton({
  busy,
  disabled,
  onClick,
  label = "Sign in with Figma",
  busyLabel = "Waiting for browser…",
  className = "",
  controlSize = "md",
  onSurface = false,
  stacked = false,
}: {
  busy: boolean;
  disabled?: boolean;
  onClick: () => void;
  label?: string;
  busyLabel?: string;
  className?: string;
  controlSize?: "sm" | "md";
  /** Lighter fill when rendered on a secondary surface (e.g. AccountCard panel). */
  onSurface?: boolean;
  /** Top spacing when rendered below card content. */
  stacked?: boolean;
}) {
  return (
    <Button
      variant="bordered"
      controlSize={controlSize}
      fullWidth
      disabled={disabled || busy}
      onClick={onClick}
      className={cn(
        onSurface &&
          "!bg-figma-bg hover:!bg-figma-bg-secondary [html.figma-dark_&]:!bg-figma-bg-tertiary [html.figma-dark_&]:hover:!bg-figma-bg-tertiary",
        stacked && "mt-3",
        className,
      )}
    >
      {busy ? (
        <span className="inline-flex items-center justify-center gap-2">
          <Loader2 size={controlSize === "md" ? 14 : 12} className="animate-spin" />
          {busyLabel}
        </span>
      ) : (
        label
      )}
    </Button>
  );
}

export function AccountCard({
  handle,
  imgUrl,
  colorKey,
  subtitle,
  avatarSize = 36,
  onLogout,
  logoutTooltip = "Log out",
  footer,
  spaced = false,
  className = "",
}: {
  handle: string;
  imgUrl: string;
  colorKey: string;
  subtitle: string;
  avatarSize?: number;
  onLogout: () => void;
  logoutTooltip?: string;
  footer?: ReactNode;
  spaced?: boolean;
  className?: string;
}) {
  return (
    <Panel className={cn(spaced && "mt-3", className)}>
      <div className="flex items-center gap-3">
        <UserAvatar
          handle={handle}
          imgUrl={imgUrl}
          colorKey={colorKey}
          size={avatarSize}
          className="border border-figma-border"
        />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-figma-text truncate">
            {handle}
          </p>
          <MetaText className="mt-0.5 truncate">{subtitle}</MetaText>
        </div>
        <IconButton
          variant="danger"
          onClick={onLogout}
          data-tooltip={logoutTooltip}
          data-tooltip-align="right"
          data-tooltip-pos="bottom"
        >
          <LogOut size={14} />
        </IconButton>
      </div>
      {footer}
    </Panel>
  );
}

export function PatHelpLink({
  href,
  onClick,
  children,
  className = "",
}: {
  href: string;
  onClick: (e: MouseEvent<HTMLAnchorElement>) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <TextLink href={href} className={className} onClick={onClick}>
      {children}
    </TextLink>
  );
}

export function PatSectionHeading({
  title,
  tooltip,
}: {
  title: string;
  tooltip?: ReactNode;
}) {
  return (
    <h3 className="text-xs font-medium text-figma-text-secondary mb-2 flex items-center gap-1.5 flex-wrap">
      {title}
      {tooltip}
    </h3>
  );
}

export function AuthPatTokenGuide({
  helpHref,
  onHelpClick,
  helpLabel,
  children,
}: {
  helpHref: string;
  onHelpClick: (e: MouseEvent<HTMLAnchorElement>) => void;
  helpLabel: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <PatScopesList className="mb-4" />
      <PatHelpLink
        href={helpHref}
        className="mb-4 block text-xs"
        onClick={onHelpClick}
      >
        {helpLabel}
      </PatHelpLink>
      {children}
    </>
  );
}

export function ConnectedStatus({
  icon: Icon,
  message,
  align = "start",
  spaced = false,
  className = "",
}: {
  icon: LucideIcon;
  message: string;
  align?: "start" | "center";
  spaced?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs text-status-resolved",
        align === "center" && "justify-center",
        spaced && "mt-2",
        className,
      )}
    >
      <Icon size={12} />
      {message}
    </div>
  );
}
