import { useState, useCallback, type MouseEvent } from "react";
import {
  Eye,
  EyeOff,
  ExternalLink,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { FieldError } from "@ui/components/common/FieldError";
import { useAuthStore } from "@ui/store/authStore";
import { useCommentsStore } from "@ui/store/commentsStore";
import {
  isFigmaOAuthConfigured,
  beginOAuthSession,
  pollOAuthUntilComplete,
} from "@ui/lib/figmaOAuth";
import { openExternalUrl } from "@ui/lib/openExternal";
import {
  FIGMA_PAT_HELP_URL,
  FIGMA_PAT_REQUIRED_SCOPES,
} from "@shared/figmaPat";
import pluginLogo from "@ui/assets/plugin-logo.png";

export function ReconnectScreen() {
  const oauthAvailable = isFigmaOAuthConfigured();
  const {
    validateAndSetToken,
    applyOAuthSession,
    completeSetup,
    isValidating,
    validationError,
    authMethod,
    user,
  } = useAuthStore();

  const [pat, setPat] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [showPatAdvanced, setShowPatAdvanced] = useState(!oauthAvailable);
  const [oauthBusy, setOauthBusy] = useState(false);

  const handleTokenChange = useCallback(
    async (value: string) => {
      setPat(value);
      setTokenValid(false);
      if (!value.trim()) return;

      try {
        await validateAndSetToken(value.trim());
        setTokenValid(true);
      } catch {
        setTokenValid(false);
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
      setTokenValid(false);
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

  const handleReconnect = useCallback(() => {
    const auth = useAuthStore.getState().getRestAuth();
    if (!auth) return;
    completeSetup();
    useCommentsStore.getState().refreshComments();
  }, [completeSetup]);

  const auth = useAuthStore((s) => s.getRestAuth());
  const authReady = !!auth && (authMethod === "oauth" || tokenValid);

  return (
    <div className="flex flex-col h-full bg-figma-bg">
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="flex flex-col items-center text-center mb-6">
          <img
            src={pluginLogo}
            alt=""
            className="h-14 w-14 rounded-xl object-cover mb-3 opacity-60"
            aria-hidden
          />
          <div className="w-10 h-10 rounded-full bg-danger-bg border border-danger-border flex items-center justify-center mb-3">
            <ShieldAlert size={20} className="text-danger" />
          </div>
          <h1 className="text-lg font-semibold text-figma-text mb-1">
            Reconnect to Figma
          </h1>
          <p className="text-sm text-figma-text-secondary max-w-[280px]">
            Your session or token is no longer valid. Sign in again or paste a new personal
            access token.
          </p>
        </div>

        {oauthAvailable && (
          <div className="mb-4">
            <button
              type="button"
              disabled={oauthBusy || isValidating}
              onClick={() => void handleSignInWithFigma()}
              className="w-full py-2.5 rounded-md text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-figma-bg-secondary border border-figma-border text-figma-text hover:bg-figma-bg-tertiary"
            >
              {oauthBusy ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Waiting for browser…
                </span>
              ) : (
                "Sign in with Figma"
              )}
            </button>
          </div>
        )}

        {oauthAvailable && (
          <button
            type="button"
            onClick={() => setShowPatAdvanced((v) => !v)}
            className="flex items-center gap-1 text-xs text-accent hover:underline mb-3 w-full justify-center"
          >
            {showPatAdvanced ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Use a personal access token instead
          </button>
        )}

        {showPatAdvanced && (
          <>
            <div className="mb-4 text-xs text-figma-text-secondary space-y-2">
              <p className="text-figma-text-tertiary">
                When generating a token, enable these permissions:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-figma-text-tertiary">
                {FIGMA_PAT_REQUIRED_SCOPES.map((scope) => (
                  <li key={scope}>
                    <code className="font-mono text-xs">{scope}</code>
                  </li>
                ))}
              </ul>
              <a
                href={FIGMA_PAT_HELP_URL}
                className="inline-flex items-center gap-1 text-accent hover:underline"
                onClick={(e: MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  openExternalUrl(FIGMA_PAT_HELP_URL);
                }}
              >
                How to generate a personal access token
                <ExternalLink size={12} />
              </a>
            </div>

            <div className="flex flex-col gap-2">
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={pat}
                  onChange={(e) => void handleTokenChange(e.target.value)}
                  placeholder="Paste your new token here"
                  className="w-full bg-figma-bg-secondary border border-figma-border rounded-md px-3 py-2 pr-9 text-xs text-figma-text placeholder:text-figma-text-disabled focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-figma-icon-tertiary hover:text-figma-icon-secondary"
                >
                  {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {isValidating && authMethod !== "oauth" && (
                <div className="flex items-center gap-1.5 text-xs text-figma-text-secondary">
                  <Loader2 size={12} className="animate-spin" />
                  Validating token...
                </div>
              )}
              {tokenValid && authMethod === "pat" && (
                <div className="flex items-center gap-1.5 text-xs text-status-resolved">
                  <CheckCircle2 size={12} />
                  Token is valid
                </div>
              )}
            </div>
          </>
        )}

        {authMethod === "oauth" && user && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-status-resolved mt-2">
            <CheckCircle2 size={12} />
            Signed in as {user.handle}
          </div>
        )}

        {validationError && (
          <div className="mt-3">
            <FieldError>{validationError}</FieldError>
          </div>
        )}
      </div>

      <div className="px-5 py-4 border-t border-figma-border">
        <button
          type="button"
          disabled={!authReady || isValidating || oauthBusy}
          onClick={handleReconnect}
          className="w-full py-2.5 rounded-md text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-accent-bg text-white hover:bg-accent-hover active:bg-accent-hover"
        >
          Reconnect
        </button>
      </div>
    </div>
  );
}
