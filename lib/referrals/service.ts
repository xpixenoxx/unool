// ============================================================
// lib/referrals/service.ts — Referral System Core
// Generates codes, tracks clicks/signups, issues rewards.
// ============================================================
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

// ── Constants ──────────────────────────────────────────────────────────────────

/** AI credits awarded to referrer when a free signup happens */
const REWARD_FREE_SIGNUP_CREDITS = 200;

/** Free months (as AI credits equivalent) when referral converts to paid */
const REWARD_PAID_CONVERSION_MONTHS = 1;
const AI_CREDITS_PER_MONTH = 1000;

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ReferralCode {
  id: string;
  userId: string;
  workspaceId: string;
  code: string;
  clickCount: number;
  signupCount: number;
  conversionCount: number;
  rewardsEarned: number;
  monthsEarned: number;
  createdAt: string;
  updatedAt: string;
}

export interface Referral {
  id: string;
  referrerUserId: string;
  referredUserId: string;
  referralCode: string;
  status: 'signed_up' | 'converted' | 'rewarded';
  rewardType: string | null;
  rewardAppliedAt: string | null;
  createdAt: string;
}

// ── Code Generation ────────────────────────────────────────────────────────────

function generateCode(name: string): string {
  const clean = (name || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const prefix = clean.length >= 3 ? clean.slice(0, 4) : 'UNO';
  const charset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += charset[bytes[i] % charset.length];
  }
  return `${prefix}${suffix}`;
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Get or create a referral code for a user.
 * Safe to call on every dashboard load — returns existing code if present.
 */
export async function getOrCreateReferralCode(
  userId: string,
  workspaceId: string,
  displayName: string
): Promise<ReferralCode> {
  // Check existing
  const { data: existing } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (existing) return rowToCode(existing as Record<string, unknown>);

  // Generate unique code (retry on collision)
  let code = generateCode(displayName || 'USER');
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: collision } = await supabase
      .from('referral_codes')
      .select('id')
      .eq('code', code)
      .single();

    if (!collision) break;
    code = generateCode(displayName || 'USER');
  }

  const { data, error } = await supabase
    .from('referral_codes')
    .insert({ user_id: userId, workspace_id: workspaceId, code })
    .select()
    .single();

  if (error) throw new Error(`getOrCreateReferralCode: ${error.message}`);
  return rowToCode(data as Record<string, unknown>);
}

/**
 * Record a referral click (visitor clicked a referral link).
 * Returns the code record so the caller can embed the ref param in signup.
 */
