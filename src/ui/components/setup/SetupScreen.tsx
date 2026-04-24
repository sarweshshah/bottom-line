import { useState, useCallback } from "react";
import {
  Eye,
  EyeOff,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Link,
  ShieldCheck,
  Info,
  Check,
  X,
} from "lucide-react";
import { useAuthStore } from "@ui/store/authStore";
import { parseFileKey, isValidFigmaUrl } from "@ui/lib/parseFileUrl";

const PAT_TRANSPARENCY_ITEMS = [
  { allow: true, label: "Read comment threads" },
  { allow: true, label: "Read user profiles" },
  { allow: true, label: "Navigate to comments" },
  { allow: false, label: "Modify your designs" },
  { allow: false, label: "Store token externally" },
  { allow: false, label: "Share data with others" },
] as const;

export function SetupScreen() {
  const { validateAndSetToken, setFileInfo, completeSetup, isValidating, validationError, user } =
    useAuthStore();

  const [pat, setPat] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);

  const [fileUrl, setFileUrl] = useState("");
  const [fileKey, setFileKey] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

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

  const handleUrlChange = useCallback((value: string) => {
    setFileUrl(value);
    setUrlError(null);

    if (!value.trim()) {
      setFileKey(null);
      return;
    }

    if (!isValidFigmaUrl(value)) {
      setUrlError("Please enter a valid Figma file URL.");
      setFileKey(null);
      return;
    }

    const key = parseFileKey(value);
    setFileKey(key);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!tokenValid || !fileKey) return;
    await setFileInfo(fileUrl, fileKey);
    completeSetup();
  }, [tokenValid, fileKey, fileUrl, setFileInfo, completeSetup]);

  const canSubmit = tokenValid && !!fileKey && !isValidating;

  return (
    <div className="flex flex-col h-full bg-figma-bg">
      <div className="flex-1 overflow-y-auto px-5 py-6">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-lg font-semibold text-figma-text mb-1">
            Welcome to Bottom Line
          </h1>
          <p className="text-sm text-figma-text-secondary">
            AI-powered comment intelligence for your design files.
            <br />
            Connect your Figma account to get started.
          </p>
        </div>

        {/* Section 1: Figma Token */}
        <section className="mb-5">
          <h2 className="text-sm font-medium text-figma-text mb-2 flex items-center gap-1.5 flex-wrap">
            <ShieldCheck size={14} className="text-accent" />
            Figma Personal Access Token
            <span className="relative inline-flex group">
              <button
                type="button"
                className="rounded p-0.5 text-figma-icon-tertiary hover:text-figma-icon-secondary focus:outline-none focus-visible:ring-1 focus-visible:ring-accent-ring"
                aria-label="What your token is used for"
                aria-describedby="pat-token-transparency"
              >
                <Info size={13} strokeWidth={2} aria-hidden />
              </button>
              <div
                id="pat-token-transparency"
                className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 w-max max-w-[min(260px,calc(100vw-2.5rem))] -translate-x-1/2 scale-95 rounded-md border border-white/[0.18] bg-figma-text pl-2.5 pr-3.5 py-2 text-left font-normal text-figma-bg opacity-0 shadow-[0_4px_20px_rgba(0,0,0,0.22)] transition-[opacity,transform] duration-150 [html.figma-dark_&]:border-black/[0.14] group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:scale-100 group-focus-within:opacity-100"
                role="tooltip"
              >
                {/* <p className="mb-1.5 text-[11px] font-medium leading-tight text-figma-bg">
                  Access Token is used to
                </p> */}
                <ul className="space-y-0.5 text-[10px] leading-tight text-figma-bg">
                  {PAT_TRANSPARENCY_ITEMS.map(({ allow, label }) => (
                    <li key={label} className="flex items-start gap-1.5">
                      {allow ? (
                        <Check
                          size={10}
                          strokeWidth={2.5}
                          className="mt-[2px] shrink-0 text-status-resolved"
                          aria-hidden
                        />
                      ) : (
                        <X
                          size={10}
                          strokeWidth={2.5}
                          className="mt-[2px] shrink-0 text-danger"
                          aria-hidden
                        />
                      )}
                      <span className="min-w-0">{label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </span>
          </h2>

          <div className="text-xs text-figma-text-secondary mb-3 space-y-1.5">
            <p className="font-medium text-figma-text-secondary">How to get your token:</p>
            <ol className="list-decimal list-inside space-y-0.5 text-figma-text-tertiary">
              <li>Open Figma Settings &rarr; Security</li>
              <li>Generate a new token named "Bottom Line"</li>
              <li>
                Include the <code className="bg-figma-bg-secondary px-1 py-0.5 rounded text-xs">file_comments:read</code> scope
              </li>
              <li>Copy and paste it below</li>
            </ol>
            <a
              href="https://www.figma.com/settings"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-accent hover:underline text-xs mt-1"
            >
              Open Figma Settings
              <ExternalLink size={10} />
            </a>
          </div>

          {/* Token input */}
          <div className="relative mb-2">
            <input
              type={showToken ? "text" : "password"}
              value={pat}
              onChange={(e) => handleTokenChange(e.target.value)}
              placeholder="figd_xxxxxxxxxxxxxxxx"
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

          {/* Validation feedback */}
          {isValidating && (
            <div className="flex items-center gap-1.5 text-xs text-figma-text-secondary">
              <Loader2 size={12} className="animate-spin" />
              Validating token...
            </div>
          )}
          {tokenValid && user && (
            <div className="flex items-center gap-1.5 text-xs text-status-resolved">
              <CheckCircle2 size={12} />
              Connected as {user.handle}
            </div>
          )}
          {validationError && (
            <div className="flex items-center gap-1.5 text-xs text-danger bg-danger-bg border border-danger-border rounded-md px-2 py-1">
              <AlertCircle size={12} />
              {validationError}
            </div>
          )}
        </section>

        {/* Section 2: File URL */}
        <section className="mb-5">
          <h2 className="text-sm font-medium text-figma-text mb-2 flex items-center gap-1.5">
            <Link size={14} className="text-accent" />
            Figma File URL
          </h2>
          <p className="text-xs text-figma-text-tertiary mb-2">
            Paste the URL of the Figma file you want to analyze comments for.
          </p>
          <input
            type="text"
            value={fileUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://www.figma.com/design/abc123/..."
            className="w-full bg-figma-bg-secondary border border-figma-border rounded-md px-3 py-2 text-xs text-figma-text placeholder:text-figma-text-disabled focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring"
          />
          {urlError && (
            <div className="flex items-center gap-1.5 text-xs text-danger bg-danger-bg border border-danger-border rounded-md px-2 py-1 mt-1">
              <AlertCircle size={12} />
              {urlError}
            </div>
          )}
          {fileKey && !urlError && (
            <div className="flex items-center gap-1.5 text-xs text-status-resolved mt-1">
              <CheckCircle2 size={12} />
              File key detected
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-figma-border">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="w-full py-2.5 rounded-md text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-accent-bg text-white hover:bg-accent-hover active:bg-accent-hover"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
