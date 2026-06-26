import { useState, useCallback } from "react";
import { useAuthStore } from "@ui/store/authStore";
import {
  beginOAuthSession,
  pollOAuthUntilComplete,
} from "@ui/lib/figmaOAuth";
import { openExternalUrl } from "@ui/lib/openExternal";
import { showToast } from "@ui/components/common/Toast";

export function useFigmaOAuthSignIn(
  onSuccess?: () => void,
  successToast?: string,
) {
  const applyOAuthSession = useAuthStore((s) => s.applyOAuthSession);
  const [oauthBusy, setOauthBusy] = useState(false);

  const signInWithFigma = useCallback(async () => {
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
      onSuccess?.();
      if (successToast) {
        showToast(successToast, "success");
      }
    } catch (e) {
      useAuthStore.setState({
        validationError:
          e instanceof Error ? e.message : "Sign in with Figma failed.",
      });
    } finally {
      setOauthBusy(false);
    }
  }, [applyOAuthSession, onSuccess, successToast]);

  return { oauthBusy, signInWithFigma };
}
