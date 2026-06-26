import { ShieldCheck, ArrowRight } from "lucide-react";
import { FieldError } from "@ui/components/common/FieldError";
import {
  AccountCard,
  OAuthSignInButton,
  PatSectionHeading,
} from "@ui/components/common/authUi";
import { FigmaAuthConnectFields } from "@ui/components/auth/FigmaAuthConnectFields";
import {
  OnboardingContinueButton,
  OnboardingErrorBlock,
  OnboardingStep,
  OnboardingStepBody,
  OnboardingStepNav,
  PatTransparencyList,
} from "@ui/components/onboarding/onboardingPrimitives";
import { OnboardingStepHeader } from "@ui/components/common/layout";
import { InfoTooltip } from "@ui/components/common/uiPrimitives";
import { useAuthStore } from "@ui/store/authStore";
import { useConnectStep } from "@ui/onboarding/useConnectStep";
import { ONBOARDING_CONFIG_STEPS } from "@ui/onboarding/onboardingConfig";
import { getAuthConnectionSubtitle } from "@shared/figmaAuth";

type ConnectStepProps = {
  onNext: () => void;
  onBack: () => void;
};

export function ConnectStep({ onNext, onBack }: ConnectStepProps) {
  const {
    oauthAvailable,
    showPatAdvanced,
    setShowPatAdvanced,
    oauthBusy,
    signInWithFigma,
    pat,
    showToken,
    setShowToken,
    handleTokenChange,
    isValidating,
    validationError,
    user,
    authMethod,
  } = useConnectStep();

  return (
    <OnboardingStep>
      <OnboardingStepBody>
        <OnboardingStepHeader
          icon={ShieldCheck}
          title="Connect to Figma"
          subtitle={`Step 1 of ${ONBOARDING_CONFIG_STEPS} · Sign in to access your comments`}
        />

        <FigmaAuthConnectFields
          variant="onboarding"
          oauthAvailable={oauthAvailable}
          oauthBusy={oauthBusy}
          isValidating={isValidating}
          onOAuthClick={() => void signInWithFigma()}
          showPatAdvanced={showPatAdvanced}
          onTogglePatAdvanced={() => setShowPatAdvanced((v) => !v)}
          pat={pat}
          showToken={showToken}
          onToggleShowToken={() => setShowToken(!showToken)}
          onPatChange={(value) => void handleTokenChange(value)}
          authMethod={authMethod}
          user={user}
          patHeading={
            <PatSectionHeading
              title="Personal access token"
              tooltip={
                <InfoTooltip
                  id="pat-token-transparency"
                  label="What your token is used for"
                  content={<PatTransparencyList />}
                />
              }
            />
          }
        />

        {user && (
          <AccountCard
            spaced
            handle={user.handle}
            imgUrl={user.img_url}
            colorKey={user.id}
            avatarSize={40}
            subtitle={getAuthConnectionSubtitle(authMethod)}
            onLogout={() => void useAuthStore.getState().logout()}
            footer={
              authMethod === "oauth" && oauthAvailable ? (
                <OAuthSignInButton
                  busy={oauthBusy}
                  disabled={isValidating}
                  controlSize="sm"
                  onSurface
                  stacked
                  label="Sign in again with Figma"
                  onClick={() => void signInWithFigma()}
                />
              ) : undefined
            }
          />
        )}

        {validationError && (
          <OnboardingErrorBlock>
            <FieldError>{validationError}</FieldError>
          </OnboardingErrorBlock>
        )}
      </OnboardingStepBody>

      <OnboardingStepNav step={1} onBack={onBack}>
        <OnboardingContinueButton disabled={!user} onClick={onNext}>
          Continue
          <ArrowRight size={14} />
        </OnboardingContinueButton>
      </OnboardingStepNav>
    </OnboardingStep>
  );
}
