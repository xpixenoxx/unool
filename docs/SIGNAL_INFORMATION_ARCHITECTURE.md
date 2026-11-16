# Unool Signal — Information Architecture

**Version:** 1.0  
**Route:** `/dashboard/signal` (plus legacy redirect from `/dashboard/publish`)  

---

## 1. Problems Solved in Legacy IA

Legacy Signal had:
1. Two redundant post-list tabs (`Feed` and `Post DNA`) displaying the same 50 posts with slightly different styling.
2. A third tab (`Analytics`) containing 4 hidden subtabs (`Growth & Reach`, `Best Times`, `Effort & ROI`, `Platforms`), creating a 2-tier navigation hierarchy that hid analytics behind clicks and disconnected posts from metrics.
3. No shared filter state across tabs (Search & platform pills filtered `Feed`, partially ignored by `Post DNA` and `AnalyticsDNA`).
4. No post detail drill-down drawer; clicking a chart point or KPI did nothing.
5. Misrouted "Connect Social Accounts" link (`/dashboard/settings` instead of `/dashboard` or `/onboarding/connect`).

---

## 2. Target Signal Information Architecture

Signal now uses a **1-Level Coherent Workspace** built around **1 Persistent Global Filter + Sync Health Header** and **4 Distinct, Interconnected Views** synced via URL query parameters (`?view=overview|content|timing|channels&range=7d|30d|90d|365d|all&platform=...&account=...&status=...&hook=...&format=...&tz=...`):

