import {
  PROVIDER_API_KEY_URLS,
  PROVIDER_MODEL_LABELS,
} from "@ui/ai/cloudProvider";
import type { AIProvider } from "@shared/types";

export type ProviderOption = {
  value: AIProvider;
  label: string;
  description: string;
  apiKeyUrl?: string;
};

export const PROVIDER_OPTIONS: ProviderOption[] = [
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

const PROVIDER_LABELS = Object.fromEntries(
  PROVIDER_OPTIONS.map((opt) => [opt.value, opt.label]),
) as Record<AIProvider, string>;

export function getProviderLabel(provider: AIProvider): string {
  return PROVIDER_LABELS[provider] ?? "API";
}

export type ProviderDisplayStyle = "brand" | "model" | "consent";

export function getProviderDisplayName(
  provider: AIProvider,
  style: ProviderDisplayStyle = "brand",
  customModelName?: string,
): string {
  if (provider === "custom") {
    if (style === "consent") return "your custom endpoint";
    if (style === "model") return customModelName?.trim() || "custom";
    return getProviderLabel(provider);
  }
  if (style === "brand") return getProviderLabel(provider);
  return PROVIDER_MODEL_LABELS[provider] ?? provider;
}
