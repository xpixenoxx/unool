import { describe, it, expect } from 'vitest';
import {
  computeSignalAnalytics,
  getZonedParts,
  sanitizeCsvCell,
  serializeSignalPostsToCsv,
  type SignalPostInput,
  type SignalConnectedAccountInput,
} from '../signalEngine';
import {
  extractExtendedEngagement,
  extractNormalizedEngagement,
} from '@/lib/services/analytics/normalize';
import { classifyHookType, extractPostTelemetry } from '../postTelemetry';
import { getPlatformCapability, isPublishOnlyPlatform, isViewCapablePlatform } from '../platformCapabilities';

describe('Platform Capabilities & Extended Engagement Normalization', () => {
  it('classifies full, engagement_only, and publish_only platforms accurately', () => {
    expect(isViewCapablePlatform('instagram')).toBe(true);
    expect(isViewCapablePlatform('linkedin')).toBe(false);
    expect(getPlatformCapability('linkedin').telemetryTier).toBe('engagement_only');
    expect(isPublishOnlyPlatform('discord')).toBe(true);
    expect(isPublishOnlyPlatform('telegram')).toBe(true);
    expect(isPublishOnlyPlatform('x')).toBe(false);
  });

  it('normalizes reactions and positiveReactions from Dev.to, Hashnode, and MeWe', () => {
    const devto = extractNormalizedEngagement({
      reactions: 24,
      positiveReactions: 22,
      comments: 4,
      pageViews: 410,
    });
    expect(devto.likes).toBe(24);
    expect(devto.comments).toBe(4);
    expect(devto.views).toBe(410);
    expect(devto.hasRealData).toBe(true);

    const pinterest = extractExtendedEngagement({
      SAVE: 15,
      IMPRESSION: 600,
      PIN_CLICK: 12,
      OUTBOUND_CLICK: 8,
    });
    expect(pinterest.saves).toBe(15);
    expect(pinterest.views).toBe(600);
    expect(pinterest.clicks).toBe(20);
    expect(pinterest.total).toBe(35);
  });

  it('does not fabricate engagementRate when views are 0', () => {
    const li = extractNormalizedEngagement({ likes: 40, comments: 5, shares: 2, views: 0 });
    expect(li.engagementRate).toBe(0);
  });
});

describe('Deterministic Post Telemetry Fallback & Classification', () => {
  it('classifies question, contrarian, howto, number, and direct hooks cleanly', () => {
    expect(classifyHookType('Why do most SaaS launches flop right away?')).toBe('question');
    expect(classifyHookType('Most founders think posting daily grows revenue. They are wrong.')).toBe('contrarian');
    expect(classifyHookType('How I cut onboarding drop-off in half without adding tooltips:')).toBe('howto');
    expect(classifyHookType('47 customer calls in 30 days taught us 3 lessons:')).toBe('number');
    expect(classifyHookType('If you are building solo this year, avoid these mistakes.')).toBe('direct');
  });

  it('extracts word count, media flags, and format even when DB columns are null', () => {
    const telemetry = extractPostTelemetry({
      content: 'One honest lesson from shipping 12 releases this month.',
      mediaUrls: ['https://cdn.example.com/chart.png', 'https://cdn.example.com/slide2.png'],
      existingHookType: null,
      existingWordCount: null,
      existingHasMedia: null,
    });
    expect(telemetry.wordCount).toBe(9);
    expect(telemetry.hasMedia).toBe(true);
    expect(telemetry.mediaCount).toBe(2);
    expect(telemetry.contentFormat).toBe('carousel');
    expect(telemetry.hookScore).toBeGreaterThanOrEqual(0);
  });
});

