import type { CacheTTLMinutes } from "./types";

export const MIN_UI_WIDTH = 420;
export const MAX_UI_WIDTH = 540;
export const MIN_UI_HEIGHT = 640;
export const MAX_UI_HEIGHT = 1200;
export const DEFAULT_UI_WIDTH = 420;
export const DEFAULT_UI_HEIGHT = 800;

export function clampUiSize(width: number, height: number) {
  return {
    width: Math.min(MAX_UI_WIDTH, Math.max(MIN_UI_WIDTH, Math.round(width))),
    height: Math.min(MAX_UI_HEIGHT, Math.max(MIN_UI_HEIGHT, Math.round(height))),
  };
}

export const DEFAULT_CACHE_TTL_MINUTES: CacheTTLMinutes = 5;
export const CACHE_TTL_OPTIONS: CacheTTLMinutes[] = [5, 10, 15, 30];
