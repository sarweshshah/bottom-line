import { useState } from "react";
import { isFigmaOAuthConfigured } from "@ui/lib/figmaOAuth";
import { useFigmaOAuthSignIn } from "@ui/hooks/useFigmaOAuthSignIn";
import { usePatTokenInput } from "@ui/hooks/usePatTokenInput";

export function useConnectStep() {
  const oauthAvailable = isFigmaOAuthConfigured();
  const patInput = usePatTokenInput();
  const [showPatAdvanced, setShowPatAdvanced] = useState(!oauthAvailable);

  const { oauthBusy, signInWithFigma } = useFigmaOAuthSignIn(patInput.clearPat);

  return {
    oauthAvailable,
    showPatAdvanced,
    setShowPatAdvanced,
    oauthBusy,
    signInWithFigma,
    ...patInput,
  };
}
