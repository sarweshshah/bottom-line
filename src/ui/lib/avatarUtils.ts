/** Non-white avatar colors from the brand palette image (tokens/primitives.css). */
export const AVATAR_PALETTE = [
  "var(--bl-palette-image-slate)",
  "var(--bl-palette-image-ink)",
  "var(--bl-palette-image-lavender)",
  "var(--bl-palette-image-navy)",
] as const;

export type AvatarColor = (typeof AVATAR_PALETTE)[number];

/** Minimum perceptual distance between colors on adjacent avatars. */
const MIN_ADJACENT_COLOR_DISTANCE = 55;

/**
 * Pairwise distances between --bl-palette-image-* swatches.
 * Keep in sync with tokens/primitives.css when palette image colors change.
 */
const PALETTE_DISTANCE_MATRIX: readonly (readonly number[])[] = [
  [0, 52, 73, 43],
  [52, 0, 120, 18],
  [73, 120, 0, 112],
  [43, 18, 112, 0],
];

export function getFirstInitial(name: string): string {
  const cleaned = name.replace(/^@/, "").trim();
  if (!cleaned) return "?";

  const firstName = cleaned.split(/[\s._-]+/)[0];
  return (firstName[0] ?? "?").toUpperCase();
}

function hashKey(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function paletteColorDistance(a: number, b: number): number {
  return PALETTE_DISTANCE_MATRIX[a][b];
}

export function colorDistance(a: AvatarColor, b: AvatarColor): number {
  const indexA = AVATAR_PALETTE.indexOf(a);
  const indexB = AVATAR_PALETTE.indexOf(b);
  if (indexA === -1 || indexB === -1) return 0;
  return paletteColorDistance(indexA, indexB);
}

function pickColorIndexForSlot(
  key: string,
  previousIndex: number | null,
): number {
  const preferred = hashKey(key) % AVATAR_PALETTE.length;

  if (
    previousIndex === null ||
    paletteColorDistance(preferred, previousIndex) >=
      MIN_ADJACENT_COLOR_DISTANCE
  ) {
    return preferred;
  }

  const ranked = AVATAR_PALETTE.map((_, index) => index).sort((a, b) => {
    const distA =
      previousIndex === null ? 0 : paletteColorDistance(a, previousIndex);
    const distB =
      previousIndex === null ? 0 : paletteColorDistance(b, previousIndex);
    if (distB !== distA) return distB - distA;
    if (a === preferred) return -1;
    if (b === preferred) return 1;
    return 0;
  });

  return ranked[0];
}

export function getAvatarColor(key: string): AvatarColor {
  return AVATAR_PALETTE[hashKey(key) % AVATAR_PALETTE.length];
}

/** Assign palette colors so adjacent avatars stay visually distinct. */
export function assignAdjacentAvatarColors(
  keys: string[],
): Map<string, AvatarColor> {
  const colors = new Map<string, AvatarColor>();
  let previousIndex: number | null = null;

  for (const key of keys) {
    const index = pickColorIndexForSlot(key, previousIndex);
    colors.set(key, AVATAR_PALETTE[index]);
    previousIndex = index;
  }

  return colors;
}

export function getAvatarFontSize(size: number): number {
  return Math.max(9, Math.floor(size * 0.54));
}

export function areAdjacentAvatarColorsDistinct(
  colors: AvatarColor[],
): boolean {
  for (let i = 1; i < colors.length; i++) {
    if (colorDistance(colors[i - 1], colors[i]) < MIN_ADJACENT_COLOR_DISTANCE) {
      return false;
    }
  }
  return true;
}
