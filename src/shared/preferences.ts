import type { MotionPreference, ThemePreference } from "./types";

export const THEME_PREFERENCES = ["system", "light", "dark"] as const;
export const MOTION_PREFERENCES = ["system", "reduce", "allow"] as const;

export function normalizeThemePreference(value: unknown): ThemePreference {
  return THEME_PREFERENCES.includes(value as ThemePreference)
    ? (value as ThemePreference)
    : "system";
}

export function normalizeMotionPreference(value: unknown): MotionPreference {
  return MOTION_PREFERENCES.includes(value as MotionPreference)
    ? (value as MotionPreference)
    : "system";
}
