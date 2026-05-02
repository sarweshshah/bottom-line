/**
 * Maps raw OAuth/broker error strings to user-safe messages.
 * Single source of truth for plugin UI and server/oauth-server.mjs.
 */

const BROWSER_FIRST_RULES = [
  {
    includesAny: ["failed to fetch", "networkerror when attempting to fetch resource"],
    message:
      "Could not start sign-in right now. Please check your connection and try again.",
  },
  {
    includesAny: ["origin not allowed"],
    message: "Sign-in is blocked for this environment. Please contact support.",
  },
];

const SHARED_RULES = [
  {
    includesAny: [
      "invalid_client",
      "server missing oauth credentials",
      "server missing figma_client_id",
      "server missing",
    ],
    message: "Sign-in is temporarily unavailable. Please try again later.",
  },
  {
    includesAny: ["invalid oauth callback", "invalid callback"],
    message: "Sign-in could not be completed. Please try again.",
  },
  {
    includesAny: ["unknown session"],
    message: "Your sign-in session expired. Please start again.",
  },
  {
    includesAny: ["refresh_token required"],
    message: "Your session could not be refreshed. Please sign in again.",
  },
  {
    includesAny: ["refresh failed", "figma refresh error"],
    message: "Your session could not be refreshed. Please sign in again.",
  },
  {
    includesAny: ["token exchange failed", "oauth failed"],
    message: "Sign-in could not be completed. Please try again.",
  },
  {
    includesAny: ["authorization timed out"],
    message:
      "Sign-in timed out. Please try again and complete authorization in your browser.",
  },
];

function matchesRule(lower, rule) {
  return rule.includesAny.some((s) => lower.includes(s));
}

function firstMatchingMessage(lower, rules) {
  for (const rule of rules) {
    if (matchesRule(lower, rule)) return rule.message;
  }
  return null;
}

/**
 * @param {unknown} message
 * @param {{ fallback?: string; includeBrowserErrors?: boolean }} [options]
 * @returns {string}
 */
export function mapOAuthErrorToPublicMessage(message, options = {}) {
  const lower = String(message ?? "").toLowerCase();
  const includeBrowserErrors = options.includeBrowserErrors === true;

  const defaultFallback = includeBrowserErrors
    ? "Sign in with Figma failed. Please try again."
    : "Request failed. Please try again.";
  const fallback = options.fallback ?? defaultFallback;

  if (includeBrowserErrors) {
    const browserHit = firstMatchingMessage(lower, BROWSER_FIRST_RULES);
    if (browserHit) return browserHit;
  }

  const sharedHit = firstMatchingMessage(lower, SHARED_RULES);
  if (sharedHit) return sharedHit;

  return fallback;
}
