import type { AIProvider } from "@shared/types";

export type StandardAIProvider = Exclude<AIProvider, "custom">;

export const API_KEY_FIELD: Record<
  StandardAIProvider,
  "anthropicApiKey" | "openaiApiKey" | "geminiApiKey"
> = {
  anthropic: "anthropicApiKey",
  openai: "openaiApiKey",
  gemini: "geminiApiKey",
};

export function isStandardProvider(
  provider: AIProvider,
): provider is StandardAIProvider {
  return provider !== "custom";
}
