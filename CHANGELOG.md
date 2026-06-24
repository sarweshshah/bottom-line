# Changelog

All notable changes to Bottom Line will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [2.3.0] - 2026-06-25

### Added

- Activity summary panel showing new threads, replies, and resolved items from the last 24 hours
- Clickable activity filters to narrow the thread list by activity category

### Changed

- Refactored AI summary topic header handling with truncation and legacy cache backfill
- Updated theme colors and global styles for improved UI consistency

## [2.2.1] - 2026-06-17

### Added

- Settings tabs for user preferences, including motion preference controls
- Topic headers in AI summary responses
- Virtualized ThreadList rendering for improved performance

## [2.2.0] - 2026-06-16

### Added

- Time filter on the dashboard (last 24 hours, 7 days, 30 days, or custom date range)
- Thread-to-page mapping for accurate current-page scope and navigation

### Changed

- Refreshed dashboard filter bar, view switcher, file name bar, and About tab styling
- Improved settings screen layout and consistency

### Removed

- Auto-open comment on navigate setting (simplified behavior)

## [2.1.0] - 2026-06-14

### Added

- Thread elbow connectors in thread detail for clearer reply threading

### Changed

- Summary word limit picker uses five options from 75–200 words
- Refreshed settings screen layout and About tab styling
- Updated design tokens and Tailwind configuration for UI consistency across dashboard, setup, reconnect, and tasks views

## [2.0.0] - 2026-06-14

### Added

- Bulk summarization for multiple threads with progress feedback
- "Read" workflow state with bulk status updates
- Threads / Tasks tab switcher in the dashboard

### Changed

- Simplified workflow states to Open, Read, and Done (removed WIP and Blocked)
- Refreshed UI with updated design tokens, thread cards, loading states, and accessibility improvements
- Streamlined API key setup across Anthropic, OpenAI, Gemini, and custom providers

## [1.0.0] - 2026-05-29

### Added

#### Comment dashboard

- Browse comment threads for a Figma file (design, file, or FigJam board URLs)
- Workflow status filters: Open, Read, Done
- Sort by replies, participants, last updated, or created date
- “Addressed to me” filter
- Scope: current page or full document
- Bulk workflow updates for selected threads
- Sync local workflow state when threads are resolved or reopened in Figma
- Navigate to comment pins on the canvas (with optional page switch)
- Auto-refresh with configurable polling interval
- Resizable plugin panel

#### AI summaries & tasks

- Summarize comment threads via Anthropic, OpenAI, Google Gemini, or a custom OpenAI-compatible endpoint
- Configurable summary word limit (75–200 words)
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
