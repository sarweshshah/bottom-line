import type { LucideIcon } from "lucide-react";
import { CheckSquare, MessageSquare, Sparkles } from "lucide-react";

export const ONBOARDING_CONFIG_STEPS = 3;

export type OnboardingFeature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export const ONBOARDING_FEATURES: OnboardingFeature[] = [
  {
    icon: MessageSquare,
    title: "Comment Dashboard",
    description:
      "Filter threads by Open, Read, or Done across the page or full file",
  },
  {
    icon: Sparkles,
    title: "AI Summaries",
    description:
      "Summarize threads on demand or in bulk with your chosen provider",
  },
  {
    icon: CheckSquare,
    title: "Tasks Tab",
    description: "Extract and track action items from discussions in one place",
  },
];
