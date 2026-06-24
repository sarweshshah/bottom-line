import { useState, useCallback } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  LogOut,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@ui/store/authStore";
import {
  isFigmaOAuthConfigured,
  beginOAuthSession,
  pollOAuthUntilComplete,
} from "@ui/lib/figmaOAuth";
import { openExternalUrl } from "@ui/lib/openExternal";
import {
  FIGMA_PAT_HELP_URL,
  FIGMA_PAT_REQUIRED_SCOPES,
} from "@shared/figmaPat";
import { showToast } from "@ui/components/common/Toast";
import { FieldError } from "@ui/components/common/FieldError";
import { UserAvatar } from "@ui/components/common/UserAvatar";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  CARD_CLASS,
  INPUT_CLASS,
  SettingsFieldGroup,
  SettingsSection,
  SettingsSectionBody,
  SettingsSectionHeader,
} from "@ui/components/settings/settingsPrimitives";

export function AuthTab() {
  const {
    pat,
    figmaAccessToken,
    authMethod,
    user,
    validateAndSetToken,
    applyOAuthSession,
    isValidating,
    validationError,
    logout,
  } = useAuthStore();

  const oauthAvailable = isFigmaOAuthConfigured();
  const [oauthBusy, setOauthBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newPat, setNewPat] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [showPatAdvanced, setShowPatAdvanced] = useState(
    authMethod !== "oauth",
  );

  const maskedCredential =
    authMethod === "oauth" && figmaAccessToken
      ? `${figmaAccessToken.slice(0, 8)}${"•".repeat(12)}`
      : pat
        ? `${pat.slice(0, 8)}${"•".repeat(20)}`
        : "";

  const displaySecret =
    authMethod === "oauth" ? figmaAccessToken || "" : pat || "";

  const handleSaveToken = useCallback(async () => {
    if (!newPat.trim()) return;
    try {
      await validateAndSetToken(newPat.trim());
      setEditing(false);
      setNewPat("");
      setShowPatAdvanced(true);
      showToast("Token updated successfully", "success");
    } catch {
      // validation error is surfaced by the store
    }
  }, [newPat, validateAndSetToken]);

  const handleSignInWithFigma = useCallback(async () => {
    useAuthStore.setState({ validationError: null });
    setOauthBusy(true);
    try {
      const { sessionId, authorizeUrl } = await beginOAuthSession();
      openExternalUrl(authorizeUrl);
      const result = await pollOAuthUntilComplete(sessionId);
      await applyOAuthSession({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
        expires_in: result.expires_in,
      });
      showToast("Figma account reconnected", "success");
    } catch (e) {
      useAuthStore.setState({
        validationError:
          e instanceof Error ? e.message : "Sign in with Figma failed.",
      });
    } finally {
      setOauthBusy(false);
    }
  }, [applyOAuthSession]);

  const connectionSubtitle =
    authMethod === "oauth"
      ? "Signed in with Figma"
      : "Using personal access token";

  return (
    <>
      {user && (
        <SettingsSection>
          <SettingsSectionHeader
            title="Account"
            description={connectionSubtitle}
          />
          <SettingsSectionBody>
            <div className={CARD_CLASS}>
              <div className="flex items-center gap-3">
                <UserAvatar
                  handle={user.handle}
                  imgUrl={user.img_url}
                  colorKey={user.id}
                  size={36}
                  className="border border-figma-border"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-figma-text truncate">
                    {user.handle}
                  </p>
                  <p className="text-[10px] text-figma-text-tertiary mt-0.5 truncate">
                    {authMethod === "oauth" ? "OAuth" : "Personal access token"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="p-1.5 rounded-md text-figma-icon-secondary hover:bg-danger-bg hover:text-danger transition-colors shrink-0"
                  data-tooltip="Log out"
                  data-tooltip-align="right"
                  data-tooltip-pos="bottom"
                >
                  <LogOut size={14} />
                </button>
              </div>
            </div>

            {authMethod === "oauth" && oauthAvailable && (
              <button
                type="button"
                disabled={oauthBusy || isValidating}
                onClick={() => void handleSignInWithFigma()}
                className={`w-full ${BTN_SECONDARY}`}
              >
                {oauthBusy ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 size={12} className="animate-spin" />
                    Waiting for browser…
                  </span>
                ) : (
                  "Sign in again with Figma"
                )}
              </button>
            )}
          </SettingsSectionBody>
        </SettingsSection>
      )}

      <SettingsSection>
        <SettingsSectionHeader
          title="Access token"
          description={
            authMethod === "oauth"
              ? "OAuth tokens are stored only in this plugin. You can re-authenticate above or switch to a personal access token."
              : "Your token is stored locally in the plugin and never shared."
          }
          helpUrl={FIGMA_PAT_HELP_URL}
        />

        <div className="px-4 pb-5 space-y-3">
          {authMethod === "oauth" && (
            <button
              type="button"
              onClick={() => setShowPatAdvanced((v) => !v)}
              className="flex items-center gap-1 text-[11px] text-accent hover:text-accent-text-hover hover:underline"
            >
              {showPatAdvanced ? (
                <ChevronDown size={12} />
              ) : (
                <ChevronRight size={12} />
              )}
              Use a personal access token instead
            </button>
          )}

          {(authMethod === "pat" ||
            (authMethod === "oauth" && showPatAdvanced)) && (
            <>
              <div className="text-[11px] text-figma-text-secondary">
                <p className="leading-snug mb-0.5">
                  When generating a token, enable these permissions:
                </p>
                <ul className="list-disc list-inside space-y-0 leading-snug">
                  {FIGMA_PAT_REQUIRED_SCOPES.map((scope) => (
                    <li key={scope}>
                      <code className="font-mono text-[10px]">{scope}</code>
                    </li>
                  ))}
                </ul>
              </div>

              {!editing ? (
                <SettingsFieldGroup>
                  <div className="flex items-center gap-2 bg-figma-bg border border-figma-border rounded-md px-2.5 py-1.5">
                    <code className="text-xs font-medium text-figma-text-secondary flex-1 truncate min-w-0">
                      {showToken ? displaySecret : maskedCredential || "—"}
                    </code>
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="p-1 rounded-md text-figma-icon-secondary hover:bg-figma-bg-secondary hover:text-figma-icon shrink-0 transition-colors"
                      data-tooltip={showToken ? "Hide token" : "Show token"}
                      data-tooltip-align="right"
                      data-tooltip-pos="bottom"
                      disabled={!displaySecret}
                    >
                      {showToken ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(true);
                      setNewPat("");
                    }}
                    className={BTN_SECONDARY}
                  >
                    {authMethod === "oauth" ? "Save" : "Change token"}
                  </button>
                </SettingsFieldGroup>
              ) : (
                <SettingsFieldGroup>
                  <input
                    type="password"
                    value={newPat}
                    onChange={(e) => setNewPat(e.target.value)}
                    placeholder="figd_xxxxxxxxxxxxxxxx"
                    className={INPUT_CLASS}
                    autoFocus
                  />
                  {isValidating && (
                    <div className="flex items-center gap-1.5 text-[11px] text-figma-text-tertiary">
                      <Loader2 size={12} className="animate-spin" />
                      Validating token...
                    </div>
                  )}
                  {validationError && (
                    <FieldError>{validationError}</FieldError>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleSaveToken()}
                      disabled={!newPat.trim() || isValidating}
                      className={BTN_PRIMARY}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setNewPat("");
                      }}
                      className={BTN_SECONDARY}
                    >
                      Cancel
                    </button>
                  </div>
                </SettingsFieldGroup>
              )}
            </>
          )}
        </div>
      </SettingsSection>
    </>
  );
}
