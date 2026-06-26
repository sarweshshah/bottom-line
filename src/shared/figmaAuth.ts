import type { FigmaAuthMethod } from "./types";

export type StoredFigmaAuth = {
  pat: string | null;
  figmaAccessToken: string | null;
  figmaRefreshToken: string | null;
  figmaTokenExpiresAt: number | null;
  authMethod: FigmaAuthMethod | null;
};

export function resolveStoredFigmaAuth(input: {
  authMethodRaw?: unknown;
  pat?: string | null;
  figmaAccessToken?: string | null;
  figmaRefreshToken?: string | null;
  figmaTokenExpiresAt?: unknown;
}): StoredFigmaAuth {
  let authMethod: FigmaAuthMethod | null =
    input.authMethodRaw === "oauth" || input.authMethodRaw === "pat"
      ? input.authMethodRaw
      : null;

  if (!authMethod && input.pat) authMethod = "pat";
  if (!authMethod && input.figmaAccessToken) authMethod = "oauth";

  return {
    pat: authMethod === "pat" ? input.pat ?? null : null,
    figmaAccessToken:
      authMethod === "oauth" ? input.figmaAccessToken ?? null : null,
    figmaRefreshToken:
      authMethod === "oauth" ? input.figmaRefreshToken ?? null : null,
    figmaTokenExpiresAt:
      authMethod === "oauth" && typeof input.figmaTokenExpiresAt === "number"
        ? input.figmaTokenExpiresAt
        : null,
    authMethod,
  };
}

export function getAuthConnectionSubtitle(
  authMethod: FigmaAuthMethod | null,
): string {
  return authMethod === "oauth"
    ? "Signed in with Figma"
    : "Using personal access token";
}

export function getAuthTokenTypeLabel(
  authMethod: FigmaAuthMethod | null,
): string {
  return authMethod === "oauth" ? "OAuth" : "Personal access token";
}
