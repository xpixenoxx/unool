import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';

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
      totalPosts: 0,
      hookBreakdown: [],
      bestDay: null,
      bestHour: null,
      dayDistribution: new Array(7).fill(0),
      hourDistribution: new Array(24).fill(0),
      avgWordCount: 0,
      mediaRatio: 0,
      resonanceScore: 0,
      recommendations: [],
      recentPatternRows: [],
    });
  }

  // Fetch all variants for these posts to understand platform performance
  const postIds = posts.map((p: any) => p.id);
  const { data: variants } = await admin
    .from('post_variants')
    .select('post_id, platform, status, character_count')
    .in('post_id', postIds);

  const variantsByPost: Record<string, any[]> = {};
  for (const v of variants || []) {
    if (!variantsByPost[v.post_id]) variantsByPost[v.post_id] = [];
    variantsByPost[v.post_id].push(v);
  }

  // Build pattern data from each post
  const patternRows = posts.map((p: any) => {
    const hookType = p.hook_type || detectHookType(p.content);
    const wordCount = p.word_count || p.content.split(/\s+/).filter(Boolean).length;
    const publishedAt = new Date(p.created_at);
    const dayOfWeek = publishedAt.getDay(); // 0=Sun
    const hourOfDay = publishedAt.getHours();
    const pVariants = variantsByPost[p.id] || [];
    const publishedCount = pVariants.filter((v: any) => v.status === 'published').length;
    const totalPlatforms = pVariants.length;
    // Success rate: how many platforms actually published (if draft, estimate 1)
    const successRate = totalPlatforms > 0 ? (publishedCount > 0 ? publishedCount / totalPlatforms : 1) : 1;
    return {
      id: p.id,
      contentSnippet: p.content.slice(0, 100),
      hookType,
      wordCount,
      dayOfWeek,
      hourOfDay,
      hasMedia: Boolean(p.has_media),
      successRate,
      publishedCount,
      totalPlatforms,
      status: p.status,
    };
  });

  // Aggregate by hookType
  const byHook: Record<string, { count: number; avgSuccess: number; samples: string[] }> = {};
  for (const row of patternRows) {
    if (!byHook[row.hookType]) byHook[row.hookType] = { count: 0, avgSuccess: 0, samples: [] };
    byHook[row.hookType].count++;
    byHook[row.hookType].avgSuccess += row.successRate;
    if (byHook[row.hookType].samples.length < 2) {
      byHook[row.hookType].samples.push(row.contentSnippet);
    }
  }
  for (const k of Object.keys(byHook)) {
    byHook[k].avgSuccess = byHook[k].avgSuccess / byHook[k].count;
  }

  // 7-day distribution
  const dayDistribution = new Array(7).fill(0);
  const byDay: Record<number, number> = {};
  for (const row of patternRows) {
    dayDistribution[row.dayOfWeek]++;
    byDay[row.dayOfWeek] = (byDay[row.dayOfWeek] || 0) + 1;
  }
  const bestDayEntry = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];

  // 24-hour distribution
  const hourDistribution = new Array(24).fill(0);
  const byHour: Record<number, number> = {};
  for (const row of patternRows) {
    hourDistribution[row.hourOfDay]++;
    byHour[row.hourOfDay] = (byHour[row.hourOfDay] || 0) + 1;
  }
  const bestHourEntry = Object.entries(byHour).sort((a, b) => b[1] - a[1])[0];

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const formatHour = (h: number) => {
    if (h === 0) return '12am';
    if (h < 12) return `${h}am`;
    if (h === 12) return '12pm';
    return `${h - 12}pm`;
  };

  const totalWords = patternRows.reduce((acc, r) => acc + r.wordCount, 0);
  const avgWordCount = Math.round(totalWords / Math.max(patternRows.length, 1));
  const mediaCount = patternRows.filter(r => r.hasMedia).length;
  const mediaRatio = Math.round((mediaCount / Math.max(patternRows.length, 1)) * 100);

  // Overall Resonance Score (0-100)
  // Factors: post volume (up to 30pts), hook variety (up to 25pts), media adoption (up to 20pts), delivery rate (up to 25pts)
  const volumePts = Math.min(posts.length * 5, 30);
  const varietyPts = Math.min(Object.keys(byHook).length * 8, 25);
  const mediaPts = Math.min(Math.round(mediaRatio * 0.2), 20);
  const avgDelivery = Math.round(
    (patternRows.reduce((acc, r) => acc + r.successRate, 0) / Math.max(patternRows.length, 1)) * 25
  );
  const resonanceScore = Math.min(volumePts + varietyPts + mediaPts + avgDelivery, 100);

  // Dynamic AI recommendations based on observed data
  const recommendations: Array<{ id: string; title: string; desc: string; type: 'hook' | 'timing' | 'format' | 'growth' }> = [];

  const topHook = Object.entries(byHook).sort((a, b) => b[1].count - a[1].count)[0];
  if (topHook) {
    if (topHook[0] === 'statement') {
      recommendations.push({
        id: 'hook-variety',
        title: 'Diversify into Curiosity Hooks',
        desc: `Over ${Math.round((topHook[1].count / posts.length) * 100)}% of your content relies on bold statements. Testing Question and Data hooks sparks up to 2.4x more comments.`,
        type: 'hook',
      });
    } else {
      recommendations.push({
        id: 'hook-double-down',
        title: `Signature Hook: ${topHook[0].toUpperCase()}`,
        desc: `Your ${topHook[0]} hooks are your most frequent pattern. Keep honing this voice while testing new angles.`,
        type: 'hook',
      });
    }
  }

  if (mediaRatio === 0) {
    recommendations.push({
      id: 'media-lift',
      title: 'Unlock Media Multiplier',
      desc: 'None of your recent posts include media. Adding visuals or carousels boosts social feed dwell time by ~65%.',
      type: 'format',
    });
  }

  if (avgWordCount < 60) {
    recommendations.push({
      id: 'pacing-expand',
      title: 'Test Sweet-Spot Pacing (80-150 words)',
      desc: `Your average post is ${avgWordCount} words (punchy micro). Testing 2-3 paragraph thought-leadership pieces builds deeper authority on LinkedIn.`,
      type: 'format',
    });
  } else if (avgWordCount > 250) {
    recommendations.push({
      id: 'pacing-condense',
      title: 'Hook Readers Faster in Line 1',
      desc: `With ${avgWordCount} words average, make sure your first 120 characters contain a crisp thesis before the "see more" cutoff.`,
      type: 'hook',
    });
  }

  if (bestDayEntry) {
    recommendations.push({
      id: 'timing-optimize',
      title: `Prime Launch Window: ${dayNames[parseInt(bestDayEntry[0])]}s`,
      desc: `Your peak publishing frequency is on ${dayNames[parseInt(bestDayEntry[0])]}s. Try scheduling consistent weekly drops during this window to condition your audience.`,
      type: 'timing',
    });
  }

  return NextResponse.json({
    hasData: true,
    totalPosts: posts.length,
    hookBreakdown: Object.entries(byHook).map(([type, data]) => ({
      type,
      count: data.count,
      avgSuccess: Math.round(data.avgSuccess * 100),
      samples: data.samples,
    })).sort((a, b) => b.count - a.count),
    bestDay: bestDayEntry ? { day: parseInt(bestDayEntry[0]), name: dayNames[parseInt(bestDayEntry[0])], count: bestDayEntry[1] } : null,
    bestHour: bestHourEntry ? { hour: parseInt(bestHourEntry[0]), label: formatHour(parseInt(bestHourEntry[0])), count: bestHourEntry[1] } : null,
    dayDistribution,
    hourDistribution,
    avgWordCount,
    mediaRatio,
    resonanceScore,
    recommendations,
    recentPatternRows: patternRows.slice(0, 100),
  });
}
