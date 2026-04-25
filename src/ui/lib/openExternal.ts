import type { OpenExternalMessage } from "@shared/messages";

export function openExternalUrl(url: string): void {
  const msg: OpenExternalMessage = { type: "OPEN_EXTERNAL", url };
  parent.postMessage({ pluginMessage: msg }, "*");
}
