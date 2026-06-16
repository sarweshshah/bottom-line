import { useState, useCallback } from "react";
import { useAuthStore } from "@ui/store/authStore";
import { useCommentsStore } from "@ui/store/commentsStore";
import { parseFileKey, isValidFigmaUrl } from "@ui/lib/parseFileUrl";
import { showToast } from "@ui/components/common/Toast";
import { FieldError } from "@ui/components/common/FieldError";
import {
  BTN_PRIMARY,
  CARD_CLASS,
  INPUT_CLASS,
  PILL_ACTIVE,
  PILL_INACTIVE,
  SettingsFieldGroup,
  SettingsRowGroup,
  SettingsSection,
  SettingsSectionBody,
  SettingsSectionHeader,
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
          <SettingsSectionBody className="!pb-0">
            <div className={`${CARD_CLASS} space-y-2`}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] text-figma-text-tertiary">
                  File key
                </span>
                <code className="text-[11px] text-figma-text font-medium bg-figma-bg px-1.5 py-0.5 rounded border border-figma-border truncate max-w-[60%]">
                  {fileKey}
                </code>
              </div>
              {fileUrl && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-figma-text-tertiary">
                    URL
                  </span>
                  <span className="text-[11px] text-figma-text-secondary truncate max-w-[60%]">
                    {fileUrl}
                  </span>
                </div>
              )}
              {fileName && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-figma-text-tertiary">
                    File name
                  </span>
                  <span className="text-[11px] text-figma-text-secondary truncate max-w-[60%]">
                    {fileName}
                  </span>
                </div>
              )}
            </div>
          </SettingsSectionBody>
        )}
        <div className={`px-4 pb-5 space-y-3 ${fileKey ? "pt-4" : ""}`}>
          {fileKey && (
            <div>
              <p className="text-[11px] font-medium text-figma-text">
                Update file
              </p>
              <p className="text-[10px] text-figma-text-tertiary mt-0.5 leading-snug">
                Paste a new URL to switch the connected Figma file.
              </p>
            </div>
          )}
          <SettingsFieldGroup>
            <input
              type="text"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://www.figma.com/design/abc123/..."
              className={INPUT_CLASS}
            />
            {urlError && <FieldError>{urlError}</FieldError>}
            <button type="button" onClick={handleSaveUrl} className={BTN_PRIMARY}>
              {fileKey ? "Update file" : "Connect file"}
            </button>
          </SettingsFieldGroup>
        </div>
      </SettingsSection>

      <SettingsSection>
        <SettingsSectionHeader
          title="Behavior"
          description="Customize how the plugin interacts with Figma."
        />
        <SettingsRowGroup>
          <SettingsToggleRow
            label="Auto-refresh interval"
            description="Refresh thread list automatically."
            trailing={
              <div className="inline-flex shrink-0 overflow-hidden rounded-md border border-figma-border">
                {TTL_OPTIONS.map((minutes, index) => {
                  const isActive = cacheTTLMinutes === minutes;
                  return (
                    <button
                      key={minutes}
                      type="button"
                      onClick={() => setCacheTTLMinutes(minutes)}
                      className={`text-xs font-medium tabular-nums px-2.5 py-1.5 transition-all duration-150 ${
                        index > 0 ? "border-l border-figma-border" : ""
                      } ${isActive ? PILL_ACTIVE : PILL_INACTIVE}`}
                    >
                      {minutes}m
                    </button>
                  );
                })}
              </div>
            }
          />
        </SettingsRowGroup>
      </SettingsSection>
    </>
  );
}
