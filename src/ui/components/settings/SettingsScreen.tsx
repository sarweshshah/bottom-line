import { useState, useCallback, useEffect } from "react";
import {
  ArrowLeft,
  User as UserIcon,
  Eye,
  EyeOff,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  Link,
  ShieldCheck,
  Monitor,
  Settings,
  Sparkles,
  Image,
  Info,
  MessageSquare,
} from "lucide-react";
import { useAuthStore } from "@ui/store/authStore";
import { useCommentsStore } from "@ui/store/commentsStore";
import { useAIStore } from "@ui/store/aiStore";
import { parseFileKey, isValidFigmaUrl } from "@ui/lib/parseFileUrl";
import { showToast } from "@ui/components/common/Toast";
import { supportsVision, PROVIDER_MODEL_LABELS } from "@ui/ai/cloudProvider";
import { clearAllCachedSummaries } from "@ui/ai/summarize";
import type { AIProvider, CacheTTLMinutes } from "@shared/types";

type SettingsTab = "general" | "ai" | "behavior" | "auth" | "display" | "about";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "ai", label: "AI" },
  { id: "behavior", label: "Behavior" },
  { id: "auth", label: "Auth" },
  { id: "display", label: "Display" },
  { id: "about", label: "About" },
];

const PLUGIN_NAME = "Bottom Line";
const PLUGIN_ID = "bottom-line-dev";
const PLUGIN_VERSION = "0.1.0";

const TTL_OPTIONS: CacheTTLMinutes[] = [5, 10, 15, 30];

const PROVIDER_OPTIONS: {
  value: AIProvider;
  label: string;
  description: string;
}[] = [
  {
    value: "anthropic",
    label: "Anthropic",
    description: PROVIDER_MODEL_LABELS.anthropic,
  },
  {
    value: "openai",
    label: "OpenAI",
    description: PROVIDER_MODEL_LABELS.openai,
  },
  {
    value: "gemini",
    label: "Google",
    description: PROVIDER_MODEL_LABELS.gemini,
  },
  {
    value: "custom",
    label: "Custom",
    description: "OpenAI-compatible endpoint",
  },
];

