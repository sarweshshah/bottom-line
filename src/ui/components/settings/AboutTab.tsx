import type { MouseEvent } from "react";
import {
  AboutHero,
  AboutLinkRow,
  AboutTabLayout,
} from "@ui/components/onboarding/onboardingPrimitives";
import { openExternalUrl } from "@ui/lib/openExternal";
import { PLUGIN_NAME, PLUGIN_VERSION } from "@shared/pluginMeta";
import pluginLogo from "@ui/assets/plugin-logo.png";

const HELP_URL = "https://github.com/sarweshshah/bottom-line#readme";
const CHANGELOG_URL =
  "https://github.com/sarweshshah/bottom-line/blob/main/CHANGELOG.md";
const COMMUNITY_URL =
  "https://www.figma.com/community/plugin/1644586572358642803/bottom-line";

function openLink(url: string, event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  openExternalUrl(url);
}

export function AboutTab() {
  return (
    <AboutTabLayout>
      <AboutHero
        logoSrc={pluginLogo}
        name={PLUGIN_NAME}
        version={PLUGIN_VERSION}
        creator="Sarwesh Shah"
        tagline="Made in India 2026"
      />
      <AboutLinkRow
        links={[
          {
            href: HELP_URL,
            label: "Help",
            onClick: (e) => openLink(HELP_URL, e),
          },
          {
            href: CHANGELOG_URL,
            label: "Changelog",
            onClick: (e) => openLink(CHANGELOG_URL, e),
          },
          {
            href: COMMUNITY_URL,
            label: "Feedback",
            onClick: (e) => openLink(COMMUNITY_URL, e),
          },
        ]}
      />
    </AboutTabLayout>
  );
}
