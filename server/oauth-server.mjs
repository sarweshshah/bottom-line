/**
 * Minimal Figma OAuth broker for the Bottom Line plugin.
 * Run: node server/oauth-server.mjs  (with env vars set; see server/env.example)
 *
 * Loads server/.env if present (KEY=VALUE lines) so local dev does not require extra tooling.
 */
import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { mapOAuthErrorToPublicMessage } from "../src/shared/oauthPublicMessages.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadDotEnv() {
  const p = path.join(__dirname, ".env");
  if (!fs.existsSync(p)) return;
  const text = fs.readFileSync(p, "utf8").replace(/^\uFEFF/, "");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadDotEnv();

/** Trim — stray spaces/newlines in .env cause Figma `invalid_client` (401). */
const FIGMA_CLIENT_ID = (process.env.FIGMA_CLIENT_ID || "").trim();
const FIGMA_CLIENT_SECRET = (process.env.FIGMA_CLIENT_SECRET || "").trim();
const OAUTH_REDIRECT_URI = (process.env.OAUTH_REDIRECT_URI || "").trim();
const PORT = Number(process.env.PORT || 3847);
const CORS_ALLOW_ORIGINS = (process.env.CORS_ALLOW_ORIGINS || "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const SCOPES = (process.env.FIGMA_OAUTH_SCOPES ||
  "current_user:read file_comments:read file_content:read")
  .split(/[\s,]+/)
  .filter(Boolean)
  .join(" ");

const FIGMA_TOKEN_URL = "https://api.figma.com/v1/oauth/token";
const FIGMA_REFRESH_URL = "https://api.figma.com/v1/oauth/refresh";

/** @type {Map<string, { state: string, codeVerifier: string, status: string, accessToken?: string, refreshToken?: string, expiresIn?: number, userId?: string, error?: string, createdAt: number }>} */
const sessions = new Map();
/** @type {Map<string, string>} state -> sessionId */
const stateToSession = new Map();

const SESSION_TTL_MS = 15 * 60 * 1000;

function base64url(buf) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function randomVerifier() {
  return base64url(crypto.randomBytes(32));
}

function challengeFromVerifier(verifier) {
  return base64url(crypto.createHash("sha256").update(verifier).digest());
}

function randomId() {
  return crypto.randomBytes(16).toString("hex");
}

function basicAuthHeader() {
  const raw = `${FIGMA_CLIENT_ID}:${FIGMA_CLIENT_SECRET}`;
  return `Basic ${Buffer.from(raw, "utf8").toString("base64")}`;
}

function isOriginAllowed(origin) {
  if (!origin) return true;
  if (origin === "null") return true;
  if (CORS_ALLOW_ORIGINS.includes("*")) return true;
  if (CORS_ALLOW_ORIGINS.includes(origin)) return true;

  // Figma surfaces slightly different host variants depending on environment.
  // Treat figma.com/www.figma.com and figma-beta.com/www.figma-beta.com as equivalent.
  try {
    const incoming = new URL(origin);
    for (const allowed of CORS_ALLOW_ORIGINS) {
      const allowedUrl = new URL(allowed);
      if (incoming.protocol !== allowedUrl.protocol) continue;
      const a = allowedUrl.hostname.replace(/^www\./, "");
      const b = incoming.hostname.replace(/^www\./, "");
      if (a === b) return true;
    }
  } catch {
    // Ignore parse errors and fall through to "not allowed".
  }

  return false;
}

