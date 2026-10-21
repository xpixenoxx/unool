import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';

const adminClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

interface AnalyticsEvent {
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
  workspace_id: string;
  profile_id: string;
  referrer: string | null;
  user_agent: string | null;
}

const TEMPLATE_NAMES: Record<string, string> = {
  'lover': 'The Lover',
  'lone': 'The Lone',
  'energy': 'The Energy',
  'rebellion': 'The Rebellion',
  'vision': 'The Vision',
  'human': 'The Human',
  'the-machine': 'The Machine',
  'the-club': 'The Club',
  'the-builder': 'The Builder',
  'the-visionary': 'The Visionary',
  'the-hustler': 'The Hustler',
  'the-aesthete': 'The Aesthete',
  'the-creator': 'The Creator',
  'the-voice': 'The Voice',
  'the-studio': 'The Studio',
};

// GET /api/profile/analytics - Get template analytics for current user's profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get the user's profile from auth context
    // In a real app, you'd get this from the session
    const supabase = createClient(
      config.SUPABASE_URL,
      config.SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            cookie: request.headers.get('cookie') || '',
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's profile
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, workspace_id, theme')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const workspaceId = profile.workspace_id;
    const currentTemplate = profile.theme?.template || 'lone';

    // Fetch analytics events for this profile
    const { data: events, error: eventsError } = await adminClient
      .from('analytics_events')
      .select('event_type, event_data, created_at, workspace_id, profile_id, referrer, user_agent')
      .eq('profile_id', profile.id)
      .gte('created_at', startDate.toISOString());

    if (eventsError) throw eventsError;

    const typedEvents = events as AnalyticsEvent[];

    // Aggregate current template stats
    let views = 0;
    let linkClicks = 0;
    let ctaClicks = 0;
    const viewsByDay: Record<string, number> = {};
    const clicksByDay: Record<string, number> = {};
    const linkClicksMap: Record<string, number> = {};
    const referrersMap: Record<string, number> = {};
    const deviceMap: Record<string, number> = {};

    typedEvents?.forEach((e) => {
      const day = e.created_at.split('T')[0];

      if (e.event_type === 'profile_view') {
        views++;
        viewsByDay[day] = (viewsByDay[day] || 0) + 1;

        // Track referrer
        const referrer = e.event_data?.utm_source as string || e.referrer || 'direct';
        referrersMap[referrer] = (referrersMap[referrer] || 0) + 1;

        // Track device (from user agent)
        const ua = e.user_agent || '';
        let device = 'Desktop';
        if (/Mobile|Android|iPhone/i.test(ua)) device = 'Mobile';
        else if (/Tablet|iPad/i.test(ua)) device = 'Tablet';
        deviceMap[device] = (deviceMap[device] || 0) + 1;
      }

      if (e.event_type === 'link_click') {
        linkClicks++;
        clicksByDay[day] = (clicksByDay[day] || 0) + 1;

        const linkType = e.event_data?.link_type as string || 'unknown';
        const linkUrl = e.event_data?.link_url as string || 'unknown';
        const linkText = e.event_data?.link_text as string || linkType;
        const key = `${linkText}:${linkUrl}`;
        linkClicksMap[key] = (linkClicksMap[key] || 0) + 1;
      }

      if (e.event_type === 'profile_cta_click') {
        ctaClicks++;
        clicksByDay[day] = (clicksByDay[day] || 0) + 1;
      }
    });

    // Template usage across workspace (for comparison)
    const { data: workspaceProfiles } = await adminClient
      .from('profiles')
      .select('id, theme')
      .eq('workspace_id', workspaceId);

    const templateUsageMap: Record<string, { views: number; clicks: number; ctaClicks: number }> = {};

    if (workspaceProfiles) {
      const profileIds = workspaceProfiles.map(p => p.id);

      if (profileIds.length > 0) {
        const { data: workspaceEvents } = await adminClient
          .from('analytics_events')
          .select('event_type, event_data, profile_id')
          .in('profile_id', profileIds)
          .gte('created_at', startDate.toISOString());

        workspaceEvents?.forEach((e) => {
          const template = workspaceProfiles.find(p => p.id === e.profile_id)?.theme?.template || 'lone';
          if (!templateUsageMap[template]) {
            templateUsageMap[template] = { views: 0, clicks: 0, ctaClicks: 0 };
          }

          if (e.event_type === 'profile_view') {
            templateUsageMap[template].views++;
          }
          if (e.event_type === 'link_click') {
            templateUsageMap[template].clicks++;
          }
          if (e.event_type === 'profile_cta_click') {
            templateUsageMap[template].ctaClicks++;
          }
        });
      }
    }

    // Build template usage array
    const templateUsage = Object.entries(templateUsageMap).map(([templateId, stats]) => ({
      templateId,
      templateName: TEMPLATE_NAMES[templateId] || templateId,
      views: stats.views,
      linkClicks: stats.clicks,
      ctaClicks: stats.ctaClicks,
      conversionRate: stats.views > 0 ? (stats.clicks / stats.views) * 100 : 0,
      avgSessionDuration: 0, // Would need session tracking
      lastUsed: null, // Would need last activity tracking
    }));

    // Build template comparison
    const templateComparison = Object.entries(templateUsageMap).map(([templateId, stats]) => ({
      templateId,
      templateName: TEMPLATE_NAMES[templateId] || templateId,
      views: stats.views,
      linkClicks: stats.clicks,
      conversionRate: stats.views > 0 ? (stats.clicks / stats.views) * 100 : 0,
    }));

    // Sort by views descending
    templateUsage.sort((a, b) => b.views - a.views);
    templateComparison.sort((a, b) => b.views - a.views);

    // Top links
    const topLinks = Object.entries(linkClicksMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([key, clicks]) => {
        const [label, url] = key.split(':');
        return { label, url, clicks };
      });

    // Top referrers
    const topReferrers = Object.entries(referrersMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([source, count]) => ({ source, count }));

    // Device breakdown
    const deviceBreakdown = Object.entries(deviceMap)
      .sort(([, a], [, b]) => b - a)
      .map(([device, count]) => ({ device, count }));

    // Generate daily data arrays for charts
    const viewsByDayArray = Array.from({ length: days }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      return { date: dateStr, count: viewsByDay[dateStr] || 0 };
    });

    const clicksByDayArray = Array.from({ length: days }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      return { date: dateStr, count: clicksByDay[dateStr] || 0 };
    });

    const conversionRate = views > 0 ? (linkClicks / views) * 100 : 0;

    return NextResponse.json({
      templateUsage,
      currentTemplateStats: {
        views,
        linkClicks,
        ctaClicks,
        conversionRate,
        avgSessionDuration: 45, // Mock value
        viewsByDay: viewsByDayArray,
        clicksByDay: clicksByDayArray,
        topLinks,
        topReferrers,
        deviceBreakdown,
      },
      templateComparison,
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}