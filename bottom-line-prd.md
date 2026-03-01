# Bottom Line — PRD

> _AI-powered comment intelligence for design teams_

|                    |                              |
| ------------------ | ---------------------------- |
| **Version**        | 1.8                          |
| **Status**         | Draft                        |
| **Author**         | Sarwesh                      |
| **Date**           | February 27, 2026            |
| **Stakeholders**   | Design, Engineering, Product |
| **Classification** | Internal                     |

# 1. Executive Summary

Bottom Line is a plugin that brings order to the often chaotic world of design feedback. As design files grow in complexity and team size, the native Figma comment panel becomes increasingly difficult to navigate — critical feedback gets buried, tasks go untracked, and designers waste time scrolling through resolved threads looking for what still needs attention.

This plugin solves that by providing an intelligent, filterable comment dashboard directly inside Figma. Powered by AI (with user-configurable local or cloud processing), it summarizes lengthy threads into actionable digests, extracts implicit tasks from natural language, and surfaces what matters most to each user based on their role and mentions.

## 1.1 Value Proposition

The plugin delivers three core value pillars:

- **Time savings:** Reduce comment triage time by up to 70% through AI-generated thread summaries and smart filtering. No more reading 47-message threads to find the conclusion.

- **Accountability:** Surface tasks and action items hidden in natural language comments. Know exactly who owes what, and what’s been completed.

- **Clarity:** Provide a single pane of glass for all comment activity — across pages or the entire document — with status-based filtering and personalized views.

# 2. Problem Statement

## 2.1 Current Pain Points

Through user research and competitive analysis, we’ve identified the following recurring frustrations with Figma’s native commenting:

| **Pain Point**           | **Impact**                                                 | **Frequency**  |
| ------------------------ | ---------------------------------------------------------- | -------------- |
| **Thread overload**      | Designers miss critical feedback buried in long threads    | Daily          |
| **No task tracking**     | Action items mentioned in comments are forgotten or lost   | Daily          |
| **Primitive filtering**  | Can only toggle resolved/unresolved; no personal view      | Per session    |
| **No summaries**         | Must read entire thread to understand current state        | Per thread     |
| **Cross-page blindness** | No unified view of comments across multiple pages          | Per project    |
| **Context switching**    | Designers leave Figma to track tasks in Jira/Notion/Sheets | Multiple daily |

## 2.2 Target Users

The plugin serves three distinct personas, each with different primary needs:

### Persona 1: Solo Designer

Works on their own files but receives feedback from stakeholders and developers. Needs to quickly see what’s been said, what’s addressed, and what requires action. Values speed and simplicity.

### Persona 2: Design Team Member

Collaborates on shared files with 3–15 other designers and cross-functional partners. Frequently @mentioned in threads. Needs a “my inbox” view to cut through noise across pages they don’t own.

### Persona 3: Design Lead / Manager

Reviews design work across multiple files and pages. Needs a bird’s-eye view of open threads, unresolved blockers, and outstanding tasks. Values reporting and oversight more than thread-level detail.

# 3. Product Overview

## 3.1 Plugin Architecture

The plugin uses the Figma REST API as its data source, authenticated via a user-provided Personal Access Token:

| **Layer**      | **Technology**                                            | **Purpose**                                                                                  |
| -------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Data Source    | Figma REST API                                            | Full comment data with thread metadata, timestamps, reactions, resolved state, and user info |
| Authentication | Personal Access Token (PAT)                               | Stored locally in plugin clientStorage; required to use the plugin                           |
| AI — Local     | On-device summarization (rule-based + lightweight models) | Privacy-first option; extracts key phrases and patterns without external calls               |
| AI — Cloud     | Anthropic / OpenAI / Gemini / Custom (OpenAI-compatible)  | High-quality thread summaries and nuanced task extraction                                    |
| UI Framework   | Figma Plugin UI (iframe)                                  | Custom React-based interface rendered in the plugin panel                                    |

**Authentication roadmap**

- **V1:** PAT-based authentication only. Users create a Personal Access Token in Figma Settings and paste it once during onboarding; it is stored in clientStorage and reused for all documents. To reduce 403 (expired/revoked token) friction, V1 includes explicit onboarding guidance (create token with no expiration and `file_comments:read` scope), a dedicated Reconnect flow on 403, and optional proactive token validation on plugin open.
- **V2:** OAuth-based authentication (planned). Sign-in with Figma and refresh tokens will reduce re-auth prompts and 403-driven disruption. PAT may remain supported during a transition period or be deprecated in favor of OAuth.

**Public Community plugin & file key (V1)**

The plugin is published to the Figma Community so anyone can install it. Public plugins do not receive `figma.fileKey` from the Figma Plugin API by default. For V1 we use **Option C — Paste file URL**: the user pastes the Figma file URL (e.g. from the browser bar when the file is open); the plugin parses the file key from the URL and stores it in clientStorage so repeat use for the same file does not require pasting again. When the user switches to a different file, they paste that file’s URL or use a “Different file” control. **Option A** (requesting access to `figma.fileKey` from Figma for this use case) is being explored in parallel; if granted, we can add automatic file key detection and keep paste-URL as a fallback.

## 3.2 Scope Definition

The following table clarifies what is and isn’t included in the V1 release:

| **In Scope (V1)**                            | **Out of Scope (Future)**                        |
| -------------------------------------------- | ------------------------------------------------ |
| Thread listing with open/resolved filtering  | Third-party integrations (Slack, Jira, Linear)   |
| AI-powered thread summaries (local + cloud)  | Comment creation or reply from within the plugin |
| Task extraction from natural language        | Cross-file comment aggregation                   |
| Personal view (“addressed to me”)            | Notification system / push alerts                |
| Page-level and document-level toggle         | Comment analytics and reporting dashboards       |
| Navigate-to-comment on canvas click          | Webhook-based real-time sync                     |
| PAT-based REST API authentication (required) | OAuth-based authentication flow (planned for V2) |
| Keyword search across threads                | Full-text search with ranking/relevance scoring  |
| Export to PDF, Markdown, TXT, Figma Canvas   | Scheduled/automated exports                      |
| User preference for AI provider              | Custom AI model fine-tuning                      |

# 4. Detailed Functional Requirements

## 4.1 FR-01: Onboarding Wizard

The plugin presents a multi-step onboarding wizard on first launch, designed to capture all key configuration upfront while allowing users to skip optional steps. Each step has a clear purpose, sensible defaults, and a “Skip” option where appropriate. Skipped steps apply the documented defaults.

### Wizard Steps

| **Step**                 | **Purpose**                                                                                                                                                                                    | **Required?**       | **Skip Default**                                         |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | -------------------------------------------------------- |
| **1. Welcome**           | Single-screen value proposition: what the plugin does and why it needs setup.                                                                                                                  | Yes (view only)     | —                                                        |
| **2. Figma Token (PAT)** | Walks user through generating a PAT, explains what the plugin will and won’t do with it, and validates the token inline. See details below.                                                    | **Yes — mandatory** | Cannot skip. Plugin cannot function without a valid PAT. |
| **3. AI Provider**       | User selects their preferred AI engine: Local, Anthropic, OpenAI, Gemini, or Custom. If a cloud provider is selected, the relevant API key / config fields are shown inline.                   | No                  | Local (rule-based, no API key needed)                    |
| **4. Image Analysis**    | Toggle for including images in AI summaries. Shows a brief explanation of cost implications and provider compatibility. Only shown if user selected a vision-capable cloud provider in Step 3. | No                  | Off                                                      |
| **5. Default Scope**     | User chooses whether the plugin defaults to Current Page or Entire Document on each launch.                                                                                                    | No                  | Current Page                                             |
| **6. Done**              | Confirmation screen summarizing all choices. Shows a “You can change these anytime in Settings” note. “Launch Plugin” button.                                                                  | Yes (view only)     | —                                                        |

