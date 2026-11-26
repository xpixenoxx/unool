/**
 * Canonical Platform Analytics Capability Registry
 *
 * Derived directly from verified implementations in `lib/platforms/*Adapter.ts`.
 * Governs denominator eligibility (weighted Engagement Rate), sync polling skips,
 * and honest `0` vs `N/A (Platform API)` presentation across Signal.
 */

export type TelemetryTier = 'full' | 'engagement_only' | 'publish_only';

export type PlatformCategory =
  | 'social'
  | 'video_visual'
  | 'publishing_blog'
  | 'community_chat'
  | 'newsletter'
  | 'manual';

export interface PlatformCapability {
  id: string;
  label: string;
  category: PlatformCategory;
  telemetryTier: TelemetryTier;
  supportedMetrics: {
    likes: boolean;
    comments: boolean;
    shares: boolean;
    saves: boolean;
    clicks: boolean;
    views: boolean;
    impressions: boolean;
  };
  likesLabel: string;
  commentsLabel: string;
  sharesLabel: string;
  viewsLabel: string;
  capabilitySummary: string;
  apiLimitationNote: string;
}

const REGISTRY: Record<string, PlatformCapability> = {
  instagram: {
    id: 'instagram',
    label: 'Instagram',
    category: 'social',
    telemetryTier: 'full',
    supportedMetrics: { likes: true, comments: true, shares: true, saves: true, clicks: false, views: true, impressions: true },
    likesLabel: 'Likes',
    commentsLabel: 'Comments',
    sharesLabel: 'Shares',
    viewsLabel: 'Views / Reach',
    capabilitySummary: 'Full Metrics',
    apiLimitationNote: 'Business/Creator accounts expose likes, comments, views, and reach (Graph API v22 replaces impressions/plays with views); personal accounts are restricted by Meta.',
  },
  facebook: {
    id: 'facebook',
    label: 'Facebook',
    category: 'social',
    telemetryTier: 'full',
    supportedMetrics: { likes: true, comments: true, shares: true, saves: false, clicks: true, views: true, impressions: true },
    likesLabel: 'Reactions',
    commentsLabel: 'Comments',
    sharesLabel: 'Shares',
    viewsLabel: 'Impressions',
    capabilitySummary: 'Full Metrics',
    apiLimitationNote: 'Page posts expose reactions, comments, shares, impressions, and clicks when `read_insights` permission is granted.',
  },
  x: {
    id: 'x',
    label: 'X (Twitter)',
    category: 'social',
    telemetryTier: 'full',
    supportedMetrics: { likes: true, comments: true, shares: true, saves: false, clicks: false, views: true, impressions: true },
    likesLabel: 'Likes',
    commentsLabel: 'Replies',
    sharesLabel: 'Reposts & Quotes',
    viewsLabel: 'Impressions',
    capabilitySummary: 'Full Metrics',
    apiLimitationNote: 'Uses X API v2 `public_metrics` (impressions, likes, retweets, replies, quotes). Subject to strict X API rate limits.',
  },
  threads: {
    id: 'threads',
    label: 'Threads',
    category: 'social',
    telemetryTier: 'full',
    supportedMetrics: { likes: false, comments: true, shares: true, saves: false, clicks: false, views: true, impressions: false },
    likesLabel: 'Likes',
    commentsLabel: 'Replies',
    sharesLabel: 'Reposts & Quotes',
    viewsLabel: 'Views',
    capabilitySummary: 'Full Metrics',
    apiLimitationNote: 'Threads Insights API provides views, replies, reposts, quotes, and shares where rolled out for the media type; post likes are omitted.',
  },
  youtube: {
    id: 'youtube',
    label: 'YouTube',
    category: 'video_visual',
    telemetryTier: 'full',
    supportedMetrics: { likes: true, comments: true, shares: false, saves: false, clicks: false, views: true, impressions: false },
    likesLabel: 'Likes',
    commentsLabel: 'Comments',
    sharesLabel: 'Shares',
    viewsLabel: 'Views',
    capabilitySummary: 'Full Metrics',
    apiLimitationNote: 'YouTube Data API v3 exposes public video views, likes, and comment counts; shares/watch retention require separate Analytics scope.',
  },
  pinterest: {
    id: 'pinterest',
    label: 'Pinterest',
    category: 'video_visual',
    telemetryTier: 'full',
    supportedMetrics: { likes: false, comments: false, shares: false, saves: true, clicks: true, views: true, impressions: true },
    likesLabel: 'Likes',
    commentsLabel: 'Comments',
    sharesLabel: 'Repins',
    viewsLabel: 'Impressions',
    capabilitySummary: 'Full Metrics',
    apiLimitationNote: 'Pinterest API v5 reports Impressions, Saves, and Pin Clicks over up to a 90-day lookback window; likes are not exposed.',
  },
  hashnode: {
    id: 'hashnode',
    label: 'Hashnode',
    category: 'publishing_blog',
    telemetryTier: 'full',
    supportedMetrics: { likes: true, comments: true, shares: false, saves: false, clicks: false, views: true, impressions: false },
    likesLabel: 'Reactions',
    commentsLabel: 'Responses',
    sharesLabel: 'Shares',
    viewsLabel: 'Views',
    capabilitySummary: 'Full Metrics',
    apiLimitationNote: 'Hashnode GraphQL API exposes article views, reactionCount, and responseCount.',
  },
  devto: {
    id: 'devto',
    label: 'Dev.to',
    category: 'publishing_blog',
    telemetryTier: 'full',
    supportedMetrics: { likes: true, comments: true, shares: false, saves: false, clicks: false, views: true, impressions: false },
    likesLabel: 'Reactions',
    commentsLabel: 'Comments',
    sharesLabel: 'Shares',
    viewsLabel: 'Page Views',
    capabilitySummary: 'Full Metrics',
    apiLimitationNote: 'Dev.to API provides public/positive reactions, comments, page views, and reading time with personal API key.',
  },
  dribbble: {
    id: 'dribbble',
    label: 'Dribbble',
    category: 'video_visual',
    telemetryTier: 'full',
    supportedMetrics: { likes: true, comments: true, shares: false, saves: true, clicks: false, views: true, impressions: false },
    likesLabel: 'Likes',
    commentsLabel: 'Comments',
    sharesLabel: 'Shares',
    viewsLabel: 'Views',
    capabilitySummary: 'Full Metrics',
    apiLimitationNote: 'Dribbble v2 Shots endpoint exposes views, likes, comments, and saves.',
  },
  listmonk: {
    id: 'listmonk',
    label: 'Listmonk',
    category: 'newsletter',
    telemetryTier: 'full',
    supportedMetrics: { likes: false, comments: false, shares: false, saves: false, clicks: true, views: true, impressions: false },
    likesLabel: 'Likes',
    commentsLabel: 'Replies',
    sharesLabel: 'Forwards',
    viewsLabel: 'Opens',
    capabilitySummary: 'Email Metrics',
    apiLimitationNote: 'Tracks campaign sent counts, pixel opens (views), and link clicks; pixel-blocked email clients undercount opens.',
  },
  linkedin: {
    id: 'linkedin',
    label: 'LinkedIn',
    category: 'social',
    telemetryTier: 'engagement_only',
    supportedMetrics: { likes: true, comments: true, shares: true, saves: false, clicks: false, views: false, impressions: false },
    likesLabel: 'Reactions',
    commentsLabel: 'Comments',
    sharesLabel: 'Reposts',
    viewsLabel: 'Views',
    capabilitySummary: 'Interactions Only',
    apiLimitationNote: 'Personal LinkedIn scope (`w_member_social`) exposes reactions, comments, and reposts only; post impressions require `r_member_postAnalytics` or Organization Admin access.',
  },
  bluesky: {
    id: 'bluesky',
    label: 'Bluesky',
    category: 'social',
    telemetryTier: 'engagement_only',
    supportedMetrics: { likes: true, comments: true, shares: true, saves: false, clicks: false, views: false, impressions: false },
    likesLabel: 'Likes',
    commentsLabel: 'Replies',
    sharesLabel: 'Reposts & Quotes',
    viewsLabel: 'Views',
    capabilitySummary: 'Interactions Only',
    apiLimitationNote: 'AT Protocol public AppView exposes likes, replies, reposts, and quotes; impressions/views are not provided by Bluesky API.',
  },
  mastodon: {
    id: 'mastodon',
    label: 'Mastodon',
    category: 'social',
    telemetryTier: 'engagement_only',
    supportedMetrics: { likes: true, comments: true, shares: true, saves: false, clicks: false, views: false, impressions: false },
    likesLabel: 'Favourites',
    commentsLabel: 'Replies',
    sharesLabel: 'Boosts',
    viewsLabel: 'Views',
    capabilitySummary: 'Interactions Only',
    apiLimitationNote: 'Mastodon ActivityPub exposes favourites, replies, and reblogs (boosts); impressions do not exist in Mastodon.',
  },
  reddit: {
    id: 'reddit',
    label: 'Reddit',
    category: 'community_chat',
    telemetryTier: 'engagement_only',
    supportedMetrics: { likes: true, comments: true, shares: false, saves: false, clicks: false, views: false, impressions: false },
    likesLabel: 'Upvotes',
    commentsLabel: 'Comments',
    sharesLabel: 'Crossposts',
    viewsLabel: 'Views',
    capabilitySummary: 'Interactions Only',
    apiLimitationNote: 'Reddit OAuth exposes post upvote score, upvote ratio, and comments; post view counts are not exposed via public API.',
  },
  lemmy: {
    id: 'lemmy',
    label: 'Lemmy',
    category: 'community_chat',
    telemetryTier: 'engagement_only',
    supportedMetrics: { likes: true, comments: true, shares: false, saves: false, clicks: false, views: false, impressions: false },
    likesLabel: 'Score / Upvotes',
    commentsLabel: 'Comments',
    sharesLabel: 'Shares',
    viewsLabel: 'Views',
    capabilitySummary: 'Interactions Only',
    apiLimitationNote: 'Lemmy API returns upvotes, downvotes, net score, and comment count; impressions are not tracked.',
  },
  mewe: {
    id: 'mewe',
    label: 'MeWe',
    category: 'community_chat',
    telemetryTier: 'engagement_only',
    supportedMetrics: { likes: true, comments: true, shares: true, saves: false, clicks: false, views: false, impressions: false },
    likesLabel: 'Reactions',
    commentsLabel: 'Comments',
    sharesLabel: 'Shares',
    viewsLabel: 'Views',
    capabilitySummary: 'Interactions Only',
    apiLimitationNote: 'MeWe API exposes post reactions, comments, and shares; impressions are unavailable.',
  },
  discord: {
    id: 'discord',
    label: 'Discord',
    category: 'community_chat',
    telemetryTier: 'publish_only',
    supportedMetrics: { likes: false, comments: false, shares: false, saves: false, clicks: false, views: false, impressions: false },
    likesLabel: 'Reactions',
    commentsLabel: 'Replies',
    sharesLabel: 'Shares',
    viewsLabel: 'Views',
    capabilitySummary: 'Publish-Only Pipe',
    apiLimitationNote: 'Webhook/bot message delivery does not poll channel engagement metrics.',
  },
  slack: {
    id: 'slack',
    label: 'Slack',
    category: 'community_chat',
    telemetryTier: 'publish_only',
    supportedMetrics: { likes: false, comments: false, shares: false, saves: false, clicks: false, views: false, impressions: false },
    likesLabel: 'Reactions',
    commentsLabel: 'Replies',
    sharesLabel: 'Shares',
    viewsLabel: 'Views',
    capabilitySummary: 'Publish-Only Pipe',
    apiLimitationNote: 'Slack channel broadcast only; emoji reaction readback is not polled.',
  },
  telegram: {
    id: 'telegram',
    label: 'Telegram',
    category: 'community_chat',
    telemetryTier: 'publish_only',
    supportedMetrics: { likes: false, comments: false, shares: false, saves: false, clicks: false, views: false, impressions: false },
    likesLabel: 'Reactions',
    commentsLabel: 'Comments',
    sharesLabel: 'Forwards',
    viewsLabel: 'Views',
    capabilitySummary: 'Publish-Only Pipe',
    apiLimitationNote: 'Telegram Bot API does not expose channel post view counters after dispatch.',
  },
  medium: {
    id: 'medium',
    label: 'Medium',
    category: 'publishing_blog',
    telemetryTier: 'publish_only',
    supportedMetrics: { likes: false, comments: false, shares: false, saves: false, clicks: false, views: false, impressions: false },
    likesLabel: 'Claps',
    commentsLabel: 'Responses',
    sharesLabel: 'Shares',
    viewsLabel: 'Views',
    capabilitySummary: 'Publish-Only Pipe',
    apiLimitationNote: 'Medium discontinued partner read-analytics endpoints in its REST API.',
  },
  nostr: {
    id: 'nostr',
    label: 'Nostr',
    category: 'community_chat',
    telemetryTier: 'publish_only',
    supportedMetrics: { likes: false, comments: false, shares: false, saves: false, clicks: false, views: false, impressions: false },
    likesLabel: 'Zaps / Likes',
    commentsLabel: 'Replies',
    sharesLabel: 'Reposts',
    viewsLabel: 'Views',
    capabilitySummary: 'Publish-Only Pipe',
    apiLimitationNote: 'Decentralized relay broadcast; cross-relay reaction aggregation is not polled.',
  },
  twitch: {
    id: 'twitch',
    label: 'Twitch',
    category: 'video_visual',
    telemetryTier: 'publish_only',
    supportedMetrics: { likes: false, comments: false, shares: false, saves: false, clicks: false, views: false, impressions: false },
    likesLabel: 'Likes',
    commentsLabel: 'Chat',
    sharesLabel: 'Clips',
    viewsLabel: 'Viewers',
    capabilitySummary: 'Publish-Only Pipe',
    apiLimitationNote: 'Stream/chat announcements do not return post-level readback engagement.',
  },
  kick: {
    id: 'kick',
    label: 'Kick',
    category: 'video_visual',
    telemetryTier: 'publish_only',
    supportedMetrics: { likes: false, comments: false, shares: false, saves: false, clicks: false, views: false, impressions: false },
    likesLabel: 'Likes',
    commentsLabel: 'Chat',
    sharesLabel: 'Shares',
    viewsLabel: 'Viewers',
    capabilitySummary: 'Publish-Only Pipe',
    apiLimitationNote: 'Stream announcements & settings only; Kick API has no post readback metrics.',
  },
  skool: {
    id: 'skool',
    label: 'Skool',
    category: 'community_chat',
    telemetryTier: 'publish_only',
    supportedMetrics: { likes: false, comments: false, shares: false, saves: false, clicks: false, views: false, impressions: false },
    likesLabel: 'Likes',
    commentsLabel: 'Comments',
    sharesLabel: 'Shares',
    viewsLabel: 'Views',
    capabilitySummary: 'Publish-Only Pipe',
    apiLimitationNote: 'Skool does not provide a public post analytics API.',
  },
  whop: {
    id: 'whop',
    label: 'Whop',
    category: 'community_chat',
    telemetryTier: 'publish_only',
    supportedMetrics: { likes: false, comments: false, shares: false, saves: false, clicks: false, views: false, impressions: false },
    likesLabel: 'Likes',
    commentsLabel: 'Comments',
    sharesLabel: 'Shares',
    viewsLabel: 'Views',
    capabilitySummary: 'Publish-Only Pipe',
    apiLimitationNote: 'Whop community publish pipe without engagement readback API.',
  },
  warpcast: {
    id: 'warpcast',
    label: 'Warpcast (Farcaster)',
    category: 'community_chat',
    telemetryTier: 'publish_only',
    supportedMetrics: { likes: false, comments: false, shares: false, saves: false, clicks: false, views: false, impressions: false },
    likesLabel: 'Likes',
    commentsLabel: 'Replies',
    sharesLabel: 'Recasts',
    viewsLabel: 'Views',
    capabilitySummary: 'Publish-Only Pipe',
    apiLimitationNote: 'Cast readback requires separate Hub/indexer queries not currently configured.',
  },
  manual: {
    id: 'manual',
    label: 'Manual Copy',
    category: 'manual',
    telemetryTier: 'publish_only',
    supportedMetrics: { likes: false, comments: false, shares: false, saves: false, clicks: false, views: false, impressions: false },
    likesLabel: 'Likes',
    commentsLabel: 'Comments',
    sharesLabel: 'Shares',
    viewsLabel: 'Views',
    capabilitySummary: 'Manual Log',
    apiLimitationNote: 'Tracks manual posting cadence & hook archive without automated API polling.',
  },
};

