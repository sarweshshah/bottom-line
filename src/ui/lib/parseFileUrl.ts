const FILE_URL_PATTERN = /figma\.com\/(?:file|design|board)\/([a-zA-Z0-9]+)/;

export function parseFileKey(url: string): string | null {
  const match = url.match(FILE_URL_PATTERN);
  return match ? match[1] : null;
}

export function isValidFigmaUrl(url: string): boolean {
  return FILE_URL_PATTERN.test(url);
}
