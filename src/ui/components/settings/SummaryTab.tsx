import { useCallback, useState } from "react";
import { useCommentsStore } from "@ui/store/commentsStore";
import { clearAllCachedSummaries } from "@ui/ai/summarize";
import { showToast } from "@ui/components/common/Toast";
import { AiProviderConfigFields } from "@ui/components/ai/AiProviderConfigFields";
import {
  SettingsButton,
  SettingsSection,
  SettingsSectionBody,
  SettingsSectionHeader,
} from "@ui/components/settings/settingsPrimitives";

function ClearCacheSection() {
  const threads = useCommentsStore((s) => s.threads);
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  const handleClear = useCallback(async () => {
    setClearing(true);
    try {
      await clearAllCachedSummaries(threads);
      setCleared(true);
      showToast("Summary cache cleared", "success");
    } catch {
      showToast("Failed to clear cache", "error");
    } finally {
      setClearing(false);
    }
  }, [threads]);

  return (
    <SettingsSection>
      <SettingsSectionHeader
        title="Cache"
        description="Clear all cached summaries and tasks. They will be regenerated on next request."
      />
      <SettingsSectionBody>
        <SettingsButton
          variant="danger"
          onClick={handleClear}
          disabled={clearing || cleared}
        >
          {clearing
            ? "Clearing..."
            : cleared
              ? "Cleared"
              : "Clear all summaries"}
        </SettingsButton>
      </SettingsSectionBody>
    </SettingsSection>
  );
}

export function SummaryTab() {
  return (
    <>
      <SettingsSection>
        <SettingsSectionHeader
          title="AI provider"
          description="Choose how thread summaries and tasks are generated."
        />
        <SettingsSectionBody>
          <AiProviderConfigFields mode="full" />
        </SettingsSectionBody>
      </SettingsSection>

      <ClearCacheSection />
    </>
  );
}
