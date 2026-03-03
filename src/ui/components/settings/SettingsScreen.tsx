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
  User,
  Sparkles,
  Image,
  Info,
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

  const detectedKey =
    url.trim() && isValidFigmaUrl(url) ? parseFileKey(url) : null;

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-medium text-figma-text mb-1 flex items-center gap-1.5">
          <Link size={14} className="text-accent" />
          Figma File
        </h3>
        <p className="text-xs text-figma-text-tertiary mb-3">
          The Figma file to analyze comments for.
        </p>
        <div className="space-y-2">
          <input
            type="text"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://www.figma.com/design/abc123/..."
            className="w-full bg-figma-bg-secondary border border-figma-border rounded-md px-3 py-2 text-sm text-figma-text placeholder:text-figma-text-disabled focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring"
          />
          {urlError && (
            <div className="flex items-center gap-1.5 text-xs text-danger bg-danger-bg border border-danger-border rounded-md px-2 py-1">
              <AlertCircle size={12} />
              {urlError}
            </div>
          )}
          {detectedKey && (
            <div className="text-xs text-figma-text-tertiary">
              File key:{" "}
              <code className="bg-figma-bg-secondary px-1 py-0.5 rounded">
                {detectedKey}
              </code>
            </div>
          )}
          {fileKey && (
            <div className="flex items-center gap-1.5 text-xs text-status-resolved">
              <CheckCircle2 size={12} />
              Currently connected: {fileKey}
            </div>
          )}
          <button
            type="button"
            onClick={handleSaveUrl}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-accent text-white hover:bg-accent-hover transition-colors"
          >
            Update File
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
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-medium text-figma-text mb-1 flex items-center gap-1.5">
          <Sparkles size={14} className="text-accent" />
          AI Provider
        </h3>
        <p className="text-xs text-figma-text-tertiary mb-3">
          Choose how thread summaries and tasks are generated.
        </p>

        <div className="space-y-1.5">
          {PROVIDER_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-3 p-2.5 rounded-md cursor-pointer border transition-colors ${
                provider === opt.value
                  ? "border-accent bg-figma-bg-selected"
                  : "border-transparent hover:bg-figma-bg-secondary"
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
              <div>
                <p className="text-sm text-figma-text">{opt.label}</p>
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
          <h3 className="text-sm font-medium text-figma-text mb-1">API Key</h3>
          <p className="text-xs text-figma-text-tertiary mb-3">
            Your key is stored locally and only sent to{" "}
            {provider === "anthropic"
              ? "Anthropic"
              : provider === "openai"
                ? "OpenAI"
                : "Google"}
            .
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-figma-bg-secondary rounded-md px-3 py-2">
              <input
                type={showKey ? "text" : "password"}
                value={showKey ? currentKey : currentKey ? maskedKey : ""}
                onChange={(e) => setCurrentKey(e.target.value)}
                placeholder="Paste your API key"
                className="flex-1 bg-transparent text-xs text-figma-text placeholder:text-figma-text-disabled focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-figma-icon-tertiary hover:text-figma-icon-secondary shrink-0"
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {currentKey && (
              <div className="flex items-center gap-1.5 text-xs text-status-resolved">
                <CheckCircle2 size={12} />
                Key configured
              </div>
            )}
          </div>
        </section>
      )}

      {provider === "custom" && (
        <section>
          <h3 className="text-sm font-medium text-figma-text mb-1">
            Custom Provider
          </h3>
          <p className="text-xs text-figma-text-tertiary mb-3">
            Any OpenAI-compatible endpoint (Groq, Mistral, Together AI, local
            Ollama, etc.)
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-figma-text-secondary mb-1 block">
                Base URL
              </label>
              <input
                type="text"
                value={customConfig.baseUrl}
                onChange={(e) =>
                  setCustomConfig({ ...customConfig, baseUrl: e.target.value })
                }
                placeholder="https://api.example.com/v1"
                className="w-full bg-figma-bg-secondary border border-figma-border rounded-md px-3 py-2 text-xs text-figma-text placeholder:text-figma-text-disabled focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring"
              />
            </div>
            <div>
              <label className="text-[11px] text-figma-text-secondary mb-1 block">
                API Key
              </label>
              <input
                type="password"
                value={customConfig.apiKey}
                onChange={(e) =>
                  setCustomConfig({ ...customConfig, apiKey: e.target.value })
                }
                placeholder="API key (if required)"
                className="w-full bg-figma-bg-secondary border border-figma-border rounded-md px-3 py-2 text-xs text-figma-text placeholder:text-figma-text-disabled focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring"
              />
            </div>
            <div>
              <label className="text-[11px] text-figma-text-secondary mb-1 block">
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
                className="w-full bg-figma-bg-secondary border border-figma-border rounded-md px-3 py-2 text-xs text-figma-text placeholder:text-figma-text-disabled focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring"
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

        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <div>
            <p className="text-sm text-figma-text">Enable image analysis</p>
            {!hasVision && (
              <p className="text-[11px] text-warning mt-0.5">
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
          <div className="mt-2 p-2.5 bg-warning-bg border border-warning-border rounded-md">
            <p className="text-[11px] text-warning">
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
    <section className="pt-4 border-t border-figma-border">
      <h3 className="text-sm font-medium text-figma-text mb-1">Cache</h3>
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
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-medium text-figma-text mb-3">Behavior</h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div>
              <p className="text-sm text-figma-text">Show comment reminder</p>
              <p className="text-xs text-figma-text-tertiary">
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

          <label className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-figma-text">Auto-refresh interval</p>
              <p className="text-xs text-figma-text-tertiary">
                Refresh thread list automatically every 5, 10, 15, or 30
                minutes.
              </p>
            </div>
            <select
              value={cacheTTLMinutes}
              onChange={(e) =>
                setCacheTTLMinutes(Number(e.target.value) as CacheTTLMinutes)
              }
              className="bg-figma-bg-secondary border border-figma-border rounded-md px-2 py-1 text-xs text-figma-text focus:outline-none focus:border-accent"
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
    <div className="space-y-6">
      {user && (
        <section>
          <h3 className="text-sm font-medium text-figma-text mb-3 flex items-center gap-1.5">
            <User size={14} className="text-accent" />
            Connected Account
          </h3>
          <div className="flex items-center gap-3 bg-figma-bg-secondary rounded-md p-3">
            {user.img_url && !avatarLoadFailed ? (
              <img
                src={user.img_url}
                alt={user.handle}
                className="w-8 h-8 rounded-full object-cover"
                onError={() => setAvatarLoadFailed(true)}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-figma-bg-tertiary flex items-center justify-center text-sm font-medium text-figma-text-secondary">
                <UserIcon size={14} className="text-figma-icon-tertiary" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-figma-text">
                {user.handle}
              </p>
              <p className="text-xs text-figma-text-tertiary">
                Connected via Personal Access Token
              </p>
            </div>
          </div>
        </section>
      )}

      <section>
        <h3 className="text-sm font-medium text-figma-text mb-1 flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-accent" />
          Personal Access Token
        </h3>
        <p className="text-xs text-figma-text-tertiary mb-3">
          Your token is stored locally in the plugin and never shared.
        </p>

        {!editing ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-figma-bg-secondary rounded-md px-3 py-2">
              <code className="text-xs text-figma-text-secondary flex-1 truncate">
                {showToken ? pat : maskedPat}
              </code>
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="text-figma-icon-tertiary hover:text-figma-icon-secondary shrink-0"
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
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-figma-bg-secondary text-figma-text-secondary hover:bg-figma-bg-tertiary transition-colors"
            >
              Change Token
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="password"
              value={newPat}
              onChange={(e) => setNewPat(e.target.value)}
              placeholder="figd_xxxxxxxxxxxxxxxx"
              className="w-full bg-figma-bg-secondary border border-figma-border rounded-md px-3 py-2 text-sm text-figma-text placeholder:text-figma-text-disabled focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring"
            />
            {isValidating && (
              <div className="flex items-center gap-1.5 text-xs text-figma-text-secondary">
                <Loader2 size={12} className="animate-spin" />
                Validating...
              </div>
            )}
            {validationError && (
              <div className="flex items-center gap-1.5 text-xs text-danger bg-danger-bg border border-danger-border rounded-md px-2 py-1">
                <AlertCircle size={12} />
                {validationError}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveToken}
                disabled={!newPat.trim() || isValidating}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-accent text-white hover:bg-accent-hover disabled:opacity-40 transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setNewPat("");
                }}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-figma-bg-secondary text-figma-text-secondary hover:bg-figma-bg-tertiary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <a
          href="https://www.figma.com/settings"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-accent hover:underline text-xs mt-3"
        >
          Open Figma Settings
          <ExternalLink size={12} />
        </a>
      </section>

      <section className="pt-4 border-t border-figma-border">
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-danger hover:bg-danger-bg transition-colors"
        >
          <LogOut size={14} />
          Disconnect &amp; Logout
        </button>
      </section>
    </div>
  );
}

function DisplayTab() {
  const { showThreadElbows, setShowThreadElbows } = useAuthStore();

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-medium text-figma-text mb-1 flex items-center gap-1.5">
          <Monitor size={14} className="text-accent" />
          Appearance
        </h3>
        <p className="text-xs text-figma-text-tertiary mb-3">
          Display settings are inherited from your Figma theme.
        </p>
        <div className="bg-figma-bg-secondary rounded-md p-3">
          <p className="text-sm text-figma-text-secondary">
            The plugin automatically adapts to your Figma appearance settings
            (light/dark mode).
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium text-figma-text mb-3">
          Thread view
        </h3>
        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <div>
            <p className="text-sm text-figma-text">Show reply elbows</p>
            <p className="text-xs text-figma-text-tertiary">
              Show connector elbows between parent and reply comments.
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
    <div className="space-y-6">
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
            <code className="text-xs text-figma-text-secondary bg-figma-bg px-1.5 py-0.5 rounded">
              v{PLUGIN_VERSION}
            </code>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-figma-text-tertiary">Plugin ID</span>
            <code className="text-xs text-figma-text-secondary bg-figma-bg px-1.5 py-0.5 rounded">
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
