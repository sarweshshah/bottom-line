import { useState, useCallback, useRef } from "react";
import { useAIStore } from "@ui/store/aiStore";
import { showToast } from "@ui/components/common/Toast";
import { PROVIDER_OPTIONS } from "@ui/ai/providerOptions";

export function useAiProviderConfig() {
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
    hasConfiguredProvider,
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

  const selectProvider = useCallback(
    (value: typeof provider) => {
      setProvider(value);
      setShowKey(false);
    },
    [setProvider],
  );

  return {
    provider,
    customConfig,
    imageAnalysisEnabled,
    summaryWordLimit,
    showKey,
    setShowKey,
    currentKey,
    maskedKey,
    hasConfiguredProvider: hasConfiguredProvider(),
    setCurrentKey,
    setCustomConfig,
    setSummaryWordLimit,
    setImageAnalysisEnabled,
    selectProvider,
    handleApiKeyFocus,
    handleApiKeyBlur,
    handleCustomConfigFocus,
    handleCustomConfigBlur,
  };
}
