# Bottom Line

AI-powered comment intelligence for design teams — a Figma plugin that surfaces, summarizes, and extracts actionable tasks from your file's comment threads.

## Features

- **Comment Dashboard** — Browse all comment threads in a Figma file with status filtering (open / resolved), sorting, and search.
- **AI Summaries** — Summarize long comment threads into concise digests using your choice of AI provider.
- **Task Extraction** — Automatically detect action items (revisions, approvals, blockers, questions) from thread conversations and track them in a unified task view.
- **Image Analysis** — Optionally include thread images in AI context for richer, design-aware summaries (vision-capable providers only).
- **Navigate to Comment** — Jump directly to a comment's location on the Figma canvas.
- **Page Scoping** — Filter threads to the current page or view the full file.
- **Auto-Refresh** — Configurable polling interval to keep threads up to date.
- **Resizable UI** — Drag edges to resize the plugin window within Figma.

## Supported AI Providers

| Provider | Model | Vision |
|----------|-------|--------|
| Anthropic | Claude Haiku 4.5 | Yes |
| OpenAI | GPT-4o mini | Yes |
| Google | Gemini 2.5 Flash | Yes |
| Custom | Any OpenAI-compatible endpoint | No |

API keys are stored locally in Figma's client storage and sent only to the selected provider.

## Tech Stack

- **UI** — React 19, TypeScript, Tailwind CSS, Zustand
- **Plugin sandbox** — Figma Plugin API, built with esbuild
- **Build** — Vite (UI) + esbuild (sandbox), bundled to a single HTML file via `vite-plugin-singlefile`

## Getting Started

### Prerequisites

- Node.js 18+
- A [Figma Personal Access Token](https://www.figma.com/settings) with file read permissions

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

This starts both the UI (Vite watch) and sandbox (esbuild watch) in parallel. Load the plugin in Figma via **Plugins → Development → Import plugin from manifest…** and select `manifest.json`.

### Production Build

```bash
npm run build
```

Outputs `dist/index.html` (UI) and `dist/code.js` (sandbox).

### Type Checking

```bash
npm run typecheck
```

## Project Structure

```
src/
├── plugin/          # Figma sandbox code (runs in main thread)
│   └── code.ts
├── shared/          # Types, messages, and constants shared between UI and sandbox
│   ├── types.ts
│   ├── messages.ts
│   └── constants.ts
└── ui/              # React UI (runs in iframe)
    ├── ai/          # AI provider clients, prompts, image processing
    ├── api/         # Figma REST API client
    ├── components/  # React components (dashboard, settings, tasks, etc.)
    ├── lib/         # Utilities (storage, URL parsing, rate limiting, etc.)
    ├── store/       # Zustand stores (auth, comments, AI, filters)
    └── main.tsx     # Entry point
```

## Configuration

All settings are accessible from the plugin's **Settings** screen:

- **General** — Set the Figma file URL to analyze.
- **AI** — Choose provider, enter API key, toggle image analysis.
- **Behavior** — Auto-refresh interval, comment navigation reminders.
- **Auth** — Manage your Figma Personal Access Token.
- **Display** — Toggle thread reply elbows, theme adapts to Figma automatically.

## License

Private — all rights reserved.
