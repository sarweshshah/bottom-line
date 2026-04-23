import { describe, expect, it } from "vitest";
import { isValidFigmaUrl, parseFileKey } from "./parseFileUrl";

describe("parseFileUrl", () => {
  it("extracts file key from supported figma URL shapes", () => {
    expect(parseFileKey("https://www.figma.com/file/AbC123xyz/Project")).toBe(
      "AbC123xyz",
    );
    expect(parseFileKey("https://www.figma.com/design/Design999/Flow")).toBe(
      "Design999",
    );
    expect(parseFileKey("https://www.figma.com/board/B0ARDKEY123/Ideas")).toBe(
      "B0ARDKEY123",
    );
  });

  it("returns null for non-figma URLs", () => {
    expect(parseFileKey("https://example.com/file/AbC123xyz")).toBeNull();
  });

  it("validates figma URL patterns correctly", () => {
    expect(isValidFigmaUrl("https://www.figma.com/file/AbC123xyz/Project")).toBe(
      true,
    );
    expect(isValidFigmaUrl("https://www.figma.com/board/B0ARDKEY123/Ideas")).toBe(
      true,
    );
    expect(isValidFigmaUrl("https://google.com/file/AbC123xyz")).toBe(false);
  });
});
