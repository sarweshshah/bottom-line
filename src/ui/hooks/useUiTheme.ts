import { useEffect } from "react";
import type { MotionPreference, ThemePreference } from "@shared/types";

const THEME_COLORS_LIGHT: Record<string, string> = {
  "--figma-color-bg": "#ffffff",
  "--figma-color-bg-secondary": "#f5f5f5",
  "--figma-color-bg-tertiary": "#e6e6e6",
  "--figma-color-bg-hover": "#f5f5f5",
  "--figma-color-bg-selected": "#e5f4ff",
  "--figma-color-text": "#000000e5",
  "--figma-color-text-secondary": "#00000080",
  "--figma-color-text-tertiary": "#0000004d",
  "--figma-color-text-disabled": "#0000004d",
  "--figma-color-border": "#e6e6e6",
  "--figma-color-border-strong": "#2c2c2c",
  "--figma-color-icon": "#000000e5",
  "--figma-color-icon-secondary": "#00000080",
  "--figma-color-icon-tertiary": "#0000004d",
};

const THEME_COLORS_DARK: Record<string, string> = {
  "--figma-color-bg": "#222226",
  "--figma-color-bg-secondary": "#323238",
  "--figma-color-bg-tertiary": "#404048",
  "--figma-color-bg-hover": "#3a3a42",
  "--figma-color-bg-selected": "#454562",
  "--figma-color-text": "#f2f0f5",
  "--figma-color-text-secondary": "#d1d3e5",
  "--figma-color-text-tertiary": "#b7b8d1",
  "--figma-color-text-disabled": "#9495b4",
  "--figma-color-border": "#45454c",
  "--figma-color-border-strong": "#5c5866",
  "--figma-color-icon": "#f2f0f5",
  "--figma-color-icon-secondary": "#d1d3e5",
  "--figma-color-icon-tertiary": "#b7b8d1",
};

const ALL_THEME_VARS = Object.keys(THEME_COLORS_LIGHT);

let figmaOriginalThemeClass: "figma-dark" | "figma-light" | null = null;

function snapshotFigmaTheme() {
  if (figmaOriginalThemeClass !== null) return;
  const root = document.documentElement;
  if (root.classList.contains("figma-dark")) {
    figmaOriginalThemeClass = "figma-dark";
  } else {
    figmaOriginalThemeClass = "figma-light";
  }
}

function applyTheme(pref: ThemePreference) {
  const root = document.documentElement;
  snapshotFigmaTheme();

  if (pref === "system") {
    ALL_THEME_VARS.forEach((v) => root.style.removeProperty(v));
    root.classList.remove("theme-override");
    root.classList.remove("figma-dark", "figma-light");
    if (figmaOriginalThemeClass) {
      root.classList.add(figmaOriginalThemeClass);
    }
    return;
  }

  const colors = pref === "dark" ? THEME_COLORS_DARK : THEME_COLORS_LIGHT;
  for (const [prop, value] of Object.entries(colors)) {
    root.style.setProperty(prop, value);
  }

  root.classList.add("theme-override");
  if (pref === "dark") {
    root.classList.add("figma-dark");
    root.classList.remove("figma-light");
  } else {
    root.classList.add("figma-light");
    root.classList.remove("figma-dark");
  }
}

function applyMotion(pref: MotionPreference) {
  const root = document.documentElement;
  if (pref === "system") {
    root.removeAttribute("data-motion");
  } else {
    root.setAttribute("data-motion", pref);
  }
}

export function useUiTheme(
  themePreference: ThemePreference,
  motionPreference: MotionPreference,
) {
  useEffect(() => {
    applyTheme(themePreference);
  }, [themePreference]);

  useEffect(() => {
    applyMotion(motionPreference);
  }, [motionPreference]);
}
