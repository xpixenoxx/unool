# Unool Signal — Final Verification & Release Readiness Report (Phase 9)

**Version:** 1.0  
**Target Route:** `/dashboard/signal`  
**Audit Standard:** Zero fabricated analytics, zero fake controls, single canonical calculation engine (`lib/analytics/signalEngine.ts`), strict multi-account/multi-tenant boundaries, explicit disclosure of API & verification boundaries.

---

## 1. End-User Journey Verification Matrix

| Journey | Scenario & Route Path | Code Path Verified | Test / Evidence | Verdict |
|---|---|---|---|---|
| **J1: First-Time User** | 0 connected accounts, 0 posts | `SignalClient.tsx` detects `connectedAccountCount === 0` & `totalPosts === 0`, renders onboarding welcome card with `1. Connect Social Accounts` (`/onboarding/connect`) & `2. Write in Studio` (`/dashboard/studio`). | `SignalClient.test.tsx` (test 3) | **VERIFIED (Mocked UI)** |
| **J2: Connected, Pending Sync / Golden Hour** | Posts < 48h old or `sync_status = 'pending'` | `signalEngine.ts` computes `isGoldenHour` & `goldenHourRemainingMin` from `publishedAt ?? createdAt`; UI shows Golden Hour badge + sync provenance rather than `0` blame. | `signalEngine.ts`, `SignalClient.tsx`, `syncEngagement.ts` | **VERIFIED (Code + Engine)** |
| **J3: Regular Creator Monitoring** | Daily/weekly check of Overview | Default `?view=overview&range=30d&compare=1` loads 6 distinct KPIs (`Views`, `Total Engagements`, `Weighted Eng. Rate`, `Published Output + Momentum`, `Bio-Link Clicks`, `SignalDM Leads`), interactive SVG + tabular daily trend chart, and `"What Worked & Next Actions"`. | `SignalClient.test.tsx` (test 4), `SignalCharts.tsx` | **VERIFIED (Mocked UI)** |
| **J4: Metric-to-Post-to-Action Drill-Down** | Overview KPI/Hook -> Content -> Inspector -> Studio | Clicking hook/KPI switches to `?view=content` with matching filter; clicking `Inspect` opens accessible `role="dialog"` `PostInspectorDrawer` fetching `/api/signal/posts/[postId]` (variants, raw extras, snapshots) + `"Repurpose in Studio"` (`/dashboard/studio?repurposePostId=...`). | `SignalClient.test.tsx` (test 4), `ComposerClient.tsx:353-390` | **VERIFIED (Mocked UI + Code)** |
| **J5: Timing Exploration -> Flight Plan** | Timing & Cadence TZ shift & slot booking | `SignalClient` timezone dropdown updates `?tz=` (defaulting to browser IANA TZ); `TimingHeatmapMatrix` plots strictly `published` items by `published_at ?? created_at`; clicking a cell reveals contributing posts + `"Schedule slot in Flight Plan"` (`/dashboard/flightplan?slotDay=&slotHour=&tz=&source=signal`). | `signalEngine.test.ts` (`Asia/Kolkata` vs `America/New_York`), `WeekCanvas.tsx`, `FlightPlanClient.tsx` | **VERIFIED (Engine + Code)** |
| **J6: Multi-Account & Cross-Platform Check** | 2 IG accounts + LinkedIn + Discord in 1 post | Variants keyed by `variant.id` and grouped by `(platform, platformAccountId, accountLabel)` — both `@brand_main` and `@founder_ig` appear on cards and Channels table; LI `views: null` (`N/A`); Discord marked `Publish-Only Pipe`. | `signalEngine.test.ts`, `SignalClient.test.tsx` (test 4) | **VERIFIED (Unit + UI)** |
| **J7: Bio-Link & SignalDM Funnel Attribution** | Profile Views -> Clicks & Comment -> DM -> Leads | `signalDataLoader.ts` pulls workspace `analytics_events` (`profile_view`, `link_click`, `cta_click`) and SignalDM tables (`instagram_comment_logs`, `instagram_dm_logs`, `instagram_flagged_comments`), shown separately in `Channels & Funnel` with links to `/dashboard/automation` and `/dashboard/settings`. | `signalDataLoader.ts`, `/api/profile/analytics/route.ts` | **VERIFIED (Code + Auth Tests)** |
| **J8: Live Publish Operational Recovery** | `failed` or partial-failure dispatch | `operational.failedPosts` / `partialFailurePosts` surface Operational Alert Banner on Overview -> filters to failed posts -> Inspector surfaces sanitized variant error & retry/reconnect actions. | `SignalClient.tsx`, `signalEngine.ts`, `PostInspectorDrawer.tsx` | **VERIFIED (Code + Engine)** |
| **J9: API Outage / Rate Limit / Stale Data** | `401`, `429`, HTTP `500` | `syncEngagement.ts` merges metrics non-destructively (preserving prior counts if refresh hits `401`/`429`, recording `sync_status` & token-redacted `sync_error`); initial fetch HTTP `500` renders `Could not load Signal Analytics` + `Retry Load`. | `SignalClient.test.tsx` (test 1), `syncEngagement.ts` | **VERIFIED (Code + UI Test)** |
| **J10: Report Export & Stakeholder Share** | CSV Export & Print / Share Story | `GET /api/signal/export` enforces `csv_export` plan limit (`403 PLAN_LIMIT_EXCEEDED` on Spark/Creator, `200 text/csv` on Pro/Studio with formula injection neutralization); `"Print"` triggers clean print styles; `"Share Story"` links to `/u/[sub]?activity=<postId>`. | `signalRoutes.test.ts`, `app/u/[subdomain]/page.tsx`, `/api/profile/[subdomain]/route.ts` | **VERIFIED (API Test + Code)** |