### Step 2 Deep Dive: Figma Token Setup

This step is a single screen with three sections stacked vertically: instructions, transparency, and input.

**How to get your token**

1. Click your profile avatar (top-left in Figma) → **Settings** → **Security**.
2. Under “Personal access tokens,” click **Generate new token**. Name it “Bottom Line Plugin.”
3. When creating the token, set **no expiration** (if Figma offers this option) and ensure the **file_comments:read** scope is included so the plugin can read comments. For resolving/reopening threads, write scope is also required.
4. Copy the token (shown once) and paste it below.

A “Open Figma Settings →” button links directly to https://www.figma.com/settings.

**What the plugin will and won’t do**

| **✓ Will do**                                         | **✗ Will never do**                                                                                        |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Read comments (threads, replies, resolved state)      | Access or modify your designs, layers, or components                                                       |
| Read user profiles (names, avatars) for the dashboard | Store your token on any external server                                                                    |
| Resolve/reopen threads you mark as Resolved/Open      | Share your token or comments with third parties (AI providers receive comment text only, never your token) |
| Navigate to comment locations on canvas               | Create, edit, or delete your files or pages                                                                |

**Token input**

- Password-masked input field with show/hide toggle.
- Validated on paste via `GET /v1/me` — confirms the token without fetching file data.
- On success: “Connected as [display name]” with a green checkmark.
- On failure: specific error messages for invalid token, expired token, or network issues.

### Wizard UX Principles

- **Progress indicator:** A step bar at the top shows the user’s position in the wizard (e.g., Step 2 of 6). Completed steps get a checkmark.

- **Back navigation:** Users can go back to any previous step to change their selection.

- **Skip behavior:** Skippable steps show a “Skip → use default” button alongside the primary action. The skip button shows what the default is (e.g., “Skip → use Local AI”).

- **Conditional steps:** Step 4 (Image Analysis) is only shown if a vision-capable cloud provider was selected in Step 3. If the user selected Local or Custom, Step 4 is skipped automatically.

- **Inline validation:** PAT and API keys are validated as soon as the user pastes them, with real-time success/error feedback.

- **Re-entry:** The wizard only runs once on first launch. All subsequent configuration is done via the Settings panel. A “Re-run Setup Wizard” option is available in Settings for users who want a guided reconfiguration.

### Acceptance Criteria

1. Wizard launches on first use only; does not re-appear on subsequent launches.
2. Step 2 (PAT) is mandatory — cannot proceed without a valid token.
3. Step 2 includes token generation instructions, a direct link to Figma Settings, and a will/won’t-do transparency table.
4. Token validated via `GET /v1/me`; success shows user’s display name, failure shows actionable error.
5. Steps 3, 4, and 5 are individually skippable with documented defaults applied.
6. Step 4 (Image Analysis) only appears for vision-capable providers.
7. Step 6 summarizes all choices including defaults from skipped steps.
8. All onboarding settings persist in clientStorage and sync to the Settings panel.
9. “Re-run Setup Wizard” available in Settings. Token can be updated/revoked anytime.

> **EDGE CASE**
>
> If a user’s PAT expires mid-session (or is revoked), the plugin should surface a blocking notification prompting re-authentication. The user cannot continue using the plugin until a valid token is provided. V1 must implement a dedicated **Reconnect** flow (not a generic error): clear copy that the token may have expired or been revoked, a link to Figma Settings to create a new token, and the same token input + validate flow as in onboarding. Optionally, the plugin may call `GET /v1/me` on open to validate the stored token and prompt re-auth before the user hits a 403 on comment fetch.

## 4.2 FR-02: Comment Fetching & Caching

### Data Retrieval

The plugin fetches comment data exclusively via the Figma REST API:

- **REST API:** GET /v1/files/:file_key/comments returns all comments for the file. The response includes thread structure, user info, timestamps, resolved_at, and client_meta (x/y coordinates on canvas).

### Caching Strategy

- Comments are cached in-memory for the session duration with a configurable TTL (default: 5 minutes).

- A manual refresh button is always available in the toolbar.

- On plugin reopen, a fresh fetch is triggered automatically.

- Cache is scoped to the current file; switching files clears and re-fetches.

### Acceptance Criteria

19. Initial load fetches all comments and displays them within 3 seconds for files with up to 500 comments.

20. Subsequent views within TTL serve from cache with \<100ms render time.

21. Pagination is handled transparently for files exceeding API response limits.

22. Rate limiting is respected (Figma allows ~30 req/min for REST API). Plugin queues requests and shows a loading state if throttled.

## 4.3 FR-03: Comment Dashboard & Filtering

### Dashboard Layout

The main plugin interface is a scrollable list of comment threads grouped by page under collapsible sections (current page first, expanded by default). Each thread card shows:

- Last-updated timestamp + status badge (Open/Resolved)
- AI summary (max 2 lines, truncated)
- Participant avatar group (current user first, max 5, +N overflow) + task badge + reply count

Tapping a card opens the Thread Detail Screen with full summary, tasks list, tags, and the complete comment thread.

### Filter System

Users can filter the thread list using the following dimensions, which are combinable:

| **Filter**   | **Options**                                                                        | **Default**  |
| ------------ | ---------------------------------------------------------------------------------- | ------------ |
| Status       | All / Open / Read / In Progress / Needs Review / Blocked / Resolved (multi-select) | Open         |
| Scope        | Current Page / Entire Document                                                     | Current Page |
| Addressed To | All / Me (based on @mentions)                                                      | All          |
| Has Tasks    | All / With Tasks Only / My Tasks Only                                              | All          |
| Author       | Dropdown of all commenters in file                                                 | All          |
| Tags         | Multi-select of all tags in current view (OR logic)                                | All          |
| Date Range   | Last 24h / Last 7 days / Last 30 days / All Time                                   | All Time     |
| Sort         | Newest First / Oldest First / Most Replies / Unread First                          | Newest First |

### Acceptance Criteria

23. All filters are persisted across plugin sessions using clientStorage.

24. Filters update the thread list in real-time (\<200ms) without a full re-fetch.

25. Filter state is displayed as removable chips/tags above the thread list.

26. A “Clear all filters” action resets to defaults.

27. Empty states are contextual: e.g., “No open comments on this page — nice work!” vs “No comments match your filters.”

## 4.4 FR-04: AI-Powered Thread Summaries

### Summary Generation

Each comment thread receives an AI-generated summary that distills the conversation into 1–3 actionable sentences. The summary should capture:

- The core topic or feedback point

- The current state of the discussion (consensus, disagreement, pending)

- Any decisions made or next steps identified

### AI Provider Options

Users choose their preferred AI processing method in Settings:

