import { useState, useCallback, type MouseEvent } from "react";
import { CheckCircle2, ExternalLink, ShieldAlert } from "lucide-react";
import { FieldError } from "@ui/components/common/FieldError";
import {
  AuthPatTokenGuide,
  ConnectedStatus,
  ExpandableDisclosure,
  OAuthSignInButton,
  ValidatingIndicator,
} from "@ui/components/common/authUi";
import {
  AppScreenShell,
  AuthScreenBody,
  CenteredAlertHeader,
  OnboardingFooter,
} from "@ui/components/common/layout";
import {
  OnboardingErrorBlock,
  OnboardingFieldStack,
  OnboardingSpacedBlock,
} from "@ui/components/onboarding/onboardingPrimitives";
import { Button, SecretField } from "@ui/components/common/uiPrimitives";
import { useAuthStore } from "@ui/store/authStore";
import { useCommentsStore } from "@ui/store/commentsStore";
import {
  isFigmaOAuthConfigured,
  beginOAuthSession,
  pollOAuthUntilComplete,
} from "@ui/lib/figmaOAuth";
import { openExternalUrl } from "@ui/lib/openExternal";
import { FIGMA_PAT_HELP_URL } from "@shared/figmaPat";

export function ReconnectScreen() {
  const oauthAvailable = isFigmaOAuthConfigured();
  const {
    validateAndSetToken,
    applyOAuthSession,
    completeSetup,
    isValidating,
    validationError,
    authMethod,
    user,
  } = useAuthStore();

  const [pat, setPat] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [showPatAdvanced, setShowPatAdvanced] = useState(!oauthAvailable);
  const [oauthBusy, setOauthBusy] = useState(false);

  const handleTokenChange = useCallback(
    async (value: string) => {
      setPat(value);
      setTokenValid(false);
      if (!value.trim()) return;

      try {
        await validateAndSetToken(value.trim());
        setTokenValid(true);
      } catch {
        setTokenValid(false);
      }
    },
    [validateAndSetToken],
  );

  const handleSignInWithFigma = useCallback(async () => {
    useAuthStore.setState({ validationError: null });
    setOauthBusy(true);
    try {
      const { sessionId, authorizeUrl } = await beginOAuthSession();
      openExternalUrl(authorizeUrl);
      const result = await pollOAuthUntilComplete(sessionId);
      await applyOAuthSession({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        expires_in: result.expires_in,
      });
      setTokenValid(false);
      setPat("");
    } catch (e) {
      useAuthStore.setState({
        validationError:
          e instanceof Error ? e.message : "Sign in with Figma failed.",
      });
    } finally {
      setOauthBusy(false);
    }
  }, [applyOAuthSession]);

  const handleReconnect = useCallback(() => {
    const auth = useAuthStore.getState().getRestAuth();
    if (!auth) return;
    completeSetup();
    useCommentsStore.getState().refreshComments();
  }, [completeSetup]);

  const auth = useAuthStore((s) => s.getRestAuth());
  const authReady = !!auth && (authMethod === "oauth" || tokenValid);

  return (
    <AppScreenShell>
      <AuthScreenBody>
        <CenteredAlertHeader
          icon={ShieldAlert}
          title="Reconnect to Figma"
          description="Your session or token is no longer valid. Sign in again or paste a new personal access token."
        />

        {oauthAvailable && (
          <OnboardingSpacedBlock spacing="lg">
            <OAuthSignInButton
              busy={oauthBusy}
              disabled={isValidating}
              onClick={() => void handleSignInWithFigma()}
            />
          </OnboardingSpacedBlock>
        )}

        {oauthAvailable && (
          <OnboardingSpacedBlock>
            <ExpandableDisclosure
              open={showPatAdvanced}
              onToggle={() => setShowPatAdvanced((v) => !v)}
              align="center"
            >
              Use a personal access token instead
            </ExpandableDisclosure>
          </OnboardingSpacedBlock>
        )}

        {showPatAdvanced && (
          <AuthPatTokenGuide
            helpHref={FIGMA_PAT_HELP_URL}
            onHelpClick={(e: MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault();
              openExternalUrl(FIGMA_PAT_HELP_URL);
            }}
            helpLabel={
              <>
                How to generate a personal access token
                <ExternalLink size={12} />
              </>
            }
          >
            <OnboardingFieldStack>
              <SecretField
                value={pat}
                onChange={(e) => void handleTokenChange(e.target.value)}
                show={showToken}
                onToggleShow={() => setShowToken(!showToken)}
                placeholder="Paste your new token here"
              />
              {isValidating && authMethod !== "oauth" && (
                <ValidatingIndicator label="Validating token..." />
              )}
              {tokenValid && authMethod === "pat" && (
                <ConnectedStatus icon={CheckCircle2} message="Token is valid" />
              )}
            </OnboardingFieldStack>
          </AuthPatTokenGuide>
        )}

        {authMethod === "oauth" && user && (
          <ConnectedStatus
            icon={CheckCircle2}
            message={`Signed in as ${user.handle}`}
            align="center"
            spaced
          />
        )}

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
