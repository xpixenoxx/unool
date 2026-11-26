/**
 * Multi-Signal Intent Score Engine (0–100)
 *
 * Combines explicit purchase/pricing signals, link clicks, lead capture,
 * follow status, conversation depth, VIP reach, and recency into a single
 * explainable 0-100 score for Audience Vault CRM and Hot-Lead Triage.
 */

export interface IntentScoreInput {
  leadScoreLegacy?: number; // 0..3 from LLM classifier
  classification?: string;
  hasEmail?: boolean;
  hasPhone?: boolean;
  isFollowing?: boolean | null;
  isVip?: boolean;
  totalComments?: number;
  totalDms?: number;
  totalClicks?: number;
  lastInteractionAt?: string | null;
  inboundText?: string;
}

export interface IntentScoreResult {
  score: number; // 0..100
  tier: 'cold' | 'warm' | 'hot' | 'vip_ready';
  reasons: string[];
}

const HIGH_BUYING_REGEX =
  /\b(price|pricing|cost|how\s+much|buy|checkout|pay|payment|invoice|discount|coupon|agency|team|book\s+a\s+call|enroll|join|order|kitna|kitne\s+ka)\b/i;

export function computeContactIntentScore(input: IntentScoreInput): IntentScoreResult {
  let score = 0;
  const reasons: string[] = [];

  // 1. Legacy 0..3 LLM lead score
  const legacy = Math.max(0, Math.min(3, Number(input.leadScoreLegacy || 0)));
  if (legacy === 3) {
    score += 42;
    reasons.push('Explicit buying intent');
  } else if (legacy === 2) {
    score += 28;
    reasons.push('Hot link/pricing inquiry');
  } else if (legacy === 1) {
    score += 14;
    reasons.push('Engaged question');
  }

  // 2. Classification & direct buying phrases
  if (input.classification === 'purchase_intent') {
    score += 15;
  } else if (input.classification === 'link_request') {
    score += 10;
  }
  if (input.inboundText && HIGH_BUYING_REGEX.test(input.inboundText)) {
    score += 12;
    if (!reasons.includes('Explicit buying intent')) reasons.push('Mentioned pricing/purchase');
  }

  // 3. Verified lead data (highest conversion predictor)
  if (input.hasEmail) {
    score += 20;
    reasons.push('Shared email');
  }
  if (input.hasPhone) {
    score += 18;
    reasons.push('Shared phone');
  }

  // 4. Tracked link clicks
  const clicks = Math.max(0, input.totalClicks || 0);
  if (clicks > 0) {
    score += Math.min(24, clicks * 14);
    reasons.push(clicks === 1 ? 'Clicked tracked link' : `Clicked links ${clicks}x`);
  }

  // 5. Repeat engagement & follower commitment
  const dms = Math.max(0, input.totalDms || 0);
  const comments = Math.max(0, input.totalComments || 0);
  if (dms >= 2) {
    score += Math.min(12, dms * 3);
    reasons.push(`${dms} DM interactions`);
  }
  if (comments >= 2) {
    score += Math.min(8, comments * 2);
  }
  if (input.isFollowing === true) {
    score += 6;
  }
  if (input.isVip) {
    score += 12;
    reasons.push('VIP / verified creator');
  }

  // 6. Recency decay (gentle decay after 7d/30d so Today view prioritizes active buyers)
  if (input.lastInteractionAt) {
    const ageDays = (Date.now() - Date.parse(input.lastInteractionAt)) / (1000 * 60 * 60 * 24);
    if (Number.isFinite(ageDays)) {
      if (ageDays > 30) score = Math.round(score * 0.65);
      else if (ageDays > 7) score = Math.round(score * 0.85);
    }
  }

  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const tier: IntentScoreResult['tier'] =
    clamped >= 80 ? 'vip_ready' : clamped >= 60 ? 'hot' : clamped >= 30 ? 'warm' : 'cold';

  return { score: clamped, tier, reasons: reasons.slice(0, 4) };
}