| **Option**            | **How It Works**                                                                                                                                                                                             | **Trade-offs**                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Local (Default)**   | Rule-based extraction + lightweight heuristics. Identifies key sentences, frequent terms, and thread structure to produce a summary.                                                                         | Fully private, no API key needed, instant. Lower quality on complex/nuanced threads.                                                     |
| **Cloud — Anthropic** | Sends thread text to Claude API. User provides their own API key. Prompt-engineered for design feedback context.                                                                                             | High-quality, nuanced summaries. Requires API key, incurs cost, depends on network.                                                      |
| **Cloud — OpenAI**    | Sends thread text to GPT API. User provides their own API key. Same prompt structure adapted for OpenAI format.                                                                                              | High-quality. Requires API key, incurs cost, depends on network.                                                                         |
| **Cloud — Gemini**    | Sends thread text to Google Gemini API. User provides their own API key. Prompt adapted for Gemini’s format.                                                                                                 | High-quality. Requires API key, incurs cost, depends on network.                                                                         |
| **Cloud — Custom**    | User configures a Base URL, API key, and model name for any OpenAI-compatible endpoint (e.g., Groq, Mistral, Together AI, local Ollama). The plugin sends requests using the OpenAI chat completions format. | Maximum flexibility. User is responsible for endpoint reliability, cost, and model quality. Local endpoints (Ollama) offer full privacy. |

### Multimodal Image Analysis

Comment threads often include images — annotated screenshots, mockup comparisons, or reference visuals. When image analysis is enabled and a capable provider is selected, the AI incorporates image content into thread summaries for richer, more accurate output.

| **Provider**           | **Vision Support** | **Behavior When Image Analysis Is Enabled**                                                                                                                                      |
| ---------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Local**              | ✗ Not supported    | Images are ignored. Summary notes: “Thread includes N image(s) not analyzed.”                                                                                                    |
| **Anthropic (Claude)** | ✓ Supported        | Images are downloaded, base64-encoded, and included in the API request alongside thread text.                                                                                    |
| **OpenAI (GPT-4o)**    | ✓ Supported        | Images are sent as image_url content parts in the chat completions request.                                                                                                      |
| **Gemini**             | ✓ Supported        | Images are sent as inline_data parts in the Gemini API request.                                                                                                                  |
| **Custom**             | ? Unknown          | Images are not sent. Summary notes: “Thread includes N image(s) not analyzed.” Custom providers are treated as text-only to avoid errors on endpoints that don’t support vision. |

Image analysis is controlled by a user toggle in Settings:

- **Default: Off** — to keep API costs low. Image tokens are significantly more expensive than text tokens across all providers.

- When enabled and the provider supports vision, images from comments are fetched via their Figma-hosted URLs, resized to a max of 1024px on the longest edge (to control token cost), and included in the AI request.

- A maximum of 5 images per thread are sent to avoid excessive token usage. If a thread has more, only the 5 most recent are included, with a note in the summary.

- When enabled but the provider does not support vision (Local, Custom), the summary includes a note: “Thread includes N image(s) not analyzed — switch to a vision-capable provider for image context.”

- The cost estimation (for named providers) updates dynamically to reflect the additional image token cost when the toggle is enabled.

> **IMAGE HANDLING**
>
> Images are fetched from Figma’s CDN URLs (included in the REST API response), resized client-side, and sent directly to the AI provider. No images are stored or cached by the plugin beyond the active session. The privacy consent dialog (shown on first cloud AI use) is updated to mention image transmission when image analysis is enabled.

### Acceptance Criteria

28. Summaries are generated on first load and cached alongside comment data.

29. Local summaries generate in \<500ms per thread.

30. Cloud summaries are batched (up to 10 threads per API call) to minimize requests and cost.

31. A loading skeleton is shown while cloud summaries are being generated.

32. If a cloud API call fails, the plugin falls back to local summarization for that thread and shows an info toast.

33. Users can regenerate a summary for any individual thread.

34. API keys and custom endpoint configurations are stored in clientStorage and never transmitted anywhere except the chosen provider’s API endpoint.

35. When image analysis is enabled and the provider supports vision, images are included in the AI request and the summary references visual content.

36. When image analysis is enabled but the provider does not support vision, the summary includes: “Thread includes N image(s) not analyzed.”

37. A maximum of 5 images per thread are sent; images are resized to max 1024px on the longest edge.

38. Image analysis toggle defaults to Off and is clearly labeled with a cost warning in Settings.

> **PRIVACY SAFEGUARD**
>
> When using cloud AI, the plugin must show a one-time consent dialog explaining that comment text (and images, if image analysis is enabled) will be sent to a third-party API. The dialog includes a “Don’t show again” option stored in preferences. If a user later enables image analysis, the consent dialog is re-shown with updated language about image transmission.

## 4.5 FR-05: Natural Language Task Extraction

### Task Detection Logic

The AI layer (local or cloud) scans each comment in a thread for implicit and explicit task assignments. Detection patterns include:

| **Pattern Type**    | **Examples**                                             | **Extracted As**                                                             |
| ------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Direct assignment   | "@sarah please update the header spacing"                | Task: Update header spacing → Assigned to: Sarah                             |
| Action request      | "Can someone fix the contrast ratio here?"               | Task: Fix contrast ratio → Assigned to: Unassigned                           |
| Conditional/blocker | "This is blocked until we get the new assets from brand" | Blocker: Awaiting assets from brand                                          |
| Approval request    | "@mike can you approve this before we ship?"             | Task: Approval needed → Assigned to: Mike                                    |
| Revision request    | "Let’s try a version with less padding and bolder type"  | Task: Create variant (less padding, bolder type) → Assigned to: Thread owner |

### Task Display

- Each thread card shows a task badge (`ClipboardList` Lucide icon) with a count. Hovering the badge shows a tooltip with the task summary.

- The full task list (assignee, description, status toggle) appears on the Thread Detail Screen.

- Task status is stored locally in clientStorage (not synced to Figma comments, as the API does not support custom metadata).

- A dedicated “Tasks” tab in the main navigation shows all extracted tasks across threads, grouped by assignee.

### Acceptance Criteria

39. Task extraction runs as part of the summary generation pipeline (same local/cloud toggle).

40. Detected tasks achieve \>80% precision (i.e., 8 out of 10 detected items are actual tasks) on design feedback corpora.

41. False positives can be dismissed by the user; dismissed patterns inform a local blocklist.

42. Task completion state persists across plugin sessions.

## 4.6 FR-06: Addressed to Me

### Detection Logic

A thread is marked as “addressed to me” if any of the following conditions are true:

43. The authenticated user’s @handle appears in any comment within the thread.

44. The user is the original thread author and someone has replied.

45. A task has been assigned to the user (per FR-05 extraction).

### UI Treatment

- Threads addressed to the user receive a distinct visual indicator (left border accent + “For You” badge).

- The “Addressed to Me” filter surfaces these threads exclusively.

- A counter in the plugin header shows the number of open threads addressed to the user.

## 4.7 FR-07: Navigate to Comment

The Thread Detail Screen includes a “Navigate to comment” button (`ExternalLink` Lucide icon). Pressing it scrolls and zooms the Figma canvas to the comment’s location using `client_meta` coordinates and `figma.viewport.scrollAndZoomIntoView()`. If the comment is on a different page, the plugin switches pages first via `figma.setCurrentPageAsync()`.

### Acceptance Criteria

1. Navigate button on detail screen scrolls and zooms to the comment’s canvas location.
2. Cross-page navigation switches pages before zooming.
3. If the target node has been deleted, a toast shows: “The element this comment was attached to no longer exists.”

## 4.8 FR-08: Settings & Preferences

The settings screen is organized into tabs to reduce cognitive load. Each tab groups related settings. A tab bar at the top (`Settings` Lucide icon per tab) allows switching between them.

### Tab 1: Account & Authentication (`User` Lucide icon)

| **Setting**         | **Options**                                          |
| ------------------- | ---------------------------------------------------- |
| PAT Management      | View masked token / Update / Revoke                  |
| Connected as        | Display name + avatar (read-only, from `GET /v1/me`) |
| Re-run Setup Wizard | Button to re-launch onboarding                       |

