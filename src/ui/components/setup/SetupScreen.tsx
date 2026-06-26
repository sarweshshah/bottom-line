import { useState, useCallback } from "react";
import {
  CheckCircle2,
  Link,
  ShieldCheck,
  ArrowRight,
  MessageSquare,
  Sparkles,
  CheckSquare,
} from "lucide-react";
import { FieldError } from "@ui/components/common/FieldError";
import {
  AccountCard,
  ConnectedStatus,
  ExpandableDisclosure,
  OAuthSignInButton,
  PatSectionHeading,
  ValidatingIndicator,
} from "@ui/components/common/authUi";
import {
  OnboardingContinueButton,
  OnboardingBackButton,
  OnboardingErrorBlock,
  OnboardingFeatureList,
  OnboardingFieldStack,
  OnboardingFileUrlInput,
  OnboardingHint,
  OnboardingIntroText,
  OnboardingScreen,
  OnboardingSpacedBlock,
  OnboardingStep,
  OnboardingStepBody,
  OnboardingWelcomeBody,
  PatSetupGuide,
  PatTransparencyList,
  SetupReadyBanner,
  WelcomeHero,
} from "@ui/components/onboarding/onboardingPrimitives";
import {
  FeatureCard,
  OnboardingFooter,
  OnboardingStepHeader,
  StepIndicator,
} from "@ui/components/common/layout";
import {
  Button,
  InfoTooltip,
  SecretField,
} from "@ui/components/common/uiPrimitives";
import { AiProviderConfigFields } from "@ui/components/ai/AiProviderConfigFields";
import { useAuthStore } from "@ui/store/authStore";
import { useAIStore } from "@ui/store/aiStore";
import { parseFileKey, isValidFigmaUrl } from "@ui/lib/parseFileUrl";
import {
  isFigmaOAuthConfigured,
  beginOAuthSession,
  pollOAuthUntilComplete,
} from "@ui/lib/figmaOAuth";
import { openExternalUrl } from "@ui/lib/openExternal";
import pluginLogo from "@ui/assets/plugin-logo.png";

const ONBOARDING_TOTAL_STEPS = 4;
const ONBOARDING_CONFIG_STEPS = 3;

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Comment Dashboard",
    desc: "Filter threads by Open, Read, or Done across the page or full file",
  },
  {
    icon: Sparkles,
    title: "AI Summaries",
    desc: "Summarize threads on demand or in bulk with your chosen provider",
  },
  {
    icon: CheckSquare,
    title: "Tasks Tab",
    desc: "Extract and track action items from discussions in one place",
  },
];

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <OnboardingStep variant="welcome">
      <OnboardingWelcomeBody>
        <WelcomeHero
          logoSrc={pluginLogo}
          logoAlt="Bottom Line"
          title="Welcome to Bottom Line"
          description="AI-powered comment intelligence for your Figma design files."
        />

        <OnboardingFeatureList>
          {FEATURES.map(({ icon, title, desc }) => (
            <FeatureCard
              key={title}
              icon={icon}
              title={title}
              description={desc}
            />
          ))}
        </OnboardingFeatureList>
      </OnboardingWelcomeBody>

      <OnboardingFooter
        stepIndicator={
          <StepIndicator current={0} total={ONBOARDING_TOTAL_STEPS} />
        }
      >
        <Button
          variant="primary"
          controlSize="md"
          fullWidth
          className="min-h-10"
          onClick={onNext}
        >
          Get Started
          <ArrowRight size={14} />
        </Button>
      </OnboardingFooter>
    </OnboardingStep>
  );
}

