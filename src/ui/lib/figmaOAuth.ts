function oauthBackendBase(): string | null {
  const raw = import.meta.env.VITE_FIGMA_OAUTH_BACKEND_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}

function normalizeOAuthErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid_client")) {
    return "Figma OAuth is misconfigured on the backend (invalid client credentials). Check FIGMA_CLIENT_ID, FIGMA_CLIENT_SECRET, and OAUTH_REDIRECT_URI on the OAuth server, then try again.";
  }
  if (lower.includes("authorization timed out")) {
    return "Authorization timed out. Try again and complete sign-in in the browser tab.";
  }
  return message;
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
  if (!base) throw new Error("OAuth backend URL is not configured.");
  const res = await fetch(`${base}/api/figma/oauth/begin`, { method: "POST" });
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
    throw new Error("Invalid response from OAuth server.");
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
  if (!base) throw new Error("OAuth backend URL is not configured.");
  const res = await fetch(`${base}/api/figma/oauth/session/${sessionId}`);
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
  if (!base) throw new Error("OAuth backend URL is not configured.");
  const res = await fetch(`${base}/api/figma/oauth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message =
      typeof err.error === "string" ? err.error : `Token refresh failed (${res.status})`;
    throw new Error(normalizeOAuthErrorMessage(message));
  }
  return res.json() as Promise<RefreshResponse>;
}
