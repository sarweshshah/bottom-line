import type {
  AIProvider,
  CommentThread,
  CustomProviderConfig,
  SummaryResult,
} from "@shared/types";
import {
  SYSTEM_PROMPT,
  formatThreadForPrompt,
  parseAIResponse,
} from "./prompts";
import type { ProcessedImage } from "./imageProcessor";

const TIMEOUT_MS = 15_000;

export class CloudAIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "CloudAIError";
  }
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new CloudAIError("AI request timed out after 15 seconds");
    }
    throw new CloudAIError(
      err instanceof Error
        ? err.message
        : "Network request to AI provider failed",
    );
  } finally {
    clearTimeout(timer);
  }
}

function buildUserContent(
  threadText: string,
  images: ProcessedImage[],
  provider: AIProvider,
): unknown {
  if (images.length === 0) {
    return threadText;
  }

  switch (provider) {
    case "anthropic": {
      const parts: unknown[] = [];
      for (const img of images) {
        parts.push({
          type: "image",
          source: {
            type: "base64",
            media_type: img.mimeType,
            data: img.base64,
          },
        });
      }
      parts.push({ type: "text", text: threadText });
      return parts;
    }
    case "openai":
    case "custom": {
      const parts: unknown[] = [];
      for (const img of images) {
        parts.push({
          type: "image_url",
          image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
        });
      }
      parts.push({ type: "text", text: threadText });
      return parts;
    }
    case "gemini": {
      return threadText;
    }
    default:
      return threadText;
  }
}

async function callAnthropic(
  apiKey: string,
  threadText: string,
  images: ProcessedImage[],
): Promise<string> {
  const userContent = buildUserContent(threadText, images, "anthropic");
  const res = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-latest",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new CloudAIError(
      `Anthropic API error (${res.status}): ${body.slice(0, 200)}`,
      res.status,
    );
  }

  const data = await res.json();
  const textBlock = data.content?.find(
    (b: { type: string }) => b.type === "text",
  );
  return textBlock?.text ?? "";
}

async function callOpenAI(
  apiKey: string,
  threadText: string,
  images: ProcessedImage[],
  baseUrl = "https://api.openai.com/v1",
  model = "gpt-4o-mini",
): Promise<string> {
  const userContent = buildUserContent(threadText, images, "openai");
  const res = await fetchWithTimeout(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new CloudAIError(
      `OpenAI API error (${res.status}): ${body.slice(0, 200)}`,
      res.status,
    );
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callGemini(
  apiKey: string,
  threadText: string,
  images: ProcessedImage[],
): Promise<string> {
  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const parts: unknown[] = [];
  for (const img of images) {
    parts.push({
      inline_data: { mime_type: img.mimeType, data: img.base64 },
    });
  }
  parts.push({ text: `${SYSTEM_PROMPT}\n\n${threadText}` });

  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { maxOutputTokens: 4096 },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new CloudAIError(
      `Gemini API error (${res.status}): ${body.slice(0, 200)}`,
      res.status,
    );
  }

  const data = await res.json();
  const responseParts: Array<{ text?: string; thought?: boolean }> =
    data.candidates?.[0]?.content?.parts ?? [];
  const responsePart =
    responseParts.find((p) => p.text && !p.thought) ??
    responseParts.find((p) => p.text);
  return responsePart?.text ?? "";
}

export async function cloudSummarize(
  thread: CommentThread,
  provider: AIProvider,
  apiKey: string,
  images: ProcessedImage[],
  customConfig?: CustomProviderConfig,
): Promise<SummaryResult> {
  const threadText = formatThreadForPrompt(thread);
  let rawResponse: string;
  let modelName: string;

  switch (provider) {
    case "anthropic":
      modelName = "claude-3-5-haiku-latest";
      rawResponse = await callAnthropic(apiKey, threadText, images);
      break;
    case "openai":
      modelName = "gpt-4o-mini";
      rawResponse = await callOpenAI(apiKey, threadText, images);
      break;
    case "gemini":
      modelName = "gemini-2.5-flash";
      rawResponse = await callGemini(apiKey, threadText, images);
      break;
    case "custom": {
      if (!customConfig?.baseUrl) {
        throw new CloudAIError("Custom provider base URL is not configured");
      }
      modelName = customConfig.modelName || "default";
      rawResponse = await callOpenAI(
        customConfig.apiKey || apiKey,
        threadText,
        images,
        customConfig.baseUrl.replace(/\/+$/, ""),
        modelName,
      );
      break;
    }
    default:
      throw new CloudAIError(`Unsupported provider: ${provider}`);
  }

  return parseAIResponse(rawResponse, thread.id, thread, provider, modelName);
}

const VISION_PROVIDERS = new Set<AIProvider>(["anthropic", "openai", "gemini"]);

export function supportsVision(provider: AIProvider): boolean {
  return VISION_PROVIDERS.has(provider);
}

export const PROVIDER_MODEL_LABELS: Record<AIProvider, string> = {
  anthropic: "Claude 3.5 Haiku",
  openai: "GPT-4o mini",
  gemini: "Gemini 2.5 Flash",
  custom: "Custom",
};

const MODEL_DISPLAY_NAMES: Record<string, string> = {
  "claude-3-5-haiku-latest": "Claude 3.5 Haiku",
  "gpt-4o-mini": "GPT-4o mini",
  "gemini-2.5-flash": "Gemini 2.5 Flash",
};

export function formatModelName(modelId: string): string {
  return MODEL_DISPLAY_NAMES[modelId] ?? modelId;
}
