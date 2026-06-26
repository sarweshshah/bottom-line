import { CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import { ConnectedStatus } from "@ui/components/common/authUi";
import { AiProviderConfigFields } from "@ui/components/ai/AiProviderConfigFields";
import {
  OnboardingContinueButton,
  OnboardingFieldStack,
  OnboardingIntroText,
  OnboardingStep,
  OnboardingStepBody,
  OnboardingStepNav,
} from "@ui/components/onboarding/onboardingPrimitives";
import { OnboardingStepHeader } from "@ui/components/common/layout";
import { useAiProviderSetup } from "@ui/onboarding/useAiProviderSetup";
import { ONBOARDING_CONFIG_STEPS } from "@ui/onboarding/onboardingConfig";

type AiProviderStepProps = {
  onNext: () => void;
  onBack: () => void;
};

export function AiProviderStep({ onNext, onBack }: AiProviderStepProps) {
  const { hasConfiguredProvider, handleContinue } = useAiProviderSetup(onNext);

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

      <OnboardingStepNav step={1} onBack={onBack}>
        <OnboardingContinueButton
          disabled={!hasConfiguredProvider}
          onClick={handleContinue}
        >
          Continue
          <ArrowRight size={14} />
        </OnboardingContinueButton>
      </OnboardingStepNav>
    </OnboardingStep>
  );
}
