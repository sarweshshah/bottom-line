import { useState, useCallback } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAuthStore } from "@ui/store/authStore";
import { isFigmaOAuthConfigured } from "@ui/lib/figmaOAuth";
import { useFigmaOAuthSignIn } from "@ui/hooks/useFigmaOAuthSignIn";
import {
  getAuthConnectionSubtitle,
  getAuthTokenTypeLabel,
} from "@shared/figmaAuth";
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
    isValidating,
    validationError,
    logout,
  } = useAuthStore(
    useShallow((s) => ({
      pat: s.pat,
      figmaAccessToken: s.figmaAccessToken,
      authMethod: s.authMethod,
      user: s.user,
      validateAndSetToken: s.validateAndSetToken,
      isValidating: s.isValidating,
      validationError: s.validationError,
      logout: s.logout,
    })),
  );

  const oauthAvailable = isFigmaOAuthConfigured();
  const { oauthBusy, signInWithFigma } = useFigmaOAuthSignIn(
    undefined,
    "Figma account reconnected",
  );
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

  const connectionSubtitle = getAuthConnectionSubtitle(authMethod);
  const tokenTypeLabel = getAuthTokenTypeLabel(authMethod);

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
                    onClick={() => void signInWithFigma()}
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
