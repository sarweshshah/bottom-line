import { describe, expect, it } from "vitest";
import { figmaRestAuthHeaders } from "./figmaAuthHeaders";

describe("figmaRestAuthHeaders", () => {
  it("uses X-Figma-Token for PAT", () => {
    expect(figmaRestAuthHeaders("figd_secret", "pat")).toEqual({
      "X-Figma-Token": "figd_secret",
    });
  });

  it("uses Bearer for OAuth", () => {
    expect(figmaRestAuthHeaders("oat_token", "oauth")).toEqual({
      Authorization: "Bearer oat_token",
    });
  });
});