### Tab 2: AI & Summarization (`Sparkles` Lucide icon)

| **Setting**            | **Options**                                                                               |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| AI Provider            | Local / Anthropic / OpenAI / Gemini / Custom                                              |
| API Key(s)             | Masked input per provider (shown conditionally)                                           |
| Custom Provider Config | Base URL + API key + model name (shown when Custom is selected)                           |
| Image Analysis         | On / Off (default: Off). Cost warning shown. Only effective for vision-capable providers. |

### Tab 3: Display & Behavior (`SlidersHorizontal` Lucide icon)

| **Setting**           | **Options**                          |
| --------------------- | ------------------------------------ |
| Default Scope         | Current Page / Entire Document       |
| Default Status Filter | All / Open / Resolved                |
| Cache TTL             | 1 min / 5 min / 15 min / Manual only |
| Theme                 | Match Figma / Light / Dark           |

### Tab 4: Tags (`Tags` Lucide icon)

| **Setting**       | **Options**                                     |
| ----------------- | ----------------------------------------------- |
| Predefined Tags   | Toggle visibility (show/hide) per tag           |
| Custom Tags       | View, rename, re-color, merge, delete           |
| Create Custom Tag | Name (max 24 chars) + color from preset palette |

All settings are persisted in `clientStorage`.

## 4.9 FR-09: Thread Workflow States

Figma natively supports only two thread states: Open and Resolved. This is insufficient for real design workflows where feedback moves through multiple stages. The plugin introduces intermediate states that live locally, while keeping the two native states bidirectionally synced with Figma.

### State Model

The plugin implements a six-state linear workflow. The first and last states sync with Figma; the four intermediate states are plugin-only:

| **State**        | **Syncs with Figma** | **Description**                                                                                                                                                                            | **Visual Treatment**         |
| ---------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| **Open**         | **✓ Yes**            | Thread is new or unaddressed. Default state for all incoming comments. Maps directly to Figma’s native Open state.                                                                         | Blue badge, open circle icon |
| **Read**         | ✗ No (local only)    | Designer has seen the feedback but has not started working on it. Signals awareness to reduce anxiety on the commenter’s side (visible only to the plugin user in V1).                     | Gray badge, eye icon         |
| **In Progress**  | ✗ No (local only)    | Actively being worked on. The designer is implementing changes or exploring the feedback. Useful for tracking personal workload.                                                           | Amber badge, wrench icon     |
| **Needs Review** | ✗ No (local only)    | Changes have been made and the designer is waiting for the original commenter (or another stakeholder) to verify. A signal that the ball is in someone else’s court.                       | Purple badge, eye-check icon |
| **Blocked**      | ✗ No (local only)    | Cannot proceed due to an external dependency — e.g., waiting for assets, a decision from another team, or a technical constraint. Pairs naturally with the task extraction system (FR-05). | Red badge, pause-circle icon |
| **Resolved**     | **✓ Yes**            | Thread is complete. Maps directly to Figma’s native Resolved state. When set from the plugin, triggers a REST API call to resolve the thread in Figma.                                     | Green badge, checkmark icon  |

### State Transition Rules

The following rules govern how states change and sync:

49. **Forward and backward:** Users can move a thread to any state from any state. The workflow is suggested (linear), not enforced. A thread in “Needs Review” can jump back to “In Progress” or skip ahead to “Resolved.”

50. **Open → Intermediate:** When a user sets any intermediate state, the thread remains Open in Figma. No API call is made.

51. **Intermediate → Resolved:** When a user moves any thread to “Resolved,” the plugin calls the Figma REST API to resolve the thread natively. This requires a valid PAT with write permissions.

52. **Resolved → Open (reopen):** When a user moves a Resolved thread back to “Open” (or any intermediate state), the plugin calls the REST API to reopen the thread in Figma, then applies the selected state locally.

> **SYNC RULE — FIGMA IS SOURCE OF TRUTH**
>
> If a thread’s state is changed outside the plugin (e.g., resolved natively in Figma by another team member), the plugin overrides the local intermediate state on the next data refresh. Example: A thread marked “In Progress” in the plugin will be overridden to “Resolved” if someone resolves it in Figma. A non-blocking toast notifies the user: “3 threads were resolved in Figma and their local states have been updated.”

### Conflict Detection & Resolution

Because intermediate states are local-only, conflicts arise when Figma’s native state changes between plugin sessions. The plugin handles this as follows:

| **Scenario**                                                                                | **Behavior**                                                                                                                                                   |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Thread resolved in Figma while plugin had it as Read / In Progress / Needs Review / Blocked | Override to Resolved. Show toast notification listing affected threads. Previous intermediate state is logged in local history for reference.                  |
| Thread reopened in Figma while plugin had it as Resolved                                    | Override to Open. User can then assign a new intermediate state.                                                                                               |
| Thread deleted in Figma while plugin had an intermediate state                              | Remove from plugin thread list. Clean up associated state data from clientStorage.                                                                             |
| PAT lacks write permissions when user tries to Resolve/Reopen                               | Show error: “Your token doesn’t have write access. Resolve this thread directly in Figma, or update your token in Settings.” State change is reverted locally. |
| REST API call to resolve/reopen fails (network error, rate limit)                           | Revert the local state change. Show error with retry option. Do not leave the plugin in a state inconsistent with Figma.                                       |

### State Change UI

The Thread Detail Screen includes a state selector in the header that allows quick transitions:

- The current state badge in the detail header is clickable, opening a dropdown (`ChevronDown` Lucide icon) with all six states.

- States are displayed with their colored badges and icons for quick visual identification.

- The two Figma-synced states (Open, Resolved) have a subtle Figma icon indicator in the dropdown to signal that selecting them will trigger a sync.

- When a user selects Resolved, a confirmation dialog appears: “This will resolve the thread in Figma. Continue?” to prevent accidental resolution.

- Bulk state changes are supported: users can select multiple threads (via checkboxes) and apply a state to all at once.

### State Persistence

- Intermediate states are stored in clientStorage keyed by file_key + thread_id.

- State history (last 5 transitions per thread) is stored for auditability.

- States are per-user in V1 (Designer A’s states are not visible to Designer B). Shared state visibility is a post-V1 consideration requiring a backend service.

- A cleanup job runs on plugin open, removing state data for threads that no longer exist in the file.

### Acceptance Criteria

53. User can change any thread to any of the six states from the detail screen dropdown.

54. Setting state to Resolved triggers a Figma REST API call and resolves the thread natively. Confirmation dialog is shown.

55. Setting state to Open (from Resolved) triggers a REST API call and reopens the thread natively.

56. Intermediate state changes are instant (\<100ms) with no API call.

57. On data refresh, any thread resolved/reopened externally in Figma overrides the local intermediate state.

58. A toast notification lists threads whose states were overridden by Figma sync.

59. If the REST API call to resolve/reopen fails, the local state reverts and an error with retry is shown.

60. Bulk state changes work for up to 50 threads at once.

61. State filter in the dashboard (FR-03) supports filtering by any of the six states, including multi-select.

62. State data persists across plugin sessions and survives Figma restarts.

## 4.10 FR-10: Custom Thread Tags

Tags provide a flexible, user-defined categorization layer that complements the structured workflow states. While states answer “where is this thread in the process?”, tags answer “what is this thread about?” — enabling cross-cutting organization by topic, discipline, priority, or any dimension the user finds useful.

### Tag System

