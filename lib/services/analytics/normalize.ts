/**
 * Universal Social Engagement Normalizer
 * Normalizes engagement metrics across all supported social platforms (LinkedIn, X, Instagram,
 * Threads, YouTube, Pinterest, Reddit, Dev.to, Hashnode, etc.) into a unified schema.
 */

export interface UniversalEngagement {
  likes: number;
  comments: number;
  shares: number;
  views: number;
  totalInteractions: number;
  engagementRate: number; // percentage (e.g. 4.8%)
  hasRealData: boolean;
  syncedAt?: string;
}

export function extractNormalizedEngagement(raw: any): UniversalEngagement {
  if (!raw || typeof raw !== 'object') {
    return {
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
      totalInteractions: 0,
      engagementRate: 0,
      hasRealData: false,
    };
  }

  // 1. Likes / Reactions / Upvotes / Favorites
  const likes = Number(
    raw.likes ??
    raw.like_count ??
    raw.likeCount ??
    raw.totalLikes ??
    raw.positive_reactions ??
    raw.reaction_count ??
    raw.score ??
    raw.upvotes ??
    raw.favorites ??
    raw.favorite_count ??
    0
  );

  // 2. Comments / Replies / Responses / First-level comments
  const comments = Number(
    raw.comments ??
    raw.comments_count ??
    raw.commentCount ??
    raw.totalComments ??
    raw.replies ??
    raw.replies_count ??
    raw.reply_count ??
    raw.response_count ??
    0
  );

  // 3. Shares / Reposts / Retweets / Boosts / Quotes / Pins / Saves
  let shares = 0;
  if (raw.shares !== undefined || raw.shares_count !== undefined || raw.totalShares !== undefined) {
    const explicitShares = Number(raw.shares ?? raw.shares_count ?? raw.totalShares ?? 0);
    const distinctReposts = Number(raw.reposts ?? raw.reposts_count ?? raw.retweets ?? raw.retweet_count ?? 0);
    const distinctQuotes = Number(raw.quotes ?? raw.quotes_count ?? 0);

    // If explicitShares is 0 but distinct reposts or quotes were reported, use their sum
    if (explicitShares === 0 && (distinctReposts > 0 || distinctQuotes > 0)) {
      shares = (isNaN(distinctReposts) ? 0 : distinctReposts) + (isNaN(distinctQuotes) ? 0 : distinctQuotes);
    } else {
      shares = isNaN(explicitShares) ? 0 : explicitShares;
    }
  } else {
    // No explicit shares field: sum distinct reposts/retweets and quotes
    const distinctReposts = Number(raw.reposts ?? raw.reposts_count ?? raw.retweets ?? raw.retweet_count ?? 0);
    const distinctQuotes = Number(raw.quotes ?? raw.quotes_count ?? 0);
    const saves = Number(raw.saves ?? raw.pin_clicks ?? 0);
    shares =
      (isNaN(distinctReposts) ? 0 : distinctReposts) +
      (isNaN(distinctQuotes) ? 0 : distinctQuotes) +
      (isNaN(saves) ? 0 : saves);
  }

  // 4. Views / Impressions / Reach / Plays
  const views = Number(
    raw.views ??
    raw.views_count ??
    raw.view_count ??
    raw.viewCount ??
    raw.impressions ??
    raw.reach ??
    raw.plays ??
    raw.pageViews ??
    0
  );

  const totalInteractions = Math.max(0, likes) + Math.max(0, comments) + Math.max(0, shares);
  
  // Calculate engagement rate
  let engagementRate = 0;
  if (views > 0) {
    engagementRate = Math.round((totalInteractions / views) * 1000) / 10;
  } else if (totalInteractions > 0) {
    // Relative benchmark when impressions are unexposed by platform API
    engagementRate = Math.min(Math.round(totalInteractions * 3.5), 100);
  }

  // hasRealData must reflect actual numeric data, NOT just a successful sync attempt.
  // syncedAt alone means the sync ran but data could still be all-zeros (e.g. API error).
  const hasRealData = totalInteractions > 0 || views > 0;

  return {
    likes: Math.max(0, isNaN(likes) ? 0 : likes),
    comments: Math.max(0, isNaN(comments) ? 0 : comments),
    shares: Math.max(0, isNaN(shares) ? 0 : shares),
    views: Math.max(0, isNaN(views) ? 0 : views),
    totalInteractions: Math.max(0, isNaN(totalInteractions) ? 0 : totalInteractions),
    engagementRate: Math.max(0, isNaN(engagementRate) ? 0 : engagementRate),
    hasRealData,
    syncedAt: raw.syncedAt || undefined,
  };
}
