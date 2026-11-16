import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SignalClient, getDraftOrigin, getDraftRedirect } from '../SignalClient';
import type { SignalAnalyticsPayload } from '@/lib/analytics/signalEngine';
import { getPlatformCapability } from '@/lib/analytics/platformCapabilities';
import { clearAllClientCaches } from '@/lib/utils/clientCache';

vi.mock('@/lib/hooks/use-user-context', () => ({
  useUserContext: () => ({
    user: { id: 'u1', email: 'alex@unool.co' },
    workspace: { id: 'ws1', name: 'Workspace 1', planTier: 'pro' },
    profile: null,
    pendingPostsCount: 0,
    loading: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: { info: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

function buildMockPayload(overrides: Partial<SignalAnalyticsPayload> = {}): SignalAnalyticsPayload {
  const igCap = getPlatformCapability('instagram');
  const liCap = getPlatformCapability('linkedin');
  const dcCap = getPlatformCapability('discord');

  return {
    meta: {
      timezone: 'Asia/Kolkata',
      requestedRange: '30d',
      effectiveRange: '30d',
      requestedDays: 30,
      effectiveDays: 30,
      retentionDays: 365,
      truncatedByPlan: false,
      planId: 'pro',
      planName: 'Pro',
      csvExportAllowed: true,
      comparePeriod: true,
      generatedAt: '2026-11-16T12:00:00Z',
    },
    syncHealth: {
      status: 'healthy',
      connectedAccountCount: 3,
      expiredAccountCount: 0,
      totalPublishedVariants: 3,
      syncedVariants: 2,
      pendingVariants: 0,
      unsupportedVariants: 1,
      erroredOrRateLimitedVariants: 0,
      lastSyncedAt: '2026-11-16T11:50:00Z',
    },
    operational: {
      totalPosts: 1,
      publishedPosts: 1,
      publishingPosts: 0,
      scheduledPosts: 0,
      draftPosts: 0,
      failedPosts: 0,
      partialFailurePosts: 0,
      overdueScheduledPosts: 0,
    },
    kpis: {
      views: { value: 600, priorValue: 300, deltaPct: 100, eligibleVariants: 1 },
      totalEngagements: { value: 52, priorValue: 26, deltaPct: 100 },
      avgEngagementsPerPost: { value: 52, median: 52, sampleSize: 1, priorValue: 26, deltaPct: 100 },
      weightedEngagementRate: {
        value: 6.67,
        numeratorEngagements: 40,
        denominatorViews: 600,
        eligibleVariants: 1,
        priorValue: 5.0,
      },
      publishedCount: { value: 1, priorValue: 1, deltaPct: 0 },
      momentumPct: { value: 100, currAvg: 52, prevAvg: 26, sampleSize: 1 },
      resonanceScore: {
        value: 74,
        components: { engagementVolume: 30, viewReach: 18, consistency: 12, momentum: 14 },
      },
    },
    dailySeries: [
      { date: '2026-11-15', label: '11/15', views: 600, engagements: 52, posts: 1, prevViews: 300, prevEngagements: 26 },
    ],
    channelBreakdown: [
      {
        key: 'instagram::ig-1',
        platform: 'instagram',
        label: 'Instagram',
        platformAccountId: 'ig-1',
        accountLabel: '@brand_main',
        connectionStatus: 'connected',
        capability: igCap,
        variantCount: 1,
        publishedCount: 1,
        failedCount: 0,
        likes: 30,
        comments: 5,
        shares: 5,
        saves: 0,
        clicks: 0,
        views: 600,
        totalEngagements: 40,
        avgEngagementsPerPost: 40,
        weightedEngagementRate: 6.67,
        lastSyncedAt: '2026-11-16T11:50:00Z',
      },
      {
        key: 'instagram::ig-2',
        platform: 'instagram',
        label: 'Instagram',
        platformAccountId: 'ig-2',
        accountLabel: '@founder_ig',
        connectionStatus: 'connected',
        capability: igCap,
        variantCount: 1,
        publishedCount: 1,
        failedCount: 0,
        likes: 6,
        comments: 1,
        shares: 0,
        saves: 0,
        clicks: 0,
        views: null,
        totalEngagements: 7,
        avgEngagementsPerPost: 7,
        weightedEngagementRate: null,
        lastSyncedAt: '2026-11-16T11:50:00Z',
      },
      {
        key: 'linkedin::li-1',
        platform: 'linkedin',
        label: 'LinkedIn',
        platformAccountId: 'li-1',
        accountLabel: 'Alex Founder',
        connectionStatus: 'connected',
        capability: liCap,
        variantCount: 1,
        publishedCount: 1,
        failedCount: 0,
        likes: 4,
        comments: 1,
        shares: 0,
        saves: 0,
        clicks: 0,
        views: null,
        totalEngagements: 5,
        avgEngagementsPerPost: 5,
        weightedEngagementRate: null,
        lastSyncedAt: '2026-11-16T11:50:00Z',
      },
      {
        key: 'discord::dc-1',
        platform: 'discord',
        label: 'Discord',
        platformAccountId: 'dc-1',
        accountLabel: '#updates',
        connectionStatus: 'connected',
        capability: dcCap,
        variantCount: 1,
        publishedCount: 1,
        failedCount: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        clicks: 0,
        views: null,
        totalEngagements: 0,
        avgEngagementsPerPost: 0,
        weightedEngagementRate: null,
        lastSyncedAt: null,
      },
    ],
    hookBreakdown: [
      {
        hookType: 'question',
        label: 'Question',
        color: '#0d9488',
        publishedCount: 1,
        totalEngagements: 52,
        avgEngagements: 52,
        medianEngagements: 52,
        avgViews: 600,
        shareOfPublishedPct: 100,
        confidence: 'low',
        bestPostId: 'post-1',
      },
    ],
    wordCountBrackets: [
      { id: 'short', label: 'Short Punch', rangeLabel: '< 30 words', publishedCount: 1, avgEngagements: 52, medianEngagements: 52, avgViews: 600 },
    ],
    mediaComparison: { withMediaCount: 1, withoutMediaCount: 0, withMediaAvg: 52, withoutMediaAvg: 0, liftPct: null, confidence: 'low' },
    timing: {
      timezone: 'Asia/Kolkata',
      publishedSampleCount: 1,
      dayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      dayStats: [{ dayIndex: 0, label: 'Sun', count: 1, avgEngagements: 52, medianEngagements: 52 }],
      hourStats: [{ hour: 10, label: '10:00 AM', count: 1, avgEngagements: 52 }],
      bestSlots: [{ dayIndex: 0, dayName: 'Sun', hour: 10, hourLabel: '10:00 AM', count: 1, avgEngagements: 52, confidence: 'low' }],
      heatmap: Array.from({ length: 7 }, (_, d) =>
        Array.from({ length: 24 }, (_, h) => ({
          dayIndex: d,
          hour: h,
          count: d === 0 && h === 10 ? 1 : 0,
          totalEngagements: d === 0 && h === 10 ? 52 : 0,
          avgEngagements: d === 0 && h === 10 ? 52 : 0,
          totalViews: d === 0 && h === 10 ? 600 : 0,
          postIds: d === 0 && h === 10 ? ['post-1'] : [],
        }))
      ),
    },
    funnels: {
      bioProfile: { profileViews: 44, profileLinkClicks: 8, profileCtaClicks: 2, ctrPct: 22.7, topLinks: [], topReferrers: [] },
      automation: { commentReplies: 9, dmSent: 6, followGateUnlocked: 4, highIntentLeads: 3, flaggedCount: 0 },
    },
    recommendations: [
      {
        id: 'rec-hook',
        category: 'hook',
        title: 'Question hooks average 52 engagements',
        detail: 'Strongest hook framing in your recent dispatches.',
        sampleSize: 1,
        confidence: 'low',
        badge: 'Rule-based',
        actionLabel: 'Draft this Hook in Studio',
        actionHref: '/dashboard/composer?hookStyle=question',
      },
    ],
    posts: [
      {
        id: 'post-1',
        content: 'Why do most launch weeks feel quieter than expected?',
        status: 'published',
        effectiveStatus: 'published',
        scheduledAt: null,
        publishedAt: '2026-11-15T10:00:00Z',
        createdAt: '2026-11-15T09:00:00Z',
        aiOrigin: 'ai-composer',
        arcId: null,
        arcBeat: null,
        campaignTag: null,
        originKind: 'studio',
        hookType: 'question',
        hookLabel: 'Question',
        hookColor: '#0d9488',
        hookFormulaId: 13,
        hookScore: 84,
        wordCount: 9,
        wordCountBracket: 'short',
        hasMedia: true,
        mediaCount: 1,
        contentFormat: 'image',
        mediaUrls: ['https://cdn.example.com/a.png'],
        goldenHourRemainingMin: 0,
        isGoldenHour: false,
        variants: [
          {
            id: 'v-ig-1',
            platform: 'instagram',
            canonicalPlatform: 'instagram',
            platformAccountId: 'ig-1',
            accountLabel: '@brand_main',
            status: 'published',
            adaptedContent: 'IG 1 copy',
            hashtagStrategy: [],
            firstCommentHint: null,
            scheduledAt: null,
            publishedAt: '2026-11-15T10:00:00Z',
            platformPostId: 'ig-p1',
            platformUrl: 'https://instagram.com/p/1',
            error: null,
            syncStatus: 'synced',
            syncError: null,
            lastSyncedAt: '2026-11-16T11:50:00Z',
            capability: igCap,
            likes: 30,
            comments: 5,
            shares: 5,
            saves: 0,
            clicks: 0,
            views: 600,
            totalEngagements: 40,
            engagementRate: 6.67,
            hasRealData: true,
            rawExtras: {},
          },
          {
            id: 'v-ig-2',
            platform: 'instagram',
            canonicalPlatform: 'instagram',
            platformAccountId: 'ig-2',
            accountLabel: '@founder_ig',
            status: 'published',
            adaptedContent: 'IG 2 copy',
            hashtagStrategy: [],
            firstCommentHint: null,
            scheduledAt: null,
            publishedAt: '2026-11-15T10:00:00Z',
            platformPostId: 'ig-p2',
            platformUrl: 'https://instagram.com/p/2',
            error: null,
            syncStatus: 'synced',
            syncError: null,
            lastSyncedAt: '2026-11-16T11:50:00Z',
            capability: igCap,
            likes: 6,
            comments: 1,
            shares: 0,
            saves: 0,
            clicks: 0,
            views: null,
            totalEngagements: 7,
            engagementRate: null,
            hasRealData: true,
            rawExtras: {},
          },
          {
            id: 'v-li-1',
            platform: 'linkedin',
            canonicalPlatform: 'linkedin',
            platformAccountId: 'li-1',
            accountLabel: 'Alex Founder',
            status: 'published',
            adaptedContent: 'LI copy',
            hashtagStrategy: [],
            firstCommentHint: null,
            scheduledAt: null,
            publishedAt: '2026-11-15T10:00:00Z',
            platformPostId: 'li-p1',
            platformUrl: null,
            error: null,
            syncStatus: 'synced',
            syncError: null,
            lastSyncedAt: '2026-11-16T11:50:00Z',
            capability: liCap,
            likes: 4,
            comments: 1,
            shares: 0,
            saves: 0,
            clicks: 0,
            views: null,
            totalEngagements: 5,
            engagementRate: null,
            hasRealData: true,
            rawExtras: {},
          },
        ],
        scopedEngagement: {
          likes: 40,
          comments: 7,
          shares: 5,
          saves: 0,
          clicks: 0,
          views: 600,
          totalEngagements: 52,
          engagementRate: 6.67,
          hasRealData: true,
          hasViewCapableVariant: true,
          lastSyncedAt: '2026-11-16T11:50:00Z',
        },
      },
    ],
    ...overrides,
  };
}

describe('SignalClient UI, Drill-Down, Multi-Account & Edge States', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAllClientCaches();
  });

  it('renders honest error card with Retry button when initial analytics request fails (never silent zeroing)', async () => {
    vi.mocked(global.fetch).mockImplementation(async url => {
      if (String(url).includes('/api/signal/analytics')) {
        return new Response(JSON.stringify({ error: 'Database unavailable' }), { status: 500 });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    });

    render(<SignalClient />);

    await waitFor(() => {
      expect(screen.getByText('Could not load Signal Analytics')).toBeTruthy();
    });
    expect(screen.getByText('Retry Load')).toBeTruthy();
  });

  it('routes flightplan-legacy-v1 drafts back to Flight Plan rather than Studio', () => {
    const legacyFp = {
      id: 'fp-old',
      content: 'Legacy plan post',
      status: 'draft',
      hookType: null,
      wordCount: null,
      hasMedia: false,
      createdAt: '2026-11-01T10:00:00Z',
      publishedAt: null,
      adaptationPromptVersion: 'flightplan-legacy-v1',
      variants: [],
    };
    expect(getDraftOrigin(legacyFp)).toBe('flightplan');
    expect(getDraftRedirect(legacyFp).href).toBe('/dashboard/flightplan?postId=fp-old');
  });

  it('renders onboarding empty state cleanly for brand-new workspace with zero accounts/posts', async () => {
    const empty = buildMockPayload({
      syncHealth: {
        status: 'no_accounts',
        connectedAccountCount: 0,
        expiredAccountCount: 0,
        totalPublishedVariants: 0,
        syncedVariants: 0,
        pendingVariants: 0,
        unsupportedVariants: 0,
        erroredOrRateLimitedVariants: 0,
        lastSyncedAt: null,
      },
      operational: {
        totalPosts: 0,
        publishedPosts: 0,
        publishingPosts: 0,
        scheduledPosts: 0,
        draftPosts: 0,
        failedPosts: 0,
        partialFailurePosts: 0,
        overdueScheduledPosts: 0,
      },
      channelBreakdown: [],
      posts: [],
    });

    vi.mocked(global.fetch).mockImplementation(async url => {
      if (String(url).includes('/api/signal/analytics')) {
        return new Response(JSON.stringify(empty), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    });

    render(<SignalClient />);

    await waitFor(() => {
      expect(screen.getByText('Signal is ready for your first broadcast')).toBeTruthy();
    });
    expect(screen.getByText('1. Connect Social Accounts')).toBeTruthy();
  });

  it('supports overview -> content drill-down, multi-account rendering, accessible post inspector, and channels N/A table', async () => {
    const payload = buildMockPayload();
    vi.mocked(global.fetch).mockImplementation(async url => {
      if (String(url).includes('/api/signal/analytics')) {
        return new Response(JSON.stringify(payload), { status: 200 });
      }
      if (String(url).includes('/api/signal/posts/post-1')) {
        return new Response(JSON.stringify({ post: payload.posts[0], snapshots: [] }), { status: 200 });
      }
      if (String(url).includes('/api/profile')) {
        return new Response(JSON.stringify({ profile: { subdomain: 'alex' } }), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    });

    render(<SignalClient />);

    await waitFor(() => {
      expect(screen.getByText('Signal Intelligence')).toBeTruthy();
      expect(screen.getAllByText('600').length).toBeGreaterThanOrEqual(1); // Views
      expect(screen.getAllByText('6.67%').length).toBeGreaterThanOrEqual(1); // Weighted ER
    });

    // Switch to Content & Hooks
    fireEvent.click(screen.getByRole('tab', { name: /Content & Hooks/i }));
    await waitFor(() => {
      // Both Instagram accounts @brand_main & @founder_ig appear simultaneously (no duplicate dropping!)
      expect(screen.getByText(/Instagram \(@brand_main\)/i)).toBeTruthy();
      expect(screen.getByText(/Instagram \(@founder_ig\)/i)).toBeTruthy();
    });

    // Open Post Detail Inspector Drawer
    fireEvent.click(screen.getByRole('button', { name: 'Inspect' }));
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Post Detail Inspector' })).toBeTruthy();
      expect(screen.getByText('Repurpose in Studio')).toBeTruthy();
    });

    // Close Drawer
    fireEvent.click(screen.getByRole('button', { name: 'Close Post Inspector' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Post Detail Inspector' })).toBeNull();
    });

    // Switch to Timing & Cadence and verify user timezone display
    fireEvent.click(screen.getByRole('tab', { name: /Timing & Cadence/i }));
    await waitFor(() => {
      expect(screen.getByText(/Best Time to Publish Matrix/i)).toBeTruthy();
    });

    // Switch to Channels & Funnel and confirm N/A API boundaries are preserved
    fireEvent.click(screen.getByRole('tab', { name: /Channels & Funnel/i }));
    await waitFor(() => {
      expect(screen.getByText('Per-Account & Channel Performance')).toBeTruthy();
      expect(screen.getAllByText('Publish-Only Pipe').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Open LinkedIn Insights')).toBeTruthy();
    });
  });
});