The plugin ships with a set of predefined tags covering common design feedback categories, while also allowing users to create their own:

| **Category**   | **Predefined Tags**                 | **Rationale**                                                                                 |
| -------------- | ----------------------------------- | --------------------------------------------------------------------------------------------- |
| **Discipline** | UX, Visual, Copy, Motion, A11y, Dev | Lets users categorize feedback by the type of work required to address it                     |
| **Priority**   | Critical, Nice-to-have, Nitpick     | Lightweight priority triage without a full priority management system                         |
| **Type**       | Bug, Question, Suggestion, Praise   | Distinguishes between actionable feedback, clarification requests, and positive reinforcement |

### Custom Tag Creation

- Users can create custom tags by typing a new name in the tag input field. The tag is created on confirmation (Enter key or click).

- Custom tags support a user-chosen color from a preset palette of 10 colors (no free-form color picker, to maintain visual consistency).

- Tag names are limited to 24 characters, alphanumeric plus hyphens and spaces.

- Duplicate tag names (case-insensitive) are prevented with an inline validation message.

- Users can manage their tag library from Settings: rename, re-color, merge, or delete custom tags. Deleting a tag removes it from all threads.

- Predefined tags cannot be deleted but can be hidden if the user doesn’t find them relevant.

### Tag Application

- Tags are applied to threads via a tag picker (`Plus` Lucide icon) on the Thread Detail Screen.

- The picker shows predefined tags first, then custom tags, with a search/filter input at the top.

- Multiple tags can be applied to a single thread (no limit, though the UI truncates display at 3 visible tags with a “+N more” indicator).

- Tags can be removed from a thread by clicking the × on the tag chip, or via the tag picker.

- Recently used tags are surfaced at the top of the picker for quick access.

- Bulk tagging is supported: select multiple threads and apply/remove tags in one action.

### Tag Filtering

Tags integrate into the existing filter system (FR-03) as an additional dimension:

- A “Tags” filter row appears in the filter panel with a multi-select dropdown of all tags present in the current view.

- Filter logic is OR within tags (show threads that have Tag A or Tag B) — this is the most intuitive behavior for narrowing by category.

- Tags combine with other filters using AND logic (e.g., “Open + In Progress” AND “Tagged UX or A11y”).

- Active tag filters appear as removable chips alongside other filter chips.

### Tag Persistence & Scope

- Tags are stored in clientStorage, keyed by file_key + thread_id.

- Tags are per-user in V1 (not visible to other team members). Shared tags are a post-V1 consideration.

- The user’s custom tag library (names + colors) is stored globally (not per-file) so custom tags are available across all files.

- Tag-to-thread associations are per-file (a thread in File A tagged “UX” does not affect File B).

- Cleanup job (same as FR-09) removes tag associations for deleted threads.

### Acceptance Criteria

63. Users can apply one or more predefined tags to any thread from the Thread Detail Screen.

64. Users can create custom tags with a name (max 24 chars) and a color from a 10-color preset palette.

65. Custom tags appear in the tag picker alongside predefined tags and persist across sessions.

66. Tags are displayed on the Thread Detail Screen as colored chips. The list view card does not show tags.

67. The dashboard filter panel includes a Tags filter that supports multi-select with OR logic.

68. Tag filters combine with other filters (status, scope, author, etc.) using AND logic.

69. Bulk tagging works for up to 50 threads at once.

70. Users can rename, re-color, merge, or delete custom tags from Settings.

71. Predefined tags can be hidden but not deleted.

72. Tag operations (apply, remove, create) complete in \<100ms.

## 4.11 FR-11: Keyword Search

A search input (`Search` Lucide icon) sits above the thread list, below the filter bar. It filters threads in real-time as the user types.

**Search scope:** The query matches against thread text (all replies), author names, AI summary text, and tag names. Matching is case-insensitive substring.

- Results update after a 200ms debounce to avoid excessive re-renders.
- The search query is combined with active filters using AND logic (e.g., search "spacing" + filter "Open" shows only open threads mentioning "spacing").
- Matching terms are highlighted in the summary text on thread cards.
- An `X` (Lucide) clear button resets the search. Empty search shows all threads (subject to active filters).
- Search works across all page groups when scope is "Entire Document."

### Acceptance Criteria

1. Search input filters the thread list in real-time with <200ms debounce.
2. Matches against thread text, author names, AI summaries, and tag names (case-insensitive).
3. Search combines with active filters using AND logic.
4. Matching terms are highlighted in card summaries.
5. Clearing search restores the full filtered list.

## 4.12 FR-12: Export Thread List

Users can export the current thread list (respecting active filters and search) via an export button (`Download` Lucide icon) in the toolbar. Export captures thread summaries, tasks, status, tags, and participant info.

### Exported Fields Per Thread

Every export format includes the same data per thread (adapted to the format’s structure):

| **Field**                | **Value**                                                              |
| ------------------------ | ---------------------------------------------------------------------- |
| Thread title / initiator | Name of the person who started the thread                              |
| Status                   | Open / Resolved + workflow state (e.g., In Progress)                   |
| Last updated             | Relative and absolute timestamp                                        |
| AI summary               | Full summary text                                                      |
| Tasks                    | List of tasks with: description, assignee, type, status (Pending/Done) |
| Tags                     | All applied tags (predefined + custom)                                 |
| Participants             | Names of all people who commented in the thread                        |
| Reply count              | Number of replies                                                      |
| Page                     | Figma page name where the thread is located                            |

### Export Formats

| **Format**       | **Structure**                                                                                                                                                                   | **Notes**                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **PDF**          | Report header (file name, export date, active filters/search) followed by sections per thread with all fields above. Tasks rendered as a table.                                 | Generated client-side via jsPDF.                     |
| **Markdown**     | `## Thread: [initiator — summary snippet]` heading per thread. Tasks as `- [ ]` / `- [x]` checklists. Metadata as key-value pairs. Grouped under `# [Page Name]` headings.      | Clean for Notion, GitHub, wikis.                     |
| **Plain Text**   | Flat text, one thread per block separated by `---`. Fields as `Label: Value` lines. Tasks as indented lines with `[ ]`/`[x]` prefixes.                                          | Universal compatibility.                             |
| **Figma Canvas** | One frame per page group, each containing sticky-note-style cards per thread (summary, status badge, task count, participants). Frames placed to the right of existing content. | Uses Plugin API. Confirmation dialog before placing. |

### Export UX

- Clicking the export button opens a dropdown with the five format options.
- A "What's included" tooltip explains that the export respects current filters/search.
- For PDF/MD/TXT: file is downloaded to the user's device.
- For Figma Canvas: a confirmation dialog ("This will add a frame to your current page. Continue?") precedes the action. The created frame is selected and scrolled into view.

### Acceptance Criteria

1. Export button is visible in the toolbar and opens a format picker.
2. All four formats (PDF, Markdown, Plain Text, Figma Canvas) are available.
3. Exports respect the current filter and search state — only visible threads are included.
4. PDF includes a header with file name, export date, and active filter summary.
5. Figma Canvas export creates a structured text frame on the current page with a confirmation dialog.
6. Export completes in <3s for up to 100 threads (PDF/MD/TXT). Figma Canvas may take longer with a progress indicator.

# 5. Non-Functional Requirements

## 5.1 Performance

