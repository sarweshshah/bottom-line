import { describe, expect, it } from "vitest";
import {
  AVATAR_PALETTE,
  assignAdjacentAvatarColors,
  areAdjacentAvatarColorsDistinct,
  colorDistance,
  getAvatarColor,
  getFirstInitial,
} from "./avatarUtils";

describe("getFirstInitial", () => {
  it("uses the first character of the first name", () => {
    expect(getFirstInitial("Jane Doe")).toBe("J");
    expect(getFirstInitial("@alice")).toBe("A");
    expect(getFirstInitial("bob_smith")).toBe("B");
  });

  it("returns ? for empty names", () => {
    expect(getFirstInitial("")).toBe("?");
    expect(getFirstInitial("@")).toBe("?");
  });
});

describe("getAvatarColor", () => {
  it("returns a palette token", () => {
    expect(AVATAR_PALETTE).toContain(getAvatarColor("alice"));
  });

  it("is stable for the same key", () => {
    expect(getAvatarColor("alice")).toBe(getAvatarColor("alice"));
  });

  it("uses CSS variables from the brand palette image", () => {
    for (const color of AVATAR_PALETTE) {
      expect(color.startsWith("var(--bl-comp-avatar-")).toBe(true);
    }
  });
});

describe("assignAdjacentAvatarColors", () => {
  it("keeps adjacent avatars visually distinct", () => {
    const keys = Array.from({ length: 12 }, (_, index) => `user-${index}`);
    const colors = assignAdjacentAvatarColors(keys);
    const ordered = keys.map((key) => colors.get(key)!);

    expect(areAdjacentAvatarColorsDistinct(ordered)).toBe(true);
  });

  it("reassigns when hash-preferred neighbors are too close", () => {
    // user3 -> palette index 0 (slate), user2 -> index 3 (navy)
    const colors = assignAdjacentAvatarColors(["user3", "user2"]);
    const ordered = [colors.get("user3")!, colors.get("user2")!];

    expect(colorDistance(ordered[0], ordered[1])).toBeGreaterThanOrEqual(55);
  });
});
