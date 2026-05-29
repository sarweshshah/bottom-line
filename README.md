# Bottom Line

AI-powered comment intelligence for design teams — a Figma plugin that surfaces, summarizes, and extracts actionable tasks from your file's comment threads.

## Features

- **Comment Dashboard**: Browse all comment threads in a Figma file with workflow status filters (Open, WIP, Blocked, Done), sorting, search, and an “addressed to me” filter.
- **Workflow States**: Track thread progress locally (Open → WIP → Blocked → Done), bulk-update selected threads, and sync when Figma’s native resolve/open status changes.
- **AI Summaries**: Summarize long comment threads into concise digests using your choice of AI provider, with a configurable word limit (50–200 words).
- **Task Extraction**: Automatically detect action items (revisions, approvals, blockers, questions) from thread conversations and track them in a unified Tasks view.
- **Image Analysis**: Optionally include thread images in AI context for richer, design-aware summaries (vision-capable providers only).

## Using Bottom Line in Figma
On first launch, complete the setup screen:

1. **Sign in**
   - **Sign in with Figma** (recommended when OAuth is enabled) — opens your browser to authorize read-only access to comments and file metadata. Return to Figma when prompted; the plugin picks up the session automatically.
   - **Personal access token** — expand “Use a personal access token” and paste a [Figma PAT](https://www.figma.com/settings) with permission to read the file and its comments. The token stays in Figma client storage on your machine.
2. **File URL** — Paste the full URL of the file you have open (must match the file you are working in). The plugin extracts the file key from the URL.
3. Select **Continue** to open the dashboard.

If your session expires, the plugin shows a reconnect screen with the same sign-in options.

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
- **Custom** — OpenAI-compatible `POST …/v1/chat/completions` (you set base URL, API key, and model name). Image analysis is not enabled for this option in the UI. Endpoints such as [OpenRouter](https://openrouter.ai) are allowed when listed in the plugin manifest.

API keys are stored locally in Figma’s client storage, trimmed when used, and sent only to the selected provider.

## Tech Stack

- **UI** — React 19, TypeScript, Tailwind CSS, Zustand
- **Plugin sandbox** — Figma Plugin API, built with esbuild
- **Build** — Vite (UI) + esbuild (sandbox), bundled to a single HTML file via `vite-plugin-singlefile`
- **OAuth broker** — Node.js HTTP server (`server/oauth-server.mjs`) for production and local development

## Getting Started

### Prerequisites

- Node.js 18+
- For PAT auth: a [Figma Personal Access Token](https://www.figma.com/settings) with file read permissions
- For OAuth (optional): a Figma OAuth app and broker URL (see [OAuth](#oauth-production))

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

This starts both the UI (Vite watch) and sandbox (esbuild watch) in parallel. Load the plugin in Figma via **Plugins → Development → Import plugin from manifest…** and select `dist/manifest.json` (generated on first build).

**Local OAuth (optional):** Use two terminals.

**Terminal 1 — OAuth broker** — Configure `server/.env` (`FIGMA_CLIENT_ID`, `FIGMA_CLIENT_SECRET`, `OAUTH_REDIRECT_URI=http://localhost:3847/api/figma/oauth/callback`, etc.), then:

```bash
npm run dev:oauth-server
```

**Terminal 2 — plugin** — In the project root `.env`, set the UI broker URL (this is what Vite inlines into the plugin; do not put secrets here):

```bash
VITE_FIGMA_OAUTH_BACKEND_URL=http://localhost:3847
```

Then start the plugin as usual:

```bash
npm run dev
```

`localhost:3847` is already listed under `devAllowedDomains` in `manifest.json`, so you do not need `FIGMA_OAUTH_BACKEND_ORIGIN` for local OAuth. That variable is only for adding a **different** broker origin to `dist/manifest.json` at build time (see Production Build below).

The broker listens on port `3847` by default (`PORT` in `server/.env`).

### Production Build

```bash
npm run build
```

Outputs `dist/index.html` (UI) and `dist/code.js` (sandbox).

For OAuth in production, set the broker URL in the project root `.env` **before** `npm run build` (Vite inlines this into the UI):

```bash
VITE_FIGMA_OAUTH_BACKEND_URL=https://figma-bottom-line-oauth-prod.onrender.com
```

Then run `npm run build` as usual.

Release builds remove `devAllowedDomains` from `dist/manifest.json`. The default production broker (`https://figma-bottom-line-oauth-prod.onrender.com`) is already in `manifest.json` → `allowedDomains`, so you do not need `FIGMA_OAUTH_BACKEND_ORIGIN` for that host. Set it only when deploying a **different** HTTPS broker, e.g. `FIGMA_OAUTH_BACKEND_ORIGIN=https://your-broker.example.com npm run build`.

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
│   ├── constants.ts
│   └── oauthPublicMessages.mjs
└── ui/              # React UI (runs in iframe)
    ├── ai/          # AI provider clients, prompts, image processing, summarization
    ├── api/         # Figma REST API client
    ├── components/  # React components (dashboard, settings, tasks, setup, etc.)
    ├── lib/         # Utilities (storage, OAuth, URL parsing, rate limiting, etc.)
    ├── store/       # Zustand stores (auth, comments, AI, filters, workflow)
    └── main.tsx     # Entry point
server/
└── oauth-server.mjs # Figma OAuth token exchange (production / local dev)
```

## Configuration

All settings are accessible from the plugin's **Settings** screen:

- **General** — Set the Figma file URL to analyze (file, design, or board links).
- **AI** — Choose provider, enter API key, set summary word limit (50–200), toggle image analysis. For **Custom**, set the API base URL, key, and model name.
- **Behavior** — Auto-refresh interval (summary cache TTL), comment navigation reminders.
- **Auth** — Sign in with Figma OAuth or manage a Personal Access Token; sign out clears stored credentials.
- **Display** — Toggle thread reply elbows; theme follows Figma, or override with light / dark.

### OAuth (Production)

Use an HTTPS OAuth backend in production and configure both frontend and server:

- UI env (`.env` in project root):
  - `VITE_FIGMA_OAUTH_BACKEND_URL=https://figma-bottom-line-oauth-prod.onrender.com`
- OAuth server env (`server/.env`):
  - `FIGMA_CLIENT_ID=...`
  - `FIGMA_CLIENT_SECRET=...`
  - `OAUTH_REDIRECT_URI=https://figma-bottom-line-oauth-prod.onrender.com/api/figma/oauth/callback`
  - `CORS_ALLOW_ORIGINS=https://www.figma.com,https://www.figma-beta.com`

Do not expose `FIGMA_CLIENT_SECRET` to the UI or any `VITE_*` variable.

## License

Private — all rights reserved.
