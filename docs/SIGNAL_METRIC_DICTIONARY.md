# Unool Signal — Canonical Metric Dictionary

**Version:** 1.0  
**Single Source of Truth Engine:** `lib/analytics/signalEngine.ts` + `lib/services/analytics/normalize.ts`  
Every API route (`/api/signal/posts`, `/api/signal/resonance`, `/api/signal/analytics`, `/api/signal/export`), UI card, and CSV export MUST derive values from these exact definitions.

---

## 1. Fundamental Classification Rules

1. **Published Analytics Denominator Rule:**  
   Unless explicitly labeled an **Operational Queue** metric (`Scheduled`, `Publishing`, `Drafts`, `Failed`), every performance KPI, Engagement Rate, Hook Ranking, Effort Matrix, Media Lift, and Timing Heatmap counts **only published items** (`post.status === 'published'` or `variant.status === 'published'`). Drafts and future scheduled posts NEVER dilute engagement averages.
2. **Variant-Level Platform & Account Attribution Rule:**  
   Every platform/account metric aggregates `variant.engagement` strictly from variants belonging to that `platform` and `platform_account_id`. Whole-post totals are NEVER attributed to individual platforms.
3. **Zero vs. Unavailable (`null` / `N/A`) Rule:**  
   - When an adapter successfully queried an API and returned `0` for a supported metric -> **`0`** (`hasRealData: true` if sync succeeded, or `0` with `syncStatus: 'synced'`).
   - When an adapter/platform does NOT expose a metric (e.g., LinkedIn `w_member_social` impressions, Discord/Telegram/Slack/Medium/Nostr/Skool/Whop/Twitch/Kick/Warpcast views) -> **`null`** (displayed as **`N/A`** with API capability tooltip), NEVER averaged as `0` into impression-based denominators or Engagement Rate.
   - When an upstream sync failed (`token_expired`, `rate_limited`, `api_error`) -> prior persisted metrics in `platform_posts.engagement` are retained **non-destructively**, and `syncStatus` surfaces an explicit stale/error indicator rather than wiping metrics to `0`.
4. **Canonical Timestamp & Timezone Rule:**  
   - **Published performance time:** `variant.publishedAt ?? post.publishedAt ?? post.createdAt`.
   - **Time bucketing:** Formatted into the user's selected IANA timezone (`Intl.DateTimeFormat`) on both Trend charts and Timing Heatmaps (default: workspace/browser timezone, valid IANA fallback `'UTC'`). Never depends on serverless runtime `Date.getHours()`.
5. **Sample Confidence Tiers:**  
   - `n < 3`: **Insufficient sample** (`Low confidence — collect >= 3 published posts`)
   - `3 <= n < 10`: **Directional** (`Early signal`)
   - `n >= 10`: **Established** (`Reliable pattern`)

---

## 2. Canonical Metric Definitions

### A. Core Engagement & Reach Metrics

