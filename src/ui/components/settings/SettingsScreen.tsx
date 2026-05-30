import { useState, useCallback, useEffect, type MouseEvent } from "react";
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
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react";
import { useAuthStore } from "@ui/store/authStore";
import { useCommentsStore } from "@ui/store/commentsStore";
import { useAIStore } from "@ui/store/aiStore";
import { parseFileKey, isValidFigmaUrl } from "@ui/lib/parseFileUrl";
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
import { showToast } from "@ui/components/common/Toast";
import { FieldError } from "@ui/components/common/FieldError";
import { supportsVision, PROVIDER_MODEL_LABELS } from "@ui/ai/cloudProvider";
import { clearAllCachedSummaries } from "@ui/ai/summarize";
import type {
  AIProvider,
  CacheTTLMinutes,
  SummaryWordLimit,
  ThemePreference,
} from "@shared/types";
import { AboutTab } from "@ui/components/settings/AboutTab";
import {
  SUMMARY_WORD_LIMIT_MAX,
  SUMMARY_WORD_LIMIT_MIN,
  SUMMARY_WORD_LIMIT_SLIDER_TICKS,
  SUMMARY_WORD_LIMIT_STEP,
} from "@shared/types";

type SettingsTab = "general" | "ai" | "behavior" | "auth" | "display" | "about";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "ai", label: "AI" },
  { id: "behavior", label: "Behavior" },
  { id: "auth", label: "Auth" },
  { id: "display", label: "Display" },
  { id: "about", label: "About" },
];

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
          <div className="bg-figma-bg-secondary border border-figma-border rounded-lg p-3 space-y-2">
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
        <div className="p-3 bg-figma-bg-secondary border border-figma-border rounded-lg space-y-2">
          <input
            type="text"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://www.figma.com/design/abc123/..."
            className="w-full bg-figma-bg text-figma-text border border-figma-border rounded-lg px-3 py-2 text-sm placeholder:text-figma-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring"
          />
          {urlError && <FieldError>{urlError}</FieldError>}
          <button
            type="button"
            onClick={handleSaveUrl}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-figma-bg-secondary border border-figma-border text-figma-text hover:bg-figma-bg-tertiary hover:border-figma-border-strong transition-colors"
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
    summaryWordLimit,
    setProvider,
    setAnthropicApiKey,
    setOpenaiApiKey,
    setGeminiApiKey,
    setCustomConfig,
    setSummaryWordLimit,
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

        <div className="border border-figma-border rounded-lg overflow-hidden">
          {PROVIDER_OPTIONS.map((opt) => {
            const isSelected = provider === opt.value;
            return (
              <div key={opt.value}>
                <label
                  className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-accent-subtle"
                      : "bg-figma-bg hover:bg-figma-bg-secondary"
                  }`}
                >
                  <input
                    type="radio"
                    name="ai-provider"
                    value={opt.value}
                    checked={isSelected}
                    onChange={() => {
                      setProvider(opt.value);
                      setShowKey(false);
                    }}
                    className="accent-accent w-3.5 h-3.5 shrink-0"
                  />
                  <span className="text-xs font-medium text-figma-text">
                    {opt.label}
                  </span>
                  <span className="text-[11px] text-figma-text-tertiary ml-auto flex items-center gap-1.5">
                    {opt.description}
                    <ChevronDown
                      size={12}
                      className={`transition-transform duration-200 ${isSelected ? "rotate-180" : ""}`}
                    />
                  </span>
                </label>

                <div
                  className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                    isSelected ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-3 pb-2.5 pt-1.5 bg-accent-subtle space-y-2.5">
                      {opt.value !== "custom" ? (
                        <div>
                          <div className="flex items-center gap-2 bg-figma-bg border border-figma-border rounded px-2.5 py-1.5">
                            <input
                              type={showKey ? "text" : "password"}
                              value={
                                showKey
                                  ? currentKey
                                  : currentKey
                                    ? maskedKey
                                    : ""
                              }
                              onChange={(e) => setCurrentKey(e.target.value)}
                              placeholder="Paste your API key"
                              className="flex-1 bg-transparent text-xs text-figma-text placeholder:text-figma-text-disabled focus:outline-none min-w-0"
                            />
                            {currentKey && (
                              <CheckCircle2
                                size={11}
                                className="text-status-resolved shrink-0"
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => setShowKey(!showKey)}
                              className="text-figma-icon-tertiary hover:text-figma-icon-secondary shrink-0 p-0.5 rounded transition-colors"
                              title={showKey ? "Hide key" : "Show key"}
                            >
                              {showKey ? (
                                <EyeOff size={12} />
                              ) : (
                                <Eye size={12} />
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={customConfig.baseUrl}
                            onChange={(e) =>
                              setCustomConfig({
                                ...customConfig,
                                baseUrl: e.target.value,
                              })
                            }
                            placeholder="Base URL (https://api.example.com/v1)"
                            className="w-full bg-figma-bg border border-figma-border rounded px-2.5 py-1.5 text-xs text-figma-text placeholder:text-figma-text-disabled focus:outline-none focus:border-accent"
                          />
                          <input
                            type="password"
                            value={customConfig.apiKey}
                            onChange={(e) =>
                              setCustomConfig({
                                ...customConfig,
                                apiKey: e.target.value,
                              })
                            }
                            placeholder="API key (optional)"
                            className="w-full bg-figma-bg border border-figma-border rounded px-2.5 py-1.5 text-xs text-figma-text placeholder:text-figma-text-disabled focus:outline-none focus:border-accent"
                          />
                          <input
                            type="text"
                            value={customConfig.modelName}
                            onChange={(e) =>
                              setCustomConfig({
                                ...customConfig,
                                modelName: e.target.value,
                              })
                            }
                            placeholder="Model name (e.g., llama-3.1-8b-instant)"
                            className="w-full bg-figma-bg border border-figma-border rounded px-2.5 py-1.5 text-xs text-figma-text placeholder:text-figma-text-disabled focus:outline-none focus:border-accent"
                          />
                        </div>
                      )}

                      <label className="flex items-center justify-between gap-2 cursor-pointer">
                        <span className="text-[11px] text-figma-text-secondary flex items-center gap-1.5">
                          <Image size={11} className="shrink-0" />
                          Image analysis
                          {!hasVision && (
                            <span className="text-warning flex items-center gap-0.5">
                              <AlertCircle size={9} />
                              {provider === "custom"
                                ? "text-only"
                                : "unsupported"}
                            </span>
                          )}
                          {imageAnalysisEnabled && hasVision && (
                            <span className="text-warning flex items-center gap-0.5">
                              <AlertCircle size={9} />
                              Costs more tokens
                            </span>
                          )}
                        </span>
                        <input
                          type="checkbox"
                          checked={imageAnalysisEnabled}
                          onChange={(e) =>
                            setImageAnalysisEnabled(e.target.checked)
                          }
                          className="accent-accent w-3.5 h-3.5 cursor-pointer shrink-0"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium text-figma-text mb-1 flex items-center gap-1.5">
          <MessageSquare size={14} className="text-accent" />
          Summary length
        </h3>
        <p className="text-xs text-figma-text-tertiary mb-3">
          Cap summary length in words.
        </p>
        <div className="p-3 rounded-lg border border-figma-border bg-figma-bg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-figma-text">Word limit</span>
            <span className="text-xs font-medium text-figma-text">
              {summaryWordLimit} words
            </span>
          </div>
          <input
            type="range"
            min={SUMMARY_WORD_LIMIT_MIN}
            max={SUMMARY_WORD_LIMIT_MAX}
            step={SUMMARY_WORD_LIMIT_STEP}
            value={summaryWordLimit}
            onChange={(e) =>
              setSummaryWordLimit(Number(e.target.value) as SummaryWordLimit)
            }
            className="w-full h-0.5 appearance-none rounded-full bg-figma-bg-tertiary cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:h-2.5
              [&::-webkit-slider-thumb]:w-2.5
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-accent
              [&::-webkit-slider-thumb]:border
              [&::-webkit-slider-thumb]:border-figma-bg
              [&::-webkit-slider-thumb]:shadow-sm
              [&::-moz-range-thumb]:h-2.5
              [&::-moz-range-thumb]:w-2.5
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-accent
              [&::-moz-range-thumb]:border
              [&::-moz-range-thumb]:border-figma-bg
              [&::-moz-range-thumb]:shadow-sm"
          />
          <div className="flex items-center justify-between text-[11px] text-figma-text-secondary">
            {SUMMARY_WORD_LIMIT_SLIDER_TICKS.map((limit) => (
              <span key={limit}>{limit}</span>
            ))}
          </div>
        </div>
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
    <section>
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
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-danger bg-danger-bg border border-danger-border hover:border-danger disabled:opacity-40 transition-colors"
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
          <label className="flex items-center justify-between gap-3 p-3 bg-figma-bg-secondary border border-figma-border rounded-lg cursor-pointer transition-colors hover:border-figma-border-strong">
            <div>
              <p className="text-sm font-medium text-figma-text">
                Show comment reminder
              </p>
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

          <label className="flex items-center justify-between gap-3 p-3 bg-figma-bg-secondary border border-figma-border rounded-lg cursor-pointer transition-colors hover:border-figma-border-strong">
            <div>
              <p className="text-sm font-medium text-figma-text">
                Auto-refresh interval
              </p>
              <p className="text-xs text-figma-text-tertiary mt-0.5">
                Refresh thread list automatically.
              </p>
            </div>
            <select
              value={cacheTTLMinutes}
              onChange={(e) =>
                setCacheTTLMinutes(Number(e.target.value) as CacheTTLMinutes)
              }
              className="bg-figma-bg border border-figma-border rounded-lg pl-2 pr-6 py-1.5 text-xs font-medium text-figma-text focus:outline-none focus:border-accent cursor-pointer appearance-none bg-[length:12px] bg-[right_6px_center] bg-no-repeat"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
              }}
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
    figmaAccessToken,
    authMethod,
    user,
    validateAndSetToken,
    applyOAuthSession,
    isValidating,
    validationError,
    logout,
  } = useAuthStore();

  const oauthAvailable = isFigmaOAuthConfigured();
  const [oauthBusy, setOauthBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newPat, setNewPat] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [showPatAdvanced, setShowPatAdvanced] = useState(authMethod !== "oauth");

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [user?.id, user?.img_url]);

  const maskedCredential =
    authMethod === "oauth" && figmaAccessToken
      ? `${figmaAccessToken.slice(0, 8)}${"•".repeat(12)}`
      : pat
        ? `${pat.slice(0, 8)}${"•".repeat(20)}`
        : "";

  const displaySecret =
    authMethod === "oauth" ? figmaAccessToken || "" : pat || "";

  const handleSaveToken = useCallback(async () => {
    if (!newPat.trim()) return;
    try {
      await validateAndSetToken(newPat.trim());
      setEditing(false);
      setNewPat("");
      setShowPatAdvanced(true);
      showToast("Token updated successfully", "success");
    } catch {
      // validation error is surfaced by the store
    }
  }, [newPat, validateAndSetToken]);

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
      showToast("Figma account reconnected", "success");
    } catch (e) {
      useAuthStore.setState({
        validationError:
          e instanceof Error ? e.message : "Sign in with Figma failed.",
      });
    } finally {
      setOauthBusy(false);
    }
  }, [applyOAuthSession]);

  const connectionSubtitle =
    authMethod === "oauth"
      ? "Signed in with Figma"
      : "Using personal access token";

  return (
    <div className="space-y-5">
      {user && (
        <section>
          <h3 className="text-sm font-medium text-figma-text mb-2 flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-status-resolved" />
            Account
          </h3>
          <div className="bg-figma-bg-secondary border border-figma-border rounded-lg p-3 space-y-3">
            <div className="flex items-center gap-3">
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
                  {connectionSubtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void logout()}
                className="p-2 rounded-lg text-figma-icon-tertiary hover:bg-danger-bg hover:text-danger transition-colors shrink-0"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>

            {authMethod === "oauth" && oauthAvailable && (
              <button
                type="button"
                disabled={oauthBusy || isValidating}
                onClick={() => void handleSignInWithFigma()}
                className="w-full py-2 rounded-lg text-xs font-medium bg-figma-bg border border-figma-border text-figma-text hover:bg-figma-bg-tertiary disabled:opacity-40"
              >
                {oauthBusy ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 size={12} className="animate-spin" />
                    Waiting for browser…
                  </span>
                ) : (
                  "Sign in again with Figma"
                )}
              </button>
            )}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-sm font-medium text-figma-text mb-1 flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-accent" />
          Access token
        </h3>
        <p className="text-xs text-figma-text-tertiary mb-3">
          {authMethod === "oauth"
            ? "OAuth tokens are stored only in this plugin. You can re-authenticate above or switch to a personal access token."
            : "Your token is stored locally in the plugin and never shared."}
        </p>

        {authMethod === "oauth" && (
          <button
            type="button"
            onClick={() => setShowPatAdvanced((v) => !v)}
            className="flex items-center gap-1 text-xs text-accent hover:underline mb-3"
          >
            {showPatAdvanced ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Use a personal access token instead
          </button>
        )}

        {(authMethod === "pat" || (authMethod === "oauth" && showPatAdvanced)) && (
          <>
            <div className="mb-3 text-xs text-figma-text-secondary space-y-2">
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
                <ExternalLink size={10} />
              </a>
            </div>

            {!editing ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-figma-bg-secondary border border-figma-border rounded-lg px-3 py-2">
                  <code className="text-xs font-medium text-figma-text-secondary flex-1 truncate">
                    {showToken ? displaySecret : maskedCredential || "—"}
                  </code>
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="text-figma-icon-tertiary hover:text-figma-icon-secondary shrink-0 p-0.5 rounded transition-colors"
                    title={showToken ? "Hide" : "Show"}
                    disabled={!displaySecret}
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
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-figma-bg-secondary border border-figma-border text-figma-text hover:bg-figma-bg-tertiary hover:border-figma-border-strong transition-colors"
                >
                  {authMethod === "oauth" ? "Paste personal access token" : "Change Token"}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="password"
                  value={newPat}
                  onChange={(e) => setNewPat(e.target.value)}
                  placeholder="figd_xxxxxxxxxxxxxxxx"
                  className="w-full bg-figma-bg-secondary border border-figma-border rounded-lg px-3 py-2 text-sm text-figma-text placeholder:text-figma-text-disabled focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring"
                  autoFocus
                />
                {isValidating && (
                  <div className="flex items-center gap-1.5 text-xs text-figma-text-tertiary">
                    <Loader2 size={12} className="animate-spin" />
                    Validating token...
                  </div>
                )}
                {validationError && <FieldError>{validationError}</FieldError>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleSaveToken()}
                    disabled={!newPat.trim() || isValidating}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-bg text-white hover:bg-accent-hover disabled:opacity-40 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setNewPat("");
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-figma-bg-secondary border border-figma-border text-figma-text hover:bg-figma-bg-tertiary hover:border-figma-border-strong transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

const THEME_OPTIONS: {
  value: ThemePreference;
  label: string;
  icon: typeof Monitor;
}[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

function DisplayTab() {
  const {
    showThreadElbows,
    setShowThreadElbows,
    themePreference,
    setThemePreference,
  } = useAuthStore();

  return (
    <div className="space-y-5">
      <section>
        <h3 className="text-sm font-medium text-figma-text mb-1 flex items-center gap-1.5">
          <Monitor size={14} className="text-accent" />
          Theme
        </h3>
        <p className="text-xs text-figma-text-tertiary mb-3">
          Override the appearance or follow Figma's theme.
        </p>
        <div className="flex gap-2">
          {THEME_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isActive = themePreference === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setThemePreference(opt.value)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-150 ${
                  isActive
                    ? "bg-accent-bg border-accent text-white shadow-sm"
                    : "bg-figma-bg-secondary border-figma-border text-figma-text-secondary hover:border-figma-border-strong"
                }`}
              >
                <Icon size={13} />
                {opt.label}
              </button>
            );
          })}
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
        <label className="flex items-center justify-between gap-3 p-3 bg-figma-bg-secondary border border-figma-border rounded-lg cursor-pointer transition-colors hover:border-figma-border-strong">
          <div>
            <p className="text-sm font-medium text-figma-text">
              Show reply elbows
            </p>
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
          className="p-1.5 rounded-lg text-figma-icon-secondary hover:bg-figma-bg-secondary hover:text-figma-icon transition-colors"
        >
          <ArrowLeft size={15} />
        </button>
        <Settings size={15} className="text-accent" />
        <span className="text-sm font-medium text-figma-text">Settings</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-figma-border px-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-accent text-accent"
                : "border-transparent text-figma-text-tertiary hover:text-figma-text-secondary"
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
