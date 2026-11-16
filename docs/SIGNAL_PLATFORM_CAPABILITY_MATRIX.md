# Unool Signal — Platform Capability Matrix (Verified Across All 27 Adapters)

**Source of Truth Registry:** `lib/analytics/platformCapabilities.ts`  
**Verified Adapters:** `lib/platforms/*Adapter.ts` (`SUPPORTED_PLATFORMS` in `lib/platforms/index.ts`)

---

## 1. Capability Classification Tiers

| Tier | Badge in UI | Meaning | Effect on Signal Calculations |
|---|---|---|---|
| **Full Metrics (`full`)** | `Full Metrics` | Upstream API exposes BOTH engagement interactions (`likes`/`comments`/`shares`) AND reach/views (`views`/`impressions`/`pageViews`). | Eligible for **Views/Impressions** KPI AND **Weighted Engagement Rate** (`engagements / views`). |
| **Engagement Only (`engagement_only`)** | `Interactions Only` | Upstream API exposes reactions/comments/shares/votes, but does NOT expose views/impressions for personal or standard OAuth scopes. | Included in **Total Engagements** and post engagement averages; **excluded from `views` and Weighted Engagement Rate denominator** (`Views` shows `N/A`). |
| **Publish Only (`publish_only`)** | `Publish-Only Pipe` | Adapter's `getEngagement()` returns `{}` or static `0`s because the destination platform provides no post readback metrics API (chat webhooks, streaming alerts, relays, manual copy). | Included in **Published Output** and publishing status queue; metrics display `N/A (Platform API)` instead of misleading `0`s; skipped during live engagement polling to save quota. |

---

## 2. Verified 27-Platform Capability Matrix

