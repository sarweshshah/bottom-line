import { useState, useCallback } from "react";
import { useAuthStore } from "@ui/store/authStore";
import {
  isFigmaOAuthConfigured,
  beginOAuthSession,
  pollOAuthUntilComplete,
} from "@ui/lib/figmaOAuth";
import { openExternalUrl } from "@ui/lib/openExternal";
import { FIGMA_PAT_HELP_URL } from "@shared/figmaPat";
import { FieldError } from "@ui/components/common/FieldError";
import {
  AccountCard,
  ExpandableDisclosure,
  OAuthSignInButton,
  PatScopesList,
  ValidatingIndicator,
} from "@ui/components/common/authUi";
import {
  SettingsConfirmField,
  SettingsFieldGroup,
  SettingsMaskedField,
  SettingsSection,
  SettingsSectionBody,
  SettingsSectionHeader,
} from "@ui/components/settings/settingsPrimitives";
import { showToast } from "@ui/components/common/Toast";

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

  const tokenTypeLabel =
    authMethod === "oauth" ? "OAuth" : "Personal access token";

  return (
    <>
      {user && (
        <SettingsSection>
          <SettingsSectionHeader
            title="Account"
            description={connectionSubtitle}
          />
          <SettingsSectionBody>
            <AccountCard
              handle={user.handle}
              imgUrl={user.img_url}
              colorKey={user.id}
              subtitle={tokenTypeLabel}
              onLogout={() => void logout()}
              footer={
                authMethod === "oauth" && oauthAvailable ? (
                  <OAuthSignInButton
                    busy={oauthBusy}
                    disabled={isValidating}
                    onClick={() => void handleSignInWithFigma()}
                    label="Sign in again with Figma"
                    controlSize="sm"
                    onSurface
                    stacked
                  />
                ) : undefined
              }
            />
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

        <SettingsSectionBody>
          {authMethod === "oauth" && (
            <ExpandableDisclosure
              open={showPatAdvanced}
              onToggle={() => setShowPatAdvanced((v) => !v)}
            >
              Use a personal access token instead
            </ExpandableDisclosure>
          )}

          {(authMethod === "pat" ||
            (authMethod === "oauth" && showPatAdvanced)) && (
            <>
              <PatScopesList />

              {!editing ? (
                <SettingsFieldGroup>
                  <SettingsMaskedField
                    revealed={showToken}
                    onToggleReveal={() => setShowToken(!showToken)}
                    displayValue={displaySecret}
                    maskedValue={maskedCredential || "—"}
                    onAction={() => {
                      setEditing(true);
                      setNewPat("");
                    }}
                    actionLabel={
                      authMethod === "oauth" ? "Save" : "Change token"
                    }
                    revealDisabled={!displaySecret}
                    revealTooltip={{ show: "Show token", hide: "Hide token" }}
                  />
                </SettingsFieldGroup>
              ) : (
                <SettingsFieldGroup>
                  <SettingsConfirmField
                    value={newPat}
                    onChange={(e) => setNewPat(e.target.value)}
                    onConfirm={() => void handleSaveToken()}
                    onCancel={() => {
                      setEditing(false);
                      setNewPat("");
                    }}
                    confirmDisabled={!newPat.trim() || isValidating}
                    placeholder="figd_xxxxxxxxxxxxxxxx"
                    autoFocus
                  />
                  {isValidating && <ValidatingIndicator />}
                  {validationError && (
                    <FieldError>{validationError}</FieldError>
                  )}
                </SettingsFieldGroup>
              )}
            </>
          )}
        </SettingsSectionBody>
      </SettingsSection>
    </>
  );
}
