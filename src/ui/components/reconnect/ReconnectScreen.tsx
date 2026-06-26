import { ShieldAlert } from "lucide-react";
import { FieldError } from "@ui/components/common/FieldError";
import { FigmaAuthConnectFields } from "@ui/components/auth/FigmaAuthConnectFields";
import {
  AppScreenShell,
  AuthScreenBody,
  CenteredAlertHeader,
  OnboardingFooter,
} from "@ui/components/common/layout";
import { OnboardingErrorBlock } from "@ui/components/onboarding/onboardingPrimitives";
import { Button } from "@ui/components/common/uiPrimitives";
import { useReconnectStep } from "@ui/onboarding/useReconnectStep";

export function ReconnectScreen() {
  const {
    oauthAvailable,
    showPatAdvanced,
    setShowPatAdvanced,
    oauthBusy,
    signInWithFigma,
    handleReconnect,
    authReady,
    authMethod,
    isValidating,
    user,
    validationError,
    pat,
    showToken,
    setShowToken,
    handleTokenChange,
    tokenValid,
  } = useReconnectStep();

  return (
    <AppScreenShell>
      <AuthScreenBody>
        <CenteredAlertHeader
          icon={ShieldAlert}
          title="Reconnect to Figma"
          description="Your session or token is no longer valid. Sign in again or paste a new personal access token."
        />

        <FigmaAuthConnectFields
          variant="reconnect"
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
          tokenValid={tokenValid}
        />

        {validationError && (
          <OnboardingErrorBlock spacing="lg">
            <FieldError>{validationError}</FieldError>
          </OnboardingErrorBlock>
        )}
      </AuthScreenBody>

      <OnboardingFooter>
        <Button
          variant="primary"
          controlSize="md"
          fullWidth
          disabled={!authReady || isValidating || oauthBusy}
          onClick={handleReconnect}
        >
          Reconnect
        </Button>
      </OnboardingFooter>
    </AppScreenShell>
  );
}
