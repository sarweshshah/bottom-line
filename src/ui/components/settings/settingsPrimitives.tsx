import type { MouseEvent, ReactNode } from "react";
import { openExternalUrl } from "@ui/lib/openExternal";
import type { CacheTTLMinutes } from "@shared/types";

export const TTL_OPTIONS: CacheTTLMinutes[] = [5, 10, 15, 30];

export const BTN_PRIMARY =
  "px-2.5 py-2 rounded-md text-xs font-medium bg-accent-bg text-white shadow-sm hover:bg-accent-hover disabled:opacity-40 transition-all duration-150";

export const BTN_SECONDARY =
  "px-2.5 py-2 rounded-md text-xs font-medium bg-figma-bg-secondary text-figma-text-secondary hover:text-figma-text disabled:opacity-40 transition-all duration-150";

export const BTN_DANGER =
  "px-2.5 py-2 rounded-md text-xs font-medium text-danger bg-danger-bg hover:opacity-90 disabled:opacity-40 transition-all duration-150";

export const INPUT_CLASS =
  "w-full bg-figma-bg text-figma-text border border-figma-border rounded-md px-2.5 py-1.5 text-xs placeholder:text-figma-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring";

export const SELECT_COMPACT_CLASS =
  "appearance-none [field-sizing:content] min-w-0 bg-figma-bg text-figma-text border border-figma-border rounded-md pl-2.5 pr-6 py-1 text-xs tabular-nums focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring";

export const PILL_ACTIVE = "bg-accent-bg text-white shadow-sm";

export const PILL_INACTIVE =
  "bg-figma-bg-secondary text-figma-text-secondary hover:text-figma-text";

export const CARD_CLASS =
  "rounded-md border border-figma-border bg-accent-subtle p-3";

export function SettingsSection({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`border-b border-figma-border ${className}`}>
      {children}
    </section>
  );
}

export function SettingsSectionHeader({
  title,
  description,
  helpUrl,
}: {
  title: string;
  description?: string;
  helpUrl?: string;
}) {
  return (
    <div className="px-4 pt-5 pb-3">
      <h3 className="font-mono text-[9.5px] font-semibold uppercase tracking-widest text-figma-text leading-none">
        {title}
      </h3>
      {(description || helpUrl) && (
        <p className="text-[10px] text-figma-text-tertiary mt-1 leading-snug tracking-wide">
          {description}
          {description && helpUrl && " "}
          {helpUrl && (
            <a
              href={helpUrl}
              onClick={(e: MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                openExternalUrl(helpUrl);
              }}
              className="text-accent hover:underline hover:text-accent-text-hover"
            >
              Learn more
            </a>
          )}
        </p>
      )}
    </div>
  );
}

export function SettingsSectionBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`px-4 pb-5 space-y-3 ${className}`}>{children}</div>;
}

export function SettingsFieldGroup({ children }: { children: ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

export function SettingsRowGroup({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

export function SettingsToggleRow({
  label,
  description,
  checked,
  onChange,
  trailing,
}: {
  label: string;
  description?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  trailing?: ReactNode;
}) {
  const inner = (
    <>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-figma-text">{label}</p>
        {description && (
          <p className="text-[10px] text-figma-text-tertiary mt-0.5 leading-snug">
            {description}
          </p>
        )}
      </div>
      {trailing ?? (
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          className="accent-accent w-3.5 h-3.5 cursor-pointer shrink-0"
        />
      )}
    </>
  );

  if (trailing) {
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-4 hover:bg-figma-bg-hover transition-colors">
        {inner}
      </div>
    );
  }

  return (
    <label className="flex items-center justify-between gap-3 px-4 py-4 cursor-pointer hover:bg-figma-bg-hover transition-colors">
      {inner}
    </label>
  );
}
