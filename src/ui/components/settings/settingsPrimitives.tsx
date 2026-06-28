import {
  createContext,
  useContext,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { Eye, EyeOff, ChevronDown, TriangleAlert } from "lucide-react";
import { cn } from "@ui/lib/cn";
import { FieldLabel, MetaText, CodeValue } from "@ui/components/common/typography";
import { TabSegment } from "@ui/components/common/layout";
import {
  Button,
  Input,
  InputDisplay,
  InputGroup,
  SegmentedControl,
  type ButtonVariant,
} from "@ui/components/common/uiPrimitives";
import { openExternalUrl } from "@ui/lib/openExternal";
import { CACHE_TTL_OPTIONS } from "@shared/constants";

export const TTL_OPTIONS = CACHE_TTL_OPTIONS;

const InputGroupContext = createContext(false);

function useInInputGroup(explicit?: boolean) {
  const inGroup = useContext(InputGroupContext);
  return explicit ?? inGroup;
}

export function SettingsTabSegment({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <TabSegment
      active={active}
      onClick={onClick}
      label={label}
      className="px-3"
    />
  );
}

export function SettingsWarningInline({ children }: { children: ReactNode }) {
  return (
    <>
      <TriangleAlert size={10} className="shrink-0" />
      {children}
    </>
  );
}

export function SettingsButton({
  variant = "secondary",
  joined: joinedProp,
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  joined?: boolean;
}) {
  const joined = useInInputGroup(joinedProp);
  return (
    <Button
      controlSize="sm"
      variant={variant}
      joined={joined}
      className={className}
      {...props}
    >
      {children}
    </Button>
  );
}

export function SettingsInput({
  joined: joinedProp,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { joined?: boolean }) {
  const joined = useInInputGroup(joinedProp);
  return (
    <Input controlSize="sm" joined={joined} className={className} {...props} />
  );
}

export function SettingsSelect({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "appearance-none min-w-0", // layout
        "pl-2.5 pr-6 py-1", // size
        "text-xs tabular-nums text-figma-text", // typography
        "bg-figma-bg", // bg
        "border border-figma-border", // border
        "rounded-md", // corner radius
        "focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring", // interactive states
        "[field-sizing:content]", // theme overrides
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function SettingsCard({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border border-figma-border", // border
        "rounded-md", // corner radius
        "bg-accent-subtle", // bg
        "p-3", // size
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SettingsSegmentedControl<T extends string | number>(
  props: Parameters<typeof SegmentedControl<T>>[0],
) {
  return <SegmentedControl {...props} />;
}

export function SettingsInputGroup({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <InputGroupContext.Provider value={true}>
      <InputGroup className={className}>{children}</InputGroup>
    </InputGroupContext.Provider>
  );
}

export function SettingsJoinedField({
  value,
  onChange,
  onAction,
  actionLabel,
  actionVariant = "secondary",
  placeholder,
  type = "text",
  error,
  ...inputProps
}: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: string;
  onChange: InputHTMLAttributes<HTMLInputElement>["onChange"];
  onAction: () => void;
  actionLabel: string;
  actionVariant?: "primary" | "secondary";
  error?: ReactNode;
}) {
  return (
    <SettingsFieldGroup>
      <SettingsInputGroup>
        <SettingsInput
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          {...inputProps}
        />
        <SettingsButton variant={actionVariant} onClick={onAction}>
          {actionLabel}
        </SettingsButton>
      </SettingsInputGroup>
      {error}
    </SettingsFieldGroup>
  );
}

export function SettingsSecretInput({
  value,
  maskedValue,
  show,
  onToggleShow,
  onChange,
  revealTooltip,
  ...inputProps
}: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: string;
  maskedValue: string;
  show: boolean;
  onToggleShow: () => void;
  onChange: InputHTMLAttributes<HTMLInputElement>["onChange"];
  revealTooltip?: { show: string; hide: string };
}) {
  const displayValue = show ? value : value ? maskedValue : "";

  return (
    <SettingsInputGroup>
      <SettingsInput
        type={show ? "text" : "password"}
        value={displayValue}
        onChange={onChange}
        {...inputProps}
      />
      <SettingsButton
        variant="icon"
        onClick={onToggleShow}
        data-tooltip={
          revealTooltip
            ? show
              ? revealTooltip.hide
              : revealTooltip.show
            : show
              ? "Hide"
              : "Show"
        }
        data-tooltip-align="right"
        data-tooltip-pos="bottom"
      >
        {show ? <EyeOff size={12} /> : <Eye size={12} />}
      </SettingsButton>
    </SettingsInputGroup>
  );
}

export function SettingsMaskedField({
  revealed,
  onToggleReveal,
  displayValue,
  maskedValue,
  onAction,
  actionLabel,
  revealDisabled,
  revealTooltip,
}: {
  revealed: boolean;
  onToggleReveal: () => void;
  displayValue: string;
  maskedValue: string;
  onAction: () => void;
  actionLabel: string;
  revealDisabled?: boolean;
  revealTooltip?: { show: string; hide: string };
}) {
  return (
    <SettingsInputGroup>
      <InputDisplay>
        <code
          className={cn(
            "min-w-0 flex-1 truncate", // layout
            "text-xs font-medium text-figma-text-secondary", // typography
          )}
        >
          {revealed ? displayValue : maskedValue}
        </code>
      </InputDisplay>
      <SettingsButton
        variant="icon"
        onClick={onToggleReveal}
        data-tooltip={
          revealTooltip
            ? revealed
              ? revealTooltip.hide
              : revealTooltip.show
            : revealed
              ? "Hide"
              : "Show"
        }
        data-tooltip-align="right"
        data-tooltip-pos="bottom"
        disabled={revealDisabled}
      >
        {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
      </SettingsButton>
      <SettingsButton variant="secondary" onClick={onAction}>
        {actionLabel}
      </SettingsButton>
    </SettingsInputGroup>
  );
}

export function SettingsConfirmField({
  value,
  onChange,
  onConfirm,
  onCancel,
  confirmLabel = "Save",
  cancelLabel = "Cancel",
  confirmDisabled,
  placeholder,
  autoFocus,
  ...inputProps
}: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: string;
  onChange: InputHTMLAttributes<HTMLInputElement>["onChange"];
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
}) {
  return (
    <SettingsInputGroup>
      <SettingsInput
        type="password"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        {...inputProps}
      />
      <SettingsButton
        variant="primary"
        onClick={onConfirm}
        disabled={confirmDisabled}
      >
        {confirmLabel}
      </SettingsButton>
      <SettingsButton variant="secondary" onClick={onCancel}>
        {cancelLabel}
      </SettingsButton>
    </SettingsInputGroup>
  );
}

export function SettingsSection({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "border-b border-figma-border", // border
        className,
      )}
    >
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
        <p className="text-[10px] text-figma-text-secondary mt-1 leading-snug tracking-wide">
          {description}
          {description && helpUrl && " "}
          {helpUrl && (
            <a
              href={helpUrl}
              onClick={(e: MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                openExternalUrl(helpUrl);
              }}
              className={cn(
                "text-accent", // typography
                "hover:underline hover:text-accent-text-hover", // interactive states
              )}
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
  flushBottom = false,
  nested = false,
}: {
  children: ReactNode;
  className?: string;
  flushBottom?: boolean;
  nested?: boolean;
}) {
  return (
    <div
      className={cn(
        "space-y-3", // layout
        "px-4 pb-5", // size
        flushBottom && "!pb-0", // state variants
        nested && "pt-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SettingsFieldGroup({ children }: { children: ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

export function SettingsCheckbox({
  checked,
  onChange,
  className = "",
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className={cn(
        "shrink-0 cursor-pointer", // layout
        "w-3.5 h-3.5", // size
        "accent-accent", // theme overrides
        className,
      )}
    />
  );
}

export function SettingsKeyValueRow({
  label,
  children,
  valueClassName = "",
}: {
  label: string;
  children: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <MetaText>{label}</MetaText>
      <div
        className={cn(
          "min-w-0 truncate", // layout
          "max-w-[60%]", // size
          valueClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function SettingsFileInfoCard({
  fileKey,
  fileUrl,
  fileName,
}: {
  fileKey: string;
  fileUrl?: string | null;
  fileName?: string | null;
}) {
  return (
    <SettingsCard className="space-y-2">
      <SettingsKeyValueRow label="File key">
        <CodeValue>{fileKey}</CodeValue>
      </SettingsKeyValueRow>
      {fileUrl && (
        <SettingsKeyValueRow label="URL">
          <MetaText className="text-figma-text-secondary">{fileUrl}</MetaText>
        </SettingsKeyValueRow>
      )}
      {fileName && (
        <SettingsKeyValueRow label="File name">
          <MetaText className="text-figma-text-secondary">{fileName}</MetaText>
        </SettingsKeyValueRow>
      )}
    </SettingsCard>
  );
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
        <SettingsCheckbox
          checked={!!checked}
          onChange={(value) => onChange?.(value)}
        />
      )}
    </>
  );

  if (trailing) {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-3", // layout
          "px-4 py-4", // size
          "transition-colors", // transition / animation
          "hover:bg-figma-bg-hover", // interactive states
        )}
      >
        {inner}
      </div>
    );
  }

  return (
    <label
      className={cn(
        "flex items-center justify-between gap-3", // layout
        "px-4 py-4", // size
        "cursor-pointer hover:bg-figma-bg-hover", // interactive states
        "transition-colors", // transition / animation
      )}
    >
      {inner}
    </label>
  );
}

export function SettingsSubsectionHeader({
  label,
  description,
}: {
  label: string;
  description?: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium text-figma-text">{label}</p>
      {description && (
        <p className="text-[10px] text-figma-text-tertiary mt-0.5 leading-snug">
          {description}
        </p>
      )}
    </div>
  );
}

export function SettingsOptionList({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        "overflow-hidden divide-y divide-figma-border", // layout
        "border border-figma-border", // border
        "rounded-md", // corner radius
        "bg-figma-bg-secondary", // bg
      )}
    >
      {children}
    </div>
  );
}

export function SettingsSelectedBadge() {
  return (
    <span
      className={cn(
        "px-2 py-1", // size
        "text-[9px] font-semibold text-white tracking-wide leading-none", // typography
        "bg-accent-bg", // bg
        "rounded-full", // corner radius
      )}
    >
      Selected
    </span>
  );
}

export function SettingsOptionRow({
  selected,
  onSelect,
  label,
  description,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "group w-full flex items-center gap-2.5 text-left", // layout
          "px-3 py-2.5", // size
          "transition-colors", // transition / animation
          selected ? "bg-accent-subtle" : "bg-figma-bg hover:bg-figma-bg-hover", // state variants
        )}
      >
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-[11px]", // typography
              selected
                ? "font-semibold text-accent"
                : "font-medium text-figma-text-secondary group-hover:text-figma-text", // state variants
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              "mt-0.5", // size
              "text-[10px] leading-snug", // typography
              selected
                ? "text-tag-approval-text"
                : "text-figma-text-tertiary group-hover:text-figma-text-secondary", // state variants
            )}
          >
            {description}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {selected && <SettingsSelectedBadge />}
          <ChevronDown
            size={12}
            className={cn(
              "transition-[transform,color] duration-200", // transition / animation
              selected
                ? "rotate-180 text-accent"
                : "text-figma-icon-tertiary group-hover:text-figma-icon-secondary", // state variants
            )}
          />
        </div>
      </button>

      {children && (
        <div
          className={cn(
            "grid", // layout
            "transition-[grid-template-rows] duration-200 ease-out", // transition / animation
            selected ? "grid-rows-[1fr]" : "grid-rows-[0fr]", // state variants
          )}
        >
          <div className="overflow-hidden">
            <div
              className={cn(
                "space-y-3", // layout
                "px-3 pt-3 pb-4", // size
                "bg-figma-bg", // bg
                "border-t border-figma-border", // border
              )}
            >
              {children}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SettingsFieldHeader({
  label,
  trailing,
}: {
  label: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <FieldLabel>{label}</FieldLabel>
      {trailing}
    </div>
  );
}

export function SettingsInlineLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: (e: MouseEvent<HTMLAnchorElement>) => void;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 shrink-0", // layout
        "text-[10px] text-accent", // typography
        "hover:text-accent-text-hover hover:underline", // interactive states
      )}
    >
      {children}
    </a>
  );
}

