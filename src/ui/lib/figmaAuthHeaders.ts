import type { FigmaAuthMethod } from "@shared/types";

export function figmaRestAuthHeaders(
  token: string,
  mode: FigmaAuthMethod,
): Record<string, string> {
  if (mode === "oauth") {
    return { Authorization: `Bearer ${token}` };
  }
  return { "X-Figma-Token": token };
}