const ALIAS_MAP: Record<string, string> = {
  twitter: 'x',
  farcaster: 'warpcast',
  'dev.to': 'devto',
};

export function canonicalPlatformId(platform: string): string {
  const normalized = (platform || '').trim().toLowerCase();
  return ALIAS_MAP[normalized] || normalized;
}

export function getPlatformCapability(platform: string): PlatformCapability {
  const id = canonicalPlatformId(platform);
  if (REGISTRY[id]) return REGISTRY[id];
  return {
    id,
    label: id ? id.charAt(0).toUpperCase() + id.slice(1) : 'Unknown',
    category: 'social',
    telemetryTier: 'publish_only',
    supportedMetrics: { likes: false, comments: false, shares: false, saves: false, clicks: false, views: false, impressions: false },
    likesLabel: 'Likes',
    commentsLabel: 'Comments',
    sharesLabel: 'Shares',
    viewsLabel: 'Views',
    capabilitySummary: 'Limited Telemetry',
    apiLimitationNote: 'No platform engagement readback capability registered.',
  };
}

export function getAllPlatformCapabilities(): PlatformCapability[] {
  return Object.values(REGISTRY);
}

export function isViewCapablePlatform(platform: string): boolean {
  return getPlatformCapability(platform).supportedMetrics.views;
}

export function isPublishOnlyPlatform(platform: string): boolean {
  return getPlatformCapability(platform).telemetryTier === 'publish_only';
}
