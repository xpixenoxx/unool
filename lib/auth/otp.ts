/**
 * lib/auth/otp.ts
 *
 * Cryptographically-secure OTP generation and verification.
 * Uses Node's crypto.randomInt for CSPRNG generation.
 * Hashing: SHA-256(OTP + pepper) — fast enough for verification,
 * secure enough when combined with per-row pepper & attempt limits.
 *
 * RULES enforced here:
 *  - 6-digit OTP
 *  - 5-minute expiry
 *  - Max 5 failed attempts
 *  - Single-use
 *  - 60-second resend cooldown
 *  - Previous OTP invalidated on re-issue
 *  - Constant-time comparison
 */

import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

// The pepper is an application-level secret mixed into the hash so that
// a leaked database alone cannot brute-force 6-digit OTPs.
const OTP_PEPPER = process.env.OTP_PEPPER || process.env.ENCRYPTION_KEY || 'dev-otp-pepper-change-in-prod';

export type OtpPurpose = 'signup' | 'signin';

// ── Generation ────────────────────────────────────────────────────────────────

/** Generates a cryptographically secure 6-digit OTP string (zero-padded). */
export function generateOtp(): string {
  // crypto.randomInt(min, max) — upper exclusive, so 0..999999
  const n = crypto.randomInt(0, 1_000_000);
  return n.toString().padStart(6, '0');
}

/** Returns a HMAC-SHA256 hex digest of the OTP + server pepper. */
function hashOtp(otp: string): string {
  return crypto
    .createHmac('sha256', OTP_PEPPER)
    .update(otp)
    .digest('hex');
}

/** Constant-time comparison to prevent timing attacks. */
function safeEqual(a: string, b: string): boolean {
  // Pad to same length to avoid length-based timing leaks
  const padded = b.padEnd(a.length, '\0');
  const aBuf  = Buffer.from(a);
  const bBuf  = Buffer.from(padded);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

// ── Issue ─────────────────────────────────────────────────────────────────────

export interface IssueOtpResult {
  otp: string;           // plaintext — send via email; never log or store
  expiresAt: Date;
  nextResendAt: Date;
}

/**
 * Issues a new OTP for a user+purpose.
 * - Deletes all previous OTPs for this user+purpose.
 * - Stores only the hash.
 * - Returns the plaintext OTP so the caller can email it.
 */
export async function issueOtp(userId: string, purpose: OtpPurpose): Promise<IssueOtpResult> {
  const otp          = generateOtp();
  const otpHash      = hashOtp(otp);
  const now          = new Date();
  const expiresAt    = new Date(now.getTime() + 5 * 60 * 1000);  // +5 min
  const nextResendAt = new Date(now.getTime() + 60 * 1000);       // +60 sec

  // Ensure the table exists (auto-migrate on first use)
  await ensureOtpTable();

  // Invalidate all previous challenges for this user+purpose
  await supabaseAdmin
    .from('auth_otp_challenges')
    .delete()
    .eq('user_id', userId)
    .eq('purpose', purpose);

  // Insert new challenge (plaintext OTP is NEVER stored)
  const { error } = await supabaseAdmin
    .from('auth_otp_challenges')
    .insert({
      user_id:        userId,
      purpose,
      otp_hash:       otpHash,
      expires_at:     expiresAt.toISOString(),
      next_resend_at: nextResendAt.toISOString(),
    });

  if (error) {
    logger.error('Failed to store OTP challenge', { error, userId, purpose });
    throw new Error('Could not create OTP challenge');
  }

  // DO NOT log the OTP itself
  logger.info('OTP issued', { userId, purpose, expiresAt });

  return { otp, expiresAt, nextResendAt };
}

/** Auto-creates the auth_otp_challenges table if it doesn't exist yet. */
let tableEnsured = false;
async function ensureOtpTable() {
  if (tableEnsured) return;
  try {
    const { error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.auth_otp_challenges (
          id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          purpose        TEXT NOT NULL CHECK (purpose IN ('signup', 'signin')),
          otp_hash       TEXT NOT NULL,
          expires_at     TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
          attempts       INTEGER NOT NULL DEFAULT 0,
          used           BOOLEAN NOT NULL DEFAULT FALSE,
          next_resend_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_auth_otp_user_purpose ON public.auth_otp_challenges(user_id, purpose);
        ALTER TABLE public.auth_otp_challenges ENABLE ROW LEVEL SECURITY;
      `
    });
    if (error) {
      // rpc may not exist — fall through, the table might already be there
      logger.warn('ensureOtpTable rpc failed (may be OK if table exists)', { error: error.message });
    }
    tableEnsured = true;
  } catch {
    // Swallow — if table exists the subsequent insert will work fine
    tableEnsured = true;
  }
}

// ── Verification ──────────────────────────────────────────────────────────────

export type OtpVerifyResult =
  | { success: true }
  | { success: false; reason: 'invalid' | 'expired' | 'used' | 'max_attempts' | 'not_found' };

/**
 * Verifies a plaintext OTP for a user+purpose.
 * Handles: expiry, max attempts, single-use, constant-time comparison.
 * On success: marks the challenge as used.
 * On failure: increments attempts; invalidates when max reached.
 */
export async function verifyOtp(
  userId: string,
  purpose: OtpPurpose,
  plainOtp: string
): Promise<OtpVerifyResult> {
  // Fetch the active challenge
  const { data: challenges, error } = await supabaseAdmin
    .from('auth_otp_challenges')
    .select('*')
    .eq('user_id', userId)
    .eq('purpose', purpose)
    .eq('used', false)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !challenges || challenges.length === 0) {
    return { success: false, reason: 'not_found' };
  }

  const challenge = challenges[0];

  // Check if already used
  if (challenge.used) {
    return { success: false, reason: 'used' };
  }

  // Check max attempts
  if (challenge.attempts >= 5) {
    // Invalidate the challenge
    await supabaseAdmin
      .from('auth_otp_challenges')
      .delete()
      .eq('id', challenge.id);
    return { success: false, reason: 'max_attempts' };
  }

  // Check expiry
  if (new Date(challenge.expires_at) < new Date()) {
    await supabaseAdmin
      .from('auth_otp_challenges')
      .delete()
      .eq('id', challenge.id);
    return { success: false, reason: 'expired' };
  }

  // Constant-time hash comparison
  const inputHash = hashOtp(plainOtp.trim());
  const isCorrect = safeEqual(challenge.otp_hash, inputHash);

  if (!isCorrect) {
    // Increment attempts
    const newAttempts = challenge.attempts + 1;
    if (newAttempts >= 5) {
      // Invalidate immediately
      await supabaseAdmin
        .from('auth_otp_challenges')
        .delete()
        .eq('id', challenge.id);
    } else {
      await supabaseAdmin
        .from('auth_otp_challenges')
        .update({ attempts: newAttempts })
        .eq('id', challenge.id);
    }
    return { success: false, reason: 'invalid' };
  }

  // Correct — mark as used (single-use enforcement)
  await supabaseAdmin
    .from('auth_otp_challenges')
    .update({ used: true })
    .eq('id', challenge.id);

  logger.info('OTP verified successfully', { userId, purpose });
  return { success: true };
}

// ── Resend Check ─────────────────────────────────────────────────────────────

/** Returns true if the user is still within the 60-second resend cooldown. */
export async function isResendCoolingDown(userId: string, purpose: OtpPurpose): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('auth_otp_challenges')
    .select('next_resend_at')
    .eq('user_id', userId)
    .eq('purpose', purpose)
    .eq('used', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) return false;
  return new Date(data.next_resend_at) > new Date();
}
