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
  ShieldX,
} from "lucide-react";
import { useAuthStore } from "@ui/store/authStore";
import { parseFileKey, isValidFigmaUrl } from "@ui/lib/parseFileUrl";

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
          <p className="text-xs text-figma-text-secondary">
            AI-powered comment intelligence for your design files.
            <br />
            Connect your Figma account to get started.
          </p>
        </div>

        {/* Section 1: Figma Token */}
        <section className="mb-5">
          <h2 className="text-sm font-medium text-figma-text mb-2 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-status-open" />
            Figma Personal Access Token
          </h2>

          <div className="text-2xs text-figma-text-secondary mb-3 space-y-1.5">
            <p className="font-medium text-figma-text-secondary">How to get your token:</p>
            <ol className="list-decimal list-inside space-y-0.5 text-figma-text-tertiary">
              <li>Open Figma Settings &rarr; Security</li>
              <li>Generate a new token named "Bottom Line"</li>
              <li>
                Include the <code className="bg-figma-bg-secondary px-1 py-0.5 rounded text-2xs">file_comments:read</code> scope
              </li>
              <li>Copy and paste it below</li>
            </ol>
            <a
              href="https://www.figma.com/settings"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-status-open hover:underline text-2xs mt-1"
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
              className="w-full bg-figma-bg-secondary border border-figma-border rounded-md px-3 py-2 pr-9 text-xs text-figma-text placeholder:text-figma-text-disabled focus:outline-none focus:border-status-open focus:ring-1 focus:ring-status-open/30"
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
            <div className="flex items-center gap-1.5 text-2xs text-figma-text-secondary">
              <Loader2 size={12} className="animate-spin" />
              Validating token...
            </div>
          )}
          {tokenValid && user && (
            <div className="flex items-center gap-1.5 text-2xs text-status-resolved">
              <CheckCircle2 size={12} />
              Connected as {user.handle}
            </div>
          )}
          {validationError && (
            <div className="flex items-center gap-1.5 text-2xs text-red-500">
              <AlertCircle size={12} />
              {validationError}
            </div>
          )}

          {/* Transparency */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-2xs">
            <div className="bg-figma-bg-secondary rounded-md p-2">
              <p className="font-medium text-figma-text-secondary mb-1 flex items-center gap-1">
                <ShieldCheck size={10} className="text-status-resolved" />
                Will do
              </p>
              <ul className="text-figma-text-tertiary space-y-0.5">
                <li>&bull; Read comments &amp; threads</li>
                <li>&bull; Read user profiles</li>
                <li>&bull; Navigate to comments</li>
              </ul>
            </div>
            <div className="bg-figma-bg-secondary rounded-md p-2">
              <p className="font-medium text-figma-text-secondary mb-1 flex items-center gap-1">
                <ShieldX size={10} className="text-red-400" />
                Will never do
              </p>
              <ul className="text-figma-text-tertiary space-y-0.5">
                <li>&bull; Modify your designs</li>
                <li>&bull; Store token externally</li>
                <li>&bull; Share data with others</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 2: File URL */}
        <section className="mb-5">
          <h2 className="text-sm font-medium text-figma-text mb-2 flex items-center gap-1.5">
            <Link size={14} className="text-status-open" />
            Figma File URL
          </h2>
          <p className="text-2xs text-figma-text-tertiary mb-2">
            Paste the URL of the Figma file you want to analyze comments for.
          </p>
          <input
            type="text"
            value={fileUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://www.figma.com/design/abc123/..."
            className="w-full bg-figma-bg-secondary border border-figma-border rounded-md px-3 py-2 text-xs text-figma-text placeholder:text-figma-text-disabled focus:outline-none focus:border-status-open focus:ring-1 focus:ring-status-open/30"
          />
          {urlError && (
            <div className="flex items-center gap-1.5 text-2xs text-red-500 mt-1">
              <AlertCircle size={12} />
              {urlError}
            </div>
          )}
          {fileKey && !urlError && (
            <div className="flex items-center gap-1.5 text-2xs text-status-resolved mt-1">
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
          className="w-full py-2.5 rounded-md text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-status-open text-white hover:bg-blue-600 active:bg-blue-700"
        >
          Get Started
        </button>
      </div>
    </div>
  );
}
