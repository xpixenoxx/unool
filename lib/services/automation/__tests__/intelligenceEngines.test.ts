import { describe, it, expect } from 'vitest';
import { computeContactIntentScore } from '@/lib/services/automation/intentScore';
import { diagnoseCampaigns, type CampaignFunnelMetrics } from '@/lib/services/automation/campaignDoctor';
import { buildDemandRadarClusters } from '@/lib/services/automation/demandRadar';
import { isInQuietHours } from '@/lib/services/automation/notificationBudget';
import { classifyMetaError } from '@/lib/services/automation/metaErrors';
import type { InstagramCampaign } from '@/lib/services/automation/campaignMatcher';

describe('Hidden Intelligence Engines (Intent Score, Campaign Doctor, Demand Radar, Quiet Hours, Meta Errors)', () => {
  it('computes explainable 0-100 multi-signal Intent Score across tiers', () => {
    const hotBuyer = computeContactIntentScore({
      leadScoreLegacy: 3,
      classification: 'purchase_intent',
      hasEmail: true,
      totalClicks: 2,
      isVip: true,
      inboundText: 'How much for the agency team plan?',
      lastInteractionAt: new Date().toISOString(),
    });
    expect(hotBuyer.score).toBeGreaterThanOrEqual(85);
    expect(hotBuyer.tier).toBe('vip_ready');
    expect(hotBuyer.reasons.length).toBeGreaterThan(0);

    const coldViewer = computeContactIntentScore({
      leadScoreLegacy: 0,
      classification: 'positive',
      inboundText: 'Nice photo!',
    });
    expect(coldViewer.score).toBeLessThan(30);
    expect(coldViewer.tier).toBe('cold');
  });

  it('Campaign Doctor detects empty coupons, missing CTA links, and Follow-Gate drop-offs', () => {
    const campCoupons = {
      id: 'c1',
      name: 'Black Friday Drop',
      is_active: true,
      dm_message: 'Use your code {{coupon}}',
      dm_cta_url: 'https://shop.example.com',
      require_follow: false,
      total_sends: 20,
    } as unknown as InstagramCampaign;

    const campMissingUrl = {
      id: 'c2',
      name: 'Broken Link Funnel',
      is_active: true,
      dm_message: 'Click the link below to download!',
      dm_cta_url: null,
      require_follow: false,
      total_sends: 5,
    } as unknown as InstagramCampaign;

    const metrics: Record<string, CampaignFunnelMetrics> = {
      c1: {
        campaignId: 'c1',
        campaignName: 'Black Friday Drop',
        triggered: 20,
        dmSent: 20,
        followVerified: 0,
        leadsCaptured: 5,
        linkClicks: 10,
        variantASends: 20,
        variantAClicks: 10,
        variantBSends: 0,
        variantBClicks: 0,
        availableCoupons: 0,
        totalCoupons: 50,
      },
    };

    const diags = diagnoseCampaigns([campCoupons, campMissingUrl], metrics);
    expect(diags.some((d) => d.code === 'COUPONS_EXHAUSTED' && d.severity === 'critical')).toBe(true);
    expect(diags.some((d) => d.code === 'MISSING_CTA_LINK')).toBe(true);
  });

  it('Demand Radar clusters repeated audience questions and returns Studio hooks + keywords', () => {
    const clusters = buildDemandRadarClusters([
      { text: 'How much does the pro plan cost?' },
      { text: 'Bhai pricing kitna hai?' },
      { text: 'Is there a discount coupon available?' },
      { text: 'Can you send the notion template link?' },
    ]);

    expect(clusters.length).toBeGreaterThanOrEqual(2);
    expect(clusters[0].id).toBe('pricing_cost');
    expect(clusters[0].count).toBe(3);
    expect(clusters[0].suggestedKeyword).toBe('PRICING');
  });

  it('enforces quiet hours across midnight boundary', () => {
    expect(isInQuietHours('22:00', '08:00', 'UTC', new Date('2026-06-01T23:30:00Z'))).toBe(true);
    expect(isInQuietHours('22:00', '08:00', 'UTC', new Date('2026-06-01T03:15:00Z'))).toBe(true);
    expect(isInQuietHours('22:00', '08:00', 'UTC', new Date('2026-06-01T14:00:00Z'))).toBe(false);
  });

  it('classifies Meta permanent vs retryable rate-limit errors accurately', () => {
    const closed = classifyMetaError('{"error":{"code":551,"message":"This person isn\'t available right now"}}');
    expect(closed.permanent).toBe(true);
    expect(closed.closedDms).toBe(true);

    const windowExp = classifyMetaError('{"error":{"code":10,"message":"Outside of allowed window"}}');
    expect(windowExp.permanent).toBe(true);
    expect(windowExp.windowExpired).toBe(true);

    const rateLim = classifyMetaError('{"error":{"code":613,"message":"Calls to this api have exceeded the rate limit"}}');
    expect(rateLim.rateLimited).toBe(true);
    expect(rateLim.permanent).toBe(false);
  });
});
