import type { ReactNode } from "react";
import { cn } from "@ui/lib/cn";

export function SectionLabel({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "font-mono text-[9.5px] font-semibold uppercase tracking-widest text-figma-text leading-none",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function FieldLabel({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <p
      className={cn(
        "text-[10px] font-medium text-figma-text-secondary",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function MetaText({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <p className={cn("text-[11px] text-figma-text-tertiary", className)}>
      {children}
    </p>
  );
}

export function BodyText({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <p className={cn("text-[11px] text-figma-text-secondary", className)}>
      {children}
    </p>
  );
}

export function CodeValue({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <code
      className={cn(
        "text-[11px] text-figma-text font-medium bg-figma-bg px-1.5 py-0.5 rounded border border-figma-border truncate",
        className,
      )}
    >
      {children}
    </code>
  );
}