export function SettingsControlRow({
  as = "div",
  align = "start",
  label,
  description,
  warning,
  trailing,
}: {
  as?: "div" | "label";
  align?: "start" | "center";
  label: string;
  description?: ReactNode;
  warning?: ReactNode;
  trailing: ReactNode;
}) {
  const content = (
    <>
      <div className="flex-1 min-w-0">
        <FieldLabel>{label}</FieldLabel>
        {warning ? (
          <p className="flex items-center gap-1 mt-0.5 text-[10px] text-warning leading-snug">
            {warning}
          </p>
        ) : description ? (
          <p className="text-[10px] text-figma-text-tertiary mt-0.5 leading-snug">
            {description}
          </p>
        ) : null}
      </div>
      {trailing}
    </>
  );

  const className = cn(
    "setting-reveal flex gap-3", // layout
    align === "center"
      ? "items-center justify-between gap-4"
      : "items-start justify-between",
    as === "label" && "cursor-pointer", // interactive states
  );

  if (as === "label") {
    return <label className={className}>{content}</label>;
  }

  return <div className={className}>{content}</div>;
}

export function SettingsSelectField({
  value,
  onChange,
  children,
}: {
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: ReactNode;
}) {
  return (
    <div className="relative inline-flex shrink-0">
      <SettingsSelect value={value} onChange={onChange}>
        {children}
      </SettingsSelect>
      <ChevronDown
        size={12}
        className={cn(
          "pointer-events-none absolute right-2 top-1/2 -translate-y-1/2", // layout
          "text-figma-icon-secondary", // typography
        )}
      />
    </div>
  );
}
