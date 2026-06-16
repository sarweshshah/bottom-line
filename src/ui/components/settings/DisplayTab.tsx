import { Monitor, Sun, Moon, Zap, ZapOff } from "lucide-react";
import { useAuthStore } from "@ui/store/authStore";
import type { MotionPreference, ThemePreference } from "@shared/types";
import {
  PILL_ACTIVE,
  PILL_INACTIVE,
  SettingsRowGroup,
  SettingsSection,
  SettingsSectionBody,
  SettingsSectionHeader,
  SettingsToggleRow,
} from "@ui/components/settings/settingsPrimitives";

const THEME_OPTIONS: {
  value: ThemePreference;
  label: string;
  icon: typeof Monitor;
}[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

const MOTION_OPTIONS: {
  value: MotionPreference;
  label: string;
  icon: typeof Monitor;
}[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "reduce", label: "Reduced", icon: ZapOff },
  { value: "allow", label: "Full", icon: Zap },
];

export function DisplayTab() {
  const {
    showThreadElbows,
    setShowThreadElbows,
    themePreference,
    setThemePreference,
    motionPreference,
    setMotionPreference,
  } = useAuthStore();

  return (
    <>
      <SettingsSection>
        <SettingsSectionHeader
          title="Theme"
          description="Override the appearance or follow Figma's theme."
        />
        <SettingsSectionBody>
          <div className="flex items-center gap-1.5">
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isActive = themePreference === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setThemePreference(opt.value)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-md text-xs font-medium transition-all duration-150 ${
                    isActive ? PILL_ACTIVE : PILL_INACTIVE
                  }`}
                >
                  <Icon size={12} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </SettingsSectionBody>
      </SettingsSection>

      <SettingsSection>
        <SettingsSectionHeader
          title="Motion"
          description="Control animations or follow your system accessibility setting."
        />
        <SettingsSectionBody>
          <div className="flex items-center gap-1.5">
            {MOTION_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isActive = motionPreference === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMotionPreference(opt.value)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-md text-xs font-medium transition-all duration-150 ${
                    isActive ? PILL_ACTIVE : PILL_INACTIVE
                  }`}
                >
                  <Icon size={12} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </SettingsSectionBody>
      </SettingsSection>

      <SettingsSection>
        <SettingsSectionHeader
          title="Thread view"
          description="Customize how comment threads are displayed."
        />
        <SettingsRowGroup>
          <SettingsToggleRow
            label="Show reply elbows"
            description="Show connector lines between parent and reply comments."
            checked={showThreadElbows}
            onChange={setShowThreadElbows}
          />
        </SettingsRowGroup>
      </SettingsSection>
    </>
  );
}