describe('Canonical Signal Engine (Formulas, TZ, Multi-Account, Denominators, CSV)', () => {
  const accounts: SignalConnectedAccountInput[] = [
    { id: 'conn-ig-1', platform: 'instagram', platformAccountId: 'conn-ig-1', accountLabel: '@brand_main', status: 'connected' },
    { id: 'conn-ig-2', platform: 'instagram', platformAccountId: 'conn-ig-2', accountLabel: '@founder_ig', status: 'connected' },
    { id: 'conn-li-1', platform: 'linkedin', platformAccountId: 'conn-li-1', accountLabel: 'Alex Founder', status: 'connected' },
    { id: 'conn-dc-1', platform: 'discord', platformAccountId: 'conn-dc-1', accountLabel: '#announcements', status: 'connected' },
  ];

  const baseNow = new Date('2026-11-16T12:00:00.000Z');

  it('excludes drafts & scheduled posts from published denominators and computes chronological positive momentum', () => {
    const posts: SignalPostInput[] = [
      // Older period (40 days ago): low engagement (5 total)
      {
        id: 'old-1',
        content: 'Old statement post from last month.',
        status: 'published',
        createdAt: '2026-10-05T10:00:00.000Z',
        publishedAt: '2026-10-05T10:00:00.000Z',
        variants: [
          {
            id: 'v-old-ig',
            platform: 'instagram',
            platformConnectionId: 'conn-ig-1',
            status: 'published',
            rawEngagement: { likes: 4, comments: 1, shares: 0, views: 100 },
          },
        ],
      },
      // Current period (5 days ago): high engagement (50 total) + multi-account + LinkedIn + Discord
      {
        id: 'new-1',
        content: 'Why does multi-account attribution break in most tools?',
        status: 'published',
        createdAt: '2026-11-01T09:00:00.000Z',
        publishedAt: '2026-11-11T10:00:00.000Z',
        variants: [
          {
            id: 'v-new-ig1',
            platform: 'instagram',
            platformConnectionId: 'conn-ig-1',
            status: 'published',
            rawEngagement: { likes: 20, comments: 5, shares: 5, views: 500 }, // 30 eng, 500 views
          },
          {
            id: 'v-new-ig2',
            platform: 'instagram',
            platformConnectionId: 'conn-ig-2',
            status: 'published',
            rawEngagement: { likes: 8, comments: 2, shares: 0, views: 100 }, // 10 eng, 100 views
          },
          {
            id: 'v-new-li',
            platform: 'linkedin',
            platformConnectionId: 'conn-li-1',
            status: 'published',
            rawEngagement: { likes: 9, comments: 1, shares: 0, views: 0 }, // 10 eng, NO views exposed by LI API
          },
          {
            id: 'v-new-dc',
            platform: 'discord',
            platformConnectionId: 'conn-dc-1',
            status: 'published',
            rawEngagement: { likes: 0, comments: 0, shares: 0 },
          },
        ],
      },
      // Unpublished draft & future scheduled MUST NOT dilute published averages
      {
        id: 'draft-1',
        content: 'Unpublished draft post that should not lower average engagement.',
        status: 'draft',
        createdAt: '2026-11-12T10:00:00.000Z',
        variants: [{ id: 'v-draft', platform: 'instagram', status: 'draft' }],
      },
      {
        id: 'sched-1',
        content: 'Future scheduled post.',
        status: 'scheduled',
        createdAt: '2026-11-12T10:00:00.000Z',
        scheduledAt: '2026-11-20T10:00:00.000Z',
        variants: [{ id: 'v-sched', platform: 'linkedin', status: 'scheduled' }],
      },
    ];

    const res = computeSignalAnalytics({
      posts,
      connectedAccounts: accounts,
      options: { range: '30d', timezone: 'UTC', now: baseNow },
    });

    expect(res.operational.publishedPosts).toBe(1);
    expect(res.operational.draftPosts).toBe(1);
    expect(res.operational.scheduledPosts).toBe(1);

    // Total Engagements across ALL variants on new-1: 30 + 10 + 10 + 0 = 50
    expect(res.kpis.totalEngagements.value).toBe(50);
    // Average MUST divide by 1 published post (not 3 incl draft/scheduled)
    expect(res.kpis.avgEngagementsPerPost.value).toBe(50);

    // Weighted Engagement Rate MUST only include view-capable variants (ig1 + ig2 = 40 / 600 = 6.67%)
    // MUST exclude LinkedIn (10 likes, null views) from numerator!
    expect(res.kpis.views.value).toBe(600);
    expect(res.kpis.weightedEngagementRate.value).toBe(6.67);
    expect(res.kpis.weightedEngagementRate.numeratorEngagements).toBe(40);
    expect(res.kpis.weightedEngagementRate.denominatorViews).toBe(600);

    // Chronological Momentum: current (50) vs prior 30d window (5) => +900% (STRICTLY POSITIVE!)
    expect(res.kpis.momentumPct.value).toBe(900);

    // Multi-account Instagram attribution keeps @brand_main and @founder_ig distinct & never leaks onto LinkedIn
    const ig1 = res.channelBreakdown.find(c => c.platformAccountId === 'conn-ig-1');
    const ig2 = res.channelBreakdown.find(c => c.platformAccountId === 'conn-ig-2');
    const li1 = res.channelBreakdown.find(c => c.platformAccountId === 'conn-li-1');
    const dc1 = res.channelBreakdown.find(c => c.platformAccountId === 'conn-dc-1');

    expect(ig1?.totalEngagements).toBe(30);
    expect(ig1?.views).toBe(500);
    expect(ig2?.totalEngagements).toBe(10);
    expect(ig2?.views).toBe(100);
    expect(li1?.totalEngagements).toBe(10);
    expect(li1?.views).toBeNull();
    expect(dc1?.views).toBeNull();
  });

  it('buckets published timestamps in user IANA timezone rather than server UTC', () => {
    // 2026-11-16T01:00:00Z = Nov 16 06:30 Asia/Kolkata (Mon) and Nov 15 20:00 America/New_York (Sun)
    const ist = getZonedParts('2026-11-16T01:00:00.000Z', 'Asia/Kolkata');
    expect(ist.dateKey).toBe('2026-11-16');
    expect(ist.hour).toBe(6);
    expect(ist.dayIndex).toBe(1); // Monday

    // Repeated call hits cached formatter and returns identical result
    const istCached = getZonedParts('2026-11-16T01:00:00.000Z', 'Asia/Kolkata');
    expect(istCached).toEqual(ist);

    const ny = getZonedParts('2026-11-16T01:00:00.000Z', 'America/New_York');
    expect(ny.dateKey).toBe('2026-11-15');
    expect(ny.hour).toBe(20);
    expect(ny.dayIndex).toBe(0); // Sunday

    // Invalid timezone safely falls back to UTC
    const invalidTz = getZonedParts('2026-11-16T01:00:00.000Z', 'Invalid/Timezone');
    expect(invalidTz.dateKey).toBe('2026-11-16');
    expect(invalidTz.hour).toBe(1);
  });

  it('clamps range transparently to workspace plan analytics_retention_days', () => {
    const res = computeSignalAnalytics({
      posts: [],
      connectedAccounts: [],
      planInfo: { planId: 'spark', planName: 'Spark', retentionDays: 30, csvExportAllowed: false },
      options: { range: '90d', now: baseNow },
    });
    expect(res.meta.requestedRange).toBe('90d');
    expect(res.meta.effectiveDays).toBe(30);
    expect(res.meta.truncatedByPlan).toBe(true);
    expect(res.meta.csvExportAllowed).toBe(false);
  });

  it('sanitizes formula-injection payloads in CSV cells and exports variant rows', () => {
    expect(sanitizeCsvCell('=CMD("calc")')).toBe('"\'=CMD(""calc"")"');
    expect(sanitizeCsvCell('+SUM(A1:A2)')).toBe("'+SUM(A1:A2)");
    expect(sanitizeCsvCell('-10+20')).toBe("'-10+20");
    expect(sanitizeCsvCell('@malicious')).toBe("'@malicious");

    const analytics = computeSignalAnalytics({
      posts: [
        {
          id: 'p1',
          content: '=HYPERLINK("bad") test post',
          status: 'published',
          createdAt: '2026-11-15T10:00:00.000Z',
          publishedAt: '2026-11-15T10:00:00.000Z',
          variants: [
            {
              id: 'v1',
              platform: 'linkedin',
              status: 'published',
              rawEngagement: { likes: 12, comments: 2, shares: 1 },
            },
          ],
        },
      ],
      connectedAccounts: accounts,
      options: { range: '30d', now: baseNow },
    });

    const csv = serializeSignalPostsToCsv(analytics);
    expect(csv).toContain("'=HYPERLINK(");
    expect(csv).toContain('N/A'); // LinkedIn views & eng rate are N/A
  });

  it('includes partial-failure posts when filtering by status=failed and counts partialFailurePosts', () => {
    const partialPost: SignalPostInput = {
      id: 'partial-1',
      content: 'Hackathon win post published to 3 platforms, failed on Instagram.',
      status: 'published',
      createdAt: '2026-11-15T10:00:00.000Z',
      publishedAt: '2026-11-15T10:05:00.000Z',
      variants: [
        {
          id: 'v-fb',
          platform: 'facebook',
          status: 'published',
        },
        {
          id: 'v-ig',
          platform: 'instagram',
          status: 'failed',
          error: 'Instagram requires an image to be uploaded.',
        },
      ],
    };

    const res = computeSignalAnalytics({
      posts: [partialPost],
      connectedAccounts: accounts,
      options: { range: '30d', status: 'failed', timezone: 'UTC', now: baseNow },
    });

    expect(res.operational.failedPosts).toBe(0);
    expect(res.operational.partialFailurePosts).toBe(1);
    expect(res.posts).toHaveLength(1);
    expect(res.posts[0].id).toBe('partial-1');
    expect(res.posts[0].variants.find(v => v.platform === 'instagram')?.error).toBe(
      'Instagram requires an image to be uploaded.'
    );
  });

  it('omits likes from Threads capability and keeps views, replies, and reposts/quotes', () => {
    const thCap = getPlatformCapability('threads');
    expect(thCap.supportedMetrics.likes).toBe(false);

    const res = computeSignalAnalytics({
      posts: [
        {
          id: 'th-1',
          content: 'All GenZ connect here',
          status: 'published',
          createdAt: '2026-11-15T10:00:00.000Z',
          publishedAt: '2026-11-15T10:05:00.000Z',
          variants: [
            {
              id: 'v-th',
              platform: 'threads',
              status: 'published',
              rawEngagement: { views: 89, likes: 1, replies: 3, comments: 3, reposts: 1, quotes: 0, shares: 1 },
            },
          ],
        },
      ],
      connectedAccounts: [
        { id: 'conn-th-1', platform: 'threads', platformAccountId: 'conn-th-1', accountLabel: '@avadika_senakkay', status: 'connected' },
      ],
      options: { range: '30d', timezone: 'UTC', now: baseNow },
    });

    expect(res.posts[0].scopedEngagement.likes).toBe(0);
    expect(res.posts[0].scopedEngagement.comments).toBe(3);
    expect(res.posts[0].scopedEngagement.shares).toBe(1);
    expect(res.posts[0].scopedEngagement.views).toBe(89);
    expect(res.posts[0].variants[0].capability.supportedMetrics.likes).toBe(false);
  });
});
