const FILE_URL_PATTERN = /figma\.com\/(?:file|design|board)\/([a-zA-Z0-9]+)/;

export function parseFileKey(url: string): string | null {
  const match = url.match(FILE_URL_PATTERN);
  return match ? match[1] : null;
}

export function isValidFigmaUrl(url: string): boolean {
  return FILE_URL_PATTERN.test(url);
}

export type FigmaFileUrlValidation =
  | { ok: true; key: string }
  | { ok: false; error: string };

export function validateFigmaFileUrl(url: string): FigmaFileUrlValidation {
  if (!url.trim()) {
    return { ok: false, error: "Please enter a Figma file URL." };
  }
  if (!isValidFigmaUrl(url)) {
    return { ok: false, error: "Please enter a valid Figma file URL." };
  }
  const key = parseFileKey(url);
  if (!key) {
    return { ok: false, error: "Could not extract file key from URL." };
  }
  return { ok: true, key };
}
