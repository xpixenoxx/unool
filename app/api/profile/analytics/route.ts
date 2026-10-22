import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';

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
    const days = parseInt(searchParams.get('days') || '30', 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const generateEmptyDailyArray = () => Array.from({ length: days }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      return { date: dateStr, count: 0 };
    });

    const emptyResponse = {
      templateUsage: [],
      currentTemplateStats: {
        views: 0,
        linkClicks: 0,
        ctaClicks: 0,
        conversionRate: 0,
        avgSessionDuration: 0,
        viewsByDay: generateEmptyDailyArray(),
        clicksByDay: generateEmptyDailyArray(),
        topLinks: [],
        topReferrers: [],
        deviceBreakdown: [],
      },
      templateComparison: [],
    };

    // Authenticate user
    let auth = null;
    try {
      auth = await getCurrentAuth(request);
    } catch (authErr) {
      console.warn('[Analytics API] getCurrentAuth error:', authErr);
    }

    const queryWorkspaceId = searchParams.get('workspaceId');
    const effectiveWorkspaceId = auth?.workspaceId || queryWorkspaceId;
    const effectiveUserId = auth?.userId;

    if (!effectiveWorkspaceId && !effectiveUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Retrieve profile
    const profileRepository = new SupabaseProfileRepository();
    let profile = null;
    if (effectiveWorkspaceId) {
      try {
        profile = await profileRepository.findByWorkspaceId(effectiveWorkspaceId);
      } catch (err) {
        console.warn('[Analytics API] findByWorkspaceId failed:', err);
      }
    }
    if (!profile && effectiveUserId) {
      try {
        profile = await profileRepository.findByUserId(effectiveUserId);
      } catch (err) {
        console.warn('[Analytics API] findByUserId failed:', err);
      }
    }

    if (!profile) {
      return NextResponse.json(emptyResponse);
    }

    const workspaceId = profile.workspaceId || effectiveWorkspaceId;
    const currentTemplate = (profile.theme as any)?.template || 'lone';

    // Fetch analytics events for this profile and/or workspace
    let typedEvents: AnalyticsEvent[] = [];
    try {
      let query = supabaseAdmin
        .from('analytics_events')
        .select('event_type, event_data, created_at, workspace_id, profile_id, referrer, user_agent')
        .gte('created_at', startDate.toISOString());

      if (profile.id && workspaceId) {
        query = query.or(`profile_id.eq.${profile.id},workspace_id.eq.${workspaceId}`);
      } else if (profile.id) {
        query = query.eq('profile_id', profile.id);
      } else if (workspaceId) {
        query = query.eq('workspace_id', workspaceId);
      }

      const { data: events, error: eventsError } = await query;
      if (eventsError) {
        console.warn('[Analytics API] Failed to query events, using empty array:', eventsError);
      } else if (events) {
        typedEvents = events as AnalyticsEvent[];
      }
    } catch (err) {
      console.warn('[Analytics API] Exception querying analytics_events:', err);
    }

    // Aggregate current template stats
    let views = 0;
    let linkClicks = 0;
    let ctaClicks = 0;
    const viewsByDay: Record<string, number> = {};
    const clicksByDay: Record<string, number> = {};
    const linkClicksMap: Record<string, number> = {};
    const referrersMap: Record<string, number> = {};
    const deviceMap: Record<string, number> = {};

    typedEvents.forEach((e) => {
      const day = e.created_at ? e.created_at.split('T')[0] : '';
      if (!day) return;

      if (e.event_type === 'profile_view') {
        views++;
        viewsByDay[day] = (viewsByDay[day] || 0) + 1;

        // Track referrer
        const referrer = (e.event_data?.utm_source as string) || e.referrer || 'direct';
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

        const linkType = (e.event_data?.link_type as string) || 'unknown';
        const linkUrl = (e.event_data?.link_url as string) || 'unknown';
        const linkText = (e.event_data?.link_text as string) || linkType;
        const key = `${linkText}:${linkUrl}`;
        linkClicksMap[key] = (linkClicksMap[key] || 0) + 1;
      }

      if (e.event_type === 'profile_cta_click') {
        ctaClicks++;
        clicksByDay[day] = (clicksByDay[day] || 0) + 1;
      }
    });

    // Template usage across workspace (for comparison)
    const templateUsageMap: Record<string, { views: number; clicks: number; ctaClicks: number }> = {};
    templateUsageMap[currentTemplate] = { views, clicks: linkClicks, ctaClicks };

    if (workspaceId) {
      try {
        const { data: workspaceProfiles, error: wpErr } = await supabaseAdmin
          .from('profiles')
          .select('id, theme')
          .eq('workspace_id', workspaceId);

        if (!wpErr && workspaceProfiles && workspaceProfiles.length > 0) {
          const profileIds = workspaceProfiles.map(p => p.id);
          const { data: workspaceEvents, error: weErr } = await supabaseAdmin
            .from('analytics_events')
            .select('event_type, event_data, profile_id')
            .in('profile_id', profileIds)
            .gte('created_at', startDate.toISOString());

          if (!weErr && workspaceEvents) {
            workspaceEvents.forEach((e) => {
              const template = (workspaceProfiles.find(p => p.id === e.profile_id)?.theme as any)?.template || 'lone';
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
      } catch (err) {
        console.warn('[Analytics API] Error fetching workspace comparison:', err);
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