| Platform | Adapter File | Capability Tier | Exact Fields Returned by `getEngagement()` | Mapped Normalized Fields | Platform API Limitations & Provenance Notes |
|---|---|---|---|---|---|
| **Instagram** | `InstagramAdapter.ts` | `full` *(Business/Creator)* | `likes` (`like_count`), `comments` (`comments_count`), `views` (Insights `views` / `plays` / `reach`), `reach`, `saves`, `shares` | `likes`, `comments`, `shares`, `saves`, `views` | Meta Graph API v22.0 replaced `impressions`/`plays` with `views`; Personal IG accounts have no Insights API; `shares`/`saves` depend on media type & permissions. |
| **Facebook** | `FacebookAdapter.ts` | `full` *(Pages)* | `likes` (`reactions.summary.total_count`), `comments` (`comments.summary.total_count`), `shares` (`shares.count`), `impressions` (`post_impressions`), `views`, `engagedUsers`, `clicks` (`post_clicks_total`) | `likes`, `comments`, `shares`, `views`, `impressions`, `clicks` + `_raw.engagedUsers` | Requires Page access (`read_insights` for insights; falls back to reactions/comments/shares if `insights` permission missing -> degraded to interactions only). |
| **X (Twitter)** | `XAdapter.ts` | `full` | `likes` (`like_count`), `retweets`, `replies`, `quotes`, `views` (`impression_count`), `impressions` | `likes`, `comments` (`replies`), `shares` (`retweets + quotes`), `views`, `impressions` | Strict X API v2 rate limits (`429`); historical windows depend on workspace API tier; Signal retains last synced metrics on rate limit. |
| **Threads** | `ThreadsAdapter.ts` | `full` | `views`, `likes`, `replies`, `comments`, `reposts`, `quotes`, `shares` | `likes`, `comments`, `shares` (`reposts + quotes + shares`), `views` | Progressive fallback query (`views,likes,replies,reposts,quotes,shares` -> `likes,replies`); `views` unavailable on very old/certain post types -> graceful `N/A`. |
| **YouTube** | `YoutubeAdapter.ts` | `full` | `likes` (`likeCount`), `views` (`viewCount`), `comments` (`commentCount`) | `likes`, `comments`, `views` | Public video `statistics` endpoint; `shares` and deep watch-time retention require separate YouTube Analytics API scope not yet connected. |
| **Pinterest** | `PinterestAdapter.ts` | `full` | `saves` (`SAVES`), `impressions` (`IMPRESSIONS`), `clicks` (`PIN_CLICKS`), `likes: 0` | `saves`, `views` (`impressions`), `impressions`, `clicks` | Pinterest natively centers on Saves/Impressions/Pin Clicks rather than Likes; `/pins/{id}/analytics` requires matching Pin analytics window params. |
| **Hashnode** | `HashnodeAdapter.ts` | `full` | `views`, `reactions` (`reactionCount`), `responses` (`responseCount`), `comments` | `likes` (`reactions`), `comments`, `views` | GraphQL `post(id)` endpoint; `reactions` previously dropped by `normalize.ts` (fixed in Phase 4). |
| **Dev.to** | `DevtoAdapter.ts` | `full` | `reactions` (`public_reactions_count`), `positiveReactions`, `comments`, `pageViews`, `readingTimeMinutes` | `likes` (`reactions` / `positiveReactions`), `comments`, `views` (`pageViews`), `_raw.readingTimeMinutes` | Personal `api-key` required for `page_views_count`; `reactions` previously dropped by `normalize.ts` (fixed in Phase 4). |
| **Dribbble** | `DribbbleAdapter.ts` | `full` | `views` (`views_count`), `likes` (`likes_count`), `comments` (`comments_count`), `saves` (`saves_count`) | `likes`, `comments`, `saves`, `views` | Returns shot-level lifetime totals via Dribbble v2 API. |
| **Listmonk** | `ListmonkAdapter.ts` | `full` *(Email)* | `status`, `sent`, `to_send`, `views` (opens), `clicks` | `views`, `clicks`, `_raw.sent`, `_raw.to_send` | Self-hosted newsletter campaigns; open tracking depends on tracking pixel in recipient clients. |
| **LinkedIn** | `LinkedInAdapter.ts` | `engagement_only` | `likes` (`likesSummary`), `comments` (`commentsSummary`), `shares` (`sharesSummary`), hardcoded `views: 0` | `likes`, `comments`, `shares`, `views: null` *(UI N/A)* | Personal `w_member_social` scope exposes interactions ONLY, **not views/impressions** (requires `r_member_postAnalytics` or org `rw_organization_admin`). LinkedIn CSV upload / manual screenshot or `/analytics/linkedin` insights bridge noted separately. |
| **Bluesky** | `BlueskyAdapter.ts` | `engagement_only` | `likes` (`likeCount`), `reposts` (`repostCount`), `replies` (`replyCount`), `quotes` (`quoteCount`) | `likes`, `comments` (`replies`), `shares` (`reposts + quotes`) | AT Protocol public AppView exposes counts (`likes`, `reposts`, `replies`, `quotes`); impressions/views are not exposed by Bluesky API. |
| **Mastodon** | `MastodonAdapter.ts` | `engagement_only` | `likes` (`favourites_count`), `comments` (`replies_count`), `shares` (`reblogs_count`) | `likes`, `comments`, `shares` | Federated ActivityPub exposes interaction counts only; views do not exist in Mastodon protocol. |
| **Reddit** | `RedditAdapter.ts` | `engagement_only` | `likes` (`ups`), `comments` (`num_comments`), `upvoteRatio` | `likes`, `comments`, `_raw.upvoteRatio` | Post `ups` score and `upvoteRatio` available; Reddit hides view counts except to native creator dashboard. |
| **Lemmy** | `LemmyAdapter.ts` | `engagement_only` | `likes` (`upvotes` / `score`), `upvotes`, `downvotes`, `score`, `comments` | `likes`, `comments`, `_raw.downvotes`, `_raw.upvoteScore` | Federated Link Aggregator counts votes & comments; zero views metric. |
| **MeWe** | `MeweAdapter.ts` | `engagement_only` | `reactions` (`reactionsCount`), `comments`, `shares` | `likes` (`reactions`), `comments`, `shares` | `reactions` previously dropped by `normalize.ts` (fixed in Phase 4). |
| **Discord** | `DiscordAdapter.ts` | `publish_only` | Static `{ likes: 0, comments: 0, shares: 0 }` | Treated as unsupported in UI | Webhook/channel message dispatch only; emoji reaction polling requires gateway/bot perms not used here. |
| **Slack** | `SlackAdapter.ts` | `publish_only` | `{}` | `N/A` | Webhook/message broadcast without readback analytics. |
| **Telegram** | `TelegramAdapter.ts` | `publish_only` | `{}` | `N/A` | Bot API `sendMessage` does not return post view telemetry without MTProto client API. |
| **Medium** | `MediumAdapter.ts` | `publish_only` | `{}` | `N/A` | Medium deprecated public partner read-analytics API endpoints. |
| **Nostr** | `NostrAdapter.ts` | `publish_only` | `{}` | `N/A` | Decentralized relay broadcast; NIP-25 reaction aggregation across arbitrary relays not polled here. |
| **Twitch** | `TwitchAdapter.ts` | `publish_only` | `{}` | `N/A` | Live/announcement integration; VOD/clip stats not linked to text posts. |
| **Kick** | `KickAdapter.ts` | `publish_only` | `{}` | `N/A` | Stream settings/chat announcement integration without post readback API. |
| **Skool** | `SkoolAdapter.ts` | `publish_only` | `{}` | `N/A` | Community post dispatch only; Skool provides no public post analytics API. |
| **Whop** | `WhopAdapter.ts` | `publish_only` | `{}` | `N/A` | Community announcement dispatch without engagement readback API. |
| **Warpcast** | `WarpcastAdapter.ts` | `publish_only` | `{}` | `N/A` | Farcaster cast metrics require Neynar/Hub indexer read queries not currently configured. |
| **Manual** | `ManualAdapter.ts` | `publish_only` | `{}` | `N/A` | Copy-paste manual publishing log for tracking cadence & hook archive only. |