---

## 2. Phase 9 Multi-Persona Product Review

| Persona | Critical Questions Evaluated | Findings & Safeguards Verified | Remaining Friction / Limitations |
|---|---|---|---|
| **1. First-Time Creator** | *"Do I understand what Signal is and what to do with 0–2 posts?"* | Empty state clearly guides 2-step setup (`/onboarding/connect` -> `/dashboard/studio`); low-sample `n < 3` badges avoid false statistical confidence; Golden Hour explains why `< 48h` posts may read `0`. | Historical posts created prior to running DB migration rely on runtime telemetry extraction for hooks/word-count until migration `20261116000003` is applied. |
| **2. Daily Social Media Manager** | *"Can I diagnose why Tuesday worked better than Friday, inspect every channel copy, and act fast?"* | Unified 1-level tabs keep filters pinned across all views via URL params; `DailyPerformanceChart` has tabular mode for rapid numeric scanning; clicking a heatmap slot opens exact contributing posts & links straight into Flight Plan at that day/hour. | Per-workspace team approval logs are not yet surfaced in Signal (planned only after Studio/Flight Plan approval workflows ship). |
| **3. Business Owner / Founder** | *"Does my content actually drive bio-profile clicks and SignalDM leads, or just vanity likes?"* | `Overview` KPIs and `Channels & Funnel` clearly separate social reactions (`Likes/Comments/Shares`) from Owned Funnel (`Profile Views`, `Link/CTA Clicks`, `CTR%`) and `SignalDM Leads`, preventing misleading metric summation. | Bio-profile revenue/UTM checkout conversions remain outside Unool's current tracking events unless Stripe/GA4 is integrated; docs disclose this honestly. |
| **4. Agency Manager** | *"Are multi-account metrics separated per handle, are client workspaces isolated, and can I export client CSV/PDFs?"* | Multiple accounts on one platform (`@brand_main`, `@founder_ig`) render side by side cleanly; `workspaceId` access enforced via `verifyWorkspaceAccess`; `clientCache` clears/resets on workspace switch; Pro/Studio CSV export + Print Summary report ready. | Post Detail drawer `/api/signal/posts/[postId]` uses `auth.workspaceId` directly rather than accepting an agency override `?workspaceId=` query param; agency must switch active workspace context first before inspecting single posts. |
| **5. Experienced Analyst** | *"Are Engagement Rate denominators mathematically sound, timezones explicit, medians shown alongside means, and unavailable API fields never fabricated as `0`?"* | Weighted ER includes ONLY variants where `capability.supportsViews && views > 0` in BOTH numerator and denominator; Median shown next to Mean in `Avg Engagements` & Hook/Word-Bracket panels; chronological Momentum & period comparisons verified; LinkedIn `w_member_social` & 11 publish-only channels report `N/A` transparently. | Snapshot trajectories (`post_engagement_snapshots`) begin accumulating only after DB migration `20261116000003` is applied to the target Postgres instance; pre-existing historical posts have single latest-known totals. |

