export const MIN_UI_WIDTH = 420;
export const MAX_UI_WIDTH = 540;
export const MIN_UI_HEIGHT = 640;
export const MAX_UI_HEIGHT = 1200;
export const DEFAULT_UI_WIDTH = 420;
export const DEFAULT_UI_HEIGHT = MAX_UI_HEIGHT;

export function clampUiSize(width: number, height: number) {
  return {
    width: Math.min(MAX_UI_WIDTH, Math.max(MIN_UI_WIDTH, Math.round(width))),
    height: Math.min(MAX_UI_HEIGHT, Math.max(MIN_UI_HEIGHT, Math.round(height))),
  };
}