export async function recordReferralClick(code: string): Promise<ReferralCode | null> {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode) return null;

  const { data, error } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('code', cleanCode)
    .maybeSingle();

  if (error || !data) return null;

  // Increment click count
  await supabase
    .from('referral_codes')
    .update({
      click_count: ((data as Record<string, unknown>).click_count as number || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('code', cleanCode);

  return rowToCode(data as Record<string, unknown>);
}

/**
 * Called at signup when a user provides a referral code.
 * Creates the referral record. Rewards are separate (called on paid conversion).
 */
export async function recordReferralSignup(
  referredUserId: string,
  referralCode: string
): Promise<void> {
  const cleanCode = (referralCode || '').trim().toUpperCase();
  if (!cleanCode) return;

  // Look up referral code owner
  const { data: codeRow, error: codeErr } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('code', cleanCode)
    .maybeSingle();

  if (codeErr || !codeRow) {
    logger.warn('recordReferralSignup: code not found', { referralCode });
    return;
  }

  const code = codeRow as Record<string, unknown>;
  const referrerUserId = code.user_id as string;

  // Don't let people refer themselves
  if (referrerUserId === referredUserId) return;

  // Idempotency: already referred?
  const { data: existing } = await supabase
    .from('referrals')
    .select('id')
    .eq('referred_user_id', referredUserId)
    .single();

  if (existing) return;

  // Create referral record
  const { error: insertErr } = await supabase.from('referrals').insert({
    referrer_user_id: referrerUserId,
    referred_user_id: referredUserId,
    referral_code: referralCode,
    status: 'signed_up',
  });

  if (insertErr) {
    logger.error('recordReferralSignup insert failed', {
      error: new Error(insertErr.message),
    });
    return;
  }

  // Increment signup count
  await supabase
    .from('referral_codes')
    .update({
      signup_count: (code.signup_count as number) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('code', cleanCode);

  // Give referrer 200 AI credits for free signup
  await grantAiCredits(referrerUserId, REWARD_FREE_SIGNUP_CREDITS, 'referral_signup');

  logger.info('Referral signup recorded + credits granted', {
    referrerUserId,
    referredUserId,
    referralCode,
    credits: REWARD_FREE_SIGNUP_CREDITS,
  });
}

/**
 * Called when a referred user converts to a paid plan.
 * Grants referrer 1 free month (as credits) and marks referral as rewarded.
 */
export async function recordReferralConversion(referredUserId: string): Promise<void> {
  const { data: referral, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referred_user_id', referredUserId)
    .eq('status', 'signed_up')
    .single();

  if (error || !referral) {
    logger.debug('recordReferralConversion: no pending referral found', { referredUserId });
    return;
  }

  const ref = referral as Record<string, unknown>;
  const referrerUserId = ref.referrer_user_id as string;
  const referralCode = ref.referral_code as string;

  // Mark referral as converted + rewarded
  await supabase
    .from('referrals')
    .update({
      status: 'rewarded',
      reward_type: 'free_month_credits',
      reward_applied_at: new Date().toISOString(),
    })
    .eq('id', ref.id as string);

  // Grant 1 month of credits
  const creditsToGrant = REWARD_PAID_CONVERSION_MONTHS * AI_CREDITS_PER_MONTH;
  await grantAiCredits(referrerUserId, creditsToGrant, 'referral_conversion');

  // Update referral_codes tracking
  const { data: codeRow } = await supabase
    .from('referral_codes')
    .select('conversion_count, months_earned')
    .eq('code', referralCode)
    .single();

  if (codeRow) {
    const cr = codeRow as Record<string, unknown>;
    await supabase
      .from('referral_codes')
      .update({
        conversion_count: (cr.conversion_count as number) + 1,
        months_earned: (cr.months_earned as number) + REWARD_PAID_CONVERSION_MONTHS,
        updated_at: new Date().toISOString(),
      })
      .eq('code', referralCode);
  }

  // Also extend active subscription by 30 days if referrer has one
  try {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id, current_period_end, workspace_id')
      .eq('user_id', referrerUserId)
      .eq('status', 'active')
      .maybeSingle();

    if (sub && sub.current_period_end) {
      const currentEnd = new Date(sub.current_period_end);
      const newEnd = new Date(Math.max(currentEnd.getTime(), Date.now()) + 30 * 24 * 60 * 60 * 1000).toISOString();
      await supabase
        .from('subscriptions')
        .update({ current_period_end: newEnd, updated_at: new Date().toISOString() })
        .eq('id', sub.id);

      if (sub.workspace_id) {
        await supabase
          .from('workspaces')
          .update({ plan_expires_at: newEnd, updated_at: new Date().toISOString() })
          .eq('id', sub.workspace_id);
      }
      logger.info('Referrer subscription extended by 30 days', { referrerUserId, newEnd });
    }
  } catch (subErr) {
    logger.warn('Failed to extend referrer subscription (non-fatal)', { subErr });
  }

  logger.info('Referral conversion recorded + month credits granted', {
    referrerUserId,
    referredUserId,
    credits: creditsToGrant,
  });
}

/**
 * Get referral stats for a user's dashboard.
 */
export async function getReferralStats(userId: string): Promise<{
  code: ReferralCode | null;
  referrals: Referral[];
}> {
  const [codeResult, referralsResult] = await Promise.all([
    supabase.from('referral_codes').select('*').eq('user_id', userId).single(),
    supabase
      .from('referrals')
      .select('*')
      .eq('referrer_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  return {
    code: codeResult.data ? rowToCode(codeResult.data as Record<string, unknown>) : null,
    referrals: (referralsResult.data ?? []).map(rowToReferral),
  };
}

// ── Internal: Grant AI Credits ────────────────────────────────────────────────

async function grantAiCredits(userId: string, credits: number, reason: string): Promise<void> {
  try {
    logger.info('AI credits granted', { userId, credits, reason });

    // 1. Update rewards_earned counter on referral_codes (the visible tally)
    const { data: existing } = await supabase
      .from('referral_codes')
      .select('rewards_earned')
      .eq('user_id', userId)
      .single();

    if (existing) {
      const curr = (existing as Record<string, unknown>).rewards_earned as number ?? 0;
      await supabase
        .from('referral_codes')
        .update({ rewards_earned: curr + credits, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
    }

    // 2. Log to referral_rewards ledger (best-effort; table may not exist yet)
    try {
      await supabase
        .from('referral_rewards')
        .insert({
          user_id: userId,
          credits,
          reason,
          created_at: new Date().toISOString(),
        });
    } catch {
      // ignore error if table does not exist
    }
  } catch (err) {
    logger.error('grantAiCredits failed', {
      error: err instanceof Error ? err : new Error(String(err)),
    });
  }
}

// ── Row mappers ────────────────────────────────────────────────────────────────

function rowToCode(row: Record<string, unknown>): ReferralCode {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    workspaceId: row.workspace_id as string,
    code: row.code as string,
    clickCount: (row.click_count as number) ?? 0,
    signupCount: (row.signup_count as number) ?? 0,
    conversionCount: (row.conversion_count as number) ?? 0,
    rewardsEarned: (row.rewards_earned as number) ?? 0,
    monthsEarned: (row.months_earned as number) ?? 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToReferral(row: Record<string, unknown>): Referral {
  return {
    id: row.id as string,
    referrerUserId: row.referrer_user_id as string,
    referredUserId: row.referred_user_id as string,
    referralCode: row.referral_code as string,
    status: row.status as Referral['status'],
    rewardType: (row.reward_type as string) ?? null,
    rewardAppliedAt: (row.reward_applied_at as string) ?? null,
    createdAt: row.created_at as string,
  };
}
