import { useState, useCallback, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAIStore } from "@ui/store/aiStore";
import { showToast } from "@ui/components/common/Toast";
import { getProviderLabel } from "@ui/ai/providerOptions";
import type { CustomProviderConfig } from "@shared/types";

export function useAiProviderConfig() {
  const {
    provider,
    customConfig,
    imageAnalysisEnabled,
    summaryWordLimit,
    currentKey,
    hasConfiguredProvider,
    setProvider,
    setCustomConfig,
    setSummaryWordLimit,
    setImageAnalysisEnabled,
    setApiKeyForProvider,
  } = useAIStore(
    useShallow((s) => ({
      provider: s.provider,
      customConfig: s.customConfig,
      imageAnalysisEnabled: s.imageAnalysisEnabled,
      summaryWordLimit: s.summaryWordLimit,
      currentKey: s.getRawApiKeyForProvider(),
      hasConfiguredProvider: s.hasConfiguredProvider(),
      setProvider: s.setProvider,
      setCustomConfig: s.setCustomConfig,
      setSummaryWordLimit: s.setSummaryWordLimit,
      setImageAnalysisEnabled: s.setImageAnalysisEnabled,
      setApiKeyForProvider: s.setApiKeyForProvider,
    })),
  );

  const [showKey, setShowKey] = useState(false);
  const apiKeyOnFocus = useRef("");
  const customConfigOnFocus = useRef("");

  const providerLabel = getProviderLabel(provider);

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
      setApiKeyForProvider(provider, key);
    },
    [provider, setApiKeyForProvider],
  );

  const updateCustomConfig = useCallback(
    (patch: Partial<CustomProviderConfig>) => {
      setCustomConfig({ ...customConfig, ...patch });
    },
    [customConfig, setCustomConfig],
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
    hasConfiguredProvider,
    setCurrentKey,
    updateCustomConfig,
    setSummaryWordLimit,
    setImageAnalysisEnabled,
    selectProvider,
    handleApiKeyFocus,
    handleApiKeyBlur,
    handleCustomConfigFocus,
    handleCustomConfigBlur,
  };
}