| Metric Key | UI Label | Exact Formula | Source & Scope | Null / Edge Handling |
|---|---|---|---|---|
| `likes` | Likes / Reactions | Sum of `likes`, `like_count`, `likeCount`, `totalLikes`, `reactions`, `reaction_count`, `positiveReactions`, `positive_reactions`, `score`, `upvotes`, `favorites`, `favorite_count` | `UniversalEngagement.likes` (`normalize.ts`) | Returns `0` when missing; negative scores clamped via `Math.max(0, ...)` |
| `comments` | Comments / Replies | Sum of `comments`, `comment_count`, `commentCount`, `comments_count`, `replies`, `reply_count`, `replies_count`, `responses`, `responseCount`, `num_comments` | `UniversalEngagement.comments` | Non-negative finite integer |
| `shares` | Shares / Reposts | Sum of `shares`, `share_count`, `shareCount`, `reposts`, `repost_count`, `retweets`, `retweet_count`, `reblogs_count`, `quotes` | `UniversalEngagement.shares` | Includes quote-posts when platform reports separately (`X`, `Threads`, `Bluesky`) |
| `saves` | Saves / Bookmarks | Sum of `saves`, `save_count`, `saves_count`, `bookmarks` | `UniversalEngagement.saves` | Only present where platform exposes saves (`Instagram`, `Pinterest`, `Dribbble`, `Bluesky` where available); `null` capability elsewhere |
| `clicks` | Post Link Clicks | Sum of `clicks`, `click_count`, `PIN_CLICKS`, `pin_clicks` | `UniversalEngagement.clicks` | Distinct from Presence bio-link clicks (`profileClicks`) |
| `views` | Views / Impressions | Primary `views`, `view_count`, `viewCount`, `impressions`, `impression_count`, `pageViews`, `page_views_count`, `VIDEO_VIEWS`, fallback `reach` if `views === 0` (`Instagram` older media) | `UniversalEngagement.views` (`impressions` also stored) | Treated as `null` (unsupported) on publish-only & non-view adapters |
| `totalEngagements` | Total Engagements | `likes + comments + shares + saves + clicks` | Computed per variant & summed per post | Notice `totalEngagements` excludes `views` so views never inflate interactions |
| `weightedEngagementRate` | Engagement Rate | `(SUM(totalEngagements on view-capable variants where views > 0) / SUM(views on those variants)) * 100` | **Strict subset:** Only variants with `views !== null && views > 0` contribute to BOTH numerator AND denominator | Returns `null` (`N/A`) if `SUM(views)` on view-capable variants is `0`! Never divides total cross-platform interactions (incl. LinkedIn likes) by IG/X-only views |
| `avgEngagementsPerPost` | Avg Engagements / Post | `SUM(totalEngagements of published posts in range) / COUNT(published posts in range)` | `status === 'published'` posts only | Returns `0` when published count is `0`; accompanied by `medianEngagementsPerPost` to guard against single viral outlier skew |
| `medianEngagementsPerPost` | Median Engagements | Statistical 50th percentile of `totalEngagements` across published posts in range | `status === 'published'` posts only | Prevents 1 outlier post from misleading creator about baseline |

---

### B. Momentum & Period Comparison Metrics

| Metric Key | UI Label | Exact Formula | Window Semantics |
|---|---|---|---|
| `engagementDeltaPct` | Momentum (Engagements) | `prevTotal > 0 ? Math.round(((currTotal - prevTotal) / prevTotal) * 100) : (currTotal > 0 ? 100 : 0)` where `currTotal` = SUM(`totalEngagements`) in `[windowStart, windowEnd]` and `prevTotal` = SUM(`totalEngagements`) in immediately preceding equal-length period `[windowStart - windowLength, windowStart)` | **Always chronological (`(newer - older) / older`)**! Prior bug inverted sign by slicing `DESC`-ordered rows backwards |
| `avgEngagementDeltaPct` | Momentum (Avg / Post) | `prevAvg > 0 ? Math.round(((currAvg - prevAvg) / prevAvg) * 100) : (currAvg > 0 ? 100 : 0)` using per-post average in current vs prior equal window | Resilient when publishing frequency changed between periods |
| `viewsDeltaPct` | Views Change | `prevViews > 0 ? Math.round(((currViews - prevViews) / prevViews) * 100) : (currViews > 0 ? 100 : 0)` | Scoped to view-capable variants |
| `outputDeltaPct` | Output Velocity Change | Same period-over-period formula over count of published posts | Tracks consistency vs prior window |

---

### C. Content Strategy & Hook Intelligence Metrics