function ConnectStep({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const oauthAvailable = isFigmaOAuthConfigured();
  const {
    validateAndSetToken,
    applyOAuthSession,
    isValidating,
    validationError,
    user,
    authMethod,
  } = useAuthStore();

  const [pat, setPat] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [showPatAdvanced, setShowPatAdvanced] = useState(!oauthAvailable);
  const [oauthBusy, setOauthBusy] = useState(false);

  const handleTokenChange = useCallback(
    async (value: string) => {
      setPat(value);
      if (!value.trim()) return;
      try {
        await validateAndSetToken(value.trim());
      } catch {
        /* validationError in store */
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

  return (
    <OnboardingStep>
      <OnboardingStepBody>
        <OnboardingStepHeader
          icon={ShieldCheck}
          title="Connect to Figma"
          subtitle={`Step 1 of ${ONBOARDING_CONFIG_STEPS} · Sign in to access your comments`}
        />

        {oauthAvailable && !user && (
          <OnboardingSpacedBlock>
            <OAuthSignInButton
              busy={oauthBusy}
              disabled={isValidating}
              onClick={() => void handleSignInWithFigma()}
            />
            <OnboardingHint>
              Opens your browser to sign in. Return here when the tab says you
              can close it.
            </OnboardingHint>
          </OnboardingSpacedBlock>
        )}

        {oauthAvailable && (
          <OnboardingSpacedBlock spacing="sm">
            <ExpandableDisclosure
              open={showPatAdvanced}
              onToggle={() => setShowPatAdvanced((v) => !v)}
            >
              Use a personal access token instead
            </ExpandableDisclosure>
          </OnboardingSpacedBlock>
        )}

        {showPatAdvanced && (
          <>
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

            <PatSetupGuide />

            <OnboardingFieldStack>
              <SecretField
                value={pat}
                onChange={(e) => void handleTokenChange(e.target.value)}
                show={showToken}
                onToggleShow={() => setShowToken(!showToken)}
                placeholder="figd_xxxxxxxxxxxxxxxx"
              />
              {isValidating && authMethod !== "oauth" && <ValidatingIndicator />}
              {user && authMethod === "pat" && (
                <ConnectedStatus
                  icon={CheckCircle2}
                  message={`Connected as ${user.handle}`}
                />
              )}
            </OnboardingFieldStack>
          </>
        )}

        {user && (
          <AccountCard
            spaced
            handle={user.handle}
            imgUrl={user.img_url}
            colorKey={user.id}
            avatarSize={40}
            subtitle={
              authMethod === "oauth"
                ? "Signed in with Figma"
                : "Using personal access token"
            }
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
                  onClick={() => void handleSignInWithFigma()}
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

      <OnboardingFooter
        stepIndicator={
          <StepIndicator current={1} total={ONBOARDING_TOTAL_STEPS} />
        }
      >
        <OnboardingBackButton onClick={onBack} />
        <OnboardingContinueButton disabled={!user} onClick={onNext}>
          Continue
          <ArrowRight size={14} />
        </OnboardingContinueButton>
      </OnboardingFooter>
    </OnboardingStep>
  );
}

function AiProviderStep({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const hasConfiguredProvider = useAIStore((s) => s.hasConfiguredProvider());
  const imageAnalysisEnabled = useAIStore((s) => s.imageAnalysisEnabled);
  const setCloudAiConsented = useAIStore((s) => s.setCloudAiConsented);

  const handleContinue = useCallback(() => {
    setCloudAiConsented(true, imageAnalysisEnabled);
    onNext();
  }, [imageAnalysisEnabled, onNext, setCloudAiConsented]);

  return (
    <OnboardingStep>
      <OnboardingStepBody>
        <OnboardingStepHeader
          icon={Sparkles}
          title="Connect Your AI Provider"
          subtitle={`Step 2 of ${ONBOARDING_CONFIG_STEPS} · Enable summaries and task extraction`}
        />

        <OnboardingIntroText>
          Choose a provider and paste your API key. Comment text from threads
          you summarize is sent to that provider only — your Figma token is
          never shared.
        </OnboardingIntroText>

        <OnboardingFieldStack>
          <AiProviderConfigFields mode="compact" />
          {hasConfiguredProvider && (
            <ConnectedStatus
              icon={CheckCircle2}
              message="AI provider configured"
            />
          )}
        </OnboardingFieldStack>
      </OnboardingStepBody>

      <OnboardingFooter
        stepIndicator={
          <StepIndicator current={2} total={ONBOARDING_TOTAL_STEPS} />
        }
      >
        <OnboardingBackButton onClick={onBack} />
        <OnboardingContinueButton
          disabled={!hasConfiguredProvider}
          onClick={handleContinue}
        >
          Continue
          <ArrowRight size={14} />
        </OnboardingContinueButton>
      </OnboardingFooter>
    </OnboardingStep>
  );
}

function LinkFileStep({
  onBack,
  onFinish,
}: {
  onBack: () => void;
  onFinish: () => void;
}) {
  const { user, setFileInfo, completeSetup, isValidating } = useAuthStore();

  const [fileUrl, setFileUrl] = useState("");
  const [fileKey, setFileKey] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  const handleUrlChange = useCallback((value: string) => {
    setFileUrl(value);
    setUrlError(null);

    if (!value.trim()) {
      setFileKey(null);
      return;
    }

    if (!isValidFigmaUrl(value)) {
      setUrlError("Please enter a valid Figma file URL.");
      setFileKey(null);
      return;
    }

    const key = parseFileKey(value);
    setFileKey(key);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!user || !fileKey) return;
    await setFileInfo(fileUrl, fileKey);
    completeSetup();
    onFinish();
  }, [user, fileKey, fileUrl, setFileInfo, completeSetup, onFinish]);

  const canSubmit = !!user && !!fileKey && !isValidating;

  return (
    <OnboardingStep>
      <OnboardingStepBody>
        <OnboardingStepHeader
          icon={Link}
          title="Link Your File"
          subtitle={`Step ${ONBOARDING_CONFIG_STEPS} of ${ONBOARDING_CONFIG_STEPS} · Choose which file to analyze`}
        />

        <OnboardingIntroText>
          Paste the URL of the Figma file you want to analyze comments for.
          You can change this later in Settings.
        </OnboardingIntroText>

        <OnboardingFieldStack>
          <OnboardingFileUrlInput
            value={fileUrl}
            onChange={handleUrlChange}
            placeholder="https://www.figma.com/design/abc123/..."
          />
          {urlError && <FieldError>{urlError}</FieldError>}
          {fileKey && !urlError && (
            <ConnectedStatus icon={CheckCircle2} message="File key detected" />
          )}
        </OnboardingFieldStack>

        {fileKey && !urlError && <SetupReadyBanner />}
      </OnboardingStepBody>

      <OnboardingFooter
        stepIndicator={
          <StepIndicator current={3} total={ONBOARDING_TOTAL_STEPS} />
        }
      >
        <OnboardingBackButton onClick={onBack} />
        <OnboardingContinueButton disabled={!canSubmit} onClick={() => void handleSubmit()}>
          Launch Bottom Line
          <Sparkles size={14} />
        </OnboardingContinueButton>
      </OnboardingFooter>
    </OnboardingStep>
  );
}

export function SetupScreen() {
  const [step, setStep] = useState(0);

  return (
    <OnboardingScreen>
      {step === 0 && <WelcomeStep onNext={() => setStep(1)} />}
      {step === 1 && (
        <ConnectStep
          onNext={() => setStep(2)}
          onBack={() => setStep(0)}
        />
      )}
      {step === 2 && (
        <AiProviderStep
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <LinkFileStep
          onBack={() => setStep(2)}
          onFinish={() => {}}
        />
      )}
    </OnboardingScreen>
  );
}
