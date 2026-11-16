# Unool Signal — Test & Acceptance Report

**Version:** 1.0  
**Scope:** End-to-end verification of Signal Intelligence (`/dashboard/signal`), canonical analytics engine (`lib/analytics/signalEngine.ts`), ingestion/normalization/sync (`normalize.ts`, `PinterestAdapter.ts`, `syncEngagement.ts`, `postTelemetry.ts`), API routes (`/api/signal/**`, `/api/profile/analytics`, `/api/profile/[subdomain]`), cross-module handoffs, UI components, and security/plan gates.

---

## 1. Execution Summary (Post-Final-Edit Verification)

| Check / Suite | Command | Scope | Result | Notes & Exact Counts |
|---|---|---|---|---|
| **TypeScript Static Typecheck** | `./node_modules/.bin/tsc.cmd --noEmit` | Entire repository (`tsconfig.json` strict) | **PASS** (`TSC_EXIT=0`) | 0 errors after all code edits. |
| **ESLint (Signal, Analytics, Adapters, E2E)** | `ESLINT_USE_FLAT_CONFIG=false ./node_modules/.bin/eslint.cmd ...` | All created & modified Signal/Analytics files (`app/dashboard/signal/**`, `app/api/signal/**`, `components/analytics/{SignalCharts,PostInspectorDrawer,AnalyticsDNA}.tsx`, `lib/analytics/**`, `lib/services/analytics/**`, `app/api/profile/analytics/route.ts`, `app/analytics/linkedin/LinkedInAnalyticsClient.tsx`, `lib/platforms/PinterestAdapter.ts`, `e2e/signal.spec.ts`) | **PASS** (`ESLINT_SIGNAL_EXIT=0`, `ESLINT_TEST_EXIT=0`) | 0 errors; 0 warnings in all newly created/rebuilt Signal files; 2 pre-existing unused-import warnings (`lib/analytics/track.ts`, `app/u/[subdomain]/page.tsx`). |
| **ESLint (Cross-Module Integrations)** | `ESLINT_USE_FLAT_CONFIG=false ./node_modules/.bin/eslint.cmd ...` | `SupabasePostRepository.ts`, `app/api/flightplan/generate/route.ts`, `DashboardClient.tsx`, `FlightPlanClient.tsx`, `WeekCanvas.tsx`, `app/dashboard/layout.tsx` | **PASS** (`ESLINT_INTEGRATION_EXIT=0`) | 0 errors; only pre-existing untouched warnings in `layout.tsx`, `WeekCanvas.tsx`, `SupabasePostRepository.ts`. |
| **Repo-Wide `npm run lint`** | `next lint` (run prior to final test selector tweak) | Entire codebase | **1 pre-existing error** (`LINT_EXIT=False`) | Pre-existing `react/jsx-no-comment-textnodes` error inside untouched persona template component; zero errors in any Signal file. |
| **Signal, Analytics, Platform & Regression Vitest** | `./node_modules/.bin/vitest.cmd run ...` | 13 core test files covering engine, routes, UI, draft routing, time series, normalization, adapters, time spent, security fixes | **PASS (13/13 files, 90/90 tests)** | Executed after all source and test edits. Details in Section 2. |
| **Full Repository Vitest Suite** | `npm test` (`vitest run`) | All 65 repository test files (522 tests) | **62/65 files PASS (509/522 tests)** | 3 pre-existing unrelated files failed (13 tests): `freeTier.test.ts` (11), `ComposerClient.test.tsx` (1), `instagram-outbound/__tests__/route.test.ts` (1). Details in Section 3. |
| **Production Build (`next build`)** | `npm run build` / `next build --no-lint` | Full Next.js 15.5.18 App Router bundle | **BLOCKED BY SANDBOX** (`EPERM`) | Failed in Windows sandbox with `EPERM: operation not permitted, mkdir` creating `.next\server\app\api\brand-materials\upload` (attempt 1) & `.next\server\app\api\composer\schedule\[postId]` (attempt 2). Must run on host/CI runner. |
| **Playwright E2E (`e2e/signal.spec.ts`)** | Static authoring + ESLint check | Multi-tab flow + mobile 375px overflow check | **NOT EXECUTED LIVE** | Spec authored & linted cleanly; requires live Next dev/prod server + Supabase test user session (`authenticatedPage`). |
| **Supabase Migration Execution** | `supabase/migrations/20261116000003_signal_analytics_foundation.sql` | Schema columns, variant-derived backfill, indexes, `post_engagement_snapshots` RLS | **APPLIED BY USER IN SQL EDITOR** | Applied cleanly via Supabase SQL Editor (`Success. No rows returned`); renamed `20261116000001` -> `20261116000003` to avoid version collision with `origin/main` Settings migrations. |

