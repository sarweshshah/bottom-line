function oauthBackendBase(): string | null {
  const raw = import.meta.env.VITE_FIGMA_OAUTH_BACKEND_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}

function normalizeOAuthErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror when attempting to fetch resource")
  ) {
    return "Could not start sign-in right now. Please check your connection and try again.";
  }
  if (lower.includes("origin not allowed")) {
    return "Sign-in is blocked for this environment. Please contact support.";
  }
  if (lower.includes("invalid oauth callback") || lower.includes("invalid callback")) {
    return "Sign-in could not be completed. Please try again.";
  }
  if (lower.includes("unknown session")) {
    return "Your sign-in session expired. Please start again.";
  }
  if (lower.includes("invalid_client")) {
    return "Sign-in is temporarily unavailable. Please try again in a moment.";
  }
  if (
    lower.includes("server missing oauth credentials") ||
    lower.includes("server missing figma_client_id") ||
    lower.includes("server missing")
  ) {
    return "Sign-in is temporarily unavailable. Please try again later.";
  }
  if (lower.includes("refresh_token required")) {
    return "Your session could not be refreshed. Please sign in again.";
  }
  if (lower.includes("token exchange failed") || lower.includes("oauth failed")) {
    return "Sign-in could not be completed. Please try again.";
  }
  if (lower.includes("refresh failed") || lower.includes("figma refresh error")) {
    return "Your session could not be refreshed. Please sign in again.";
  }
  if (lower.includes("authorization timed out")) {
    return "Sign-in timed out. Please try again and complete authorization in your browser.";
  }
  return "Sign in with Figma failed. Please try again.";
}

async function fetchWithRetry(
  input: string,
  init: RequestInit,
  options?: { attempts?: number; baseDelayMs?: number },
): Promise<Response> {
  const attempts = Math.max(1, options?.attempts ?? 3);
  const baseDelayMs = Math.max(100, options?.baseDelayMs ?? 500);
  let lastError: Error | null = null;

  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fetch(input, init);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (i < attempts - 1) {
        const delay = baseDelayMs * (i + 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError ?? new Error("Network request failed.");
}

export function isFigmaOAuthConfigured(): boolean {
  return oauthBackendBase() !== null;
}

export interface BeginOAuthResponse {
  sessionId: string;
  authorizeUrl: string;
}

export async function beginOAuthSession(): Promise<BeginOAuthResponse> {
  const base = oauthBackendBase();
  if (!base) throw new Error("Sign-in is temporarily unavailable. Please try again later.");
  let res: Response;
  try {
    res = await fetchWithRetry(
      `${base}/api/figma/oauth/begin`,
      { method: "POST" },
      { attempts: 3, baseDelayMs: 600 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign in with Figma failed.";
    const normalized = normalizeOAuthErrorMessage(message);
    throw new Error(normalized);
  }
  const text = await res.text();
  if (!res.ok) {
    let msg = `OAuth begin failed (${res.status})`;
    try {
      const j = JSON.parse(text) as { error?: string };
      if (j.error) msg = j.error;
    } catch {
      if (text) msg = text;
    }
    throw new Error(normalizeOAuthErrorMessage(msg));
  }
  const data = JSON.parse(text) as BeginOAuthResponse;
  if (!data.sessionId || !data.authorizeUrl) {
    throw new Error("Sign-in is temporarily unavailable. Please try again.");
  }
  return data;
}

export interface OAuthSessionComplete {
  status: "complete";
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id_string?: string;
}

export interface OAuthSessionPoll {
  status: "pending" | "error";
  error?: string;
}

export async function fetchOAuthSessionStatus(
  sessionId: string,
): Promise<OAuthSessionComplete | OAuthSessionPoll> {
  const base = oauthBackendBase();
  if (!base) throw new Error("Sign-in is temporarily unavailable. Please try again later.");
  let res: Response;
  try {
    res = await fetch(`${base}/api/figma/oauth/session/${sessionId}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sign in with Figma failed.";
    throw new Error(normalizeOAuthErrorMessage(message));
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(normalizeOAuthErrorMessage(text || `OAuth session poll failed (${res.status})`));
  }
  return res.json() as Promise<OAuthSessionComplete | OAuthSessionPoll>;
}

export async function pollOAuthUntilComplete(
  sessionId: string,
  options?: { timeoutMs?: number },
): Promise<OAuthSessionComplete> {
  const deadline = Date.now() + (options?.timeoutMs ?? 120_000);
  let delay = 400;
  while (Date.now() < deadline) {
    const data = await fetchOAuthSessionStatus(sessionId);
    if (data.status === "complete") return data;
    if (data.status === "error") {
      throw new Error(normalizeOAuthErrorMessage(data.error || "Sign in with Figma failed."));
    }
    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(Math.floor(delay * 1.25), 3000);
  }
  throw new Error(normalizeOAuthErrorMessage("Authorization timed out. Close this message and try again."));
}

export interface RefreshResponse {
  access_token: string;
  expires_in: number;
}

export async function refreshOAuthAccessToken(
  refreshToken: string,
): Promise<RefreshResponse> {
  const base = oauthBackendBase();
  if (!base) throw new Error("Session refresh is temporarily unavailable. Please sign in again.");
  let res: Response;
  try {
    res = await fetch(`${base}/api/figma/oauth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Session refresh failed.";
    throw new Error(normalizeOAuthErrorMessage(message));
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message =
      typeof err.error === "string" ? err.error : `Token refresh failed (${res.status})`;
    throw new Error(normalizeOAuthErrorMessage(message));
  }
  return res.json() as Promise<RefreshResponse>;
}
