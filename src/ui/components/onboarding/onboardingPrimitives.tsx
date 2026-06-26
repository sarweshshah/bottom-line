import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";
import { Check, CheckCircle2, X, ArrowLeft } from "lucide-react";
import { HeroLayout, OnboardingFooter, StepIndicator } from "@ui/components/common/layout";
import { BodyText } from "@ui/components/common/typography";
import { Button, Input } from "@ui/components/common/uiPrimitives";
import { ONBOARDING_CONFIG_STEPS } from "@ui/onboarding/onboardingConfig";
import { cn } from "@ui/lib/cn";

const PAT_TRANSPARENCY_ITEMS = [
  { allow: true, label: "Read comment threads" },
  { allow: true, label: "Read user profiles" },
  { allow: true, label: "Navigate to comments" },
  { allow: false, label: "Modify your designs" },
  { allow: false, label: "Store token externally" },
  { allow: false, label: "Share data with others" },
] as const;

export function PatTransparencyList({ className = "" }: { className?: string }) {
  return (
    <ul className={cn("space-y-0.5 text-[10px] leading-tight text-figma-bg", className)}>
      {PAT_TRANSPARENCY_ITEMS.map(({ allow, label }) => (
        <li key={label} className="flex items-start gap-1.5">
          {allow ? (
            <Check
              size={10}
              strokeWidth={2.5}
              className="mt-[2px] shrink-0 text-status-resolved"
              aria-hidden
            />
          ) : (
            <X
              size={10}
              strokeWidth={2.5}
              className="mt-[2px] shrink-0 text-danger"
              aria-hidden
            />
          )}
          <span className="min-w-0">{label}</span>
        </li>
      ))}
    </ul>
  );
}

export function SetupReadyBanner({
  title = "You're all set!",
  description = "Hit the button below to start exploring your comments.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="mt-6 p-4 rounded-md onboarding-hero-gradient border border-figma-border/50 text-center">
      <CheckCircle2 size={28} className="text-accent mx-auto mb-2" />
      <p className="text-sm font-medium text-figma-text mb-1">{title}</p>
      <p className="text-xs text-figma-text-tertiary">{description}</p>
    </div>
  );
}

export function OnboardingHint({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] text-figma-text-tertiary mt-1.5 text-center">
      {children}
    </p>
  );
}

export function OnboardingBodyText({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <p
      className={cn(
        "text-xs text-figma-text-secondary leading-relaxed",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function WelcomeHero({
  logoSrc,
  logoAlt,
  title,
  description,
  className = "",
}: {
  logoSrc: string;
  logoAlt: string;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <div className="empty-state-halo mb-6 rounded-2xl overflow-hidden">
        <img
          src={logoSrc}
          alt={logoAlt}
          className="h-20 w-20 rounded-2xl object-cover"
        />
      </div>
      <h1 className="text-xl font-bold text-figma-text mb-2">{title}</h1>
      <p className="text-sm text-figma-text-secondary mb-8 max-w-[260px] leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export function AboutHero({
  logoSrc,
  name,
  version,
  creator,
  tagline,
}: {
  logoSrc: string;
  name: string;
  version: string;
  creator: string;
  tagline: string;
}) {
  return (
    <>
      <div className="relative mb-4 h-20 w-20 shrink-0 overflow-hidden rounded-2xl empty-state-halo">
        <img src={logoSrc} alt="" className="h-full w-full object-cover" aria-hidden />
      </div>
      <div className="mb-3 space-y-1">
        <h3 className="text-md font-semibold text-figma-text">{name}</h3>
        <span className="inline-block font-mono text-[9px] font-bold uppercase tracking-widest text-figma-text-tertiary">
          v{version}
        </span>
      </div>
      <div className="mb-4 space-y-0.5">
        <BodyText>
          Created by <span className="font-medium text-figma-text">{creator}</span>
        </BodyText>
        <BodyText className="text-figma-text-tertiary">{tagline}</BodyText>
      </div>
    </>
  );
}

export function AboutLinkRow({
  links,
}: {
  links: { href: string; label: string; onClick: (e: MouseEvent<HTMLAnchorElement>) => void }[];
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      {links.map((link, index) => (
        <span key={link.href} className="inline-flex items-center gap-2">
          {index > 0 && (
            <span className="text-figma-border-strong" aria-hidden>
              ·
            </span>
          )}
          <a
            href={link.href}
            className="text-[11px] text-accent hover:text-accent-text-hover hover:underline"
            onClick={link.onClick}
          >
            {link.label}
          </a>
        </span>
      ))}
    </div>
  );
}

export function OnboardingScreen({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col h-full bg-figma-bg onboarding-hero-gradient",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function OnboardingStep({
  variant = "form",
  className = "",
  children,
}: {
  variant?: "form" | "welcome";
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "onboarding-step-enter flex flex-col h-full",
        variant === "welcome" && "text-center",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function OnboardingStepBody({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex-1 overflow-y-auto px-5 py-5", className)}>
      {children}
    </div>
  );
}

export function OnboardingWelcomeBody({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex-1 flex flex-col items-center justify-center px-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function OnboardingFeatureList({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("w-full max-w-[260px] space-y-3 mb-8", className)}>
      {children}
    </div>
  );
}

export function OnboardingIntroText({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <OnboardingBodyText className={cn("mb-3", className)}>
      {children}
    </OnboardingBodyText>
  );
}

export function OnboardingFileUrlInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <Input
      type="text"
      controlSize="md"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="py-2.5"
    />
  );
}

export function OnboardingFieldStack({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>{children}</div>
  );
}

export function OnboardingSpacedBlock({
  spacing = "md",
  className = "",
  children,
}: {
  spacing?: "sm" | "md" | "lg";
  className?: string;
  children: ReactNode;
}) {
  const spacingClass =
    spacing === "sm" ? "mt-2" : spacing === "lg" ? "mt-3 mb-4" : "mb-3";
  return <div className={cn(spacingClass, className)}>{children}</div>;
}

export function OnboardingErrorBlock({
  spacing = "sm",
  className = "",
  children,
}: {
  spacing?: "sm" | "lg";
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn(spacing === "lg" ? "mt-3" : "mt-2", className)}>
      {children}
    </div>
  );
}

export function AboutTabLayout({ children }: { children: ReactNode }) {
  return (
    <HeroLayout className="empty-state-enter min-h-full">{children}</HeroLayout>
  );
}

export function OnboardingContinueButton({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button
      variant="primary"
      controlSize="md"
      className="min-h-10 flex-1"
      {...props}
    >
      {children}
    </Button>
  );
}

export function OnboardingBackButton({
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button
      variant="bordered"
      controlSize="md"
      onClick={onClick}
      className="min-h-10 shrink-0 px-3"
      aria-label="Go back"
      {...props}
    >
      <ArrowLeft size={14} />
    </Button>
  );
}

export function OnboardingStepNav({
  step,
  onBack,
  children,
}: {
  step: number;
  onBack?: () => void;
  children: ReactNode;
}) {
  return (
    <OnboardingFooter
      stepIndicator={
        <StepIndicator current={step} total={ONBOARDING_CONFIG_STEPS} />
      }
    >
      {onBack && <OnboardingBackButton onClick={onBack} />}
      {children}
    </OnboardingFooter>
  );
}
