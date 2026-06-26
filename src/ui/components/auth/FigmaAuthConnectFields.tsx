import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import type { FigmaAuthMethod, FigmaUser } from "@shared/types";
import {
  ConnectedStatus,
  ExpandableDisclosure,
  OAuthSignInButton,
  PatTokenGuide,
  ValidatingIndicator,
} from "@ui/components/common/authUi";
import { SecretField } from "@ui/components/common/uiPrimitives";
import {
  OnboardingFieldStack,
  OnboardingHint,
  OnboardingSpacedBlock,
} from "@ui/components/onboarding/onboardingPrimitives";

type FigmaAuthConnectFieldsProps = {
  variant: "onboarding" | "reconnect";
  oauthAvailable: boolean;
  oauthBusy: boolean;
  isValidating: boolean;
  onOAuthClick: () => void;
  showPatAdvanced: boolean;
  onTogglePatAdvanced: () => void;
  pat: string;
  showToken: boolean;
  onToggleShowToken: () => void;
  onPatChange: (value: string) => void;
  authMethod: FigmaAuthMethod | null;
  user: FigmaUser | null;
  tokenValid?: boolean;
  patHeading?: ReactNode;
};

export function FigmaAuthConnectFields({
  variant,
  oauthAvailable,
  oauthBusy,
  isValidating,
  onOAuthClick,
  showPatAdvanced,
  onTogglePatAdvanced,
  pat,
  showToken,
  onToggleShowToken,
  onPatChange,
  authMethod,
  user,
  tokenValid = false,
  patHeading,
}: FigmaAuthConnectFieldsProps) {
  const showOAuth = oauthAvailable && (variant === "reconnect" || !user);
  const patPlaceholder =
    variant === "onboarding"
      ? "figd_xxxxxxxxxxxxxxxx"
      : "Paste your new token here";

  const patFields = (
    <OnboardingFieldStack>
      <SecretField
        value={pat}
        onChange={(e) => onPatChange(e.target.value)}
        show={showToken}
        onToggleShow={() => onToggleShowToken()}
        placeholder={patPlaceholder}
      />
      {isValidating && authMethod !== "oauth" && (
        <ValidatingIndicator
          label={variant === "reconnect" ? "Validating token..." : undefined}
        />
      )}
      {variant === "onboarding" && user && authMethod === "pat" && (
        <ConnectedStatus
          icon={CheckCircle2}
          message={`Connected as ${user.handle}`}
        />
      )}
      {variant === "reconnect" && tokenValid && authMethod === "pat" && (
        <ConnectedStatus icon={CheckCircle2} message="Token is valid" />
      )}
    </OnboardingFieldStack>
  );

  return (
    <>
      {showOAuth && (
        <OnboardingSpacedBlock spacing={variant === "reconnect" ? "lg" : undefined}>
          <OAuthSignInButton
            busy={oauthBusy}
            disabled={isValidating}
            onClick={onOAuthClick}
          />
          {variant === "onboarding" && (
            <OnboardingHint>
              Opens your browser to sign in. Return here when the tab says you
              can close it.
            </OnboardingHint>
          )}
        </OnboardingSpacedBlock>
      )}

      {oauthAvailable && (
        <OnboardingSpacedBlock spacing={variant === "onboarding" ? "sm" : undefined}>
          <ExpandableDisclosure
            open={showPatAdvanced}
            onToggle={onTogglePatAdvanced}
            align={variant === "reconnect" ? "center" : "start"}
          >
            Use a personal access token instead
          </ExpandableDisclosure>
        </OnboardingSpacedBlock>
      )}

      {showPatAdvanced && (
        <>
          {patHeading}
          {variant === "onboarding" ? (
            <>
              <PatTokenGuide variant="onboarding" />
              {patFields}
            </>
          ) : (
            <PatTokenGuide variant="compact">{patFields}</PatTokenGuide>
          )}
        </>
      )}

      {variant === "reconnect" && authMethod === "oauth" && user && (
        <ConnectedStatus
          icon={CheckCircle2}
          message={`Signed in as ${user.handle}`}
          align="center"
          spaced
        />
      )}
    </>
  );
}
