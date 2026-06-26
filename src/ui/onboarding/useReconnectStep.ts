import { useState, useCallback } from "react";
import { isFigmaOAuthConfigured } from "@ui/lib/figmaOAuth";
import { useAuthStore } from "@ui/store/authStore";
import { useCommentsStore } from "@ui/store/commentsStore";
import { useFigmaOAuthSignIn } from "@ui/hooks/useFigmaOAuthSignIn";
import { usePatTokenInput } from "@ui/hooks/usePatTokenInput";

export function useReconnectStep() {
  const oauthAvailable = isFigmaOAuthConfigured();
  const completeSetup = useAuthStore((s) => s.completeSetup);
  const authMethod = useAuthStore((s) => s.authMethod);
  const auth = useAuthStore((s) => s.getRestAuth());

  const patInput = usePatTokenInput({ trackValidation: true });
  const [showPatAdvanced, setShowPatAdvanced] = useState(!oauthAvailable);

  const { oauthBusy, signInWithFigma } = useFigmaOAuthSignIn(patInput.clearPat);

  const handleReconnect = useCallback(() => {
    if (!auth) return;
    completeSetup();
    useCommentsStore.getState().refreshComments();
  }, [auth, completeSetup]);

  const authReady = Boolean(auth && (authMethod === "oauth" || patInput.tokenValid));

  return {
    oauthAvailable,
    showPatAdvanced,
    setShowPatAdvanced,
    oauthBusy,
    signInWithFigma,
    handleReconnect,
    authReady,
    ...patInput,
  };
}
