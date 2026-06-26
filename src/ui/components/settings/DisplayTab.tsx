import { Monitor, Sun, Moon, Zap, ZapOff } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { useAuthStore } from "@ui/store/authStore";
import type { MotionPreference, ThemePreference } from "@shared/types";
import {
  SettingsSection,
  SettingsSectionBody,
  SettingsSectionHeader,
  SettingsSegmentedControl,
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
  } = useAuthStore(
    useShallow((s) => ({
      showThreadElbows: s.showThreadElbows,
      setShowThreadElbows: s.setShowThreadElbows,
      themePreference: s.themePreference,
      setThemePreference: s.setThemePreference,
      motionPreference: s.motionPreference,
      setMotionPreference: s.setMotionPreference,
    })),
  );

  return (
    <>
      <SettingsSection>
        <SettingsSectionHeader
          title="Theme"
          description="Override the appearance or follow Figma's theme."
        />
        <SettingsSectionBody>
          <SettingsSegmentedControl
            value={themePreference}
            onChange={setThemePreference}
            options={THEME_OPTIONS}
          />
        </SettingsSectionBody>
      </SettingsSection>

      <SettingsSection>
        <SettingsSectionHeader
          title="Motion"
          description="Control animations or follow your system accessibility setting."
        />
        <SettingsSectionBody>
          <SettingsSegmentedControl
            value={motionPreference}
            onChange={setMotionPreference}
            options={MOTION_OPTIONS}
          />
        </SettingsSectionBody>
      </SettingsSection>

      <SettingsSection>
        <SettingsSectionHeader
          title="Thread view"
          description="Customize how comment threads are displayed."
        />
        <SettingsToggleRow
          label="Show reply elbows"
          description="Show connector lines between parent and reply comments."
          checked={showThreadElbows}
          onChange={setShowThreadElbows}
        />
      </SettingsSection>
    </>
  );
}
