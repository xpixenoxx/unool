# Unool Signal — Analytics Data Architecture

**Version:** 1.0  
**Related Migration:** `supabase/migrations/20261116000003_signal_analytics_foundation.sql`  
**Core Libraries:** `lib/analytics/signalEngine.ts`, `lib/analytics/platformCapabilities.ts`, `lib/services/analytics/normalize.ts`, `lib/services/analytics/syncEngagement.ts`

---

## 1. Architecture Overview

```
Write / Publish Lifecycle:
  Studio / Composer / FlightPlan / ScheduleService
     └─► Enriches post telemetry (`classifyHookType`, `HookScorer.score`, `wordCount`, `hasMedia`, `mediaCount`, `contentFormat`)
     └─► Persists to `posts` + `post_variants` (multi-account `platform_account_id`)

Publishing & Engagement Collection Lifecycle:
  PublishService ──► `platform_posts` (links `variant_id`, `platform`, `platform_account_id`, `platform_post_id`, `platform_url`, `published_at`)
  syncEngagement.ts (throttled / manual coalesced sync)
     ├─► Decrypts token per matching (`platform`, `platform_account_id`) connection
     ├─► Refreshes OAuth token if expiring/401 or marks connection `expired` cleanly
     ├─► Calls `adapter.getEngagement(token, platformPostId)`
     ├─► Normalizes via `extractNormalizedEngagement(raw)` preserving `_raw` extras
     ├─► Non-destructive merge into `platform_posts.engagement` + updates `last_synced_at`, `sync_status`, `sync_error`
     └─► Appends deduplicated checkpoint to `post_engagement_snapshots` (when values changed or >=6h elapsed)

Read & Aggregation Lifecycle:
  GET /api/signal/analytics (unified endpoint) + backwards-compatible GET /api/signal/posts & /api/signal/resonance + GET /api/signal/export
     ├─► `getCurrentAuth(req)` + `verifyWorkspaceAccess` -> strict multi-tenant workspace isolation
     ├─► `getWorkspacePlanInfo(workspaceId)` -> enforces `analytics_retention_days` & `csv_export`
     ├─► Single workspace query loading `posts`, `post_variants`, `platform_posts`, `platform_connections`, `analytics_events`, SignalDM counts
     └─► `computeSignalAnalytics(input, filters)` (`lib/analytics/signalEngine.ts`) -> guarantees 100% numeric consistency across Overview, Content, Timing, Channels & CSV Export
```

---

## 2. Database Schema & Migration Design (`20261116000003_signal_analytics_foundation.sql`)

### A. Columns Added Idempotently to `posts`
- `hook_type TEXT`: Canonical hook category (`question`, `number`, `contrarian`, `story`, `howto`, `curiosity`, `direct`, `statement`).
- `hook_formula_id INTEGER`: Best matching formula ID (`1..26`) from `HookScorer`, nullable when unmatched.
- `hook_score SMALLINT`: Deterministic `HookScorer.score()` total (`0..100`).
- `word_count INTEGER`: Tokenized word count of `posts.content`.
- `has_media BOOLEAN NOT NULL DEFAULT false`: True when post includes image/video assets.
- `media_count INTEGER NOT NULL DEFAULT 0`: Count of attached media assets.
- `content_format TEXT NOT NULL DEFAULT 'text'`: `'text' | 'image' | 'video' | 'carousel' | 'thread' | 'article'`.
- `campaign_tag TEXT`: Optional user/arc campaign grouping label (`arc_id` posts automatically map to campaign/arc grouping).
- **Safe Backfill Block:** Idempotent `DO $$ ...` aggregates media metadata from `post_variants.media_urls` and populates `word_count`, `has_media`, `media_count`, and `content_format` on existing `posts` rows where `word_count IS NULL`, without locking or deleting any existing records.

