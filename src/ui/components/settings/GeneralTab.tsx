import { useState, useCallback } from "react";
import { useAuthStore } from "@ui/store/authStore";
import { useCommentsStore } from "@ui/store/commentsStore";
import { parseFileKey, isValidFigmaUrl } from "@ui/lib/parseFileUrl";
import { showToast } from "@ui/components/common/Toast";
import { FieldError } from "@ui/components/common/FieldError";
import {
  SettingsFileInfoCard,
  SettingsJoinedField,
  SettingsSection,
  SettingsSectionBody,
  SettingsSectionHeader,
  SettingsSegmentedControl,
  SettingsSubsectionHeader,
  SettingsToggleRow,
  TTL_OPTIONS,
} from "@ui/components/settings/settingsPrimitives";

export function GeneralTab() {
  const { fileUrl, fileKey, fileName, setFileInfo } = useAuthStore();
  const { refreshComments, cacheTTLMinutes, setCacheTTLMinutes } =
    useCommentsStore();

  const [url, setUrl] = useState(fileUrl ?? "");
  const [urlError, setUrlError] = useState<string | null>(null);

  const handleUrlChange = useCallback((value: string) => {
    setUrl(value);
    setUrlError(null);
  }, []);

  const handleSaveUrl = useCallback(async () => {
    if (!url.trim()) {
      setUrlError("Please enter a Figma file URL.");
      return;
    }
    if (!isValidFigmaUrl(url)) {
      setUrlError("Please enter a valid Figma file URL.");
      return;
    }
    const key = parseFileKey(url);
    if (!key) {
      setUrlError("Could not extract file key from URL.");
      return;
    }
    await setFileInfo(url, key);
    refreshComments();
    showToast("File updated successfully", "success");
  }, [url, setFileInfo, refreshComments]);

  return (
    <>
      <SettingsSection>
        <SettingsSectionHeader
          title={fileKey ? "Connected file" : "Figma file"}
          description={
            fileKey
              ? "The Figma file currently linked to this plugin."
              : "The Figma file to analyze comments for."
          }
        />
        {fileKey && (
          <SettingsSectionBody flushBottom>
            <SettingsFileInfoCard
              fileKey={fileKey}
              fileUrl={fileUrl}
              fileName={fileName}
            />
          </SettingsSectionBody>
        )}
        <SettingsSectionBody nested={!!fileKey}>
          {fileKey && (
            <SettingsSubsectionHeader
              label="Update file"
              description="Paste a new URL to switch the connected Figma file."
            />
          )}
          <SettingsJoinedField
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://www.figma.com/design/abc123/..."
            actionLabel="Save"
            onAction={handleSaveUrl}
            error={urlError ? <FieldError>{urlError}</FieldError> : undefined}
          />
        </SettingsSectionBody>
      </SettingsSection>

      <SettingsSection>
        <SettingsSectionHeader
          title="Behavior"
          description="Customize how the plugin interacts with Figma."
        />
        <SettingsToggleRow
          label="Auto-refresh interval"
          description="Refresh thread list automatically."
          trailing={
            <SettingsSegmentedControl
              variant="inline"
              value={cacheTTLMinutes}
              onChange={setCacheTTLMinutes}
              options={TTL_OPTIONS.map((minutes) => ({
                value: minutes,
                label: `${minutes}m`,
              }))}
            />
          }
        />
      </SettingsSection>
    </>
  );
}