| Metric Key | UI Label | Exact Formula | Source & Rules |
|---|---|---|---|
| `hookType` | Hook Style | Categorized archetype (`question`, `number`, `contrarian`, `story`, `howto`, `curiosity`, `direct`, `statement`) determined at publish/save time via deterministic rule classifier (`classifyHookType`) and stored in `posts.hook_type` | Fallback classifier runs on historical posts missing `hook_type`; NEVER silently returns `'unknown'` when content exists |
| `hookFormulaId` / `hookScore` | Matched Hook Formula & Strength | Matches against `HookScorer.score(content)` 26-formula library (`lib/ai/engines/HookScorer.ts`) | Explicitly labeled **Deterministic Rubric (`HookScorer`)** |
| `wordCount` | Word Count | `content.trim().split(/\s+/).filter(Boolean).length` computed from the canonical post copy | Persisted in `posts.word_count` AND derived cleanly if column null |
| `wordCountBracket` | Length Bracket | Buckets: `Short (<30w)`, `Punchy (30–79w)`, `Structured (80–159w)`, `Deep Dive (160+w)` | Enables stable sample aggregation even when scatter has few points |
| `hasMedia` / `mediaCount` | Has Media | `(Array.isArray(mediaUrls) && mediaUrls.length > 0) \|\| Boolean(post.has_media)` | Stored in `posts.has_media` & `media_count` |
| `mediaLiftPct` | Media vs Text Lift | `textAvg > 0 && mediaCount > 0 && textCount > 0 ? Math.round(((mediaAvg - textAvg) / textAvg) * 100) : null` | Returns **`null`** (not `0%`!) unless **both** Media and Text-Only published cohorts have `>= 1` post (`>= 3` recommended for confidence) |
| `resonanceScore` | Composite Signal Score (0–100) | Transparent documented composite index when `publishedCount > 0`: normalized percentile/log index combining `engagementVolume (45%)` + `viewReach (25%)` + `consistencyDaysPct (15%)` + `positiveMomentumBonus (15%)`, or `null` when `publishedCount === 0` | Tooltips display exact formula weights and clarify it is an **internal summary index**, NOT an external platform algorithm metric |

---

### D. Cross-Surface Funnel Metrics (Clearly Separated Domain)

| Metric Key | UI Label | Table & Events | Relationship to Social Post Engagements |
|---|---|---|---|
| `profileViews` | Bio-Profile Views | `analytics_events` (`event_type = 'profile_view'`) | **Never added to social `views` or `totalEngagements`** — shown separately in Executive Funnel & Channels view |
| `profileLinkClicks` | Bio Link & CTA Clicks | `analytics_events` (`event_type IN ('link_click', 'profile_cta_click')`) | Computed identically to `/api/analytics/insights` & `/api/profile/analytics` |
| `profileCtrPct` | Bio-Link CTR | `profileViews > 0 ? round1((profileLinkClicks / profileViews) * 100) : null` | Matches `/api/analytics/insights` |
| `automationCommentsProcessed` | SignalDM Comments Replied | `instagram_comment_logs` + `fb_automation_comment_logs` + `threads_automation_reply_logs` (if present/queried safely) | Shown separately as **Automation Conversions** (`dmSent`, `highIntentLeads`, `followGateUnlocked`) |

---

## 3. Data Provenance & Plan Retention Semantics

- **Plan Retention (`analytics_retention_days` from `lib/billing/plans.ts`):**
  - `spark`: `30` days
  - `creator`: `90` days
  - `pro`: `365` days
  - `studio`: `-1` (unlimited)
- Server API endpoints compute effective `retentionDays` from `getWorkspacePlanInfo(workspaceId)` and clamp requested lookback windows to `retentionDays` (when `> 0`), returning `{ requestedRange, effectiveRange, retentionDays, truncatedByPlan: boolean }` so the UI can show an exact notice when older history exists beyond the active plan limit.
- **Provenance Labels:**
  - `live_api`: Pulled directly from upstream platform API (`instagram`, `facebook`, `linkedin`, `x`, `threads`, `bluesky`, `youtube`, `pinterest`, `reddit`, `mastodon`, `devto`, `hashnode`, `dribbble`, `lemmy`, `listmonk`, `mewe`).
  - `first_party`: Recorded inside Unool (`analytics_events` bio-link views/clicks, `instagram_comment_logs`/`dm_logs`, `posts` hook/word metrics).
  - `publish_only`: Platform adapter does not provide post engagement readback (`discord`, `telegram`, `slack`, `manual`, `twitch`, `kick`, `skool`, `whop`, `warpcast`, `nostr`, `medium`).
  - `deterministic_rule`: Computed locally without LLM (`HookScorer`, `classifyHookType`, recommendations).
