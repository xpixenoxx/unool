import type { InstagramCampaign } from '@/lib/services/automation/campaignMatcher';

export interface CampaignFunnelMetrics {
  campaignId: string;
  campaignName: string;
  triggered: number;
  dmSent: number;
  followVerified: number;
  leadsCaptured: number;
  linkClicks: number;
  variantASends: number;
  variantAClicks: number;
  variantBSends: number;
  variantBClicks: number;
  availableCoupons: number;
  totalCoupons: number;
}

export interface CampaignDiagnostic {
  campaignId: string;
  campaignName: string;
  severity: 'critical' | 'warning' | 'opportunity' | 'healthy';
  code:
    | 'COUPONS_EXHAUSTED'
    | 'LOW_LINK_CTR'
    | 'FOLLOW_GATE_DROP'
    | 'ZERO_TRIGGERS'
    | 'AB_WINNER_READY'
    | 'MISSING_CTA_LINK'
    | 'HEALTHY';
  headline: string;
  detail: string;
  suggestedAction: string;
}

/**
 * Campaign Doctor — inspects live funnel conversion across Comment -> DM -> Follow -> Lead -> Click
 * and surfaces concrete, non-generic diagnostic fixes.
 */
export function diagnoseCampaigns(
  campaigns: InstagramCampaign[],
  metricsByCampaign: Record<string, CampaignFunnelMetrics>
): CampaignDiagnostic[] {
  const diagnostics: CampaignDiagnostic[] = [];

  for (const camp of campaigns) {
    if (!camp.is_active) continue;
    const m = metricsByCampaign[camp.id] || {
      campaignId: camp.id,
      campaignName: camp.name,
      triggered: camp.total_sends || 0,
      dmSent: camp.total_sends || 0,
      followVerified: 0,
      leadsCaptured: 0,
      linkClicks: 0,
      variantASends: 0,
      variantAClicks: 0,
      variantBSends: 0,
      variantBClicks: 0,
      availableCoupons: 0,
      totalCoupons: 0,
    };

    // 1. Coupon pool exhausted or critically low
    if (m.totalCoupons > 0 && m.availableCoupons <= 5) {
      diagnostics.push({
        campaignId: camp.id,
        campaignName: camp.name,
        severity: m.availableCoupons === 0 ? 'critical' : 'warning',
        code: 'COUPONS_EXHAUSTED',
        headline:
          m.availableCoupons === 0
            ? `Coupon pool empty for "${camp.name}"`
            : `Only ${m.availableCoupons} unique coupons left in "${camp.name}"`,
        detail: `New commenters matching this campaign won't receive a unique promo code until you upload more codes.`,
        suggestedAction: 'Upload fresh promo codes in Campaign Coupons',
      });
      continue;
    }

    // 2. Missing destination link when DM promises a link
    if (
      !camp.dm_cta_url &&
      /\b(link|download|click|grab|below)\b/i.test(camp.dm_message || '') &&
      !/https?:\/\//i.test(camp.dm_message || '')
    ) {
      diagnostics.push({
        campaignId: camp.id,
        campaignName: camp.name,
        severity: 'warning',
        code: 'MISSING_CTA_LINK',
        headline: `"${camp.name}" mentions a link but has no CTA URL`,
        detail: 'Your DM copy references a link, yet no CTA URL or inline URL is configured.',
        suggestedAction: 'Add a CTA button URL or connect a Brand Materials page',
      });
      continue;
    }

    // 3. Follow-Gate conversion drop-off
    if (camp.require_follow && m.triggered >= 10) {
      const unlockPct = Math.round((m.followVerified / Math.max(1, m.triggered)) * 100);
      if (unlockPct < 25) {
        diagnostics.push({
          campaignId: camp.id,
          campaignName: camp.name,
          severity: 'warning',
          code: 'FOLLOW_GATE_DROP',
          headline: `Follow-Gate drop-off on "${camp.name}" (${unlockPct}% unlock)`,
          detail: `${m.triggered} users triggered this funnel but only ${m.followVerified} verified their follow. Tightening your follow-ask copy or adding an Opening DM button typically doubles unlock rate.`,
          suggestedAction: 'Enable Opening DM Button or shorten the Follow-Ask copy',
        });
      }
    }

    // 4. Low click-through rate on delivered DMs
    if (camp.dm_cta_url && m.dmSent >= 15) {
      const ctr = Math.round((m.linkClicks / Math.max(1, m.dmSent)) * 100);
      if (ctr < 15) {
        diagnostics.push({
          campaignId: camp.id,
          campaignName: camp.name,
          severity: 'opportunity',
          code: 'LOW_LINK_CTR',
          headline: `Low link CTR (${ctr}%) on "${camp.name}"`,
          detail: `${m.dmSent} DMs delivered, ${m.linkClicks} clicks. Try enabling a 3-hour nudge or testing an A/B Variant B with a Rich CTA Card.`,
          suggestedAction: camp.nudge_enabled ? 'Add Variant B copy to A/B test' : 'Enable 3-hour unclicked nudge',
        });
      }
    }

    // 5. Statistically meaningful A/B Winner ready
    if (camp.ab_variant_b_dm && m.variantASends >= 10 && m.variantBSends >= 10) {
      const ctrA = m.variantAClicks / m.variantASends;
      const ctrB = m.variantBClicks / m.variantBSends;
      const deltaPct = Math.round(Math.abs(ctrA - ctrB) * 100);
      if (deltaPct >= 10) {
        const winner = ctrB > ctrA ? 'Variant B' : 'Variant A';
        diagnostics.push({
          campaignId: camp.id,
          campaignName: camp.name,
          severity: 'opportunity',
          code: 'AB_WINNER_READY',
          headline: `${winner} is winning by +${deltaPct}% CTR on "${camp.name}"`,
          detail: `Variant A: ${Math.round(ctrA * 100)}% (${m.variantAClicks}/${m.variantASends}) vs Variant B: ${Math.round(ctrB * 100)}% (${m.variantBClicks}/${m.variantBSends}).`,
          suggestedAction: `Promote ${winner} to 100% traffic`,
        });
      }
    }

    // 6. Active campaign with zero triggers for > 48h
    if (
      m.triggered === 0 &&
      camp.created_at &&
      Date.now() - Date.parse(camp.created_at) > 48 * 60 * 60 * 1000
    ) {
      diagnostics.push({
        campaignId: camp.id,
        campaignName: camp.name,
        severity: 'warning',
        code: 'ZERO_TRIGGERS',
        headline: `"${camp.name}" has 0 triggers in 48h`,
        detail: `Check if your post caption/pinned comment explicitly tells viewers to comment one of: ${(camp.keywords || []).join(', ') || 'any comment'}.`,
        suggestedAction: 'Run 7-Day Comment Backfill or broaden trigger mode to Fuzzy',
      });
    }
  }

  return diagnostics.sort((a, b) => {
    const rank = { critical: 0, warning: 1, opportunity: 2, healthy: 3 };
    return rank[a.severity] - rank[b.severity];
  });
}
