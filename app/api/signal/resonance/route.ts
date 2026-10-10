import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';

export const dynamic = 'force-dynamic';

const admin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

// Detect hook type from the first sentence of the post content
function detectHookType(content: string): 'question' | 'statement' | 'statistic' | 'story' | 'unknown' {
  const firstLine = content.split('\n')[0].trim().slice(0, 200);
  if (!firstLine) return 'unknown';
  if (firstLine.endsWith('?')) return 'question';
  // Statistic: starts with number or has % or number pattern early
  if (/^\d/.test(firstLine) || /\b\d+[%x]\b|\b\d+\s*(times|x|percent|million|billion|thousand)\b/i.test(firstLine.slice(0, 80))) return 'statistic';
  // Story: starts with "I ", "We ", "Last", "Today", "Yesterday", "When I"
  if (/^(I |We |Last |Today|Yesterday|When I|It was|Back in|In \d{4})/i.test(firstLine)) return 'story';
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
    .eq('status', 'published')
    .gte('created_at', ninetyDaysAgo.toISOString())
    .order('created_at', { ascending: false });

  if (error || !posts || posts.length === 0) {
    return NextResponse.json({ hasData: false, totalPosts: 0, patterns: [] });
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
    // Success rate: how many platforms actually published
    const successRate = totalPlatforms > 0 ? publishedCount / totalPlatforms : 0;
    return { hookType, wordCount, dayOfWeek, hourOfDay, hasMedia: p.has_media || false, successRate, publishedCount };
  });

  // Aggregate by hookType
  const byHook: Record<string, { count: number; avgSuccess: number }> = {};
  for (const row of patternRows) {
    if (!byHook[row.hookType]) byHook[row.hookType] = { count: 0, avgSuccess: 0 };
    byHook[row.hookType].count++;
    byHook[row.hookType].avgSuccess += row.successRate;
  }
  for (const k of Object.keys(byHook)) {
    byHook[k].avgSuccess = byHook[k].avgSuccess / byHook[k].count;
  }

  // Best day of week
  const byDay: Record<number, { count: number }> = {};
  for (const row of patternRows) {
    if (!byDay[row.dayOfWeek]) byDay[row.dayOfWeek] = { count: 0 };
    byDay[row.dayOfWeek].count++;
  }
  const bestDay = Object.entries(byDay).sort((a, b) => b[1].count - a[1].count)[0];

  // Best hour
  const byHour: Record<number, { count: number }> = {};
  for (const row of patternRows) {
    if (!byHour[row.hourOfDay]) byHour[row.hourOfDay] = { count: 0 };
    byHour[row.hourOfDay].count++;
  }
  const bestHour = Object.entries(byHour).sort((a, b) => b[1].count - a[1].count)[0];

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const formatHour = (h: number) => {
    if (h === 0) return '12am';
    if (h < 12) return `${h}am`;
    if (h === 12) return '12pm';
    return `${h - 12}pm`;
  };

  return NextResponse.json({
    hasData: true,
    totalPosts: posts.length,
    hookBreakdown: Object.entries(byHook).map(([type, data]) => ({
      type,
      count: data.count,
      avgSuccess: Math.round(data.avgSuccess * 100),
    })).sort((a, b) => b.avgSuccess - a.avgSuccess),
    bestDay: bestDay ? { day: parseInt(bestDay[0]), name: dayNames[parseInt(bestDay[0])], count: bestDay[1].count } : null,
    bestHour: bestHour ? { hour: parseInt(bestHour[0]), label: formatHour(parseInt(bestHour[0])), count: bestHour[1].count } : null,
    recentPatternRows: patternRows.slice(0, 20), // For heatmap rendering
  });
}
