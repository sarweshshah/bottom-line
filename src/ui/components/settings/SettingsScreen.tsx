import { useState, useCallback, type MouseEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  ExternalLink,
  CheckCircle2,
  Loader2,
  LogOut,
  Monitor,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
  TriangleAlert,
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
import { UserAvatar } from "@ui/components/common/UserAvatar";
import {
  supportsVision,
  PROVIDER_MODEL_LABELS,
  PROVIDER_API_KEY_URLS,
} from "@ui/ai/cloudProvider";
import { clearAllCachedSummaries } from "@ui/ai/summarize";
import type {
  AIProvider,
  CacheTTLMinutes,
  SummaryWordLimit,
  ThemePreference,
} from "@shared/types";
import { AboutTab } from "@ui/components/settings/AboutTab";
import { SUMMARY_WORD_LIMIT_OPTIONS } from "@shared/types";

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

const BTN_PRIMARY =
  "px-2.5 py-2 rounded-md text-xs font-medium bg-accent-bg text-white shadow-sm hover:bg-accent-hover disabled:opacity-40 transition-all duration-150";

const BTN_SECONDARY =
  "px-2.5 py-2 rounded-md text-xs font-medium bg-figma-bg-secondary text-figma-text-secondary hover:text-figma-text disabled:opacity-40 transition-all duration-150";

const BTN_DANGER =
  "px-2.5 py-2 rounded-md text-xs font-medium text-danger bg-danger-bg hover:opacity-90 disabled:opacity-40 transition-all duration-150";

const INPUT_CLASS =
  "w-full bg-figma-bg text-figma-text border border-figma-border rounded-md px-2.5 py-1.5 text-xs placeholder:text-figma-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring";

const SELECT_COMPACT_CLASS =
  "appearance-none [field-sizing:content] min-w-0 bg-figma-bg text-figma-text border border-figma-border rounded-md pl-2.5 pr-6 py-1 text-xs tabular-nums focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring";

const PILL_ACTIVE = "bg-accent-bg text-white shadow-sm";

const PILL_INACTIVE =
  "bg-figma-bg-secondary text-figma-text-secondary hover:text-figma-text";

const CARD_CLASS =
  "rounded-md border border-figma-border bg-accent-subtle p-3";

function SettingsSection({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`border-b border-figma-border ${className}`}>
      {children}
    </section>
  );
}

function SettingsSectionHeader({
  title,
  description,
  helpUrl,
}: {
  title: string;
  description?: string;
  helpUrl?: string;
}) {
  return (
    <div className="px-4 pt-5 pb-3">
      <h3 className="font-mono text-[9.5px] font-semibold uppercase tracking-widest text-figma-text leading-none">
        {title}
      </h3>
      {(description || helpUrl) && (
        <p className="text-[10px] text-figma-text-tertiary mt-1 leading-snug tracking-wide">
          {description}
          {description && helpUrl && " "}
          {helpUrl && (
            <a
              href={helpUrl}
              onClick={(e: MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                openExternalUrl(helpUrl);
              }}
              className="text-accent hover:underline hover:text-accent-text-hover"
            >
              Learn more
            </a>
          )}
        </p>
      )}
    </div>
  );
}

function SettingsSectionBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`px-4 pb-5 space-y-3 ${className}`}>{children}</div>;
}

