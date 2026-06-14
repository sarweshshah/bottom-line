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
    <div className="empty-state-enter flex min-h-full flex-col items-center justify-center px-6 py-8 text-center">
      <div className="relative mb-4 h-20 w-20 shrink-0 overflow-hidden rounded-2xl empty-state-halo">
        <img
          src={pluginLogo}
          alt=""
          className="h-full w-full object-cover"
          aria-hidden
        />
      </div>

      <div className="mb-3 space-y-1">
        <h3 className="text-sm font-semibold text-figma-text">{PLUGIN_NAME}</h3>
        <span className="inline-block font-mono text-[9px] font-bold uppercase tracking-widest text-figma-text-tertiary">
          v{PLUGIN_VERSION}
        </span>
      </div>

      <div className="mb-4 space-y-0.5">
        <p className="text-[11px] text-figma-text-secondary">
          Created by{" "}
          <span className="font-medium text-figma-text">Sarwesh Shah</span>
        </p>
        <p className="text-[11px] text-figma-text-tertiary">
          Made in India 2026
        </p>
      </div>

      <div className="flex items-center justify-center gap-2">
        <a
          href={HELP_URL}
          className="text-[11px] text-accent hover:underline"
          onClick={(e) => openLink(HELP_URL, e)}
        >
          Help
        </a>
        <span className="text-figma-border-strong">·</span>
        <a
          href={CHANGELOG_URL}
          className="text-[11px] text-accent hover:underline"
          onClick={(e) => openLink(CHANGELOG_URL, e)}
        >
          Changelog
        </a>
      </div>
    </div>
  );
}
