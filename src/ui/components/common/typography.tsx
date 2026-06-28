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
        "font-mono text-[9.5px] font-semibold uppercase tracking-widest text-figma-text leading-none", // typography
        // className
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
        "text-[10px] font-medium text-figma-text-secondary", // typography
        // className
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
    <p
      className={cn(
        "text-[11px] text-figma-text-tertiary", // typography
        // className
        className,
      )}
    >
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
    <p
      className={cn(
        "text-[11px] text-figma-text-secondary", // typography
        // className
        className,
      )}
    >
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
        "px-1.5 py-0.5 truncate", // layout
        "text-[11px] text-figma-text font-medium", // typography
        "bg-figma-bg", // bg
        "border border-figma-border", // border
        "rounded", // corner radius
        // className
        className,
      )}
    >
      {children}
    </code>
  );
}
