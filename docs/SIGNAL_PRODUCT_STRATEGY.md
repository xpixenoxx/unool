# Unool Signal — Product Strategy & Phase 1 Verification Register

**Version:** 1.0  
**Product Area:** Signal (`/dashboard/signal`) — Analytics, Content Intelligence & Publishing Telemetry Hub  

---

## 1. Phase 1: Verified Current-State Audit Register

Inspection of the current repository confirms the root causes discovered during initial investigation:

| ID | Area | Verified Repository Evidence | Impact Before Redesign | Resolution in This Initiative |
|---|---|---|---|---|
| **VER-01** | **Non-Existent DB Columns** | `app/api/signal/resonance/route.ts:64` selects `hook_type, word_count, has_media` from `posts`. Neither `supabase-schema.sql` nor any migration creates those columns; `adapt`, `save-draft`, `broadcast`, `schedule` never write them. | Risk of PostgreSQL `42703` empty state in `/api/signal/resonance`; `hookBreakdown`, `mediaLift`, `EffortMatrix` permanently degraded/empty in `/api/signal/posts`. | Add idempotent migration `20261116000003_signal_analytics_foundation.sql` (`hook_type`, `hook_formula_id`, `hook_score`, `word_count`, `has_media`, `media_count`, `content_format`, `campaign_tag`) + deterministic backfill + populate on all write routes + non-breaking fallback in query layer. |
| **VER-02** | **Inverted Momentum Delta** | `components/analytics/AnalyticsDNA.tsx:458-463` splits `recentPatternRows` (`created_at DESC`) with `f1` = newest half and `f2` = older half, then computes `(f2 - f1) / f1`. | Positive trending accounts show negative Momentum (`-X%`) and declining accounts show positive growth. | Replace with chronological period-over-period comparison in canonical `lib/analytics/signalEngine.ts` (current window vs equal prior window, or chronological older->newer half when custom). |
| **VER-03** | **Cross-Platform Misattribution** | `components/analytics/AnalyticsDNA.tsx:358-365` sums whole-post `p.engagement` onto IG & LI cards in `PlatformIntelligence`, while `PlatformBreakdown` uses per-variant `v.engagement`. | Contradictory numbers on the same screen (`Platforms` subtab). | Move ALL platform & account attribution to strict variant-level math in `signalEngine.ts`. |
| **VER-04** | **UTC Server Timezone & Wrong Timestamp** | `app/api/signal/resonance/route.ts` buckets `created_at` with Node `.getDay()` / `.getHours()` (UTC in serverless runtime) instead of `published_at` and user timezone. | Best-time heatmaps shifted by user UTC offset and polluted by draft creation times. | Require explicit IANA `tz` query parameter (`Intl.DateTimeFormat`), bucket strictly `published` variants by `published_at ?? created_at`. |
| **VER-05** | **Inflated Denominators & Dropped Failures** | `app/api/signal/resonance/route.ts:66` filters `.in('status', ['published', 'draft', 'scheduled'])`. | `totalPosts` includes un-published drafts & future scheduled items, diluting `avgInteractionsPerPost`; `failed`/`publishing` hidden. | Separate **Published Analytics** (`status = 'published'`, published variants only) from **Queue / Pipeline Operational Counts** (`publishing`, `scheduled`, `draft`, `failed`). |
| **VER-06** | **Normalizer Drops Blog/Community Reactions** | `lib/services/analytics/normalize.ts:32-44` omits `raw.reactions` and `raw.positiveReactions` emitted by `DevtoAdapter.ts`, `HashnodeAdapter.ts`, and `MeweAdapter.ts`; drops extra raw fields. | Zero engagement reported for Dev.to, Hashnode, MeWe posts. | Extend `normalize.ts` (`reactions`, `positiveReactions`, `pageViews`, `downvotes`, `sent`, etc.) while preserving `rawMetrics` (`_raw`) for inspector drill-down. |
| **VER-07** | **Multi-Account Variant Hiding & Sync Bugs** | `SignalClient.tsx:988-1005` deduplicates variants solely by `v.platform`; mislabels published variants without `platformUrl` as `"Publishing to..."`; sync fires duplicate parallel `?sync=true` calls; fails to update `memory*` cache; Share Story ignores post ID. | Second Instagram/LinkedIn account disappears from cards; Share always shares latest post; HTTP 500 sync can show false success. | Render all variants keyed by `variant.id` with account identifier; distinguish published-without-URL from `publishing`; single coalesced sync endpoint with honest per-account error/rate-limit provenance; `/u/[sub]?activity=<postId>`. |
| **VER-08** | **Fragmented 4-Silo Analytics & Broken Links** | Overview (`/dashboard`), Signal (`/dashboard/signal`), LinkedIn (`/analytics/linkedin`), Template Analytics (`/api/profile/analytics` — also contains `auth` bypass IDOR + `avgSessionDuration: 45` mock). `AnalyticsDNA` links "Connect Social Accounts" to `/dashboard/settings`. | Users bounce across 4 disconnected tools with conflicting numbers and dead-end links. | Unify post metrics via canonical `signalEngine.ts`, fix `/api/profile/analytics` IDOR & mock, wire contextual navigation (`Studio`, `FlightPlan`, `Overview`, `LinkedIn`, `Automation`, `/onboarding/connect`), fix broken links. |
| **VER-09** | **FlightPlan Draft Misrouting & Non-Realtime Tables** | `app/api/flightplan/generate/route.ts` stamps `post-adapter-v2` without `arcId`, misrouting to Studio instead of Flight Plan; `posts`/`post_variants` missing from Supabase Realtime publication. | Unscheduled Flight Plan drafts open wrong editor; Realtime listeners silently stay idle. | Support explicit origin (`ai_origin` / `arc_id` context) in `getDraftRedirect` & Composer/FlightPlan handoffs; keep graceful polling/manual refresh without broken Realtime assumptions. |
| **VER-10** | **Hover-Only `<canvas>` Accessibility & Duplication** | `SignalClient` renders duplicate Feed & Post DNA cards; `AnalyticsDNA` uses raw `<canvas>` charts unusable on touch/keyboard/screen readers. | No keyboard/SR parity, weak mobile tooltips, redundant 2-tab clutter. | Replace fragmented canvas/duplicate tabs with accessible responsive SVG + semantic DOM charts, tabular fallbacks, keyboard focus, and 4 unified non-overlapping Signal views. |

