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
| Custom | You configure (see below) | No |

- **Anthropic** — Uses the `claude-haiku-4-5` [model alias](https://docs.anthropic.com/en/docs/about-claude/models), which always targets the current Haiku 4.5 snapshot.
- **OpenAI** — `gpt-4o-mini` via the Chat Completions API.
- **Google** — Tries **Gemini 2.5 Flash** first. On temporary overload (HTTP 503), the plugin retries once, then falls back to **Gemini 1.5 Flash** if needed.
- **Custom** — OpenAI-compatible `POST …/v1/chat/completions` (you set base URL, API key, and model name). Image analysis is not enabled for this option in the UI.

API keys are stored locally in Figma’s client storage, trimmed when used, and sent only to the selected provider.

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

For OAuth-enabled release builds, set your production backend origin before build:

```bash
FIGMA_OAUTH_BACKEND_ORIGIN=https://figma-bottom-line-oauth-prod.onrender.com npm run build
```

Release builds remove `devAllowedDomains` from `dist/manifest.json`. The production OAuth broker is already in `allowedDomains`; set `FIGMA_OAUTH_BACKEND_ORIGIN` before `npm run build` only if you use a different HTTPS OAuth backend and need that origin added.

### Type Checking

```bash
npm run typecheck
```

### Tests

```bash
npm test
```

Watch mode: `npm run test:watch`

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
- **AI** — Choose provider, enter API key, toggle image analysis. For **Custom**, set the API base URL, key, and model name.
- **Behavior** — Auto-refresh interval, comment navigation reminders.
- **Auth** — Manage your Figma Personal Access Token.
- **Display** — Toggle thread reply elbows, theme adapts to Figma automatically.

### OAuth (Production)

Use an HTTPS OAuth backend in production and configure both frontend + server:

- UI env (`.env`):
  - `VITE_FIGMA_OAUTH_BACKEND_URL=https://figma-bottom-line-oauth-prod.onrender.com`
- OAuth server env (see `server/env.example`):
  - `FIGMA_CLIENT_ID=...`
  - `FIGMA_CLIENT_SECRET=...`
  - `OAUTH_REDIRECT_URI=https://figma-bottom-line-oauth-prod.onrender.com/api/figma/oauth/callback`
  - `CORS_ALLOW_ORIGINS=https://www.figma.com,https://www.figma-beta.com`

Do not expose `FIGMA_CLIENT_SECRET` to the UI or any `VITE_*` variable.

## License

Private — all rights reserved.