| **Metric**                           | **Target**                   | **Measurement**                                          |
| ------------------------------------ | ---------------------------- | -------------------------------------------------------- |
| Initial load (500 comments)          | \<3 seconds                  | Time from plugin open to thread list render              |
| Filter application                   | \<200ms                      | Time from filter change to list update                   |
| Local summary generation             | \<500ms per thread           | Measured on average thread (5–10 comments)               |
| Cloud summary generation             | \<5s for batch of 10 threads | Includes network round-trip                              |
| Cloud summary with images            | \<8s for batch of 10 threads | Includes image fetch, resize, encode, and API round-trip |
| Navigate to comment                  | \<1 second                   | Time from click to canvas viewport settled               |
| Intermediate state change            | \<100ms                      | Local state change (no API call)                         |
| Keyword search filtering             | \<200ms                      | Debounce + render from keystroke to list update          |
| Export (PDF/MD/TXT, 100 threads)     | \<3 seconds                  | Time from format selection to file download              |
| Tag operation (apply/remove/create)  | \<100ms                      | Local storage operation                                  |
| Synced state change (Resolve/Reopen) | \<2 seconds                  | Includes REST API round-trip + confirmation dialog       |
| Memory usage                         | \<50MB                       | Measured with 1000+ comment file open                    |

## 5.2 Security & Privacy

- All API keys (PAT, AI provider keys, custom endpoint credentials) are stored in Figma’s clientStorage, which is sandboxed per plugin and per user.

- API keys are never logged, transmitted to any server other than the intended provider, or included in analytics.

- Cloud AI consent dialog is mandatory on first use and re-shown if the user changes provider.

- No comment data is persisted outside the user’s machine. In-memory cache is cleared on plugin close.

- Task completion states are the only persistent data (stored locally via clientStorage).

## 5.3 Accessibility

- All interactive elements are keyboard-navigable with visible focus indicators.

- Color contrast meets WCAG 2.1 AA standards (4.5:1 for body text, 3:1 for large text).

- Status badges use both color and iconography/text to convey state (no color-only communication).

- Screen reader support with ARIA labels on all interactive components.

## 5.4 Reliability & Error Handling

- REST API failures surface a clear error with retry option. If the failure persists, the plugin shows a diagnostic screen with common fixes (token expired, network issue, rate limited).
- **403 (token invalid/expired/revoked):** Show a dedicated Reconnect flow: message that the token may have expired or been revoked, link to Figma Settings, and re-enter-token flow (same as onboarding Step 2). Do not show a generic error. Optionally, on plugin open, call `GET /v1/me` to validate the stored token and prompt re-auth before any comment fetch if invalid.

- Cloud AI failures trigger fallback to local summarization per-thread.

- Network timeouts are set at 10 seconds for REST API, 15 seconds for AI provider APIs.

- All errors are surfaced with human-readable messages and remediation steps (never raw error codes).

- Plugin should never crash the Figma client; all operations wrapped in try/catch with logging.

# 6. Key User Flows

## 6.1 First-Time Setup

73. User installs plugin from Figma Community and launches it.

74. Welcome screen (Step 1) introduces the plugin with a concise value proposition.

75. PAT setup (Step 2, mandatory): instructions to generate a token, will/won’t-do transparency, and inline validation. Token verified via `GET /v1/me`, showing user’s name on success.

76. AI Provider (Step 3, skippable): user selects Local, Anthropic, OpenAI, Gemini, or Custom. If cloud provider is chosen, API key or config fields appear inline. Skipping defaults to Local.

77. Image Analysis (Step 4, conditional): only shown if a vision-capable cloud provider was selected. User toggles on/off with cost context. Skipping defaults to Off.

78. Default Scope (Step 5, skippable): user chooses Current Page or Entire Document. Skipping defaults to Current Page.

79. Confirmation (Step 6): summary of all choices (including defaults from skipped steps). User clicks “Launch Plugin.”

80. Dashboard loads with comments based on chosen defaults.

## 6.2 Daily Triage (Primary Flow)

81. Designer opens plugin at the start of their work session.

82. Dashboard loads with “Open + Addressed to Me” as the default filtered view.

83. Each thread shows a 1–2 sentence AI summary and task badges.

84. Designer scans summaries, clicks a thread to jump to the canvas location.

85. After addressing feedback, designer can mark tasks as done within the plugin.

86. Designer toggles to “Entire Document” scope to check other pages.

## 6.3 Manager Review

87. Lead opens plugin and selects “Entire Document” scope.

88. Filters to “With Tasks Only” to see outstanding action items.

89. Switches to the “Tasks” tab for an assignee-grouped task view.

90. Identifies blockers and follows up with team members.

# 7. Technical Architecture

## 7.1 System Components

| **Component**      | **Technology**                    | **Responsibility**                                                                                   |
| ------------------ | --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Plugin UI (iframe) | React + TypeScript + Tailwind CSS | Renders all UI components, handles user interaction, manages local state                             |
| Plugin Sandbox     | Figma Plugin API (TypeScript)     | Communicates with Figma canvas for viewport navigation and node data. Not used for comment fetching. |
| REST API Client    | Fetch API with retry logic        | Makes authenticated requests to Figma REST API for comment data                                      |
| AI Engine — Local  | TypeScript module                 | Rule-based summarization, keyword extraction, pattern matching for tasks                             |
| AI Engine — Cloud  | TypeScript module                 | Formats prompts, manages API calls to Anthropic/OpenAI/Gemini/custom endpoints, parses responses     |
| State Manager      | Zustand or similar                | Manages comment cache, filter state, task states, user preferences                                   |
| Storage Layer      | Figma clientStorage API           | Persists tokens, preferences, task states, filter defaults                                           |

## 7.2 Data Flow

The comment data flows through the following pipeline:

91. Plugin opens → checks clientStorage for cached PAT. If no PAT or PAT is invalid, user is directed to the setup screen.

92. Obtain file key: in V1, user pastes the Figma file URL; plugin parses the file key and stores it in clientStorage (see §3.1). If no file key is available, prompt user to paste before fetching. A “Different file” control allows re-paste when switching files.

93. Fetch comments via REST API (GET /v1/files/:key/comments).

94. Raw comment data is normalized into a unified CommentThread model.

95. Threads are passed to the AI Engine (local or cloud, per user preference).

96. AI Engine returns summaries + extracted tasks, which are attached to each thread model.

97. Enriched threads are stored in the state manager and rendered by the UI.

98. Filter changes operate on the in-memory enriched data (no re-fetch or re-summarization).

99. Manual refresh or TTL expiry triggers a re-fetch from step 93.

## 7.3 Key Data Models

### CommentThread

The core data model normalized from REST API responses:

| **Field**     | **Type**                                                           | **Source**                                     |
| ------------- | ------------------------------------------------------------------ | ---------------------------------------------- |
| id            | string                                                             | REST API                                       |
| fileKey       | string                                                             | From paste file URL (V1); or current file when API available (future) |
| pageId        | string                                                             | REST API client_meta                           |
| parentId      | string \| null                                                     | REST API (null for top-level)                  |
| author        | User { id, name, avatarUrl }                                       | REST API                                       |
| message       | string                                                             | REST API                                       |
| createdAt     | ISO 8601 datetime                                                  | REST API                                       |
| resolvedAt    | ISO 8601 datetime \| null                                          | REST API                                       |
| replies       | CommentThread[]                                                    | Derived from parentId grouping                 |
| clientMeta    | { x, y, nodeId, nodeOffset }                                       | REST API                                       |
| images        | string[] (CDN URLs)                                                | REST API (extracted from comment attachments)  |
| mentions      | string[] (user handles)                                            | Parsed from message text                       |
| workflowState | open \| read \| in_progress \| needs_review \| blocked \| resolved | Plugin state engine (synced for open/resolved) |
| stateHistory  | StateTransition[] (last 5)                                         | Local state change log for auditability        |
| tags          | Tag[]                                                              | User-applied tags (local only, per-user)       |
| summary       | string \| null                                                     | AI Engine output                               |
| tasks         | Task[]                                                             | AI Engine output                               |

