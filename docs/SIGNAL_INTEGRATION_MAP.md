# Unool Signal — Cross-Product Integration Map

**Version:** 1.0  
**Scope:** Bidirectional integrations across Studio, Flight Plan, Overview Dashboard, Presence (`/u/[subdomain]`), LinkedIn Insights (`/analytics/linkedin`), SignalDM Automation (`/dashboard/automation`), and `/admin` isolation boundary.

---

## 1. Integration Architecture Diagram

```
   ┌────────────────────────────────────────────────────────────────────┐
   │                        UNOOL STUDIO WORKSPACE                      │
   │                                                                    │
   │  [Overview /dashboard] ◄──── Profile & Pace Stats ────► [Presence /u/sub]
   │         │                                                    ▲     │
   │         │ Deep-link to Signal (?view=...)                    │     │
   │         ▼                                      Link Clicks & │     │
   │  ┌───────────────────────────────────────┐      CTAs (?activity=id)│
   │  │      SIGNAL (/dashboard/signal)       │───────────────────┘     │
   │  │   Shared Engine: signalEngine.ts      │                         │
   │  └──┬─────────────┬──────────────┬───────┘                         │
   │     │             │              │                                 │
   │     │ Hook / Post │ Slot Day/Hr  │ Deep-Dive / Lead Outcome        │
   │     ▼             ▼              ▼                                 │
   │  [Studio]     [Flight Plan]   [LinkedIn Insights] & [SignalDM Auto]│
   │ (/composer)  (/flightplan)   (/analytics/linkedin)  (/automation) │
   └────────────────────────────────────────────────────────────────────┘
                                    ✕ STRICT BOUNDARY
                        [Admin Telemetry (/admin)] — Never mixed into creator Signal
```

---

## 2. Verified Endpoint & Navigation Contracts

### A. Signal -> Studio (`/dashboard/composer` -> `/dashboard/studio`)
- **Action Triggers:**
  1. `"Repurpose in Studio"` inside PostCard / Post Detail Inspector passes `?repurposePostId=<postId>&platform=<platform>` (and Studio safely preloads original/adapted content for editing as a new draft without overwriting the published post).
  2. `"Draft with winning hook"` on Overview / Hook Leaderboard passes `?hookStyle=<hookType>&suggestedHook=<sample>&platform=<platform>`.
  3. `"Open draft"` on unpublished Studio drafts keeps `getDraftRedirect(post)` behavior (`/dashboard/composer?postId=<id>`).
- **Write-Back Telemetry:**
  - `/api/composer/adapt`, `/api/composer/save-draft`, and `/api/composer/broadcast` invoke shared `extractPostTelemetry(content, mediaUrls, hookMetadata)` so `hook_type`, `hook_formula_id`, `hook_score`, `word_count`, `has_media`, `media_count`, and `content_format` persist automatically on save/adapt/publish.

### B. Signal -> Flight Plan (`/dashboard/flightplan`)
- **Action Triggers:**
  1. `"Schedule in Flight Plan"` from Timing & Cadence best-slot cards or heatmap cell click navigates to `/dashboard/flightplan?slotDay=<0-6>&slotHour=<0-23>&tz=<ianaTz>&source=signal`.
  2. `"Open in Flight Plan"` on scheduled or Flight Plan-originated drafts keeps `getDraftRedirect(post)` (`/dashboard/flightplan?postId=<id>`).
  3. `/api/flightplan/generate` & `/api/composer/arc/generate` stamp `arc_id` / `campaign_tag` AND populate post telemetry (`word_count`, `hook_type`, `has_media`) cleanly so `Signal` never misclassifies unscheduled Flight Plan drafts.
- **UI Handling in Flight Plan (`WeekCanvas.tsx` / `FlightPlanClient.tsx`):**
  - Reads optional `slotDay`, `slotHour`, `source=signal` params to pre-select the recommended weekday tab and surface a subtle contextual banner (`Scheduled slot from Signal timing insight`).

### C. Overview Dashboard (`/dashboard`) <-> Signal (`/dashboard/signal`)
- **Metric Parity:**
  - `/dashboard` uses `/api/analytics/insights` for bio-profile views, link clicks, posts/week, and peak hour, and displays a concise Signal Post Performance snapshot + direct `"Open Full Signal Analytics ->"` links into `/dashboard/signal?view=overview` and `/dashboard/signal?view=channels`.
- **Sidebar Discovery (`app/dashboard/layout.tsx`):**
  - Update Signal nav description from narrow `"Post history & resonance"` to accurate `"Analytics, hooks, timing & live feed"`.

### D. Presence & Bio-Link (`/u/[subdomain]`, Settings -> Analytics Tab) <-> Signal
- **Single-Post Activity Deep-Link Fix:**
  - `PostCard` / Inspector `"Share Story"` links to `/u/[subdomain]?activity=<postId>`.
  - `app/u/[subdomain]/page.tsx` and `/api/profile/[subdomain]` support optional `?activity=<postId>` selection cleanly (falling back safely to latest published post only if not found — never exposing drafts!).
- **Template Analytics Hardening (`app/api/profile/analytics/route.ts` & `TemplateAnalyticsTab.tsx`):**
  - Remove unauthenticated `?workspaceId=` fallback IDOR; enforce `verifyWorkspaceAccess`!
  - Replace hardcoded `avgSessionDuration: 45` mock with `null` / honest tracked metric (`N/A` unless session duration events are captured).
  - Surface matching bio-profile KPIs inside Signal's `Channels & Funnel` view alongside a link to Settings Template Analytics.

### E. LinkedIn Insights (`/analytics/linkedin`) <-> Signal
- LinkedIn personal `w_member_social` posts lack impressions/views in Signal (`N/A`).
- Signal `Channels & Funnel` view includes a dedicated **LinkedIn Deep Insights** bridge linking directly to `/analytics/linkedin` (where AI/historical CSV or synced LI comment/post tools live), and `/analytics/linkedin` links back to `/dashboard/signal?platform=linkedin`.

### F. SignalDM Automation (`/dashboard/automation`) <-> Signal
- Signal queries workspace-scoped counts from `instagram_comment_logs` / `instagram_dm_logs` (gracefully optional across FB/Threads tables) and presents them under a **separate Automation Conversion** section in `Overview` and `Channels & Funnel`, linking directly to `/dashboard/automation?tab=comments` or `?tab=flagged`.
- Automation DM counts are **NEVER mixed** into social post `likes` / `comments` / `totalEngagements`.

### G. Account Connection & Live Strip (`SignalStrip`)
- Legacy `AnalyticsDNA` `"Connect Social Accounts"` linked to `/dashboard/settings` (API keys). Fixed to link to `/onboarding/connect` and `/dashboard#platforms`.
- `SignalStrip` global publishing tracker stays mounted in `app/dashboard/layout.tsx` and dispatches live status updates consumed by `/dashboard/signal` seamlessly.
- `/admin/analytics` and `/api/admin/**` remain strictly isolated for superadmins only.
