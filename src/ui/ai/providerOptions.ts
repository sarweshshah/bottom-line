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
