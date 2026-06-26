import { useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAuthStore } from "@ui/store/authStore";
import { useCommentsStore } from "@ui/store/commentsStore";
import { useFigmaFileUrlInput } from "@ui/hooks/useFigmaFileUrlInput";
import { validateFigmaFileUrl } from "@ui/lib/parseFileUrl";
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
} from "@ui/components/settings/settingsPrimitives";
import { CACHE_TTL_OPTIONS } from "@shared/constants";

export function GeneralTab() {
  const { fileUrl, fileKey, fileName, setFileInfo } = useAuthStore(
    useShallow((s) => ({
      fileUrl: s.fileUrl,
      fileKey: s.fileKey,
      fileName: s.fileName,
      setFileInfo: s.setFileInfo,
    })),
  );
  const { refreshComments, cacheTTLMinutes, setCacheTTLMinutes } =
    useCommentsStore(
      useShallow((s) => ({
        refreshComments: s.refreshComments,
        cacheTTLMinutes: s.cacheTTLMinutes,
        setCacheTTLMinutes: s.setCacheTTLMinutes,
      })),
    );

  const { fileUrl: url, urlError, handleUrlChange, validateForSave } =
    useFigmaFileUrlInput(fileUrl ?? "");

  const handleSaveUrl = useCallback(async () => {
    if (!validateForSave()) return;
    const result = validateFigmaFileUrl(url);
    if (!result.ok) return;
    await setFileInfo(url, result.key);
    refreshComments();
    showToast("File updated successfully", "success");
  }, [url, validateForSave, setFileInfo, refreshComments]);

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
            onAction={() => void handleSaveUrl()}
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
              options={CACHE_TTL_OPTIONS.map((minutes) => ({
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
