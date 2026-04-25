import type { RawComment, FigmaUser } from "@shared/types";
import type { FigmaAuthMethod } from "@shared/types";
import { rateLimitedFetch } from "@ui/lib/rateLimiter";
import { figmaRestAuthHeaders } from "@ui/lib/figmaAuthHeaders";

const BASE_URL = "https://api.figma.com";
const TIMEOUT_MS = 10_000;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

export type ApiErrorCode =
  | "TOKEN_INVALID"
  | "FILE_NOT_FOUND"
  | "RATE_LIMITED"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "UNKNOWN";

export class FigmaApiError extends Error {
  constructor(
    message: string,
    public code: ApiErrorCode,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "FigmaApiError";
  }
}

function classifyError(status: number): ApiErrorCode {
  switch (status) {
    case 403:
      return "TOKEN_INVALID";
    case 404:
      return "FILE_NOT_FOUND";
    case 429:
      return "RATE_LIMITED";
    default:
      return "UNKNOWN";
  }
}

function shouldRetry(code: ApiErrorCode): boolean {
  return code === "RATE_LIMITED" || code === "NETWORK_ERROR" || code === "TIMEOUT";
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    return await rateLimitedFetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new FigmaApiError("Request timed out", "TIMEOUT");
    }
    throw new FigmaApiError(
      err instanceof Error ? err.message : "Network request failed",
      "NETWORK_ERROR",
    );
  } finally {
    clearTimeout(timer);
  }
}

async function apiRequest<T>(
  path: string,
  token: string,
  authMode: FigmaAuthMethod,
  attempt = 0,
): Promise<T> {
  let response: Response;

  try {
    response = await fetchWithTimeout(`${BASE_URL}${path}`, {
      headers: figmaRestAuthHeaders(token, authMode),
    });
  } catch (err) {
    if (err instanceof FigmaApiError && shouldRetry(err.code) && attempt < MAX_RETRIES) {
      const delay = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
      return apiRequest<T>(path, token, authMode, attempt + 1);
    }
    throw err;
  }

  if (!response.ok) {
    const code = classifyError(response.status);
    if (shouldRetry(code) && attempt < MAX_RETRIES) {
      const retryAfter = response.headers.get("Retry-After");
      const delay = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : INITIAL_BACKOFF_MS * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
      return apiRequest<T>(path, token, authMode, attempt + 1);
    }

    const errorMessages: Record<string, string> = {
      TOKEN_INVALID: "Your Figma token is invalid or has expired.",
      FILE_NOT_FOUND: "The specified file was not found. Check your file URL.",
      RATE_LIMITED: "Too many requests. Please wait a moment and try again.",
      UNKNOWN: `Request failed with status ${response.status}.`,
    };

    throw new FigmaApiError(
      errorMessages[code] || errorMessages.UNKNOWN,
      code,
      response.status,
    );
  }

  return response.json() as Promise<T>;
}

export interface MeResponse {
  id: string;
  handle: string;
  img_url: string;
  email: string;
}

export interface CommentsResponse {
  comments: RawComment[];
}

export async function validateToken(
  token: string,
  authMode: FigmaAuthMethod,
): Promise<FigmaUser> {
  const data = await apiRequest<MeResponse>("/v1/me", token, authMode);
  return {
    id: data.id,
    handle: data.handle,
    img_url: data.img_url,
  };
}

interface FileMetaResponse {
  name: string;
}

export async function getFileName(
  fileKey: string,
  token: string,
  authMode: FigmaAuthMethod,
): Promise<string> {
  const data = await apiRequest<FileMetaResponse>(
    `/v1/files/${fileKey}?depth=1`,
    token,
    authMode,
  );
  return data.name;
}

export async function getComments(
  fileKey: string,
  token: string,
  authMode: FigmaAuthMethod,
): Promise<RawComment[]> {
  const data = await apiRequest<CommentsResponse>(
    `/v1/files/${fileKey}/comments?as_md=true`,
    token,
    authMode,
  );
  return data.comments;
}

/**
 * The Figma REST API does not support resolving or reopening comments.
 * The POST /v1/files/:file_key/comments endpoint only accepts message,
 * comment_id, and client_meta — there is no "resolved" field.
 * Resolve/reopen state is tracked locally only.
 */
