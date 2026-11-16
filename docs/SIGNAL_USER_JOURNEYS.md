# Unool Signal — End-to-End User Journeys

**Version:** 1.0  
Validates all 10 required journeys across entry, monitoring, drill-down, cross-product handoff, multi-account isolation, and failure recovery.

---

## Journey 1: First-Time User (Zero Accounts / Zero Posts)
- **Trigger:** User opens `/dashboard/signal` right after onboarding with no connected platforms or zero published posts.
- **Flow:** Signal loads cleanly in `overview` -> displays Onboarding / Empty State card (zero fake charts or `0%` misleading drop deltas) -> clear CTAs to **Connect Social Accounts** (`/onboarding/connect`) and **Write First Post in Studio** (`/dashboard/studio`).

## Journey 2: Newly Connected Account Pending Sync / Early Data
- **Trigger:** User connected Instagram/LinkedIn and just published 1–2 posts (< 48h old or never synced).
- **Flow:** Operational badge highlights **Golden Hour Active** on the post; Sync Status shows `Pending initial platform sync` or `n = 1–2 (Low sample confidence)` with a one-click `Sync Live Metrics` trigger and explanation of upstream API propagation lag.

## Journey 3: Regular Creator Monitoring Weekly & Monthly Performance
- **Trigger:** Returning Creator/Founder enters `/dashboard/signal`.
- **Flow:** Lands on `overview` (default `30d`, compares previous 30d) -> scans 6 KPIs (`Views`, `Total Engagements`, `Engagement Rate`, `Published Output + Chronological Momentum`, `Bio Clicks`, `SignalDM Outcomes`) -> inspects interactive daily trend chart -> toggles to table/comparison -> checks `"What Worked & Next Best Actions"`.

## Journey 4: Metric-to-Post-to-Action Drill-Down
- **Trigger:** User notices `Question` hooks outperform `Statement` hooks (`+62%`) or wants to inspect top views.
- **Flow:** Clicks `Content & Hooks` (or clicks a Hook row / KPI card) -> Content list auto-filters to `status=published` + `hook=question`, sorted by engagement -> clicks a post row -> **Post Detail Inspector Drawer** opens showing per-variant metrics, raw extras (`readingTimeMinutes` / `upvoteRatio`), snapshot trajectory, and `"Repurpose in Studio"` -> opens `/dashboard/studio?repurposePostId=<id>`.

## Journey 5: Timing Exploration & Flight Plan Scheduling
- **Trigger:** User switches to `Timing & Cadence`, selects local timezone `Asia/Kolkata`.
- **Flow:** 7×24 Heatmap & Day/Hour bars recalculate in `Asia/Kolkata` strictly from `published_at` -> highlights top window `Tue 10:00` (`n=6`, median `48` interactions) -> user clicks heatmap cell -> sees contributing Tuesday 10 AM posts -> clicks `"Schedule slot in Flight Plan"` -> lands on `/dashboard/flightplan?slotDay=1&slotHour=10&tz=Asia/Kolkata&source=signal` ready to schedule.

## Journey 6: Multi-Account & Cross-Platform Normalization Check
- **Trigger:** Agency user publishes one post to 2 Instagram accounts (`@brand_main`, `@founder_ig`) and 1 LinkedIn personal profile + 1 Discord channel.
- **Flow:** Filtering by `account` isolates `@brand_main` vs `@founder_ig` cleanly; Content card renders both IG pills via `variant.id` without hiding the second account; `Channels & Funnel` shows IG (`Full Metrics`), LinkedIn (`Interactions Only`, `Views: N/A`), and Discord (`Publish-Only Pipe`, `N/A`), never summing IG metrics onto LinkedIn.

## Journey 7: Bio-Link & SignalDM Funnel Attribution
- **Trigger:** Creator runs Instagram Reel campaign with `"Comment GUIDE"` automation + `/u/alex` link in bio.
- **Flow:** In `Channels & Funnel`, creator checks Presence Bio-Link Funnel (Profile Views, Link Clicks, CTR, Top Links, Top Referrers) next to SignalDM Conversions (Comments Replied, DMs Sent, High-Intent Leads) and jumps cleanly via `"Manage Automation ->"` (`/dashboard/automation`) or `"Detailed Template Analytics ->"` (`/dashboard/settings`).

## Journey 8: Live Publish Operational Recovery
- **Trigger:** User clicks Publish in Studio; `SignalStrip` appears globally at bottom -> 1 variant fails due to expired token while 2 succeed.
- **Flow:** User clicks Signal link in `SignalStrip` -> `Overview` Operational Alert Banner highlights `1 variant failed` -> clicks `"View Failed Posts"` -> opens Post Detail Inspector -> sees sanitized failure reason + `"Reconnect Account"` (`/onboarding/connect`) or `"Retry Variant"`.

## Journey 9: API Rate Limit / Partial Outage / Error Recovery
- **Trigger:** X API returns `429 Rate Limit` or Instagram returns `401 Token Expired` during sync, OR `/api/signal/analytics` fails transiently.
- **Flow:** Existing persisted metrics in `platform_posts.engagement` remain intact (`non-destructive retention`); Sync banner displays `"Partial sync: X rate-limited (cached from 2h ago); Instagram token expired [Reconnect]"`; network errors render explicit Retry Error banner rather than fake zeroed charts.

## Journey 10: Report Export & Stakeholder Sharing
- **Trigger:** Pro/Studio user filters `90d` LinkedIn + Instagram report, clicks `Export`.
- **Flow:** Clicks `"Download CSV"` -> hits `GET /api/signal/export?range=90d&...` (enforces workspace `csv_export` plan permission & escapes CSV formulas against spreadsheet injection!) -> downloads clean variant/post report matching UI numbers verbatim; OR clicks `"Print / Save PDF"` -> triggers clean print-optimized Signal summary layout. Spark/Creator users clicking CSV see an honest upgrade prompt (`Pro plan required for CSV export -> Upgrade in Billing`) without crashing.
