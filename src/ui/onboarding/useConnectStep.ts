import { useEffect, useState } from "react";
import { isFigmaOAuthConfigured } from "@ui/lib/figmaOAuth";
import { useFigmaOAuthSignIn } from "@ui/hooks/useFigmaOAuthSignIn";
import { usePatTokenInput } from "@ui/hooks/usePatTokenInput";
import { useAuthStore } from "@ui/store/authStore";

export function useConnectStep() {
  const oauthAvailable = isFigmaOAuthConfigured();
  const authMethod = useAuthStore((s) => s.authMethod);
  const patInput = usePatTokenInput();
  const [showPatAdvanced, setShowPatAdvanced] = useState(!oauthAvailable);

  useEffect(() => {
    if (authMethod === "oauth") {
      setShowPatAdvanced(false);
    } else if (!oauthAvailable) {
      setShowPatAdvanced(true);
    }
  }, [authMethod, oauthAvailable]);

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