function GeneralTab() {
  const { fileUrl, fileKey, setFileInfo } = useAuthStore();
  const { refreshComments } = useCommentsStore();

  const [url, setUrl] = useState(fileUrl ?? "");
  const [urlError, setUrlError] = useState<string | null>(null);

  const handleUrlChange = useCallback((value: string) => {
    setUrl(value);
    setUrlError(null);
  }, []);

  const handleSaveUrl = useCallback(async () => {
    if (!url.trim()) {
      setUrlError("Please enter a Figma file URL.");
      return;
    }
    if (!isValidFigmaUrl(url)) {
      setUrlError("Please enter a valid Figma file URL.");
      return;
    }
    const key = parseFileKey(url);
    if (!key) {
      setUrlError("Could not extract file key from URL.");
      return;
    }
    await setFileInfo(url, key);
    refreshComments();
    showToast("File updated successfully", "success");
  }, [url, setFileInfo, refreshComments]);

  return (
    <div className="space-y-5">
      {fileKey && (
        <section>
          <h3 className="text-sm font-medium text-figma-text mb-2 flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-status-resolved" />
            Connected File
          </h3>
          <div className="bg-figma-bg-secondary border border-figma-border rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-figma-text-tertiary">File key</span>
              <code className="text-xs text-figma-text font-medium bg-figma-bg px-1.5 py-0.5 rounded truncate max-w-[60%]">
                {fileKey}
              </code>
            </div>
            {fileUrl && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-figma-text-tertiary">URL</span>
                <span className="text-xs text-figma-text-secondary truncate max-w-[60%]">
                  {fileUrl}
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-sm font-medium text-figma-text mb-1 flex items-center gap-1.5">
          <Link size={14} className="text-accent" />
          {fileKey ? "Update File" : "Figma File"}
        </h3>
        <p className="text-xs text-figma-text-tertiary mb-3">
          {fileKey
            ? "Paste a new URL to switch the connected Figma file."
            : "The Figma file to analyze comments for."}
        </p>
        <div className="space-y-2.5">
          <input
            type="text"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://www.figma.com/design/abc123/..."
            className="w-full bg-figma-bg-secondary border border-figma-border rounded-md px-3 py-2 text-sm text-figma-text placeholder:text-figma-text-disabled focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring"
          />
          {urlError && (
            <div className="flex items-center gap-1.5 text-xs text-danger bg-danger-bg border border-danger-border rounded-md px-2.5 py-1.5">
              <AlertCircle size={12} />
              {urlError}
            </div>
          )}
          <button
            type="button"
            onClick={handleSaveUrl}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-accent-bg text-white hover:bg-accent-hover transition-colors"
          >
            {fileKey ? "Update File" : "Connect File"}
          </button>
        </div>
      </section>
    </div>
  );
}

function AITab() {
  const {
    provider,
    anthropicApiKey,
    openaiApiKey,
    geminiApiKey,
    customConfig,
    imageAnalysisEnabled,
    setProvider,
    setAnthropicApiKey,
    setOpenaiApiKey,
    setGeminiApiKey,
    setCustomConfig,
    setImageAnalysisEnabled,
  } = useAIStore();

  const [showKey, setShowKey] = useState(false);

  const currentKey = (() => {
    switch (provider) {
      case "anthropic":
        return anthropicApiKey;
      case "openai":
        return openaiApiKey;
      case "gemini":
        return geminiApiKey;
      case "custom":
        return customConfig.apiKey;
      default:
        return "";
    }
  })();

  const setCurrentKey = useCallback(
    (key: string) => {
      switch (provider) {
        case "anthropic":
          setAnthropicApiKey(key);
          break;
        case "openai":
          setOpenaiApiKey(key);
          break;
        case "gemini":
          setGeminiApiKey(key);
          break;
        case "custom":
          setCustomConfig({ ...customConfig, apiKey: key });
          break;
      }
    },
    [
      provider,
      customConfig,
      setAnthropicApiKey,
      setOpenaiApiKey,
      setGeminiApiKey,
      setCustomConfig,
    ],
  );

  const maskedKey = currentKey
    ? `${currentKey.slice(0, 8)}${"•".repeat(16)}`
    : "";

  const hasVision = supportsVision(provider);

  return (
    <div className="space-y-5">
      <section>
        <h3 className="text-sm font-medium text-figma-text mb-1 flex items-center gap-1.5">
          <Sparkles size={14} className="text-accent" />
          AI Provider
        </h3>
        <p className="text-xs text-figma-text-tertiary mb-3">
          Choose how thread summaries and tasks are generated.
        </p>

        <div className="bg-figma-bg-secondary border border-figma-border rounded-md divide-y divide-figma-border">
          {PROVIDER_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                provider === opt.value
                  ? "bg-figma-bg-selected"
                  : "hover:bg-figma-bg-hover"
              }`}
            >
              <input
                type="radio"
                name="ai-provider"
                value={opt.value}
                checked={provider === opt.value}
                onChange={() => {
                  setProvider(opt.value);
                  setShowKey(false);
                }}
                className="accent-accent w-3.5 h-3.5 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-figma-text">{opt.label}</p>
                <p className="text-[11px] text-figma-text-tertiary">
                  {opt.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </section>

      {provider !== "custom" && (
        <section>
          <h3 className="text-sm font-medium text-figma-text mb-1 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-accent" />
            API Key
          </h3>
          <p className="text-xs text-figma-text-tertiary mb-3">
            Your key is stored locally and only sent to{" "}
            {provider === "anthropic"
              ? "Anthropic"
              : provider === "openai"
                ? "OpenAI"
                : "Google"}
            .
          </p>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 bg-figma-bg-secondary border border-figma-border rounded-md px-3 py-2">
              <input
                type={showKey ? "text" : "password"}
                value={showKey ? currentKey : currentKey ? maskedKey : ""}
                onChange={(e) => setCurrentKey(e.target.value)}
                placeholder="Paste your API key"
                className="flex-1 bg-transparent text-sm text-figma-text placeholder:text-figma-text-disabled focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-figma-icon-tertiary hover:text-figma-icon-secondary shrink-0 p-0.5 rounded transition-colors"
                title={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {currentKey && (
              <div className="flex items-center gap-1.5 text-xs text-figma-text-tertiary">
                <CheckCircle2 size={11} className="text-status-resolved shrink-0" />
                <span>Key configured</span>
              </div>
            )}
          </div>
        </section>
      )}

      {provider === "custom" && (
        <section>
          <h3 className="text-sm font-medium text-figma-text mb-1 flex items-center gap-1.5">
            <Settings size={14} className="text-accent" />
            Custom Provider
          </h3>
          <p className="text-xs text-figma-text-tertiary mb-3">
            Any OpenAI-compatible endpoint (Groq, Mistral, Together AI, local
            Ollama, etc.)
          </p>
          <div className="space-y-3 bg-figma-bg-secondary border border-figma-border rounded-md p-3">
            <div>
              <label className="text-[11px] font-medium text-figma-text-secondary mb-1.5 block">
                Base URL
              </label>
              <input
                type="text"
                value={customConfig.baseUrl}
                onChange={(e) =>
                  setCustomConfig({ ...customConfig, baseUrl: e.target.value })
                }
                placeholder="https://api.example.com/v1"
                className="w-full bg-figma-bg border border-figma-border rounded-md px-3 py-2 text-sm text-figma-text placeholder:text-figma-text-disabled focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-figma-text-secondary mb-1.5 block">
                API Key <span className="text-figma-text-disabled font-normal">(optional)</span>
              </label>
              <input
                type="password"
                value={customConfig.apiKey}
                onChange={(e) =>
                  setCustomConfig({ ...customConfig, apiKey: e.target.value })
                }
                placeholder="API key (if required)"
                className="w-full bg-figma-bg border border-figma-border rounded-md px-3 py-2 text-sm text-figma-text placeholder:text-figma-text-disabled focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-figma-text-secondary mb-1.5 block">
                Model Name
              </label>
              <input
                type="text"
                value={customConfig.modelName}
                onChange={(e) =>
                  setCustomConfig({
                    ...customConfig,
                    modelName: e.target.value,
                  })
                }
                placeholder="e.g., llama-3.1-8b-instant"
                className="w-full bg-figma-bg border border-figma-border rounded-md px-3 py-2 text-sm text-figma-text placeholder:text-figma-text-disabled focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring"
              />
            </div>
          </div>
        </section>
      )}

      <section>
        <h3 className="text-sm font-medium text-figma-text mb-1 flex items-center gap-1.5">
          <Image size={14} className="text-accent" />
          Image Analysis
        </h3>
        <p className="text-xs text-figma-text-tertiary mb-3">
          Include images from comment threads in AI summaries for richer
          context.
        </p>

        <label className="flex items-center justify-between gap-3 p-3 bg-figma-bg-secondary border border-figma-border rounded-md cursor-pointer transition-colors hover:border-figma-border-hover">
          <div>
            <p className="text-sm font-medium text-figma-text">Enable image analysis</p>
            {!hasVision && (
              <p className="text-[11px] text-warning mt-1 flex items-center gap-1">
                <AlertCircle size={10} />
                {provider === "custom"
                  ? "Custom providers are treated as text-only."
                  : "Selected provider does not support vision."}
              </p>
            )}
          </div>
          <input
            type="checkbox"
            checked={imageAnalysisEnabled}
            onChange={(e) => setImageAnalysisEnabled(e.target.checked)}
            className="accent-accent w-4 h-4 cursor-pointer shrink-0"
          />
        </label>

        {imageAnalysisEnabled && hasVision && (
          <div className="mt-2.5 p-2.5 bg-warning-bg border border-warning-border rounded-md flex items-start gap-1.5">
            <AlertCircle size={12} className="text-warning shrink-0 mt-0.5" />
            <p className="text-[11px] text-warning leading-relaxed">
              Image tokens are significantly more expensive than text. Up to 5
              images per thread are sent, resized to max 1024px.
            </p>
          </div>
        )}
      </section>

      <ClearCacheSection />
    </div>
  );
}

function ClearCacheSection() {
  const threads = useCommentsStore((s) => s.threads);
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  const handleClear = useCallback(async () => {
    setClearing(true);
    try {
      await clearAllCachedSummaries(threads);
      setCleared(true);
      showToast("Summary cache cleared", "success");
    } catch {
      showToast("Failed to clear cache", "error");
    } finally {
      setClearing(false);
    }
  }, [threads]);

  return (
    <section className="pt-5 border-t border-figma-border">
      <h3 className="text-sm font-medium text-figma-text mb-1 flex items-center gap-1.5">
        <Loader2 size={14} className="text-accent" />
        Cache
      </h3>
      <p className="text-xs text-figma-text-tertiary mb-3">
        Clear all cached summaries and tasks. They will be regenerated on next
        request.
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleClear}
          disabled={clearing || cleared}
          className="px-3 py-1.5 rounded-md text-xs font-medium text-danger bg-danger-bg border border-danger-border hover:opacity-80 disabled:opacity-40 transition-colors"
        >
          {clearing
            ? "Clearing..."
            : cleared
              ? "Cleared"
              : "Clear all summaries"}
        </button>
      </div>
    </section>
  );
}

function BehaviorTab() {
  const { autoOpenComment, setAutoOpenComment } = useAuthStore();
  const { cacheTTLMinutes, setCacheTTLMinutes } = useCommentsStore();

  return (
    <div className="space-y-5">
      <section>
        <h3 className="text-sm font-medium text-figma-text mb-1 flex items-center gap-1.5">
          <Settings size={14} className="text-accent" />
          Behavior
        </h3>
        <p className="text-xs text-figma-text-tertiary mb-3">
          Customize how the plugin interacts with Figma.
        </p>

        <div className="space-y-3">
          <label className="flex items-center justify-between gap-3 p-3 bg-figma-bg-secondary border border-figma-border rounded-md cursor-pointer transition-colors hover:border-figma-border-hover">
            <div>
              <p className="text-sm font-medium text-figma-text">Show comment reminder</p>
              <p className="text-xs text-figma-text-tertiary mt-0.5">
                Show a notification to click the comment pin after navigating.
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoOpenComment}
              onChange={(e) => setAutoOpenComment(e.target.checked)}
              className="accent-accent w-4 h-4 cursor-pointer shrink-0"
            />
          </label>

          <label className="flex items-center justify-between gap-3 p-3 bg-figma-bg-secondary border border-figma-border rounded-md cursor-pointer transition-colors hover:border-figma-border-hover">
            <div>
              <p className="text-sm font-medium text-figma-text">Auto-refresh interval</p>
              <p className="text-xs text-figma-text-tertiary mt-0.5">
                Refresh thread list automatically.
              </p>
            </div>
            <select
              value={cacheTTLMinutes}
              onChange={(e) =>
                setCacheTTLMinutes(Number(e.target.value) as CacheTTLMinutes)
              }
              className="bg-figma-bg border border-figma-border rounded-md px-2 py-1.5 text-xs font-medium text-figma-text focus:outline-none focus:border-accent cursor-pointer"
            >
              {TTL_OPTIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} min
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>
    </div>
  );
}

function AuthTab() {
  const {
    pat,
    user,
    validateAndSetToken,
    isValidating,
    validationError,
    logout,
  } = useAuthStore();

  const [editing, setEditing] = useState(false);
  const [newPat, setNewPat] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [user?.id, user?.img_url]);

  const maskedPat = pat ? `${pat.slice(0, 8)}${"•".repeat(20)}` : "";

  const handleSaveToken = useCallback(async () => {
    if (!newPat.trim()) return;
    try {
      await validateAndSetToken(newPat.trim());
      setEditing(false);
      setNewPat("");
      showToast("Token updated successfully", "success");
    } catch {
      // validation error is surfaced by the store
    }
  }, [newPat, validateAndSetToken]);

  return (
    <div className="space-y-5">
      {user && (
        <section>
          <h3 className="text-sm font-medium text-figma-text mb-2 flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-status-resolved" />
            Connected Account
          </h3>
          <div className="flex items-center gap-3 bg-figma-bg-secondary border border-figma-border rounded-md p-3">
            {user.img_url && !avatarLoadFailed ? (
              <img
                src={user.img_url}
                alt={user.handle}
                className="w-10 h-10 rounded-full object-cover border border-figma-border"
                onError={() => setAvatarLoadFailed(true)}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-figma-bg-tertiary flex items-center justify-center border border-figma-border">
                <UserIcon size={16} className="text-figma-icon-tertiary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-figma-text truncate">
                {user.handle}
              </p>
              <p className="text-xs text-figma-text-tertiary mt-0.5 truncate">
                Connected via Token
              </p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-md text-figma-icon-tertiary hover:bg-danger-bg hover:text-danger transition-colors shrink-0"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </section>
      )}

      <section>
        <h3 className="text-sm font-medium text-figma-text mb-1 flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-accent" />
          Personal Access Token
        </h3>
        <p className="text-xs text-figma-text-tertiary mb-3">
          Your token is stored locally in the plugin and never shared.{" "}
          <a
            href="https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-accent hover:text-accent-hover transition-colors"
          >
            How to get one
            <ExternalLink size={10} />
          </a>
        </p>

        {!editing ? (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 bg-figma-bg-secondary border border-figma-border rounded-md px-3 py-2">
              <code className="text-xs font-medium text-figma-text-secondary flex-1 truncate">
                {showToken ? pat : maskedPat}
              </code>
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="text-figma-icon-tertiary hover:text-figma-icon-secondary shrink-0 p-0.5 rounded transition-colors"
                title={showToken ? "Hide token" : "Show token"}
              >
                {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                setNewPat("");
              }}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-figma-bg-secondary border border-figma-border text-figma-text hover:bg-figma-bg-hover transition-colors"
            >
              Change Token
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <input
              type="password"
              value={newPat}
              onChange={(e) => setNewPat(e.target.value)}
              placeholder="figd_xxxxxxxxxxxxxxxx"
              className="w-full bg-figma-bg-secondary border border-figma-border rounded-md px-3 py-2 text-sm text-figma-text placeholder:text-figma-text-disabled focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring"
              autoFocus
            />
            {isValidating && (
              <div className="flex items-center gap-1.5 text-xs text-figma-text-tertiary">
                <Loader2 size={12} className="animate-spin" />
                Validating token...
              </div>
            )}
            {validationError && (
              <div className="flex items-center gap-1.5 text-xs text-danger bg-danger-bg border border-danger-border rounded-md px-2.5 py-1.5">
                <AlertCircle size={12} />
                {validationError}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveToken}
                disabled={!newPat.trim() || isValidating}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-accent-bg text-white hover:bg-accent-hover disabled:opacity-40 transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setNewPat("");
                }}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-figma-bg-secondary border border-figma-border text-figma-text hover:bg-figma-bg-hover transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function DisplayTab() {
  const { showThreadElbows, setShowThreadElbows } = useAuthStore();

  return (
    <div className="space-y-5">
      <section>
        <h3 className="text-sm font-medium text-figma-text mb-1 flex items-center gap-1.5">
          <Monitor size={14} className="text-accent" />
          Appearance
        </h3>
        <p className="text-xs text-figma-text-tertiary mb-3">
          Display settings are inherited from your Figma theme.
        </p>
        <div className="bg-figma-bg-secondary border border-figma-border rounded-md p-3 flex items-start gap-2">
          <Info size={14} className="text-figma-icon-tertiary shrink-0 mt-0.5" />
          <p className="text-xs text-figma-text-secondary leading-relaxed">
            The plugin automatically adapts to your Figma appearance settings
            (light/dark mode).
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium text-figma-text mb-1 flex items-center gap-1.5">
          <MessageSquare size={14} className="text-accent" />
          Thread View
        </h3>
        <p className="text-xs text-figma-text-tertiary mb-3">
          Customize how comment threads are displayed.
        </p>
        <label className="flex items-center justify-between gap-3 p-3 bg-figma-bg-secondary border border-figma-border rounded-md cursor-pointer transition-colors hover:border-figma-border-hover">
          <div>
            <p className="text-sm font-medium text-figma-text">Show reply elbows</p>
            <p className="text-xs text-figma-text-tertiary mt-0.5">
              Show connector lines between parent and reply comments.
            </p>
          </div>
          <input
            type="checkbox"
            checked={showThreadElbows}
            onChange={(e) => setShowThreadElbows(e.target.checked)}
            className="accent-accent w-4 h-4 cursor-pointer shrink-0"
          />
        </label>
      </section>
    </div>
  );
}

function AboutTab() {
  return (
    <div className="space-y-5">
      <section>
        <h3 className="text-sm font-medium text-figma-text mb-1 flex items-center gap-1.5">
          <Info size={14} className="text-accent" />
          About
        </h3>
        <p className="text-xs text-figma-text-tertiary mb-3">
          AI-powered comment intelligence for design teams.
        </p>
        <div className="bg-figma-bg-secondary border border-figma-border rounded-md p-3 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-figma-text-tertiary">Plugin</span>
            <span className="text-xs text-figma-text font-medium">
              {PLUGIN_NAME}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-figma-text-tertiary">Version</span>
            <code className="text-[11px] font-medium text-figma-text-secondary bg-figma-bg border border-figma-border px-1.5 py-0.5 rounded">
              v{PLUGIN_VERSION}
            </code>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-figma-text-tertiary">Plugin ID</span>
            <code className="text-[11px] font-medium text-figma-text-secondary bg-figma-bg border border-figma-border px-1.5 py-0.5 rounded">
              {PLUGIN_ID}
            </code>
          </div>
        </div>
      </section>
    </div>
  );
}

interface SettingsScreenProps {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  return (
    <div className="flex flex-col h-full bg-figma-bg">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-figma-border">
        <button
          type="button"
          onClick={onBack}
          className="p-1 rounded-md text-figma-icon-secondary hover:bg-figma-bg-secondary hover:text-figma-icon transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <Settings size={16} className="text-figma-icon" />
        <span className="text-sm font-medium text-figma-text">Settings</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-figma-border px-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-accent text-accent"
                : "border-transparent text-figma-text-secondary hover:text-figma-text"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {activeTab === "general" && <GeneralTab />}
        {activeTab === "ai" && <AITab />}
        {activeTab === "behavior" && <BehaviorTab />}
        {activeTab === "auth" && <AuthTab />}
        {activeTab === "display" && <DisplayTab />}
        {activeTab === "about" && <AboutTab />}
      </div>
    </div>
  );
}