---

## 2. Signal, Analytics & Platform Test Breakdown (90/90 Passing)

| Test File | Tests | Result | Verified Behaviors & Formulas |
|---|---|---|---|
| `lib/analytics/__tests__/signalEngine.test.ts` | 9 | **PASS** | Platform tiers (`full` IG/X/Threads/YT/Pinterest/Hashnode/Dev.to/Dribbble/Listmonk vs `engagement_only` LI/Bluesky/Mastodon/Reddit/Lemmy/MeWe vs `publish_only` Discord/Telegram/Slack/Medium/Nostr/Twitch/Kick/Skool/Whop/Warpcast/Manual); `reactions`/`positiveReactions` & Pinterest `IMPRESSION`/`SAVE`/`PIN_CLICK`/`OUTBOUND_CLICK` normalization; zero fake `engagementRate` when `views === 0`; deterministic `classifyHookType` + `extractPostTelemetry` null-column fallback; excluding drafts/scheduled posts from published KPI denominators; chronological Momentum (`+900%` upward trend, fixing legacy sign inversion); multi-account `@brand_main` vs `@founder_ig` vs LI attribution isolation; IANA TZ bucketing (`Asia/Kolkata` +05:30 vs `America/New_York` -05:00); plan `analytics_retention_days` clamping (`Spark 30d`); CSV formula-injection neutralization (`'=`, `'+`, `'-`, `'@`) and `N/A` emission. |
| `app/api/signal/__tests__/signalRoutes.test.ts` | 3 | **PASS** | Unauthenticated `401` enforcement across `/api/signal/analytics`, `/api/signal/export`, `/api/signal/posts/[postId]`, and `/api/profile/analytics` (closing previous `?workspaceId=` IDOR); cross-tenant `workspaceId` `403` rejection via `verifyWorkspaceAccess`; `csv_export` entitlement enforcement (`403 PLAN_LIMIT_EXCEEDED` on Spark vs `200 text/csv` on Pro matching variant metrics). |
| `app/dashboard/signal/__tests__/SignalClient.test.tsx` | 4 | **PASS** | Explicit `Could not load Signal Analytics` error state + `Retry Load` CTA on HTTP 500 (never silent `0`s); legacy `flightplan-legacy-v1` draft routing to `/dashboard/flightplan`; first-time zero-account onboarding welcome screen; full interactive workflow: `Overview` -> `Content & Hooks` (rendering multiple Instagram accounts `@brand_main` & `@founder_ig` simultaneously) -> accessible `role="dialog"` `Post Detail Inspector` Drawer -> `Timing & Cadence` TZ heatmap -> `Channels & Funnel` with `Publish-Only Pipe` & `Open LinkedIn Insights` bridge. |
| `app/dashboard/signal/__tests__/draftRedirect.test.ts` | 6 | **PASS** | Deterministic routing of Studio vs Flight Plan vs Direct Broadcast drafts back to correct editor. |
| `lib/analytics/__tests__/timeSeries.test.ts` | 8 | **PASS** | Time-series alignment and growth utilities. |
| `lib/services/analytics/__tests__/normalize.test.ts` | 7 | **PASS** | Core 7-field `UniversalEngagement` shape preserved cleanly without breaking legacy callers. |
| `lib/platforms/__tests__/multiPlatformEngagement.test.ts` | 6 | **PASS** | Multi-platform engagement extraction and partial-insights graceful degradation. |
| `lib/platforms/__tests__/ThreadsAdapter.test.ts` | 4 | **PASS** | Progressive Meta Threads Insights query fallback (`views,likes,replies,reposts,quotes,shares` -> `likes,replies`). |
| `lib/platforms/__tests__/FacebookAdapter.test.ts` | 8 | **PASS** | Page post publishing & permalink canonical URL fallback. |
| `lib/platforms/__tests__/facebookUrl.test.ts` | 13 | **PASS** | Facebook URL parsing & validation. |
| `lib/platforms/__tests__/connectionStatus.test.ts` | 9 | **PASS** | Multi-account connection state classification (`connected`, `expired`, `disconnected`). |
| `app/api/analytics/time-spent/__tests__/route.test.ts` | 5 | **PASS** | Dashboard section time telemetry endpoint validation. |
| `lib/utils/__tests__/forensicAuditFixes.test.ts` | 8 | **PASS** | Header spoofing block, cron fail-closed secret check, SSRF guard, signed OAuth state cookie, and `clientCache` isolation. |

