import { describe, it, expect } from 'vitest';
import {
  matchCampaignWaterfall,
  pickRotatingPublicReply,
  isWithinActiveHours,
  analyzeCampaignKeywords,
  selectAbVariant,
  type InstagramCampaign,
} from '@/lib/services/automation/campaignMatcher';

function makeCampaign(overrides: Partial<InstagramCampaign> = {}): InstagramCampaign {
  return {
    id: 'camp-1',
    workspace_id: 'ws-1',
    name: 'Default Campaign',
    trigger_surface: 'comment',
    media_id: null,
    post_id: null,
    ad_id: null,
    trigger_mode: 'fuzzy',
    keywords: ['GUIDE', 'LINK'],
    exclude_keywords: ['scam'],
    ignore_sub_comments: false,
    ignore_tag_only_comments: true,
    dedup_user_post_hours: 24,
    total_sends: 0,
    public_replies: ['Sent!', 'Dropped it in DMs!'],
    dm_opening_enabled: false,
    dm_message: 'Here is your guide!',
    dm_extra_bubbles: [],
    require_follow: false,
    max_follow_reminders: 1,
    capture_email: false,
    capture_phone: false,
    skip_if_already_captured: true,
    send_email_delivery: false,
    ab_split_pct: 50,
    nudge_enabled: false,
    nudge_delay_minutes: 180,
    priority: 100,
    is_active: true,
    ...overrides,
  };
}

describe('campaignMatcher — Hybrid Deterministic Waterfall Engine', () => {
  it('prioritizes post-specific exact over post-specific fuzzy over global keyword over global any', () => {
    const globalAny = makeCampaign({ id: 'g-any', trigger_mode: 'any', keywords: [] });
    const globalKw = makeCampaign({ id: 'g-kw', trigger_mode: 'contains', keywords: ['GUIDE'] });
    const postFuzzy = makeCampaign({ id: 'p-fuzzy', media_id: 'media-1', trigger_mode: 'fuzzy', keywords: ['GUIDE'] });
    const postExact = makeCampaign({ id: 'p-exact', media_id: 'media-1', trigger_mode: 'exact', keywords: ['GUIDE'] });

    const exactHit = matchCampaignWaterfall([globalAny, globalKw, postFuzzy, postExact], {
      surface: 'comment',
      text: 'GUIDE!',
      mediaId: 'media-1',
    });
    expect(exactHit?.campaign.id).toBe('p-exact');
    expect(exactHit?.tier).toBe(1);

    const fuzzyHit = matchCampaignWaterfall([globalAny, globalKw, postFuzzy], {
      surface: 'comment',
      text: 'please send the GUDE',
      mediaId: 'media-1',
    });
    expect(fuzzyHit?.campaign.id).toBe('p-fuzzy');
    expect(fuzzyHit?.matchType).toBe('fuzzy');
    expect(fuzzyHit?.tier).toBe(2);

    const globalHit = matchCampaignWaterfall([globalAny, globalKw, postExact], {
      surface: 'comment',
      text: 'I want the guide please',
      mediaId: 'other-media',
    });
    expect(globalHit?.campaign.id).toBe('g-kw');
    expect(globalHit?.tier).toBe(4);
  });

  it('respects exclude_keywords, ignore_tag_only_comments, ignore_sub_comments, schedules, and caps', () => {
    const camp = makeCampaign({
      exclude_keywords: ['scam', 'fake'],
      ignore_sub_comments: true,
      ignore_tag_only_comments: true,
      max_total_sends: 10,
      total_sends: 5,
    });

    // Excluded negative word blocks trigger
    expect(matchCampaignWaterfall([camp], { surface: 'comment', text: 'This GUIDE looks like a scam' })).toBeNull();
    // Sub-comment ignored
    expect(matchCampaignWaterfall([camp], { surface: 'comment', text: 'GUIDE', parentId: 'parent-1' })).toBeNull();
    // Tag-only comment ignored
    const anyCamp = makeCampaign({ trigger_mode: 'any', keywords: [], ignore_tag_only_comments: true });
    expect(matchCampaignWaterfall([anyCamp], { surface: 'comment', text: '@friend1 @friend2 🔥' })).toBeNull();
    // Max sends cap reached
    const capped = makeCampaign({ max_total_sends: 5, total_sends: 5 });
    expect(matchCampaignWaterfall([capped], { surface: 'comment', text: 'GUIDE' })).toBeNull();
    // Expired schedule
    const expired = makeCampaign({ ends_at: '2020-01-01T00:00:00Z' });
    expect(matchCampaignWaterfall([expired], { surface: 'comment', text: 'GUIDE', now: new Date('2026-01-01T00:00:00Z') })).toBeNull();
  });

  it('rotates public replies avoiding recently used variations', () => {
    const picked = pickRotatingPublicReply(['Reply A', 'Reply B'], ['Reply A']);
    expect(picked).toBe('Reply B');
  });

  it('evaluates active hours including overnight windows', () => {
    const noonUtc = new Date('2026-06-01T12:00:00Z');
    const midnightUtc = new Date('2026-06-01T00:30:00Z');

    expect(isWithinActiveHours({ activeHoursEnabled: false }, midnightUtc)).toBe(true);
    expect(
      isWithinActiveHours(
        { activeHoursEnabled: true, activeHoursStart: '09:00', activeHoursEnd: '21:00', activeHoursTimezone: 'UTC' },
        noonUtc
      )
    ).toBe(true);
    expect(
      isWithinActiveHours(
        { activeHoursEnabled: true, activeHoursStart: '09:00', activeHoursEnd: '21:00', activeHoursTimezone: 'UTC' },
        midnightUtc
      )
    ).toBe(false);
    // Overnight window 22:00 -> 06:00
    expect(
      isWithinActiveHours(
        { activeHoursEnabled: true, activeHoursStart: '22:00', activeHoursEnd: '06:00', activeHoursTimezone: 'UTC' },
        midnightUtc
      )
    ).toBe(true);
  });

  it('flags broad stopwords and keyword collisions on same surface & scope', () => {
    const existing = [makeCampaign({ id: 'c1', name: 'Launch Flow', keywords: ['GUIDE'], media_id: null })];
    const analysis = analyzeCampaignKeywords(['hi', 'GUIDE'], 'comment', null, existing);
    expect(analysis.warnings.length).toBeGreaterThanOrEqual(1);
    expect(analysis.collisions).toEqual([{ keyword: 'GUIDE', campaignName: 'Launch Flow' }]);
  });

  it('assigns deterministic A/B variants per user', () => {
    const camp = makeCampaign({ id: 'ab-test', ab_variant_b_dm: 'Variant B copy', ab_split_pct: 50 });
    const v1 = selectAbVariant(camp, 'user-123');
    const v2 = selectAbVariant(camp, 'user-123');
    expect(v1).toBe(v2);
    expect(['A', 'B']).toContain(v1);

    const noB = makeCampaign({ id: 'no-b', ab_variant_b_dm: null });
    expect(selectAbVariant(noB, 'user-123')).toBe('A');
  });
});
