import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { extractNormalizedEngagement, UniversalEngagement } from '@/lib/services/analytics/normalize';
import { syncWorkspaceEngagement } from '@/lib/services/analytics/syncEngagement';

export const dynamic = 'force-dynamic';

const admin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

// Detect hook type from the first sentence of the post content
function detectHookType(content: string): 'question' | 'statement' | 'statistic' | 'story' | 'contrarian' | 'framework' | 'unknown' {
  const firstLine = content.split('\n')[0].trim().slice(0, 240);
  if (!firstLine) return 'unknown';
  
  if (firstLine.endsWith('?') || /^(why|how|what|can|are|is|should|who|where|when|which)\b/i.test(firstLine)) {
    return 'question';
  }
  
  if (/^(stop|don't|dont|never|most people|unpopular opinion|forget|nobody talks about|everyone is wrong|the truth about)\b/i.test(firstLine)) {
    return 'contrarian';
  }

  if (/^(how to|here's|heres|here is|the \d|step \d|framework|guide|blueprint|playbook|3 steps|5 ways|rule #?\d)\b/i.test(firstLine)) {
    return 'framework';
  }

  // Statistic: starts with number or has %, $, x multiplier
  if (/^\d/.test(firstLine) || /\b\d+[%x]\b|\$[\d,]+|\b\d+\s*(times|x|percent|million|billion|thousand|k|hours|days|years)\b/i.test(firstLine.slice(0, 90))) {
    return 'statistic';
  }

  // Story: personal narrative opener
  if (/^(i |we |my |last |today|yesterday|when i|it was|back in|in \d{4}|a few months ago|a few years ago|i spent)\b/i.test(firstLine)) {
    return 'story';
  }

  return 'statement';
}

export async function GET(request: NextRequest) {
  const auth = await getCurrentAuth(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { workspaceId } = auth;

  const shouldSync = request.nextUrl.searchParams.get('sync') === 'true';

  // If requested or on demand, attempt a live sync of recent engagement from platform APIs
  if (shouldSync) {
    try {
      await syncWorkspaceEngagement(workspaceId, { maxPosts: 20, forceRefresh: true });
    } catch {
      // Non-blocking sync failure — proceed with stored data
    }
  }

  // Get posts from last 90 days with enough data for patterns
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { data: posts, error } = await admin
    .from('posts')
    .select('id, content, hook_type, word_count, has_media, created_at, status')
    .eq('workspace_id', workspaceId)
    .in('status', ['published', 'draft', 'scheduled'])
    .gte('created_at', ninetyDaysAgo.toISOString())
    .order('created_at', { ascending: false });

  if (error || !posts || posts.length === 0) {
    return NextResponse.json({
      hasData: false,
      hasRealEngagement: false,
      totalPosts: 0,
      totalInteractions: 0,
      avgInteractionsPerPost: 0,
      totalViews: 0,
      hookBreakdown: [],
      bestDay: null,
      bestHour: null,
      dayDistribution: new Array(7).fill(0),
      dayEngagement: new Array(7).fill(0),
      hourDistribution: new Array(24).fill(0),
      hourEngagement: new Array(24).fill(0),
      avgWordCount: 0,
      mediaRatio: 0,
      mediaLift: 0,
      resonanceScore: 0,
      recommendations: [],
      recentPatternRows: [],
    });
  }

  // 1. Fetch all variants for these posts
  const postIds = posts.map((p: any) => p.id);
  const { data: variants } = await admin
    .from('post_variants')
    .select('id, post_id, platform, status, character_count')
    .in('post_id', postIds);

  const variantIds = (variants || []).map((v: any) => v.id);

  // 2. Fetch real platform posts containing engagement data
  let platformPostsByVariant: Record<string, any[]> = {};
  if (variantIds.length > 0) {
    const { data: pPosts } = await admin
      .from('platform_posts')
      .select('id, post_variant_id, platform_connection_id, platform_post_id, platform_url, engagement')
      .in('post_variant_id', variantIds);

    for (const pp of pPosts || []) {
      if (!platformPostsByVariant[pp.post_variant_id]) platformPostsByVariant[pp.post_variant_id] = [];
      platformPostsByVariant[pp.post_variant_id].push(pp);
    }
  }

  const variantsByPost: Record<string, any[]> = {};
  for (const v of variants || []) {
    if (!variantsByPost[v.post_id]) variantsByPost[v.post_id] = [];
    const ppList = platformPostsByVariant[v.id] || [];
    variantsByPost[v.post_id].push({
      ...v,
      platformPosts: ppList,
    });
  }

  // 3. Build enriched pattern data with REAL metrics from social platform APIs
  let totalWorkspaceInteractions = 0;
  let totalWorkspaceViews = 0;
  let totalRealEngagementCount = 0;

  const patternRows = posts.map((p: any) => {
    const hookType = p.hook_type || detectHookType(p.content);
    const wordCount = p.word_count || p.content.split(/\s+/).filter(Boolean).length;
    const publishedAt = new Date(p.created_at);
    const dayOfWeek = publishedAt.getDay(); // 0=Sun
    const hourOfDay = publishedAt.getHours();
    const pVariants = variantsByPost[p.id] || [];
    const publishedCount = pVariants.filter((v: any) => v.status === 'published').length;
    const totalPlatforms = pVariants.length;

    // Aggregate real engagement across all platform variants for this post
    let postLikes = 0;
    let postComments = 0;
    let postShares = 0;
    let postViews = 0;
    let hasRealData = false;

    for (const v of pVariants) {
      for (const pp of v.platformPosts || []) {
        const norm: UniversalEngagement = extractNormalizedEngagement(pp.engagement);
        postLikes += norm.likes;
        postComments += norm.comments;
        postShares += norm.shares;
        postViews += norm.views;
        if (norm.hasRealData) hasRealData = true;
      }
    }

    const postInteractions = postLikes + postComments + postShares;
    totalWorkspaceInteractions += postInteractions;
    totalWorkspaceViews += postViews;
    if (hasRealData) totalRealEngagementCount++;

    const deliveryRate = totalPlatforms > 0 ? (publishedCount > 0 ? publishedCount / totalPlatforms : 1) : 1;

    return {
      id: p.id,
      contentSnippet: p.content.slice(0, 100),
      hookType,
      wordCount,
      dayOfWeek,
      hourOfDay,
      hasMedia: Boolean(p.has_media),
      deliveryRate,
      publishedCount,
      totalPlatforms,
      status: p.status,
      // Real Engagement Metrics
      likes: postLikes,
      comments: postComments,
      shares: postShares,
      views: postViews,
      interactions: postInteractions,
      hasRealData,
    };
  });

  const hasRealEngagement = totalRealEngagementCount > 0;
  const avgWorkspaceInteractions = Math.round((totalWorkspaceInteractions / Math.max(posts.length, 1)) * 10) / 10;

  // 4. Aggregate by hookType with REAL AUDIENCE DATA
  const byHook: Record<
    string,
    {
      count: number;
      totalInteractions: number;
      totalLikes: number;
      totalComments: number;
      totalShares: number;
      totalViews: number;
      samples: string[];
      topPostSnippet: string;
      topPostInteractions: number;
      hasRealData: boolean;
    }
  > = {};

  for (const row of patternRows) {
    if (!byHook[row.hookType]) {
      byHook[row.hookType] = {
        count: 0,
        totalInteractions: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        totalViews: 0,
        samples: [],
        topPostSnippet: '',
        topPostInteractions: -1,
        hasRealData: false,
      };
    }
    const h = byHook[row.hookType];
    h.count++;
    h.totalInteractions += row.interactions;
    h.totalLikes += row.likes;
    h.totalComments += row.comments;
    h.totalShares += row.shares;
    h.totalViews += row.views;
    if (row.hasRealData) h.hasRealData = true;

    if (row.interactions > h.topPostInteractions) {
      h.topPostInteractions = row.interactions;
      h.topPostSnippet = row.contentSnippet;
    }

    if (h.samples.length < 2) {
      h.samples.push(row.contentSnippet);
    }
  }

  // Calculate averages and performance index per hook
  const hookBreakdown = Object.entries(byHook).map(([type, data]) => {
    const avgInteractions = Math.round((data.totalInteractions / Math.max(data.count, 1)) * 10) / 10;
    const avgComments = Math.round((data.totalComments / Math.max(data.count, 1)) * 10) / 10;
    const avgLikes = Math.round((data.totalLikes / Math.max(data.count, 1)) * 10) / 10;
    const avgShares = Math.round((data.totalShares / Math.max(data.count, 1)) * 10) / 10;

    // Relative performance index (e.g., 100 = average, 180 = 80% above average)
    let performanceIndex = 100;
    if (avgWorkspaceInteractions > 0) {
      performanceIndex = Math.round((avgInteractions / avgWorkspaceInteractions) * 100);
    }

    return {
      type,
      count: data.count,
      totalInteractions: data.totalInteractions,
      avgInteractions,
      avgComments,
      avgLikes,
      avgShares,
      performanceIndex,
      samples: data.samples,
      topPostSnippet: data.topPostSnippet,
      hasRealData: data.hasRealData,
    };
  });

  // Sort hooks by real audience response (avgInteractions) if real data exists, else by count
  if (hasRealEngagement) {
    hookBreakdown.sort((a, b) => b.avgInteractions - a.avgInteractions);
  } else {
    hookBreakdown.sort((a, b) => b.count - a.count);
  }

  // Identify top-performing hook archetype
  const topHook = hookBreakdown[0];

  // 5. Aggregate Best Day & Hour using REAL AUDIENCE ENGAGEMENT
  const dayDistribution = new Array(7).fill(0);
  const dayEngagement = new Array(7).fill(0);
  const byDay: Record<number, { count: number; interactions: number }> = {};

  for (const row of patternRows) {
    dayDistribution[row.dayOfWeek]++;
    dayEngagement[row.dayOfWeek] += row.interactions;
    if (!byDay[row.dayOfWeek]) byDay[row.dayOfWeek] = { count: 0, interactions: 0 };
    byDay[row.dayOfWeek].count++;
    byDay[row.dayOfWeek].interactions += row.interactions;
  }

  // Sort days by total audience engagement if available, else by frequency
  const sortedDays = Object.entries(byDay).sort((a, b) => {
    if (hasRealEngagement && (b[1].interactions !== a[1].interactions)) {
      return b[1].interactions - a[1].interactions;
    }
    return b[1].count - a[1].count;
  });
  const bestDayEntry = sortedDays[0];

  // 24-hour distribution
  const hourDistribution = new Array(24).fill(0);
  const hourEngagement = new Array(24).fill(0);
  const byHour: Record<number, { count: number; interactions: number }> = {};

  for (const row of patternRows) {
    hourDistribution[row.hourOfDay]++;
    hourEngagement[row.hourOfDay] += row.interactions;
    if (!byHour[row.hourOfDay]) byHour[row.hourOfDay] = { count: 0, interactions: 0 };
    byHour[row.hourOfDay].count++;
    byHour[row.hourOfDay].interactions += row.interactions;
  }

  const sortedHours = Object.entries(byHour).sort((a, b) => {
    if (hasRealEngagement && (b[1].interactions !== a[1].interactions)) {
      return b[1].interactions - a[1].interactions;
    }
    return b[1].count - a[1].count;
  });
  const bestHourEntry = sortedHours[0];

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const formatHour = (h: number) => {
    if (h === 0) return '12am';
    if (h < 12) return `${h}am`;
    if (h === 12) return '12pm';
    return `${h - 12}pm`;
  };

  // 6. Media Performance Lift vs Text-Only
  const mediaPosts = patternRows.filter(r => r.hasMedia);
  const textPosts = patternRows.filter(r => !r.hasMedia);
  const mediaRatio = Math.round((mediaPosts.length / Math.max(patternRows.length, 1)) * 100);

  const avgMediaInteractions = mediaPosts.length > 0
    ? mediaPosts.reduce((s, r) => s + r.interactions, 0) / mediaPosts.length
    : 0;
  const avgTextInteractions = textPosts.length > 0
    ? textPosts.reduce((s, r) => s + r.interactions, 0) / textPosts.length
    : 0;

  let mediaLift = 0;
  if (avgTextInteractions > 0 && avgMediaInteractions > 0) {
    mediaLift = Math.round(((avgMediaInteractions - avgTextInteractions) / avgTextInteractions) * 100);
  }

  const totalWords = patternRows.reduce((acc, r) => acc + r.wordCount, 0);
  const avgWordCount = Math.round(totalWords / Math.max(patternRows.length, 1));

  // 7. REAL Content Resonance Score (0-100)
  // Factors:
  // - Real Audience Interactions (up to 40 pts)
  // - Hook Variety & Leverage (up to 25 pts)
  // - Media Lift / Adoption (up to 20 pts)
  // - Publishing Consistency & Reach (up to 15 pts)
  let resonanceScore: number;
  if (hasRealEngagement) {
    const interactionPts = Math.min(Math.round(avgWorkspaceInteractions * 3.5), 40);
    const varietyPts = Math.min(hookBreakdown.filter(h => h.count > 0).length * 5, 25);
    const mediaPts = Math.min(Math.round((mediaRatio / 100) * 15) + (mediaLift > 0 ? 5 : 0), 20);
    const consistencyPts = Math.min(posts.length * 2, 15);
    resonanceScore = Math.min(Math.max(interactionPts + varietyPts + mediaPts + consistencyPts, 25), 100);
  } else {
    // Graceful baseline when engagement hasn't yet been synced
    const volumePts = Math.min(posts.length * 5, 30);
    const varietyPts = Math.min(hookBreakdown.length * 7, 25);
    const mediaPts = Math.min(Math.round(mediaRatio * 0.2), 20);
    const deliveryPts = Math.min(
      Math.round((patternRows.reduce((acc, r) => acc + r.deliveryRate, 0) / Math.max(patternRows.length, 1)) * 25),
      25
    );
    resonanceScore = Math.min(volumePts + varietyPts + mediaPts + deliveryPts, 92);
  }

  // 8. Dynamic Prescriptions Powered by Real Observed Metrics
  const recommendations: Array<{ id: string; title: string; desc: string; type: 'hook' | 'timing' | 'format' | 'growth' }> = [];

  // Prescription A: Highest performing hook vs baseline
  if (topHook) {
    if (hasRealEngagement && topHook.avgInteractions > avgWorkspaceInteractions) {
      const multiplier = (topHook.avgInteractions / Math.max(avgWorkspaceInteractions, 0.1)).toFixed(1);
      recommendations.push({
        id: 'hook-proven-winner',
        title: `Signature Hook: ${topHook.type.toUpperCase()}`,
        desc: `Your ${topHook.type} openers generate ${multiplier}x higher audience engagement (avg ${topHook.avgInteractions} reactions) than your channel average. Prioritize this style.`,
        type: 'hook',
      });
    } else if (topHook.type === 'statement') {
      recommendations.push({
        id: 'hook-variety',
        title: 'Diversify into Curiosity Questions',
        desc: `Over ${Math.round((topHook.count / posts.length) * 100)}% of your dispatches rely on bold statements. Testing Question and Data hooks sparks up to 2.4x more comments across feeds.`,
        type: 'hook',
      });
    } else {
      recommendations.push({
        id: 'hook-double-down',
        title: `Signature Voice: ${topHook.type.toUpperCase()}`,
        desc: `Your ${topHook.type} hooks represent your primary narrative structure. Keep honing this voice across your social channels.`,
        type: 'hook',
      });
    }
  }

  // Prescription B: Media lift
  if (hasRealEngagement && mediaLift > 15) {
    recommendations.push({
      id: 'media-proven-lift',
      title: `Media Multiplier (+${mediaLift}%)`,
      desc: `Dispatches with media attachments attract ${mediaLift}% more audience interactions than text-only posts on your channels. Keep attaching visuals or carousels.`,
      type: 'format',
    });
  } else if (mediaRatio === 0) {
    recommendations.push({
      id: 'media-lift',
      title: 'Unlock Media Multiplier',
      desc: 'None of your recent dispatches include media. Adding visuals or slide carousels boosts social feed dwell time by ~65%.',
      type: 'format',
    });
  }

  // Prescription C: Launch timing
  if (bestDayEntry) {
    const bestDayNum = parseInt(bestDayEntry[0]);
    const bestDayName = dayNames[bestDayNum];
    if (hasRealEngagement && bestDayEntry[1].interactions > 0) {
      recommendations.push({
        id: 'timing-optimize',
        title: `Peak Engagement Window: ${bestDayName}s`,
        desc: `Your highest audience interaction density is recorded on ${bestDayName}s (${bestDayEntry[1].interactions} total interactions). Schedule your flagship stories on this day.`,
        type: 'timing',
      });
    } else {
      recommendations.push({
        id: 'timing-optimize',
        title: `Prime Launch Window: ${bestDayName}s`,
        desc: `Your peak publishing frequency is on ${bestDayName}s. Maintain consistent drops during this window to condition your audience.`,
        type: 'timing',
      });
    }
  }

  return NextResponse.json({
    hasData: true,
    hasRealEngagement,
    totalPosts: posts.length,
    totalInteractions: totalWorkspaceInteractions,
    avgInteractionsPerPost: avgWorkspaceInteractions,
    totalViews: totalWorkspaceViews,
    hookBreakdown,
    topHook: topHook?.type || 'statement',
    bestDay: bestDayEntry
      ? {
          day: parseInt(bestDayEntry[0]),
          name: dayNames[parseInt(bestDayEntry[0])],
          count: bestDayEntry[1].count,
          interactions: bestDayEntry[1].interactions,
        }
      : null,
    bestHour: bestHourEntry
      ? {
          hour: parseInt(bestHourEntry[0]),
          label: formatHour(parseInt(bestHourEntry[0])),
          count: bestHourEntry[1].count,
          interactions: bestHourEntry[1].interactions,
        }
      : null,
    dayDistribution,
    dayEngagement,
    hourDistribution,
    hourEngagement,
    avgWordCount,
    mediaRatio,
    mediaLift,
    resonanceScore,
    recommendations,
    recentPatternRows: patternRows.slice(0, 100),
  });
}
