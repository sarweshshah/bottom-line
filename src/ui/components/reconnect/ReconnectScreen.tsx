import { useState, useCallback } from "react";
import {
  Eye,
  EyeOff,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { useAuthStore } from "@ui/store/authStore";
import { useCommentsStore } from "@ui/store/commentsStore";

export function ReconnectScreen() {
  const { validateAndSetToken, isValidating, validationError, completeSetup } =
    useAuthStore();

  const [pat, setPat] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);

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

  const handleReconnect = useCallback(() => {
    if (!tokenValid) return;
    completeSetup();
    useCommentsStore.getState().refreshComments();
  }, [tokenValid, completeSetup]);

  return (
    <div className="flex flex-col h-full bg-figma-bg">
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-danger-bg border border-danger-border flex items-center justify-center mb-3">
            <ShieldAlert size={24} className="text-danger" />
          </div>
          <h1 className="text-lg font-semibold text-figma-text mb-1">
            Token Expired or Revoked
          </h1>
          <p className="text-sm text-figma-text-secondary max-w-[280px]">
            Your Figma token is no longer valid. Generate a new one and paste it
            below to reconnect.
          </p>
        </div>

        <div className="mb-4">
          <a
            href="https://www.figma.com/settings"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-accent hover:underline text-xs"
          >
            Open Figma Settings to create a new token
            <ExternalLink size={12} />
          </a>
        </div>

        <div className="relative mb-2">
          <input
            type={showToken ? "text" : "password"}
            value={pat}
            onChange={(e) => handleTokenChange(e.target.value)}
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

        {isValidating && (
          <div className="flex items-center gap-1.5 text-xs text-figma-text-secondary">
            <Loader2 size={12} className="animate-spin" />
            Validating token...
          </div>
        )}
        {tokenValid && (
          <div className="flex items-center gap-1.5 text-xs text-status-resolved">
            <CheckCircle2 size={12} />
            Token is valid
          </div>
        )}
        {validationError && (
          <div className="flex items-center gap-1.5 text-xs text-danger bg-danger-bg border border-danger-border rounded-md px-2 py-1">
            <AlertCircle size={12} />
            {validationError}
          </div>
        )}
      </div>

      <div className="px-5 py-4 border-t border-figma-border">
        <button
          type="button"
          disabled={!tokenValid || isValidating}
          onClick={handleReconnect}
          className="w-full py-2.5 rounded-md text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-accent-bg text-white hover:bg-accent-hover active:bg-accent-hover"
        >
          Reconnect
        </button>
      </div>
    </div>
  );
}
