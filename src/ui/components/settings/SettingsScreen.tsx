import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { AboutTab } from "@ui/components/settings/AboutTab";
import { AuthTab } from "@ui/components/settings/AuthTab";
import { DisplayTab } from "@ui/components/settings/DisplayTab";
import { GeneralTab } from "@ui/components/settings/GeneralTab";
import { SummaryTab } from "@ui/components/settings/SummaryTab";
import { AppScreenBody, AppScreenShell, ScreenHeader, TabBar } from "@ui/components/common/layout";
import { SettingsTabSegment } from "@ui/components/settings/settingsPrimitives";

type SettingsTab = "general" | "summary" | "auth" | "display" | "about";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "summary", label: "Summary" },
  { id: "auth", label: "Auth" },
  { id: "display", label: "Display" },
  { id: "about", label: "About" },
];

interface SettingsScreenProps {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  return (
    <AppScreenShell>
      <ScreenHeader
        onBack={onBack}
        backIcon={<ArrowLeft size={15} />}
        title="Settings"
        backTooltip="Back to dashboard"
      />

      <TabBar>
        {TABS.map((tab) => (
          <SettingsTabSegment
            key={tab.id}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            label={tab.label}
          />
        ))}
      </TabBar>

      <AppScreenBody>
        {activeTab === "general" && <GeneralTab />}
        {activeTab === "summary" && <SummaryTab />}
        {activeTab === "auth" && <AuthTab />}
        {activeTab === "display" && <DisplayTab />}
        {activeTab === "about" && <AboutTab />}
      </AppScreenBody>
    </AppScreenShell>
  );
}