---

## 3. Pre-Existing Non-Signal Failures in Full Repository Test Run

Running `npm test` across all 65 repository files passes **62 files / 509 tests** and fails **3 pre-existing test files / 13 tests** outside Signal:

1. `lib/limits/freeTier.test.ts` (**11 failed**): Legacy tests assert `12`, `300`, `10000` posts/month caps, whereas `lib/billing/plans.ts` defines Spark `15` and Pro/Studio `-1` (unlimited).
2. `app/dashboard/composer/__tests__/ComposerClient.test.tsx` (**1 failed**): Legacy test asserts `/No connected platforms yet/i`, whereas `ComposerClient.tsx:1440` renders `"No connected accounts yet"` following multi-account UI copy updates prior to this project.
3. `app/api/webhooks/qstash/instagram-outbound/__tests__/route.test.ts` (**1 failed**): `uses public comment reply for follow-gate in comment_reply job to preserve private reply slot` asserts `mockPostPublicReply` called 2 times, received 1.

---

## 4. Analytical Correctness Verification Checklist

| Requirement | Verified Status | Evidence |
|---|---|---|
| Published KPI denominator excludes drafts & scheduled posts | **VERIFIED** | `signalEngine.test.ts` asserts `operational.publishedPosts = 1`, `draftPosts = 1`, `scheduledPosts = 1`, and `avgEngagementsPerPost = 50 / 1 = 50` rather than `50 / 3`. |
| Weighted Engagement Rate excludes non-view platforms from BOTH numerator & denominator | **VERIFIED** | `signalEngine.test.ts` combines IG1 (`30` eng / `500` views), IG2 (`10` eng / `100` views), LI (`10` interactions, `views: null`), and Discord (`0`, publish-only) -> computes `(30 + 10) / (500 + 100) = 6.67%`, excluding LinkedIn interactions from the numerator and excluding Discord completely. |
| Chronological Momentum direction fixed | **VERIFIED** | Prior window (`5` total) -> Current window (`50` total) returns `+900%` (positive growth, never inverted `-90%`). |
| Timezone shifting uses `published_at` in user IANA TZ | **VERIFIED** | `getZonedParts('2026-11-16T01:00:00.000Z', 'Asia/Kolkata')` -> `2026-11-16 06:00 Mon`; `'America/New_York'` -> `2026-11-15 20:00 Sun`. |
| Zero vs `N/A` platform capability separation | **VERIFIED** | `LinkedIn`, `Bluesky`, `Mastodon`, `Reddit`, `Lemmy`, `MeWe` show interactions with `views: null` (`N/A`); 11 publish-only platforms show `Publish-Only Pipe` / `N/A`. |
| CSV export parity + formula neutralization | **VERIFIED** | `/api/signal/export` calls the exact `loadWorkspaceSignalAnalytics` + `serializeSignalPostsToCsv` pipeline; leading `=`, `+`, `-`, `@` prefixed with `'`. |
| Security & Multi-Tenancy Isolation | **VERIFIED** | `/api/signal/analytics`, `/api/signal/export`, `/api/signal/posts`, `/api/signal/posts/[postId]`, `/api/signal/resonance`, `/api/profile/analytics` all require `getCurrentAuth`; cross-tenant `?workspaceId=` checked via `verifyWorkspaceAccess`; `SignalClient` syncs `clientCache` to workspace scope. |