### B. Sync Provenance & Multi-Account Columns on `platform_posts`
- `platform_connection_id UUID` (already FK-linked to `platform_connections`): Links published platform posts to the exact multi-account connection row.
- `sync_status TEXT NOT NULL DEFAULT 'pending'`: `'pending' | 'synced' | 'unsupported' | 'rate_limited' | 'token_expired' | 'error'`.
- `sync_error TEXT`: Last sanitized upstream error (token-redacted, max 240 chars) for user troubleshooting without console digging.
- `last_synced_at TIMESTAMPTZ`: Authoritative timestamp of last completed metrics fetch attempt.
- **Indexes:** `idx_platform_posts_sync_lookup (sync_status, last_synced_at ASC NULLS FIRST)` and `idx_platform_posts_variant_id (post_variant_id)`.

### C. Time-Series History Table: `post_engagement_snapshots`
Enables post trajectory sparklines and Golden Hour decay inspection over time without overwriting history:
- `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE`
- `platform_post_id UUID NOT NULL REFERENCES platform_posts(id) ON DELETE CASCADE`
- `post_id UUID REFERENCES posts(id) ON DELETE CASCADE`
- `platform TEXT NOT NULL`
- `platform_connection_id UUID REFERENCES platform_connections(id) ON DELETE SET NULL`
- `captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `likes INTEGER NOT NULL DEFAULT 0`, `comments INTEGER NOT NULL DEFAULT 0`, `shares INTEGER NOT NULL DEFAULT 0`, `saves INTEGER NOT NULL DEFAULT 0`, `clicks INTEGER NOT NULL DEFAULT 0`, `views INTEGER` (nullable when unsupported!), `total_engagements INTEGER NOT NULL DEFAULT 0`
- `raw_metrics JSONB NOT NULL DEFAULT '{}'`
- **Indexes:** `(workspace_id, captured_at DESC)`, `(platform_post_id, captured_at DESC)`, and `(workspace_id, post_id, captured_at ASC)`.
- **RLS:** Enabled! `TO authenticated` workspace member `SELECT` policy using `(SELECT auth.uid())` initPlan caching + `TO service_role` `FOR ALL` policy.

### D. `post_variants` Variant-to-Account Linking
- Ensures `platform_connection_id` is indexed and propagated from `ScheduleService` / `PublishService` / `syncEngagement` so multi-account posts attribute per-account metrics accurately.

---

## 3. Sync Reliability, Concurrency & Caching Rules

1. **In-Flight Coalescing (`syncEngagement.ts`):**  
   A module-level `Map<string, Promise<SyncResult>>` keyed by `${workspaceId}:${forceRefresh ? 'force' : 'auto'}` coalesces concurrent sync calls from parallel page loads or accidental double-clicks into one execution.
2. **Staleness Window & Priority Queueing:**  
   - Auto-sync (`sync=false`) only queries `platform_posts` whose `last_synced_at` (or `engagement._lastSyncedAt`) is missing or older than `30 minutes`, capped to `maxPosts = 35` prioritizing newest published posts and active Golden Hour posts (<48h).
   - Manual refresh (`?sync=true`) refreshes up to `50` posts (skipping `publish_only` adapters cleanly without wasting timeouts, marking them `sync_status: 'unsupported'`).
3. **Non-Destructive Failure Retention:**  
   - If an adapter returns `{}` (empty on HTTP failure/network error), throws `TokenExpiredError`, or hits rate limit `429`, existing non-zero counters in `platform_posts.engagement` are **preserved** while `last_synced_at` / `sync_status` / `sync_error` update cleanly so UI knows data is cached-stale rather than fresh `0`.
4. **Workspace-Scoped Client Cache (`lib/utils/clientCache.ts`):**  
   All module-level SWR caches in `SignalClient` register via `registerClientCacheReset` and invoke `syncClientCacheScope(userId, workspaceId)`, preventing cross-account or cross-workspace cache leaks on logout/switch. Manual Sync updates BOTH React state AND module SWR cache atomically.
5. **Security & Multi-Tenancy:**  
   - All `/api/signal/*` endpoints require `getCurrentAuth(req)` + workspace membership check (`verifyWorkspaceAccess` if `workspaceId` overridden) -> `401` / `403`.
   - `/api/profile/analytics` hardened to require verified auth and workspace ownership (`401` on missing auth, eliminating unauthenticated `?workspaceId=` fallback IDOR) and removes mock `avgSessionDuration: 45`.
