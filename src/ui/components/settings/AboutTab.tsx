import type { MouseEvent } from "react";
import { openExternalUrl } from "@ui/lib/openExternal";
import { PLUGIN_NAME, PLUGIN_VERSION } from "@shared/pluginMeta";
import pluginLogo from "@ui/assets/plugin-logo.png";

const HELP_URL = "https://github.com/sarweshshah/bottom-line#readme";
const CHANGELOG_URL =
  "https://github.com/sarweshshah/bottom-line/blob/main/CHANGELOG.md";

function openLink(url: string, event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  openExternalUrl(url);
}

export function AboutTab() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-8 text-center">
      <img
        src={pluginLogo}
        alt=""
        className="mb-6 h-24 w-24 shrink-0 rounded-2xl object-cover"
        aria-hidden
      />

      <div className="mb-4 space-y-1">
        <div className="text-lg font-semibold text-figma-text">
          {PLUGIN_NAME}
        </div>
        <div className="text-sm text-figma-text-secondary">
          v{PLUGIN_VERSION}
        </div>
      </div>

      <div className="mb-4 space-y-1">
        <div className="text-sm text-figma-text-secondary">
          Created by{" "}
          <span className="font-medium text-figma-text">Sarwesh Shah</span>
        </div>
        <div className="text-sm text-figma-text-secondary">
          ♥️ Made in India 2026
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <a
          href={HELP_URL}
          className="text-sm text-accent hover:underline"
          onClick={(e) => openLink(HELP_URL, e)}
        >
          Help
        </a>
        <span className="text-figma-border-strong">·</span>
        <a
          href={CHANGELOG_URL}
          className="text-sm text-accent hover:underline"
          onClick={(e) => openLink(CHANGELOG_URL, e)}
        >
          Change Log
        </a>
      </div>
    </div>
  );
}
