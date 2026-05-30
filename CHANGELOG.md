# Changelog

All notable changes to Bottom Line will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] - 2026-05-29

### Added

#### Comment dashboard

- Browse comment threads for a Figma file (design, file, or FigJam board URLs)
- Workflow status filters: Open, WIP, Blocked, Done
- Sort by replies, participants, last updated, or created date
- Search threads by message text
- “Addressed to me” filter
- Scope: current page or full document
- Bulk workflow updates for selected threads
- Sync local workflow state when threads are resolved or reopened in Figma
- Navigate to comment pins on the canvas (with optional page switch)
- Auto-refresh with configurable polling interval
- Resizable plugin panel

#### AI summaries & tasks

- Summarize comment threads via Anthropic, OpenAI, Google Gemini, or a custom OpenAI-compatible endpoint
- Configurable summary word limit (50–200 words)
- Summary caching until a thread changes
- Optional image analysis for vision-capable providers
- One-time cloud AI consent dialog
- Task extraction from threads (revision, approval, blocker, question, general)
- Unified Tasks view with done/pending tracking

#### Authentication

- Sign in with Figma OAuth (production broker on Render)
- Personal access token fallback
- Reconnect screen when the session expires

#### Settings

- General: file URL
- AI: provider, API keys, word limit, image analysis, custom endpoint
- Behavior: auto-refresh interval, navigate-to-comment reminders
- Auth: OAuth or PAT management
- Display: thread reply elbows, theme (system / light / dark)
- About: plugin info, Help, and Change Log links
