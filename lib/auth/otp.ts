/**
 * lib/auth/otp.ts
 *
 * Cryptographically-secure OTP generation and verification.
 *
 * For SIGNUP, no Supabase user is created yet — OTP is stored with email + metadata only.
 * For SIGNIN, user_id is used for lookup.
 *
 * RULES:
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

const OTP_PEPPER = process.env.OTP_PEPPER || process.env.ENCRYPTION_KEY || 'dev-otp-pepper-change-in-prod';

export type OtpPurpose = 'signup' | 'signin';

// ── Generation ────────────────────────────────────────────────────────────────

export function generateOtp(): string {
  const n = crypto.randomInt(0, 1_000_000);
  return n.toString().padStart(6, '0');
}

function hashOtp(otp: string): string {
  return crypto.createHmac('sha256', OTP_PEPPER).update(otp).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const padded = b.padEnd(a.length, '\0');
  const aBuf   = Buffer.from(a);
  const bBuf   = Buffer.from(padded);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

// ── Issue (Signup — no user yet) ──────────────────────────────────────────────

export interface IssueOtpResult {
  otp:          string;   // plaintext — send via email; never log or store
  expiresAt:    Date;
  nextResendAt: Date;
}

/**
 * Issues a signup OTP without creating a Supabase user.
 * Stores {name, password_hash} in metadata until OTP is verified.
 */
export async function issueSignupOtp(opts: {
  email:        string;
  name:         string;
  passwordHash: string;
}): Promise<IssueOtpResult> {
  const { email, name, passwordHash } = opts;
  const otp          = generateOtp();
  const otpHash      = hashOtp(otp);
  const now          = new Date();
  const expiresAt    = new Date(now.getTime() + 5 * 60 * 1000);
  const nextResendAt = new Date(now.getTime() + 60 * 1000);

  // Invalidate any previous pending signup OTPs for this email
  await supabaseAdmin
    .from('auth_otp_challenges')
    .delete()
    .eq('email', email)
    .eq('purpose', 'signup')
    .is('user_id', null);

  const { error } = await supabaseAdmin
    .from('auth_otp_challenges')
    .insert({
      email,
      user_id:        null,               // no user yet
      purpose:        'signup',
      otp_hash:       otpHash,
      expires_at:     expiresAt.toISOString(),
      next_resend_at: nextResendAt.toISOString(),
      metadata:       { name, password_hash: passwordHash },
    });

  if (error) {
    logger.error('Failed to store signup OTP challenge', { error, email });
    throw new Error('Could not create OTP challenge');
  }

  logger.info('Signup OTP issued (no user created yet)', { email, expiresAt });
  return { otp, expiresAt, nextResendAt };
}

/**
 * Issues a signin OTP for an existing, verified user.
 */
export async function issueOtp(userId: string, purpose: OtpPurpose, email?: string): Promise<IssueOtpResult> {
  const otp          = generateOtp();
  const otpHash      = hashOtp(otp);
  const now          = new Date();
  const expiresAt    = new Date(now.getTime() + 5 * 60 * 1000);
  const nextResendAt = new Date(now.getTime() + 60 * 1000);

  await supabaseAdmin
    .from('auth_otp_challenges')
    .delete()
    .eq('user_id', userId)
    .eq('purpose', purpose);

  const { error } = await supabaseAdmin
    .from('auth_otp_challenges')
    .insert({
      user_id:        userId,
      email:          email ?? '',
      purpose,
      otp_hash:       otpHash,
      expires_at:     expiresAt.toISOString(),
      next_resend_at: nextResendAt.toISOString(),
    });

  if (error) {
    logger.error('Failed to store OTP challenge', { error, userId, purpose });
    throw new Error('Could not create OTP challenge');
  }

  logger.info('OTP issued', { userId, purpose, expiresAt });
  return { otp, expiresAt, nextResendAt };
}

// ── Verification ──────────────────────────────────────────────────────────────

export type OtpVerifyResult =
  | { success: true;  metadata?: Record<string, string> }
  | { success: false; reason: 'invalid' | 'expired' | 'used' | 'max_attempts' | 'not_found' };

/**
 * Verifies a signup OTP (looks up by email, not user_id).
 * Returns metadata ({name, password_hash}) on success so the caller can create the user.
 */
export async function verifySignupOtp(email: string, plainOtp: string): Promise<OtpVerifyResult> {
  const { data: challenges, error } = await supabaseAdmin
    .from('auth_otp_challenges')
    .select('*')
    .eq('email', email)
    .eq('purpose', 'signup')
    .is('user_id', null)
    .eq('used', false)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !challenges || challenges.length === 0) {
    return { success: false, reason: 'not_found' };
  }

  const challenge = challenges[0];
  return _checkAndMarkOtp(challenge, plainOtp);
}

/**
 * Verifies a signin OTP (looks up by user_id).
 */
export async function verifyOtp(
  userId:   string,
  purpose:  OtpPurpose,
  plainOtp: string
): Promise<OtpVerifyResult> {
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

  return _checkAndMarkOtp(challenges[0], plainOtp);
}

async function _checkAndMarkOtp(challenge: Record<string, unknown>, plainOtp: string): Promise<OtpVerifyResult> {
  if (challenge.used) return { success: false, reason: 'used' };

  if ((challenge.attempts as number) >= 5) {
    await supabaseAdmin.from('auth_otp_challenges').delete().eq('id', challenge.id);
    return { success: false, reason: 'max_attempts' };
  }

  if (new Date(challenge.expires_at as string) < new Date()) {
    await supabaseAdmin.from('auth_otp_challenges').delete().eq('id', challenge.id);
    return { success: false, reason: 'expired' };
  }

  const inputHash = hashOtp(plainOtp.trim());
  const isCorrect = safeEqual(challenge.otp_hash as string, inputHash);

  if (!isCorrect) {
    const newAttempts = (challenge.attempts as number) + 1;
    if (newAttempts >= 5) {
      await supabaseAdmin.from('auth_otp_challenges').delete().eq('id', challenge.id);
    } else {
      await supabaseAdmin.from('auth_otp_challenges').update({ attempts: newAttempts }).eq('id', challenge.id);
    }
    return { success: false, reason: 'invalid' };
  }

  // Mark used (single-use)
  await supabaseAdmin.from('auth_otp_challenges').update({ used: true }).eq('id', challenge.id);

  logger.info('OTP verified successfully', { id: challenge.id });
  return { success: true, metadata: challenge.metadata as Record<string, string> };
}

// ── Resend Check ─────────────────────────────────────────────────────────────

export async function isSignupResendCoolingDown(email: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('auth_otp_challenges')
    .select('next_resend_at')
    .eq('email', email)
    .eq('purpose', 'signup')
    .is('user_id', null)
    .eq('used', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) return false;
  return new Date(data.next_resend_at) > new Date();
}

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
