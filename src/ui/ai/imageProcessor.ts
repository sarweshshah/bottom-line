import type { CommentThread } from "@shared/types";

export interface ProcessedImage {
  base64: string;
  mimeType: string;
}

const MAX_DIMENSION = 1024;
const MAX_IMAGES = 5;

const IMAGE_URL_REGEX = /https?:\/\/[^\s"')]+\.(?:png|jpg|jpeg|gif|webp)(?:\?[^\s"')]*)?/gi;

export function extractImageUrls(thread: CommentThread): string[] {
  const urls: string[] = [];

  function scanMessage(message: string) {
    const matches = message.match(IMAGE_URL_REGEX);
    if (matches) urls.push(...matches);
  }

  scanMessage(thread.message);
  for (const reply of thread.replies) {
    scanMessage(reply.message);
  }

  if (urls.length > MAX_IMAGES) {
    return urls.slice(-MAX_IMAGES);
  }
  return urls;
}

async function fetchImage(url: string): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch image: ${res.status}`);
  }
  return res.blob();
}

async function resizeImage(blob: Blob): Promise<{ canvas: OffscreenCanvas; mimeType: string }> {
  const bitmap = await createImageBitmap(blob);
  const { width, height } = bitmap;

  let targetWidth = width;
  let targetHeight = height;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(width, height);
    targetWidth = Math.round(width * scale);
    targetHeight = Math.round(height * scale);
  }

  const canvas = new OffscreenCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  bitmap.close();

  return { canvas, mimeType: blob.type || "image/png" };
}

async function canvasToBase64(canvas: OffscreenCanvas, mimeType: string): Promise<string> {
  const outputType = mimeType === "image/png" ? "image/png" : "image/jpeg";
  const blob = await canvas.convertToBlob({ type: outputType, quality: 0.85 });
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function processThreadImages(
  thread: CommentThread,
): Promise<{ images: ProcessedImage[]; skippedCount: number }> {
  const urls = extractImageUrls(thread);
  if (urls.length === 0) {
    return { images: [], skippedCount: 0 };
  }

  const totalFound = urls.length;
  const results: ProcessedImage[] = [];

  for (const url of urls) {
    try {
      const blob = await fetchImage(url);
      const { canvas, mimeType } = await resizeImage(blob);
      const base64 = await canvasToBase64(canvas, mimeType);
      const outputMime = mimeType === "image/png" ? "image/png" : "image/jpeg";
      results.push({ base64, mimeType: outputMime });
    } catch {
      // Skip images that fail to load/process
    }
  }

  return {
    images: results,
    skippedCount: Math.max(0, totalFound - MAX_IMAGES),
  };
}