### Task

| **Field**       | **Type**           | **Description**                                      |
| --------------- | ------------------ | ---------------------------------------------------- |
| id              | string (generated) | Unique identifier for the task                       |
| threadId        | string             | Parent thread reference                              |
| description     | string             | What needs to be done                                |
| assignee        | string \| null     | Detected assignee name or null if unassigned         |
| status          | pending \| done    | User-toggleable; persisted in clientStorage          |
| sourceCommentId | string             | The specific comment the task was extracted from     |
| detectedPattern | string             | The pattern type used for extraction (for debugging) |

### StateTransition

| **Field** | **Type**           | **Description**                                       |
| --------- | ------------------ | ----------------------------------------------------- |
| from      | WorkflowState      | Previous state                                        |
| to        | WorkflowState      | New state                                             |
| timestamp | ISO 8601 datetime  | When the transition occurred                          |
| trigger   | user \| figma_sync | Whether the user changed it or Figma sync overrode it |

### Tag

| **Field** | **Type**              | **Description**                                                                     |
| --------- | --------------------- | ----------------------------------------------------------------------------------- |
| id        | string (generated)    | Unique identifier for the tag                                                       |
| name      | string (max 24 chars) | Display name of the tag                                                             |
| color     | string (hex)          | Color from the 10-color preset palette                                              |
| type      | predefined \| custom  | Whether the tag is system-provided or user-created                                  |
| hidden    | boolean               | If true, predefined tag is hidden from the picker (custom tags are deleted instead) |
| createdAt | ISO 8601 datetime     | When the tag was created (custom only)                                              |

# 8. AI Prompt Engineering

When using cloud AI providers, the quality of summaries and task extraction depends heavily on the system prompt. Below is the reference prompt structure:

## 8.1 System Prompt (Summary + Task Extraction)

> **SYSTEM PROMPT TEMPLATE**
>
> ```
> You are an assistant that analyzes Figma design comment threads.
> For each thread, provide:
>
> 1. SUMMARY: A 1-3 sentence summary capturing the core feedback,
>    current state, and any decisions made. Write in present tense.
>    Be specific about design elements mentioned. If images are
>    attached, describe the relevant visual content and how it
>    relates to the feedback.
>
> 2. TASKS: Extract any action items, requests, or assignments.
>    For each task, provide:
>    - description: What needs to be done
>    - assignee: The @mentioned person, or "Unassigned" if none
>    - type: One of [revision, approval, blocker, question, general]
>
> Respond in JSON format. If no tasks are found, return an empty
> tasks array. Do not invent tasks that aren't clearly implied
> by the conversation.
> ```

## 8.2 Prompt Safety & Cost Controls

- **Max input:** Thread text is truncated to 4,000 tokens per thread to control cost and stay within context limits.

- **Batching:** Up to 10 threads are sent per API call, each clearly delimited, to minimize request count.

- **Cost estimation:** The plugin displays an estimated API cost before the first cloud summarization run for named providers (Anthropic, OpenAI, Gemini) based on total comment volume. For custom providers, cost estimation is skipped with a note that the user is responsible for monitoring usage.

- **Fallback:** If any individual thread in a batch fails to parse, the plugin falls back to local summarization for that thread only.

# 9. UI/UX Specifications

## 9.1 Plugin Window

- **Default size:** 340px wide × 580px tall (fits Figma’s standard plugin panel).

- **Resizable:** Yes, with a minimum width of 300px.

- **Theme:** Matches Figma’s current theme (light/dark) by default; user-overridable in settings.

## 9.2 Navigation Structure

| **Tab**      | **Content**                                   | **Lucide Icon** |
| ------------ | --------------------------------------------- | --------------- |
| **Threads**  | Main comment dashboard with filters           | `MessageSquare` |
| **Tasks**    | All extracted tasks grouped by assignee       | `CheckSquare`   |
| **Settings** | Configuration for tokens, AI, and preferences | `Settings`      |

## 9.3 Thread List Grouping

Threads are grouped by page under collapsible sections:

- Each section header shows the page name with a `ChevronDown` / `ChevronRight` (Lucide) toggle and a thread count badge.
- The page matching the user’s current canvas selection appears first, expanded by default. Other pages are collapsed.
- When scope is set to “Current Page,” a single flat list is shown (no collapsible header).

## 9.4 Thread Card Anatomy

Each thread card is a compact, tappable row:

- **Row 1:** Relative timestamp of last update (e.g., “2h ago”) aligned left + Status badge (Open/Resolved) aligned right.
- **Row 2:** AI summary text (max 2 lines, truncated with ellipsis).
- **Row 3:** Avatar group of all participants (current user first, max 5, `+N` overflow badge) + Task badge with count (`ClipboardList` Lucide icon; hover shows task summary tooltip) + Reply count (`MessageCircle` Lucide icon).

**Interactions:**

- **Tap card** → opens the Thread Detail Screen (see 9.5).
- **Long-press / right-click** → context menu: Copy link, Change state, Add tag.

## 9.5 Thread Detail Screen

Tapping a card navigates to a full-width detail screen (replaces the list). A back arrow (`ArrowLeft` Lucide icon) in the top bar returns to the list, preserving scroll position and filters.

**Layout (top to bottom):**

| **Section** | **Content**                                                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Header**  | Back arrow + page name + status badge + workflow state selector (`ChevronDown`)                                              |
| **Meta**    | Relative timestamp · thread initiator name · avatar group of all participants                                                |
| **Summary** | Full AI summary (no truncation). `RefreshCw` (Lucide) button to regenerate.                                                  |
| **Tasks**   | Extracted tasks: checkbox (Pending/Done), description, assignee avatar + name, type badge. Empty state: “No tasks detected.” |
| **Tags**    | Tag chips with `Plus` (Lucide) button to add more.                                                                           |
| **Thread**  | Collapsible full comment thread (`ChevronDown` toggle). Replies in chronological order with author, timestamp, and text.     |
| **Actions** | “Navigate to comment” button (`ExternalLink` Lucide icon) — jumps to canvas location.                                        |

## 9.6 Empty States

| **Context**                 | **Message**                                                 | **Action**                        |
| --------------------------- | ----------------------------------------------------------- | --------------------------------- |
| No comments in file         | “This file has no comments yet. Start the conversation!”    | None                              |
| No comments match filters   | “No threads match your current filters.”                    | "Clear filters" button            |
| No comments addressed to me | “You’re all caught up! No threads need your attention.”     | None                              |
| API error                   | “Couldn’t fetch comments. Check your connection and token.” | "Retry" + "Open Settings" buttons |
| No tasks detected           | “No action items found in the current threads.”             | None                              |

# 10. Success Metrics & KPIs

## 10.1 Product Metrics

| **Metric**                   | **Target (90 days)**                      | **Measurement Method**                 |
| ---------------------------- | ----------------------------------------- | -------------------------------------- |
| Weekly Active Users (WAU)    | 5,000+                                    | Figma plugin analytics                 |
| Avg. session duration        | \>3 minutes                               | Plugin analytics (open/close events)   |
| Comments triaged per session | 15+ thread views                          | Event tracking on thread card taps     |
| Task completion rate         | \>40% of detected tasks marked done       | clientStorage aggregation (anonymized) |
| Cloud AI adoption            | \>25% of users configure a cloud provider | Settings event tracking                |
| Retention (Week 4)           | \>30%                                     | Cohort analysis via plugin analytics   |

