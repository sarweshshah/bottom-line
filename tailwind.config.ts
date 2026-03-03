import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/ui/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        figma: {
          bg: "var(--figma-color-bg)",
          "bg-secondary": "var(--figma-color-bg-secondary)",
          "bg-tertiary": "var(--figma-color-bg-tertiary)",
          "bg-hover": "var(--figma-color-bg-hover)",
          "bg-selected": "var(--figma-color-bg-selected)",
          text: "var(--figma-color-text)",
          "text-secondary": "var(--figma-color-text-secondary)",
          "text-tertiary": "var(--figma-color-text-tertiary)",
          "text-disabled": "var(--figma-color-text-disabled)",
          border: "var(--figma-color-border)",
          "border-strong": "var(--figma-color-border-strong)",
          icon: "var(--figma-color-icon)",
          "icon-secondary": "var(--figma-color-icon-secondary)",
          "icon-tertiary": "var(--figma-color-icon-tertiary)",
        },
        status: {
          open: "var(--bl-status-open)",
          "open-bg": "var(--bl-status-open-bg)",
          "open-text": "var(--bl-status-open-text)",
          resolved: "var(--bl-status-done)",
          "resolved-bg": "var(--bl-status-done-bg)",
          "resolved-text": "var(--bl-status-done-text)",
        },
        accent: {
          DEFAULT: "var(--bl-accent)",
          hover: "var(--bl-accent-hover)",
          ring: "var(--bl-accent-ring)",
        },
        tag: {
          "revision-bg": "var(--bl-tag-revision-bg)",
          "revision-text": "var(--bl-tag-revision-text)",
          "approval-bg": "var(--bl-tag-approval-bg)",
          "approval-text": "var(--bl-tag-approval-text)",
          "blocker-bg": "var(--bl-tag-blocker-bg)",
          "blocker-text": "var(--bl-tag-blocker-text)",
          "question-bg": "var(--bl-tag-question-bg)",
          "question-text": "var(--bl-tag-question-text)",
        },
        ai: {
          bg: "var(--bl-ai-bg)",
        },
        elbow: "var(--bl-elbow)",
        danger: {
          DEFAULT: "var(--bl-red)",
          bg: "var(--bl-red-soft-bg)",
          border: "var(--bl-red-soft-border)",
        },
        warning: {
          DEFAULT: "var(--bl-yellow)",
          bg: "var(--bl-yellow-soft-bg)",
          border: "var(--bl-yellow-soft-border)",
        },
      },
      boxShadow: {
        "status-open": "0 0 6px var(--bl-status-open-glow)",
        "status-done": "0 0 6px var(--bl-status-done-glow)",
      },
      fontSize: {},
    },
  },
  plugins: [],
} satisfies Config;
