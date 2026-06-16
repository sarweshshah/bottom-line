import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { AboutTab } from "@ui/components/settings/AboutTab";
import { AuthTab } from "@ui/components/settings/AuthTab";
import { DisplayTab } from "@ui/components/settings/DisplayTab";
import { GeneralTab } from "@ui/components/settings/GeneralTab";
import { SummaryTab } from "@ui/components/settings/SummaryTab";

type SettingsTab = "general" | "summary" | "auth" | "display" | "about";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "summary", label: "Summary" },
  { id: "auth", label: "Auth" },
  { id: "display", label: "Display" },
  { id: "about", label: "About" },
];

interface SettingsTabSegmentProps {
  active: boolean;
  onClick: () => void;
  label: string;
}

function SettingsTabSegment({
  active,
  onClick,
  label,
}: SettingsTabSegmentProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center px-3 h-full font-mono text-[9px] uppercase tracking-widest leading-none shrink-0 transition-colors ${
        active
          ? "bg-accent-subtle text-accent font-semibold"
          : "text-figma-text-secondary font-medium hover:bg-figma-bg-hover hover:text-figma-text"
      }`}
    >
      {label}
    </button>
  );
}

interface SettingsScreenProps {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  return (
    <div className="flex flex-col h-full bg-figma-bg">
      <div className="flex items-stretch border-b border-figma-border">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center w-9 shrink-0 text-figma-icon-secondary hover:bg-figma-bg-hover transition-colors"
          data-tooltip="Back to dashboard"
          data-tooltip-align="left"
          data-tooltip-pos="bottom"
        >
          <ArrowLeft size={15} />
        </button>
        <div className="flex items-center flex-1 min-w-0 py-3 pl-2 pr-2.5">
          <span className="font-mono text-[9.5px] font-semibold uppercase tracking-widest text-figma-text leading-none">
            Settings
          </span>
        </div>
      </div>

      <div className="flex items-stretch h-9 overflow-x-auto bg-figma-bg border-b border-figma-border">
        <div className="flex items-stretch self-stretch min-w-0">
          {TABS.map((tab) => (
            <SettingsTabSegment
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              label={tab.label}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-figma-bg">
        {activeTab === "general" && <GeneralTab />}
        {activeTab === "summary" && <SummaryTab />}
        {activeTab === "auth" && <AuthTab />}
        {activeTab === "display" && <DisplayTab />}
        {activeTab === "about" && <AboutTab />}
      </div>
    </div>
  );
}