---

## 3. Edge-Case & Failure-Case Coverage Summary

All 17 catalogued edge cases (**EC-01** through **EC-17** in `docs/SIGNAL_EDGE_CASE_MATRIX.md`) were mapped against code and tests:
- **Account & Auth Edge Cases (EC-01, EC-07, EC-10, EC-15):** Covered by `signalRoutes.test.ts`, `signalEngine.test.ts`, `SignalClient.test.tsx`, `syncEngagement.ts`, and `clientCache.ts`.
- **Content & Status Edge Cases (EC-02, EC-03, EC-04, EC-05, EC-08, EC-09, EC-12):** Covered by `signalEngine.test.ts`, `SignalClient.test.tsx`, and `draftRedirect.test.ts`.
- **Analytics & Timezone Edge Cases (EC-06, EC-11, EC-13, EC-14, EC-16, EC-17):** Covered by `signalEngine.test.ts` (medians, IANA TZ shift, plan retention clamping, CSV formula safety), `SignalClient.test.tsx` (HTTP 500 Retry), `DailyPerformanceChart` accessible table view (`SignalCharts.tsx`), and `e2e/signal.spec.ts` (`375x812` mobile overflow check).

---

## 4. Explicit Disclosure of Unverified / External Items

Per strict verification policy, the following items are **not** marked as verified live because of sandbox/environment boundaries:
1. **Production Bundle Compilation (`next build`):** Twice failed inside the Windows sandbox with `EPERM: operation not permitted, mkdir` inside `.next\server\app\api\...`. Must be verified on host or CI runner (`npm run build`).
2. **Database Migration Application:** `supabase/migrations/20261116000003_signal_analytics_foundation.sql` has been statically reviewed and verified to degrade safely on unmigrated schemas (via runtime telemetry fallback & `try/catch` around `post_engagement_snapshots`), but has **not** yet been executed against the live Supabase project (`supabase db push` required before deployment).
3. **Live Social Platform OAuth Sync:** Real API calls to Meta Graph v22.0 (IG/FB/Threads), X API v2, YouTube, Pinterest v5, LinkedIn, Bluesky, Mastodon, Reddit, Lemmy, Dev.to, Hashnode, Dribbble, MeWe, Listmonk could not execute without live OAuth tokens and network access in sandbox; behavior is verified via unit/adapter tests (`normalize.test.ts`, `ThreadsAdapter.test.ts`, `multiPlatformEngagement.test.ts`) and source code inspection.
4. **Live Playwright Browser E2E:** `e2e/signal.spec.ts` is implemented and lint-clean, pending execution against a running local/staging Next.js server (`bypass` / live credentials).

---

## 5. Final Release Readiness Recommendation

**Recommendation: `CONDITIONAL GO`**

All core product architecture, canonical math, normalization, multi-account isolation, security fixes (including closing `/api/profile/analytics` IDOR and removing the hardcoded `45s` mock), UI overhaul, accessibility improvements, cross-module integrations, and 90/90 Signal/Analytics/Platform Vitest checks + `tsc --noEmit` PASS after the final edit.

**Conditions before production deploy:**
1. Apply `supabase/migrations/20261116000003_signal_analytics_foundation.sql` to target Supabase (`supabase db push`).
2. Run `npm run build` (`next build`) and Playwright smoke (`npx playwright test e2e/signal.spec.ts`) in the unsandboxed host/CI environment.
