import { useState, useCallback, useRef, type MouseEvent } from "react";
import {
  Eye,
  EyeOff,
  ExternalLink,
  ChevronDown,
  TriangleAlert,
} from "lucide-react";
import { useCommentsStore } from "@ui/store/commentsStore";
import { useAIStore } from "@ui/store/aiStore";
import { openExternalUrl } from "@ui/lib/openExternal";
import { showToast } from "@ui/components/common/Toast";
import {
  supportsVision,
  PROVIDER_MODEL_LABELS,
  PROVIDER_API_KEY_URLS,
} from "@ui/ai/cloudProvider";
import { clearAllCachedSummaries } from "@ui/ai/summarize";
import type { AIProvider, SummaryWordLimit } from "@shared/types";
import { SUMMARY_WORD_LIMIT_OPTIONS } from "@shared/types";
import {
  BTN_DANGER,
  INPUT_CLASS,
  SELECT_COMPACT_CLASS,
  SettingsSection,
  SettingsSectionBody,
  SettingsSectionHeader,
} from "@ui/components/settings/settingsPrimitives";

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

export function SummaryTab() {
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
  const apiKeyOnFocus = useRef("");
  const customConfigOnFocus = useRef("");

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

  const providerLabel =
    PROVIDER_OPTIONS.find((opt) => opt.value === provider)?.label ?? "API";

  const customConfigSnapshot = useCallback(
    () =>
      JSON.stringify({
        baseUrl: customConfig.baseUrl.trim(),
        apiKey: customConfig.apiKey.trim(),
        modelName: customConfig.modelName.trim(),
      }),
    [customConfig],
  );

  const handleApiKeyFocus = useCallback(() => {
    apiKeyOnFocus.current = currentKey.trim();
  }, [currentKey]);

  const handleApiKeyBlur = useCallback(() => {
    const trimmed = currentKey.trim();
    if (!trimmed || trimmed === apiKeyOnFocus.current) return;
    showToast(`${providerLabel} API key saved`, "success");
  }, [currentKey, providerLabel]);

  const handleCustomConfigFocus = useCallback(() => {
    customConfigOnFocus.current = customConfigSnapshot();
  }, [customConfigSnapshot]);

  const handleCustomConfigBlur = useCallback(() => {
    const snapshot = customConfigSnapshot();
    if (snapshot === customConfigOnFocus.current) return;

    const baseUrl = customConfig.baseUrl.trim();
    const modelName = customConfig.modelName.trim();
    const apiKey = customConfig.apiKey.trim();

    if (baseUrl && modelName) {
      showToast("Custom endpoint configured", "success");
      return;
    }

    if (apiKey) {
      showToast("Custom API key saved", "success");
    }
  }, [customConfig, customConfigSnapshot]);

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
                                  onFocus={handleApiKeyFocus}
                                  onBlur={handleApiKeyBlur}
                                  placeholder="Paste your API key"
                                  className="flex-1 bg-transparent text-xs text-figma-text placeholder:text-figma-text-disabled focus:outline-none min-w-0"
                                />
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
                              onFocus={handleCustomConfigFocus}
                              onBlur={handleCustomConfigBlur}
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
                              onFocus={handleCustomConfigFocus}
                              onBlur={handleCustomConfigBlur}
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
                              onFocus={handleCustomConfigFocus}
                              onBlur={handleCustomConfigBlur}
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
