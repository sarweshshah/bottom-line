import { ArrowRight } from "lucide-react";
import {
  OnboardingFeatureList,
  OnboardingStep,
  OnboardingWelcomeBody,
  WelcomeHero,
} from "@ui/components/onboarding/onboardingPrimitives";
import {
  FeatureCard,
  OnboardingFooter,
  StepIndicator,
} from "@ui/components/common/layout";
import { Button } from "@ui/components/common/uiPrimitives";
import {
  ONBOARDING_FEATURES,
  ONBOARDING_CONFIG_STEPS,
} from "@ui/onboarding/onboardingConfig";
import pluginLogo from "@ui/assets/plugin-logo.png";

type WelcomeStepProps = {
  onNext: () => void;
};

export function WelcomeStep({ onNext }: WelcomeStepProps) {
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
          {ONBOARDING_FEATURES.map(({ icon, title, description }) => (
            <FeatureCard
              key={title}
              icon={icon}
              title={title}
              description={description}
            />
          ))}
        </OnboardingFeatureList>
      </OnboardingWelcomeBody>

      <OnboardingFooter
        stepIndicator={
          <StepIndicator current={-1} total={ONBOARDING_CONFIG_STEPS} />
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
