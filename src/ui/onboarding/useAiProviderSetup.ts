import { useCallback } from "react";
import { useAIStore } from "@ui/store/aiStore";

export function useAiProviderSetup(onNext: () => void) {
  const hasConfiguredProvider = useAIStore((s) => s.hasConfiguredProvider());
  const imageAnalysisEnabled = useAIStore((s) => s.imageAnalysisEnabled);
  const setCloudAiConsented = useAIStore((s) => s.setCloudAiConsented);

  const handleContinue = useCallback(() => {
    setCloudAiConsented(true, imageAnalysisEnabled);
    onNext();
  }, [imageAnalysisEnabled, onNext, setCloudAiConsented]);

  return { hasConfiguredProvider, handleContinue };
}