## 10.2 Quality Metrics

| **Metric**                | **Target**          | **Measurement Method**                 |
| ------------------------- | ------------------- | -------------------------------------- |
| Summary accuracy          | \>85% rated helpful | In-plugin thumbs up/down on summaries  |
| Task extraction precision | \>80%               | User dismissal rate as negative signal |
| Plugin crash rate         | \<0.1%              | Error logging                          |
| Avg. load time            | \<3s                | Performance telemetry                  |

# 11. Phased Delivery Roadmap

## Phase 1 — Foundation (Weeks 1–3)

Goal: Core infrastructure and basic comment browsing.

- PAT authentication flow + clientStorage management

- File key via paste file URL (Option C); Option A (request figma.fileKey from Figma) explored in parallel

- REST API client with retry logic and rate limiting

- Unified CommentThread data model and normalization

- Basic thread list UI (no AI, no tasks)

- Status filtering (Open / Resolved)

- Navigate-to-comment canvas integration

## Phase 2 — Intelligence (Weeks 4–6)

Goal: AI-powered summaries and task extraction.

- Local summarization engine (rule-based)

- Cloud AI integration (Anthropic, OpenAI, Gemini + custom OpenAI-compatible endpoint support)

- Prompt engineering and response parsing

- Multimodal image analysis (fetch, resize, encode, send for vision-capable providers)

- Task extraction pipeline (local + cloud)

- Summary display on thread cards and Thread Detail Screen

- Tasks tab with assignee grouping

- AI provider settings UI

## Phase 3 — Personalization & Workflow (Weeks 7–9)

Goal: Personalized views, advanced filtering, thread workflow states, and custom tags.

- @mention detection and “Addressed to Me” view

- Thread Workflow States engine (6-state model with Figma sync for Open/Resolved)

- State selector UI on Thread Detail Screen with confirmation dialogs for synced states

- Bulk state changes (multi-select + apply)

- Conflict detection and override logic (Figma as source of truth)

- Custom thread tags: predefined tag library + custom tag creation with color picker

- Tag picker UI, bulk tagging, and tag management in Settings

- Full filter system (author, date, scope, tasks, workflow state, tags)

- Page-level / Document-level scope toggle

- Filter persistence and chip UI

- Task status persistence (Pending / Done)

- Empty states for all contexts

- User preference: default filters

- Keyword search with real-time filtering and match highlighting

- Export functionality (PDF, Markdown, TXT, Figma Canvas)

## Phase 4 — Polish & Launch (Weeks 10–12)

Goal: Production readiness, performance, and community launch.

- Performance optimization (caching, lazy rendering, virtualized lists)

- Dark/light theme support and Figma theme matching

- Accessibility audit and WCAG compliance

- Error handling hardening and edge case coverage

- Analytics integration (plugin events)

- Figma Community listing (description, screenshots, video)

- Beta testing with 20–50 users, feedback incorporation

# 12. Risks & Mitigations

| **Risk**                                                   | **Likelihood** | **Impact** | **Mitigation**                                                                                                                                  |
| ---------------------------------------------------------- | -------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Figma REST API rate limiting causes slow/failed loads      | Medium         | High       | Aggressive caching with configurable TTL; queue-based request management; clear user feedback during throttling                                 |
| Figma changes or deprecates comment API endpoints          | Low            | Critical   | Abstracted data layer that decouples UI from API specifics; monitor Figma changelog; maintain close parity with API versioning                  |
| AI task extraction has high false-positive rate            | Medium         | Medium     | User-dismissable tasks with feedback loop; adjustable confidence threshold in settings; conservative default patterns                           |
| Users reluctant to provide PAT for security concerns       | Medium         | High       | Clear security messaging in onboarding; link to Figma’s official docs on PAT safety; explain minimal scopes required; token stored locally only |
| Cloud AI costs concern users                               | Low            | Medium     | Cost estimation before first run; local AI as capable default; batching to minimize API calls                                                   |
| Large files (1000+ comments) cause performance degradation | Medium         | High       | Virtualized list rendering; pagination; progressive summarization (visible threads first)                                                       |

# 13. Future Considerations (Post-V1)

The following capabilities are intentionally deferred from V1 but represent the natural evolution of the product:

- **Shared workflow states:** Allow team members to see each other’s intermediate thread states. Requires a lightweight backend service or shared storage layer (e.g., Figma file metadata, Firebase, or a plugin backend).

- **Custom workflow states:** Let teams define their own intermediate states beyond the default six, tailored to their specific review process.

- **Shared tags:** Allow team members to see each other’s tags on threads for collaborative categorization. Requires shared storage and conflict resolution for tag naming.

- **OAuth-based authentication (V2):** Replace or supplement PAT with OAuth (Sign in with Figma) and refresh tokens to reduce 403-driven re-auth and improve reliability. Requires Figma OAuth app registration, redirect URI (e.g. small backend or hosted page), and refresh flow. PAT may be supported during transition or deprecated in favor of OAuth.

- **Slack / Linear / Jira integration:** Push extracted tasks directly to project management tools. Requires OAuth and significant backend work.

- **Comment creation and reply:** Allow users to respond to threads from within the plugin. Requires write access via REST API.

- **Cross-file aggregation:** A unified comment inbox across all files in a team/project. Requires Figma team-level API access.

- **Real-time sync via webhooks:** Push-based updates instead of polling. Requires a backend service to receive Figma webhooks.

- **Analytics dashboard:** Comment velocity, resolution time, top commenters, feedback hotspots. Valuable for leads and managers.

- **Custom AI model fine-tuning:** Train on the team’s comment patterns for higher accuracy summaries and task extraction.

- **Batch resolve:** Allow users to resolve multiple threads at once after confirming tasks are done.

# 14. Open Questions

The following questions should be resolved during Phase 1 development:

1. **Local summarization quality bar:** What’s the minimum acceptable quality for local summaries? A user study during Phase 2 should determine if rule-based is sufficient or if a lightweight on-device model (e.g., ONNX) is needed.

2. **Task persistence model:** clientStorage has size limits. For power users with thousands of tasks over time, we may need a cleanup/archival strategy.

3. **Figma Community monetization:** Is this a free plugin, freemium (cloud AI gated), or paid? Pricing model should be decided before Phase 4.

# 15. Appendix

## 15.1 Figma REST API Reference

- **Verify Token:** GET /v1/me (used for PAT validation during onboarding; returns user name and ID)

- **Get Comments:** GET /v1/files/:file_key/comments

- **Post Comment:** POST /v1/files/:file_key/comments (future use)

- **Delete Comment:** DELETE /v1/files/:file_key/comments/:comment_id (future use)

- **Rate Limit:** ~30 requests per minute per token

- **Documentation:** https://www.figma.com/developers/api#comments

## 15.2 Glossary

| **Term**      | **Definition**                                                                            |
| ------------- | ----------------------------------------------------------------------------------------- |
| PAT           | Personal Access Token — a user-generated token for authenticating with the Figma REST API |
| Thread        | A top-level comment and all its replies, treated as a single conversation unit            |
| clientStorage | Figma’s per-plugin, per-user key-value storage API (async, sandboxed)                     |
| TTL           | Time To Live — the duration a cached item remains valid before requiring refresh          |
| client_meta   | REST API field containing the x/y canvas coordinates and node reference for a comment     |

_End of Document_