```
/dashboard/signal
├── Global Header & Sync Freshness Bar
│   ├── Title + Live Sync Button (manual coalesced refresh + lastSyncedAt provenance)
│   ├── Retention Notice Badge (reflects plan's analytics_retention_days: 30d/90d/365d/unlimited)
│   ├── Export Menu: Download CSV (/api/signal/export) + Print / Save Executive Report
│   └── Global Filter Bar (shared across ALL views + persisted in URL query params)
│       ├── Date Range (7d, 14d, 30d, 90d, 365d, All) + Previous Period Compare Toggle
│       ├── Platform Filter & Connected Account Filter (supports multi-account platform_connections)
│       ├── Hook Style / Content Format / Media Type Filter
│       ├── Campaign / Flight Plan Origin Filter (All, Flight Plan Arcs, Studio/Manual)
│       └── Timezone Selector (defaults to browser IANA TZ, e.g. Asia/Kolkata, America/New_York)
│
├── View 1: Overview (?view=overview, default)
│   ├── Operational Alert Banner (shown conditionally if any post is publishing, failed, or overdue scheduled)
│   ├── 6-Card Executive KPI Strip (strictly separated metrics + tooltips + period deltas + sample n)
│   │   ├── Views / Impressions (explicit "Across view-capable platforms" scope)
│   │   ├── Total Engagements (Likes/Reactions + Comments + Shares + Saves)
│   │   ├── Weighted Engagement Rate (calculated ONLY across variants where views > 0)
│   │   ├── Published Output & Chronological Momentum (Published variants + current vs prior period delta)
│   │   ├── Profile Bio-Link Clicks & CTR (/u/[subdomain] funnel from analytics_events)
│   │   └── SignalDM Automated Outcomes (Comments handled & DMs dispatched, clearly distinct from social likes)
│   ├── Performance Over Time Chart (Interactive dual/toggle SVG daily series + accessible data table toggle + period overlay)
│   ├── Channel & Account Quick Comparison Bar (click any bar -> filters & drills into Channels or Content)
│   └── "What Worked & Next Best Actions" (Deterministic rule-based findings with sample counts & one-click Handoffs)
│       ├── Top Hook Style / Formula -> [Draft with this hook in Studio]
│       ├── Media vs Text Lift -> [Create visual post]
│       ├── Best Time Slot -> [Schedule slot in Flight Plan]
│       └── Highest-Converting Bio Link -> [Edit Presence Profile]
│
├── View 2: Content & Hooks (?view=content)
│   │   (Merges & upgrades legacy Feed + Post DNA + Effort/ROI — zero duplication)
│   ├── Hook Performance & Content Strategy Strip
│   │   ├── Hook Formula & Style Leaderboard (table + bars: avg/median interactions, avg views, sample n, confidence tier)
│   │   ├── Word-Count Effort Brackets (<30, 30-79, 80-159, 160+ words + interactive accessible scatter plot)
│   │   └── Media vs Text-Only Impact (published-only denominator)
│   ├── Operational Status Pills & Sort Controls
│   │   ├── Status: All | Published | Publishing | Scheduled | Draft | Failed (showing counts)
│   │   ├── Sort: Newest | Top Engagement | Top Views | Top Eng Rate | Most Discussed
│   │   └── Layout Switch: Cards | Compact Performance Table
│   ├── Unified Post List (each item clickable -> opens Post Detail Inspector Drawer)
│   │   ├── Per-Variant Account Pills (keyed by variant.id, shows @accountHandle / page name, no multi-account hiding)
│   │   ├── Honest Variant Status ("Published · Link Pending", "Live", "Publishing...", "Failed (reason)", "Scheduled")
│   │   ├── Hook Style Badge + Formula Match + Word Count + Golden Hour Window (computed from published_at)
│   │   └── Quick Actions: Inspect Details | Share Story (?activity=postId) | Repurpose in Studio | Delete
│   └── Post Detail Inspector Drawer (Slide-over / Modal Dialog, ARIA role="dialog")
│       ├── Full master prompt/copy + per-variant adapted text + hashtags + media preview
│       ├── Variant-by-Variant Metrics Grid + Explicit Unsupported-Metric Callouts (e.g. LinkedIn member views unavailable)
│       ├── Raw Platform-Specific Metrics (_raw: readingTimeMinutes, upvoteRatio, downvotes, pageViews, clicks, sent)
│       ├── Historical Snapshots Trajectory (when post_engagement_snapshots has >= 2 checkpoints)
│       └── Actions: View on Platform | Copy Caption | Retry Failed Variant | Open in Studio | Reschedule in Flight Plan
│
├── View 3: Timing & Cadence (?view=timing)
│   ├── Timezone Banner & Selector ("All times rendered in Asia/Kolkata — bucketed by published_at")
│   ├── Interactive 7×24 Day-by-Hour Performance Matrix (SVG/Grid heatmap + keyboard navigable cells + tabular fallback)
│   │   ├── Toggle Metric: Avg Interactions | Avg Views | Post Volume
│   │   └── Click any cell -> highlights contributing posts & offers "Schedule in Flight Plan for <Day> <Hour>"
│   ├── Day-of-Week & Hour-of-Day Breakdown Bars (published posts only; minimum-sample warning badge when n < 3)
│   └── Publishing Cadence & Consistency Card (posts/week, active days in window, Golden Hour reminder)
│
└── View 4: Channels, Accounts & Funnel (?view=channels)
    ├── Per-Account & Per-Platform Leaderboard (strictly variant-scoped — IG only sums IG variants, LI only sums LI variants)
    │   ├── Connection Health Badges (Connected / Token Expired / Reconnect CTA -> /onboarding/connect)
    │   ├── API Capability Tier Pill ("Full Metrics" / "Engagement Only" / "Publish Only")
    │   └── Explicit "N/A (Platform API)" vs "0" distinction on every column
    ├── Platform Capability Reference Drawer/Accordion (sourced directly from PLATFORM_CAPABILITIES registry)
    ├── Cross-Surface Attribution Bridges
    │   ├── LinkedIn Deep Insights Card -> link to /analytics/linkedin
    │   ├── Presence Profile Funnel Card -> Profile Views, Link Clicks, Top Links, Top Referrers + Settings analytics link
    │   └── SignalDM Automation Funnel Card -> Comment Replies, DMs Sent, Follow-Gate Unlocks -> link to /dashboard/automation
    └── Connect More Accounts CTA -> /onboarding/connect or /dashboard (fixes legacy /dashboard/settings misroute)
```

---

## 3. Drill-Down Guarantee

Every high-level summary supports explicit drill-down without leaving context behind:
1. **KPI Card Click** -> Navigates to the backing Signal view with matching sort/filter (`Top Views` -> `Content` sorted by views; `Bio Clicks` -> `Channels & Funnel`).
2. **Chart Day / Channel Bar / Hook Row Click** -> Filters Content & Hooks to matching platform/hook/time bucket or scrolls to contributing posts.
3. **Timing Cell Click** -> Lists exact posts published in that slot and links directly to `/dashboard/flightplan?slotDay=...&slotHour=...&tz=...`.
4. **Post Row/Card Click** -> Opens the **Post Detail Inspector Drawer** showing every variant, capability note, snapshot trend, and action (`Repurpose in Studio`, `Reschedule`, `Retry`, `Share Story`, `Delete`).
5. **Global Filter Bar Reset** -> One-click `Clear all filters` restores default workspace state cleanly.
