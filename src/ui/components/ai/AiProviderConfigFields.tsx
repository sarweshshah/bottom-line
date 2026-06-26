import { ExternalLink } from "lucide-react";
import { openExternalUrl } from "@ui/lib/openExternal";
import { supportsVision } from "@ui/ai/cloudProvider";
import { PROVIDER_OPTIONS } from "@ui/ai/providerOptions";
import { useAiProviderConfig } from "@ui/ai/useAiProviderConfig";
import type { SummaryWordLimit } from "@shared/types";
import { SUMMARY_WORD_LIMIT_OPTIONS } from "@shared/types";
import {
  SettingsCheckbox,
  SettingsControlRow,
  SettingsFieldGroup,
  SettingsFieldHeader,
  SettingsInlineLink,
  SettingsInput,
  SettingsOptionList,
  SettingsOptionRow,
  SettingsSecretInput,
  SettingsSelectField,
  SettingsWarningInline,
} from "@ui/components/settings/settingsPrimitives";

type AiProviderConfigFieldsProps = {
  mode?: "full" | "compact";
};

export function AiProviderConfigFields({
  mode = "full",
}: AiProviderConfigFieldsProps) {
  const {
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
    setCustomConfig,
    setSummaryWordLimit,
    setImageAnalysisEnabled,
    selectProvider,
    handleApiKeyFocus,
    handleApiKeyBlur,
    handleCustomConfigFocus,
    handleCustomConfigBlur,
  } = useAiProviderConfig();

  const hasVision = supportsVision(provider);
  const showAdvancedOptions = mode === "full";

  return (
    <SettingsOptionList>
      {PROVIDER_OPTIONS.map((opt) => {
        const isSelected = provider === opt.value;
        return (
          <SettingsOptionRow
            key={opt.value}
            selected={isSelected}
            onSelect={() => selectProvider(opt.value)}
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

            {showAdvancedOptions && isSelected && hasConfiguredProvider && hasVision && (
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

            {showAdvancedOptions && isSelected && hasConfiguredProvider && (
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
  );
}
