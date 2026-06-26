import { CheckCircle2, Link, Sparkles } from "lucide-react";
import { FieldError } from "@ui/components/common/FieldError";
import { ConnectedStatus } from "@ui/components/common/authUi";
import {
  OnboardingContinueButton,
  OnboardingFieldStack,
  OnboardingFileUrlInput,
  OnboardingIntroText,
  OnboardingStep,
  OnboardingStepBody,
  OnboardingStepNav,
  SetupReadyBanner,
} from "@ui/components/onboarding/onboardingPrimitives";
import { OnboardingStepHeader } from "@ui/components/common/layout";
import { useLinkFileStep } from "@ui/onboarding/useLinkFileStep";
import { ONBOARDING_CONFIG_STEPS } from "@ui/onboarding/onboardingConfig";

type LinkFileStepProps = {
  onBack: () => void;
};

export function LinkFileStep({ onBack }: LinkFileStepProps) {
  const { fileUrl, fileKey, urlError, handleUrlChange, handleSubmit, canSubmit } =
    useLinkFileStep();

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

      <OnboardingStepNav step={3} onBack={onBack}>
        <OnboardingContinueButton
          disabled={!canSubmit}
          onClick={() => void handleSubmit()}
        >
          Launch Bottom Line
          <Sparkles size={14} />
        </OnboardingContinueButton>
      </OnboardingStepNav>
    </OnboardingStep>
  );
}
