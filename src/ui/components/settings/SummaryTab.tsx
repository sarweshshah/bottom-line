import { useState, useCallback, useRef } from "react";
import { ExternalLink } from "lucide-react";
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
  SettingsButton,
  SettingsCheckbox,
  SettingsControlRow,
  SettingsFieldGroup,
  SettingsFieldHeader,
  SettingsInlineLink,
  SettingsInput,
  SettingsOptionList,
  SettingsOptionRow,
  SettingsSection,
  SettingsSectionBody,
  SettingsSectionHeader,
  SettingsSecretInput,
  SettingsSelectField,
  SettingsWarningInline,
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
        <SettingsButton
          variant="danger"
          onClick={handleClear}
          disabled={clearing || cleared}
        >
          {clearing
            ? "Clearing..."
            : cleared
              ? "Cleared"
              : "Clear all summaries"}
        </SettingsButton>
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
          <SettingsOptionList>
            {PROVIDER_OPTIONS.map((opt) => {
              const isSelected = provider === opt.value;
              return (
                <SettingsOptionRow
                  key={opt.value}
                  selected={isSelected}
                  onSelect={() => {
                    setProvider(opt.value);
                    setShowKey(false);
                  }}
                  label={opt.label}
                  description={opt.description}
                >
                  {opt.value !== "custom" ? (
                    <SettingsFieldGroup>
                      <SettingsFieldHeader
                        label="API key"
                        trailing={
                          opt.apiKeyUrl ? (
                            <SettingsInlineLink
                              href={opt.apiKeyUrl}
                              onClick={(e) => {
                                e.preventDefault();
                                openExternalUrl(opt.apiKeyUrl!);
                              }}
                            >
                              Get your {opt.label} API key
                              <ExternalLink size={9} />
                            </SettingsInlineLink>
                          ) : undefined
                        }
                      />
                      <SettingsSecretInput
                        value={currentKey}
                        maskedValue={maskedKey}
                        show={showKey}
                        onToggleShow={() => setShowKey(!showKey)}
                        onChange={(e) => setCurrentKey(e.target.value)}
                        onFocus={handleApiKeyFocus}
                        onBlur={handleApiKeyBlur}
                        placeholder="Paste your API key"
                        revealTooltip={{ show: "Show key", hide: "Hide key" }}
                      />
                    </SettingsFieldGroup>
                  ) : (
                    <>
                      <SettingsInput
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
                      />
                      <SettingsInput
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
                      />
                      <SettingsInput
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
                      />
                    </>
                  )}

                  {isSelected && hasKey && hasVision && (
                    <SettingsControlRow
                      as="label"
                      align="center"
                      label="Image analysis"
                      description={
                        imageAnalysisEnabled
                          ? undefined
                          : "Include attached images when generating summaries."
                      }
                      warning={
                        imageAnalysisEnabled ? (
                          <SettingsWarningInline>
                            Uses more tokens per summary
                          </SettingsWarningInline>
                        ) : undefined
                      }
                      trailing={
                        <SettingsCheckbox
                          checked={imageAnalysisEnabled}
                          onChange={setImageAnalysisEnabled}
                        />
                      }
                    />
                  )}

                  {isSelected && hasKey && (
                    <SettingsControlRow
                      label="Summary length"
                      description="Cap summary length in words."
                      trailing={
                        <SettingsSelectField
                          value={summaryWordLimit}
                          onChange={(e) =>
                            setSummaryWordLimit(
                              Number(e.target.value) as SummaryWordLimit,
                            )
                          }
                        >
                          {SUMMARY_WORD_LIMIT_OPTIONS.map((limit) => (
                            <option key={limit} value={limit}>
                              {limit} words
                            </option>
                          ))}
                        </SettingsSelectField>
                      }
                    />
                  )}
                </SettingsOptionRow>
              );
            })}
          </SettingsOptionList>
        </SettingsSectionBody>
      </SettingsSection>

      <ClearCacheSection />
    </>
  );
}
