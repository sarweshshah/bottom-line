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
          "icon": "var(--figma-color-icon)",
          "icon-secondary": "var(--figma-color-icon-secondary)",
          "icon-tertiary": "var(--figma-color-icon-tertiary)",
        },
        status: {
          open: "#3b82f6",
          resolved: "#22c55e",
        },
      },
      fontSize: {
        "2xs": "0.6875rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