---

## 2. Target User Segments & PMF Evaluation

Evaluated directly against Unool's onboarding personas (`lib/config/studioOnboarding.ts`: `Founder`, `Creator`, `Influencer`, `Software engineer`, `Company / Brand`, `Student`) and billing plans (`lib/billing/plans.ts`: `Spark`, `Creator`, `Pro`, `Studio`):

| Segment | Who They Are in Unool | Core Pain in Current Signal | Fit & Urgency (1–5) | Why They Choose Unool Signal Over Metricool/Sprout |
|---|---|---|---|---|
| **1. Founder / Solopreneur / Dev-Creator** (Primary Wedge) | Uses Studio AI adaptation + HookScorer + LinkedIn/X/Threads/Dev.to + `/u/[subdomain]` profile link + occasional Flight Plan | Writes multi-platform content in Studio, publishes across 3–5 channels, opens Signal and sees broken Effort Matrix, inverted Momentum, wrong UTC hours, and zero attribution between Hooks -> Engagement -> Profile Link Clicks | **5 / 5** (Highest daily active overlap with Studio & Presence) | Only analytics hub that tells them *which hook formula & length actually drove reach + profile link clicks across their writing + publishing workflow*, without $99/seat pricing |
| **2. Interactive Creator / Instagram + SignalDM Operator** (High-Expansion Segment) | Runs IG/FB/Threads posts + SignalDM comment-to-DM automation & follow-gates (`Creator`/`Pro` tiers) | IG post metrics exist in Signal, bio clicks live in Overview/Settings, and DM conversions live in Automation — impossible to see full content -> engagement -> DM lead loop in one place | **5 / 5** | Bridges post engagement directly to Profile CTA clicks and SignalDM automated replies/leads in the `Channels & Funnel` view |
| **3. Multi-Account Brand / Boutique Agency (`Studio` tier)** | Manages multiple connected accounts per platform (`20261114000001_multi_account_platform_connections.sql`) + client reporting | Signal deduplicates variants by `platform`, hiding 2nd account results, and lacks clean CSV / printable stakeholder reporting despite `csv_export: true` in `Studio`/`Pro` plans | **4 / 5** | Per-account variant metrics, plan-gated CSV & printable Executive Summary reports, honest API capability explanations for clients |
| **4. Students / Occasional Posters (`Spark` tier)** | Publishes <=15 posts/month on 1–2 channels inside 30-day retention window | Overwhelmed by empty canvases & broken charts after publishing only 2–3 posts | **3 / 5** | Low-data honest state (`n = 2` sample badge, clear operational queue + first-post checklist) encourages activation into Creator/Pro |

### Prioritized PMF Hypotheses
1. **H1 (Content Loop Activation):** Connecting deterministic `HookScorer` formula + word-count + media attributes directly to per-variant published engagement in Signal will increase weekly Studio/Flight Plan creation triggers initiated from Signal insights (measurable via `Repurpose in Studio` / `Schedule slot in Flight Plan` deep-link flows).
2. **H2 (Trust & Retention via Metric Truth):** Eliminating conflicting denominators, inverted Momentum, UTC time skew, and silent sync failures—and explicitly separating `0` from `API Unavailable`—removes core distrust that prevents paid upgrade to `Creator`/`Pro`.
3. **H3 (Full-Funnel Value beyond Schedulers):** Unifying post performance + Profile bio-link clicks (`/u/[sub]`) + SignalDM lead volume proves Unool isn't just another scheduler, differentiating against Buffer/Typefully at 5x lower cost than Sprout/Hootsuite.

---

## 3. Product Identity & Strategic Guardrails

- **Product Identity:** **Signal is Unool's Closed-Loop Content & Attribution Intelligence Engine.**
- **What Signal IS:**
  1. Single source of truth for post, variant, account, hook/format, timing, and downstream Presence/SignalDM conversion telemetry.
  2. Real-time operational monitor for in-flight publishing (`publishing` / `failed` / `scheduled`) seamlessly linked with `SignalStrip`.
  3. Action launcher directly back into Studio (`/dashboard/studio`), Flight Plan (`/dashboard/flightplan`), LinkedIn Insights (`/analytics/linkedin`), and Automation (`/dashboard/automation`).
- **What Signal IS NOT:**
  - Not a synthetic score generator inventing follower demographics, ad spend ROI, or competitor data where APIs are absent.
  - Not an internal SaaS Admin console (`/admin/analytics` stays strictly separate for operator telemetry and billing KPIs).
  - Not a duplicate clone of `/dashboard/publish` or `/dashboard/settings`.