function SettingsFieldGroup({ children }: { children: ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

function SettingsRowGroup({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

function SettingsToggleRow({
  label,
  description,
  checked,
  onChange,
  trailing,
}: {
  label: string;
  description?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  trailing?: ReactNode;
}) {
  const inner = (
    <>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-figma-text">{label}</p>
        {description && (
          <p className="text-[10px] text-figma-text-tertiary mt-0.5 leading-snug">
            {description}
          </p>
        )}
      </div>
      {trailing ?? (
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          className="accent-accent w-3.5 h-3.5 cursor-pointer shrink-0"
        />
      )}
    </>
  );

  if (trailing) {
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-4 hover:bg-figma-bg-hover transition-colors">
        {inner}
      </div>
    );
  }

  return (
    <label className="flex items-center justify-between gap-3 px-4 py-4 cursor-pointer hover:bg-figma-bg-hover transition-colors">
      {inner}
    </label>
  );
}

interface SettingsTabSegmentProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

function SettingsTabSegment({
  active,
  onClick,
  label,
}: SettingsTabSegmentProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center px-3 h-full font-mono text-[9px] uppercase tracking-widest leading-none shrink-0 transition-colors ${
        active
          ? "bg-accent-subtle text-accent font-semibold"
          : "text-figma-text-secondary font-medium hover:bg-figma-bg-hover hover:text-figma-text"
      }`}
    >
      {label}
    </button>
  );
}

const PROVIDER_OPTIONS: {
  value: AIProvider;
  label: string;
  description: string;
  apiKeyUrl?: string;
}[] = [
  {
    value: "anthropic",
    label: "Anthropic",
    description: PROVIDER_MODEL_LABELS.anthropic,
    apiKeyUrl: PROVIDER_API_KEY_URLS.anthropic,
  },
  {
    value: "openai",
    label: "OpenAI",
    description: PROVIDER_MODEL_LABELS.openai,
    apiKeyUrl: PROVIDER_API_KEY_URLS.openai,
  },
  {
    value: "gemini",
    label: "Google",
    description: PROVIDER_MODEL_LABELS.gemini,
    apiKeyUrl: PROVIDER_API_KEY_URLS.gemini,
  },
  {
    value: "custom",
    label: "Custom",
    description: "OpenAI-compatible endpoint",
  },
];

function GeneralTab() {
  const { fileUrl, fileKey, fileName, setFileInfo } = useAuthStore();
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
    <SettingsSection>
      <SettingsSectionHeader
        title={fileKey ? "Connected file" : "Figma file"}
        description={
          fileKey
            ? "The Figma file currently linked to this plugin."
            : "The Figma file to analyze comments for."
        }
      />
      {fileKey && (
        <SettingsSectionBody className="!pb-0">
          <div className={`${CARD_CLASS} space-y-2`}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-figma-text-tertiary">
                File key
              </span>
              <code className="text-[11px] text-figma-text font-medium bg-figma-bg px-1.5 py-0.5 rounded border border-figma-border truncate max-w-[60%]">
                {fileKey}
              </code>
            </div>
            {fileUrl && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] text-figma-text-tertiary">
                  URL
                </span>
                <span className="text-[11px] text-figma-text-secondary truncate max-w-[60%]">
                  {fileUrl}
                </span>
              </div>
            )}
            {fileName && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] text-figma-text-tertiary">
                  File name
                </span>
                <span className="text-[11px] text-figma-text-secondary truncate max-w-[60%]">
                  {fileName}
                </span>
              </div>
            )}
          </div>
        </SettingsSectionBody>
      )}
      <div className={`px-4 pb-5 space-y-3 ${fileKey ? "pt-4" : ""}`}>
        {fileKey && (
          <div>
            <p className="text-[11px] font-medium text-figma-text">
              Update file
            </p>
            <p className="text-[10px] text-figma-text-tertiary mt-0.5 leading-snug">
              Paste a new URL to switch the connected Figma file.
            </p>
          </div>
        )}
        <SettingsFieldGroup>
          <input
            type="text"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://www.figma.com/design/abc123/..."
            className={INPUT_CLASS}
          />
          {urlError && <FieldError>{urlError}</FieldError>}
          <button type="button" onClick={handleSaveUrl} className={BTN_PRIMARY}>
            {fileKey ? "Update file" : "Connect file"}
          </button>
        </SettingsFieldGroup>
      </div>
    </SettingsSection>
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

  const hasKey =
    provider === "custom"
      ? Boolean(customConfig.baseUrl.trim() && customConfig.modelName.trim())
      : Boolean(currentKey.trim());

  return (
    <>
      <SettingsSection>
        <SettingsSectionHeader
          title="AI provider"
          description="Choose how thread summaries and tasks are generated."
        />
        <SettingsSectionBody>
          <div className="rounded-md border border-figma-border overflow-hidden bg-figma-bg-secondary divide-y divide-figma-border">
            {PROVIDER_OPTIONS.map((opt) => {
              const isSelected = provider === opt.value;
              return (
                <div key={opt.value}>
                  <button
                    type="button"
                    onClick={() => {
                      setProvider(opt.value);
                      setShowKey(false);
                    }}
                    className={`group w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
                      isSelected
                        ? "bg-accent-subtle"
                        : "bg-figma-bg hover:bg-figma-bg-hover"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-[11px] ${
                          isSelected
                            ? "font-semibold text-accent"
                            : "font-medium text-figma-text-secondary group-hover:text-figma-text"
                        }`}
                      >
                        {opt.label}
                      </p>
                      <p
                        className={`text-[10px] mt-0.5 leading-snug ${
                          isSelected
                            ? "text-tag-approval-text"
                            : "text-figma-text-tertiary group-hover:text-figma-text-secondary"
                        }`}
                      >
                        {opt.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isSelected && (
                        <span className="text-[9px] font-semibold px-2 py-1 rounded-full bg-accent-bg text-white tracking-wide leading-none">
                          Selected
                        </span>
                      )}
                      <ChevronDown
                        size={12}
                        className={`transition-[transform,color] duration-200 ${
                          isSelected
                            ? "rotate-180 text-accent"
                            : "text-figma-icon-tertiary group-hover:text-figma-icon-secondary"
                        }`}
                      />
                    </div>
                  </button>

                  <div
                    className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                      isSelected ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-3 pt-3 pb-4 border-t border-figma-border bg-figma-bg space-y-3">
                        {opt.value !== "custom" ? (
                          <>
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-[10px] font-medium text-figma-text-secondary">
                                  API key
                                </p>
                                {opt.apiKeyUrl && (
                                  <a
                                    href={opt.apiKeyUrl}
                                    onClick={(
                                      e: MouseEvent<HTMLAnchorElement>,
                                    ) => {
                                      e.preventDefault();
                                      openExternalUrl(opt.apiKeyUrl!);
                                    }}
                                    className="inline-flex items-center gap-1 text-[10px] text-accent hover:text-accent-text-hover hover:underline shrink-0"
                                  >
                                    Get your {opt.label} API key
                                    <ExternalLink size={9} />
                                  </a>
                                )}
                              </div>
                              <div className="flex items-center gap-2 bg-figma-bg-secondary border border-figma-border rounded-md px-2.5 py-1.5">
                                <input
                                  type={showKey ? "text" : "password"}
                                  value={
                                    showKey
                                      ? currentKey
                                      : currentKey
                                        ? maskedKey
                                        : ""
                                  }
                                  onChange={(e) =>
                                    setCurrentKey(e.target.value)
                                  }
                                  placeholder="Paste your API key"
                                  className="flex-1 bg-transparent text-xs text-figma-text placeholder:text-figma-text-disabled focus:outline-none min-w-0"
                                />
                                {hasKey && (
                                  <CheckCircle2
                                    size={11}
                                    className="text-status-resolved shrink-0"
                                  />
                                )}
                                <button
                                  type="button"
                                  onClick={() => setShowKey(!showKey)}
                                  className="p-1 rounded-md text-figma-icon-secondary hover:bg-figma-bg hover:text-figma-icon shrink-0 transition-colors"
                                  data-tooltip={
                                    showKey ? "Hide key" : "Show key"
                                  }
                                  data-tooltip-align="right"
                                  data-tooltip-pos="bottom"
                                >
                                  {showKey ? (
                                    <EyeOff size={12} />
                                  ) : (
                                    <Eye size={12} />
                                  )}
                                </button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
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
                              className={INPUT_CLASS}
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
                              className={INPUT_CLASS}
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
                              className={INPUT_CLASS}
                            />
                          </>
                        )}

                        {isSelected && hasKey && hasVision && (
                          <label className="setting-reveal flex items-center justify-between gap-4 cursor-pointer">
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-medium text-figma-text-secondary">
                                Image analysis
                              </p>
                              {imageAnalysisEnabled ? (
                                <p className="flex items-center gap-1 mt-0.5 text-[10px] text-warning leading-snug">
                                  <TriangleAlert
                                    size={10}
                                    className="shrink-0"
                                  />
                                  Uses more tokens per summary
                                </p>
                              ) : (
                                <p className="text-[10px] text-figma-text-tertiary mt-0.5 leading-snug">
                                  Include attached images when generating summaries.
                                </p>
                              )}
                            </div>
                            <input
                              type="checkbox"
                              checked={imageAnalysisEnabled}
                              onChange={(e) =>
                                setImageAnalysisEnabled(e.target.checked)
                              }
                              className="accent-accent w-3.5 h-3.5 cursor-pointer shrink-0"
                            />
                          </label>
                        )}

                        {isSelected && hasKey && (
                          <div className="setting-reveal flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-medium text-figma-text-secondary">
                                Summary length
                              </p>
                              <p className="text-[10px] text-figma-text-tertiary mt-0.5 leading-snug">
                                Cap summary length in words.
                              </p>
                            </div>
                            <div className="relative inline-flex shrink-0">
                              <select
                                value={summaryWordLimit}
                                onChange={(e) =>
                                  setSummaryWordLimit(
                                    Number(e.target.value) as SummaryWordLimit,
                                  )
                                }
                                className={SELECT_COMPACT_CLASS}
                              >
                                {SUMMARY_WORD_LIMIT_OPTIONS.map((limit) => (
                                  <option key={limit} value={limit}>
                                    {limit} words
                                  </option>
                                ))}
                              </select>
                              <ChevronDown
                                size={12}
                                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-figma-icon-secondary"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SettingsSectionBody>
      </SettingsSection>

      <ClearCacheSection />
    </>
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
    <SettingsSection>
      <SettingsSectionHeader
        title="Cache"
        description="Clear all cached summaries and tasks. They will be regenerated on next request."
      />
      <SettingsSectionBody>
        <button
          type="button"
          onClick={handleClear}
          disabled={clearing || cleared}
          className={BTN_DANGER}
        >
          {clearing
            ? "Clearing..."
            : cleared
              ? "Cleared"
              : "Clear all summaries"}
        </button>
      </SettingsSectionBody>
    </SettingsSection>
  );
}

function BehaviorTab() {
  const { autoOpenComment, setAutoOpenComment } = useAuthStore();
  const { cacheTTLMinutes, setCacheTTLMinutes } = useCommentsStore();

  return (
    <SettingsSection>
      <SettingsSectionHeader
        title="Behavior"
        description="Customize how the plugin interacts with Figma."
      />

      <SettingsRowGroup>
        <SettingsToggleRow
          label="Show comment reminder"
          description="Show a notification to click the comment pin after navigating."
          checked={autoOpenComment}
          onChange={setAutoOpenComment}
        />

        <SettingsToggleRow
          label="Auto-refresh interval"
          description="Refresh thread list automatically."
          trailing={
            <div className="inline-flex shrink-0 overflow-hidden rounded-md border border-figma-border">
              {TTL_OPTIONS.map((minutes, index) => {
                const isActive = cacheTTLMinutes === minutes;
                return (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => setCacheTTLMinutes(minutes)}
                    className={`text-xs font-medium tabular-nums px-2.5 py-1.5 transition-all duration-150 ${
                      index > 0 ? "border-l border-figma-border" : ""
                    } ${isActive ? PILL_ACTIVE : PILL_INACTIVE}`}
                  >
                    {minutes}m
                  </button>
                );
              })}
            </div>
          }
        />
      </SettingsRowGroup>
    </SettingsSection>
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
  const [showPatAdvanced, setShowPatAdvanced] = useState(
    authMethod !== "oauth",
  );

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
    <>
      {user && (
        <SettingsSection>
          <SettingsSectionHeader
            title="Account"
            description={connectionSubtitle}
          />
          <SettingsSectionBody>
            <div className={CARD_CLASS}>
              <div className="flex items-center gap-3">
                <UserAvatar
                  handle={user.handle}
                  imgUrl={user.img_url}
                  colorKey={user.id}
                  size={36}
                  className="border border-figma-border"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-figma-text truncate">
                    {user.handle}
                  </p>
                  <p className="text-[10px] text-figma-text-tertiary mt-0.5 truncate">
                    {authMethod === "oauth" ? "OAuth" : "Personal access token"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="p-1.5 rounded-md text-figma-icon-secondary hover:bg-danger-bg hover:text-danger transition-colors shrink-0"
                  data-tooltip="Log out"
                  data-tooltip-align="right"
                  data-tooltip-pos="bottom"
                >
                  <LogOut size={14} />
                </button>
              </div>
            </div>

            {authMethod === "oauth" && oauthAvailable && (
              <button
                type="button"
                disabled={oauthBusy || isValidating}
                onClick={() => void handleSignInWithFigma()}
                className={`w-full ${BTN_SECONDARY}`}
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
          </SettingsSectionBody>
        </SettingsSection>
      )}

      <SettingsSection>
        <SettingsSectionHeader
          title="Access token"
          description={
            authMethod === "oauth"
              ? "OAuth tokens are stored only in this plugin. You can re-authenticate above or switch to a personal access token."
              : "Your token is stored locally in the plugin and never shared."
          }
          helpUrl={FIGMA_PAT_HELP_URL}
        />

        {authMethod === "oauth" && (
          <div className="px-4">
            <button
              type="button"
              onClick={() => setShowPatAdvanced((v) => !v)}
              className="flex items-center gap-1 text-[11px] text-accent hover:text-accent-text-hover hover:underline"
            >
              {showPatAdvanced ? (
                <ChevronDown size={12} />
              ) : (
                <ChevronRight size={12} />
              )}
              Use a personal access token instead
            </button>
          </div>
        )}

        {(authMethod === "pat" ||
          (authMethod === "oauth" && showPatAdvanced)) && (
          <>
            <div className="px-4 pb-1.5 text-[11px] text-figma-text-secondary">
              <p className="leading-snug mb-0.5">
                When generating a token, enable these permissions:
              </p>
              <ul className="list-disc list-inside space-y-0 leading-snug mb-2">
                {FIGMA_PAT_REQUIRED_SCOPES.map((scope) => (
                  <li key={scope}>
                    <code className="font-mono text-[10px]">{scope}</code>
                  </li>
                ))}
              </ul>
            </div>

            <SettingsSectionBody>
              {!editing ? (
                <SettingsFieldGroup>
                  <div className="flex items-center gap-2 bg-figma-bg border border-figma-border rounded-md px-2.5 py-1.5">
                    <code className="text-xs font-medium text-figma-text-secondary flex-1 truncate min-w-0">
                      {showToken ? displaySecret : maskedCredential || "—"}
                    </code>
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="p-1 rounded-md text-figma-icon-secondary hover:bg-figma-bg-secondary hover:text-figma-icon shrink-0 transition-colors"
                      data-tooltip={showToken ? "Hide token" : "Show token"}
                      data-tooltip-align="right"
                      data-tooltip-pos="bottom"
                      disabled={!displaySecret}
                    >
                      {showToken ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(true);
                      setNewPat("");
                    }}
                    className={BTN_SECONDARY}
                  >
                    {authMethod === "oauth"
                      ? "Paste personal access token"
                      : "Change token"}
                  </button>
                </SettingsFieldGroup>
              ) : (
                <SettingsFieldGroup>
                  <input
                    type="password"
                    value={newPat}
                    onChange={(e) => setNewPat(e.target.value)}
                    placeholder="figd_xxxxxxxxxxxxxxxx"
                    className={INPUT_CLASS}
                    autoFocus
                  />
                  {isValidating && (
                    <div className="flex items-center gap-1.5 text-[11px] text-figma-text-tertiary">
                      <Loader2 size={12} className="animate-spin" />
                      Validating token...
                    </div>
                  )}
                  {validationError && (
                    <FieldError>{validationError}</FieldError>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleSaveToken()}
                      disabled={!newPat.trim() || isValidating}
                      className={BTN_PRIMARY}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setNewPat("");
                      }}
                      className={BTN_SECONDARY}
                    >
                      Cancel
                    </button>
                  </div>
                </SettingsFieldGroup>
              )}
            </SettingsSectionBody>
          </>
        )}
      </SettingsSection>
    </>
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
    <>
      <SettingsSection>
        <SettingsSectionHeader
          title="Theme"
          description="Override the appearance or follow Figma's theme."
        />
        <SettingsSectionBody>
          <div className="flex items-center gap-1.5">
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isActive = themePreference === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setThemePreference(opt.value)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-md text-xs font-medium transition-all duration-150 ${
                    isActive ? PILL_ACTIVE : PILL_INACTIVE
                  }`}
                >
                  <Icon size={12} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </SettingsSectionBody>
      </SettingsSection>

      <SettingsSection>
        <SettingsSectionHeader
          title="Thread view"
          description="Customize how comment threads are displayed."
        />
        <SettingsRowGroup>
          <SettingsToggleRow
            label="Show reply elbows"
            description="Show connector lines between parent and reply comments."
            checked={showThreadElbows}
            onChange={setShowThreadElbows}
          />
        </SettingsRowGroup>
      </SettingsSection>
    </>
  );
}

interface SettingsScreenProps {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  return (
    <div className="flex flex-col h-full bg-figma-bg">
      <div className="flex items-stretch border-b border-figma-border">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center w-9 shrink-0 text-figma-icon-secondary hover:bg-figma-bg-hover transition-colors"
          data-tooltip="Back to dashboard"
          data-tooltip-align="left"
          data-tooltip-pos="bottom"
        >
          <ArrowLeft size={15} />
        </button>
        <div className="flex items-center flex-1 min-w-0 py-3 pl-2 pr-2.5">
          <span className="font-mono text-[9.5px] font-semibold uppercase tracking-widest text-figma-text leading-none">
            Settings
          </span>
        </div>
      </div>

      <div className="flex items-stretch h-9 overflow-x-auto bg-figma-bg border-b border-figma-border">
        <div className="flex items-stretch self-stretch min-w-0">
          {TABS.map((tab) => (
            <SettingsTabSegment
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              label={tab.label}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-figma-bg">
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
