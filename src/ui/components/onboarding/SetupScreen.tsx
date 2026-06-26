import { useState } from "react";
import { OnboardingScreen } from "@ui/components/onboarding/onboardingPrimitives";
import { WelcomeStep } from "@ui/components/onboarding/WelcomeStep";
import { ConnectStep } from "@ui/components/onboarding/ConnectStep";
import { AiProviderStep } from "@ui/components/onboarding/AiProviderStep";
import { LinkFileStep } from "@ui/components/onboarding/LinkFileStep";

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
      {step === 3 && <LinkFileStep onBack={() => setStep(2)} />}
    </OnboardingScreen>
  );
}