function cors(req, res) {
  const origin = req.headers.origin;
  if (CORS_ALLOW_ORIGINS.includes("*")) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else if (origin && isOriginAllowed(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function json(req, res, status, body) {
  cors(req, res);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        if (!raw.trim()) return resolve({});
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function cleanupSessions() {
  const now = Date.now();
  for (const [id, s] of sessions) {
    if (now - s.createdAt > SESSION_TTL_MS) {
      stateToSession.delete(s.state);
      sessions.delete(id);
    }
  }
}

setInterval(cleanupSessions, 60_000).unref();

async function exchangeCode(code, redirectUri, codeVerifier) {
  const params = new URLSearchParams({
    redirect_uri: redirectUri,
    code,
    grant_type: "authorization_code",
    code_verifier: codeVerifier,
  });

  const res = await fetch(FIGMA_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuthHeader(),
    },
    body: params.toString(),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Figma token error ${res.status}: ${text.slice(0, 500)}`);
  }
  return JSON.parse(text);
}

async function figmaRefresh(refreshToken) {
  const params = new URLSearchParams({ refresh_token: refreshToken });
  const res = await fetch(FIGMA_REFRESH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuthHeader(),
    },
    body: params.toString(),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Figma refresh error ${res.status}: ${text.slice(0, 500)}`);
  }
  return JSON.parse(text);
}

const successHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Connected</title></head>
<body style="font-family:system-ui,sans-serif;text-align:center;padding:2rem">
<p>You can close this tab and return to Figma.</p>
</body></html>`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://localhost`);

  if (req.method === "OPTIONS") {
    if (!isOriginAllowed(req.headers.origin)) {
      res.writeHead(403);
      res.end();
      return;
    }
    cors(req, res);
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    if (req.method === "POST" && url.pathname === "/api/figma/oauth/begin") {
      if (!isOriginAllowed(req.headers.origin)) {
        json(req, res, 403, { error: "Sign-in is blocked for this environment. Please contact support." });
        return;
      }
      if (!FIGMA_CLIENT_ID || !FIGMA_CLIENT_SECRET || !OAUTH_REDIRECT_URI) {
        json(req, res, 500, {
          error: "Sign-in is temporarily unavailable. Please try again later.",
        });
        return;
      }
      cleanupSessions();
      const sessionId = randomId();
      const state = randomId();
      const codeVerifier = randomVerifier();
      const codeChallenge = challengeFromVerifier(codeVerifier);
      sessions.set(sessionId, {
        state,
        codeVerifier,
        status: "pending",
        createdAt: Date.now(),
      });
      stateToSession.set(state, sessionId);

      const authParams = new URLSearchParams({
        client_id: FIGMA_CLIENT_ID,
        redirect_uri: OAUTH_REDIRECT_URI,
        scope: SCOPES,
        state,
        response_type: "code",
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
      });
      const authorizeUrl = `https://www.figma.com/oauth?${authParams.toString()}`;
      json(req, res, 200, { sessionId, authorizeUrl });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/figma/oauth/callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const sessionId = state ? stateToSession.get(state) : null;
      const session = sessionId ? sessions.get(sessionId) : null;

      if (!code || !state || !session || session.state !== state) {
        res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<p>Invalid OAuth callback.</p>");
        return;
      }

      try {
        const data = await exchangeCode(code, OAUTH_REDIRECT_URI, session.codeVerifier);
        session.status = "complete";
        session.accessToken = data.access_token;
        session.refreshToken = data.refresh_token;
        session.expiresIn = data.expires_in;
        session.userId = data.user_id_string ?? String(data.user_id ?? "");
        delete session.codeVerifier;
      } catch (e) {
        const rawError = e instanceof Error ? e.message : String(e);
        console.error("OAuth code exchange failed:", rawError);
        session.status = "error";
        session.error = mapOAuthErrorToPublicMessage(rawError, {
          fallback: "Sign-in could not be completed. Please try again.",
        });
      }

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(successHtml);
      return;
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/figma/oauth/session/")) {
      const sessionId = url.pathname.replace("/api/figma/oauth/session/", "").split("/")[0];
      const session = sessions.get(sessionId);
      if (!session) {
        json(req, res, 404, { status: "error", error: "Your sign-in session expired. Please start again." });
        return;
      }
      if (session.status === "pending") {
        json(req, res, 200, { status: "pending" });
        return;
      }
      if (session.status === "error") {
        json(req, res, 200, {
          status: "error",
          error: session.error || "Sign-in could not be completed. Please try again.",
        });
        stateToSession.delete(session.state);
        sessions.delete(sessionId);
        return;
      }
      const body = {
        status: "complete",
        access_token: session.accessToken,
        refresh_token: session.refreshToken,
        expires_in: session.expiresIn,
        user_id_string: session.userId,
      };
      stateToSession.delete(session.state);
      sessions.delete(sessionId);
      json(req, res, 200, body);
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/figma/oauth/refresh") {
      if (!isOriginAllowed(req.headers.origin)) {
        json(req, res, 403, { error: "Sign-in is blocked for this environment. Please contact support." });
        return;
      }
      if (!FIGMA_CLIENT_ID || !FIGMA_CLIENT_SECRET) {
        json(req, res, 500, { error: "Sign-in is temporarily unavailable. Please try again later." });
        return;
      }
      const body = await readBody(req);
      const refreshToken = body.refresh_token;
      if (!refreshToken || typeof refreshToken !== "string") {
        json(req, res, 400, { error: "Your session could not be refreshed. Please sign in again." });
        return;
      }
      try {
        const data = await figmaRefresh(refreshToken);
        json(req, res, 200, {
          access_token: data.access_token,
          expires_in: data.expires_in,
          token_type: data.token_type,
        });
      } catch (e) {
        const rawError = e instanceof Error ? e.message : String(e);
        console.error("OAuth token refresh failed:", rawError);
        json(req, res, 401, {
          error: mapOAuthErrorToPublicMessage(rawError, {
            fallback: "Your session could not be refreshed. Please sign in again.",
          }),
        });
      }
      return;
    }

    res.writeHead(404);
    res.end();
  } catch (e) {
    const rawError = e instanceof Error ? e.message : String(e);
    console.error("OAuth server request failed:", rawError);
    json(req, res, 500, { error: "Something went wrong. Please try again." });
  }
});

server.listen(PORT, () => {
  console.error(`Figma OAuth broker listening on http://localhost:${PORT}`);
  if (!FIGMA_CLIENT_ID || !FIGMA_CLIENT_SECRET) {
    console.error("Warning: FIGMA_CLIENT_ID / FIGMA_CLIENT_SECRET not set.");
  } else {
    console.error(
      `OAuth client_id loaded (${FIGMA_CLIENT_ID.length} chars, starts with ${FIGMA_CLIENT_ID.slice(0, 6)}…).`,
    );
  }
});
