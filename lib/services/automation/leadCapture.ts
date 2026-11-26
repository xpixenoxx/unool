import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { config } from '@/lib/config/schema';
import type { MessagingUserProfile } from '@/lib/services/InstagramCommentAutomation';

export interface WorkspaceContact {
  id: string;
  workspace_id: string;
  platform: 'instagram' | 'facebook' | 'threads' | 'linkedin';
  platform_user_id: string;
  username?: string | null;
  full_name?: string | null;
  profile_pic_url?: string | null;
  follower_count?: number | null;
  is_verified: boolean;
  is_following_business?: boolean | null;
  is_business_following?: boolean | null;
  is_vip: boolean;
  email?: string | null;
  phone?: string | null;
  consent_at?: string | null;
  consent_source?: string | null;
  opted_out: boolean;
  opted_out_at?: string | null;
  ai_paused_until?: string | null;
  intent_score: number;
  tags: string[];
  custom_fields: Record<string, unknown>;
  lead_capture_state?: LeadCaptureState | null;
  total_comments: number;
  total_dms: number;
  total_clicks: number;
  last_interaction_at: string;
  last_dm_at?: string | null;
  last_campaign_id?: string | null;
}

export interface LeadCaptureState {
  campaignId: string;
  awaiting: 'email' | 'phone';
  deliveryMessage: string;
  ctaUrl?: string | null;
  ctaTitle?: string | null;
  sendEmailDelivery?: boolean;
  emailSubject?: string | null;
  emailBody?: string | null;
  confirmText?: string | null;
  attempts: number;
  startedAt: string;
}

export interface ExtractedContactInfo {
  email: string | null;
  phone: string | null;
  declined: boolean;
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,5}\)?[\s.-]?)?\d{3,5}[\s.-]?\d{4,5}/;
const DECLINE_REGEX = /^\s*(?:no|nope|nah|skip|no\s+thanks|rather\s+not|not\s+sharing|pass|nevermind|cancel)\s*[!.]*\s*$/i;

/**
 * Extracts email and/or E.164-normalized phone number from natural conversational DM text.
 * Examples:
 *  - "sure it's raj@unool.co" -> email: "raj@unool.co"
 *  - "my whatsapp is +91 98765-43210" -> phone: "+919876543210"
 *  - "no thanks" -> declined: true
 */
export function extractEmailAndPhone(text: string): ExtractedContactInfo {
  const raw = (text || '').trim();
  if (!raw) return { email: null, phone: null, declined: false };

  const emailMatch = raw.match(EMAIL_REGEX);
  const email = emailMatch ? emailMatch[0].toLowerCase().trim() : null;

  let phone: string | null = null;
  const withoutEmail = email ? raw.replace(email, '') : raw;
  const phoneMatch = withoutEmail.match(PHONE_REGEX);
  if (phoneMatch) {
    const digits = phoneMatch[0].replace(/[^\d+]/g, '');
    const digitCount = digits.replace(/\D/g, '').length;
    if (digitCount >= 10 && digitCount <= 15) {
      phone = digits.startsWith('+') ? digits : `+${digits}`;
    }
  }

  const declined = !email && !phone && DECLINE_REGEX.test(raw);
  return { email, phone, declined };
}

/**
 * Upserts a consented contact into `workspace_contacts` (Audience Vault CRM).
 * Computes VIP status automatically from official Meta profile fields
 * (`is_verified_user` OR `follower_count >= vipThreshold`).
 */
export async function upsertWorkspaceContact(params: {
  workspaceId: string;
  platform: 'instagram' | 'facebook' | 'threads' | 'linkedin';
  platformUserId: string;
  username?: string | null;
  fullName?: string | null;
  profile?: MessagingUserProfile | null;
  email?: string | null;
  phone?: string | null;
  consentSource?: string | null;
  optedOut?: boolean;
  aiPausedUntil?: string | null;
  addTags?: string[];
  leadCaptureState?: LeadCaptureState | null;
  clearLeadCaptureState?: boolean;
  incrementComments?: boolean;
  incrementDms?: boolean;
  incrementClicks?: boolean;
  intentScore?: number;
  lastCampaignId?: string | null;
  vipFollowerThreshold?: number;
}): Promise<WorkspaceContact | null> {
  if (!params.workspaceId || !params.platformUserId) return null;

  try {
    const { data: existing } = await supabaseAdmin
      .from('workspace_contacts')
      .select('*')
      .eq('workspace_id', params.workspaceId)
      .eq('platform', params.platform)
      .eq('platform_user_id', params.platformUserId)
      .maybeSingle();

    const nowIso = new Date().toISOString();
    const vipThreshold = params.vipFollowerThreshold ?? 10000;
    const followerCount = params.profile?.followerCount ?? existing?.follower_count ?? null;
    const isVerified = params.profile?.isVerifiedUser ?? existing?.is_verified ?? false;
    const isVip =
      Boolean(existing?.is_vip) ||
      Boolean(isVerified) ||
      (typeof followerCount === 'number' && followerCount >= vipThreshold);

    const mergedTags = Array.from(
      new Set([...(Array.isArray(existing?.tags) ? existing.tags : []), ...(params.addTags || [])])
    );
    if (isVip && !mergedTags.includes('VIP')) {
      mergedTags.push('VIP');
    }

    const emailValue = params.email || existing?.email || null;
    const phoneValue = params.phone || existing?.phone || null;
    const hasNewLeadInfo = Boolean(params.email || params.phone);

    const payload: Record<string, unknown> = {
      workspace_id: params.workspaceId,
      platform: params.platform,
      platform_user_id: params.platformUserId,
      username: params.profile?.username || params.username || existing?.username || null,
      full_name: params.profile?.name || params.fullName || existing?.full_name || null,
      profile_pic_url: params.profile?.profilePic || existing?.profile_pic_url || null,
      follower_count: followerCount,
      is_verified: isVerified,
      is_following_business:
        params.profile?.isUserFollowBusiness ?? existing?.is_following_business ?? null,
      is_business_following:
        params.profile?.isBusinessFollowUser ?? existing?.is_business_following ?? null,
      is_vip: isVip,
      email: emailValue,
      phone: phoneValue,
      consent_at: hasNewLeadInfo ? nowIso : existing?.consent_at || null,
      consent_source: hasNewLeadInfo
        ? params.consentSource || `${params.platform}_dm_opt_in`
        : existing?.consent_source || null,
      opted_out: params.optedOut !== undefined ? params.optedOut : Boolean(existing?.opted_out),
      opted_out_at:
        params.optedOut === true ? nowIso : params.optedOut === false ? null : existing?.opted_out_at || null,
      ai_paused_until:
        params.aiPausedUntil !== undefined ? params.aiPausedUntil : existing?.ai_paused_until || null,
      intent_score:
        typeof params.intentScore === 'number'
          ? Math.max(0, Math.min(100, Math.round(params.intentScore)))
          : existing?.intent_score ?? 0,
      tags: mergedTags,
      lead_capture_state: params.clearLeadCaptureState
        ? null
        : params.leadCaptureState !== undefined
          ? params.leadCaptureState
          : existing?.lead_capture_state ?? null,
      total_comments: (existing?.total_comments ?? 0) + (params.incrementComments ? 1 : 0),
      total_dms: (existing?.total_dms ?? 0) + (params.incrementDms ? 1 : 0),
      total_clicks: (existing?.total_clicks ?? 0) + (params.incrementClicks ? 1 : 0),
      last_interaction_at: nowIso,
      last_dm_at: params.incrementDms ? nowIso : existing?.last_dm_at || null,
      last_campaign_id: params.lastCampaignId || existing?.last_campaign_id || null,
      updated_at: nowIso,
    };

    const { data, error } = await supabaseAdmin
      .from('workspace_contacts')
      .upsert(payload, { onConflict: 'workspace_id,platform,platform_user_id' })
      .select('*')
      .maybeSingle();

    if (error) {
      logger.debug('upsertWorkspaceContact returned non-fatal DB error', { error: error.message });
      return null;
    }
    return (data as WorkspaceContact) || null;
  } catch (err) {
    logger.debug('upsertWorkspaceContact degraded cleanly', {
      workspaceId: params.workspaceId,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * Checks whether AI automation is currently paused for a contact (e.g. due to creator `is_echo`
 * phone reply or manual pause in CRM, or explicit "STOP" opt-out).
 */
export async function getContactAutomationStatus(
  workspaceId: string,
  platformUserId: string,
  platform: 'instagram' | 'facebook' = 'instagram'
): Promise<{
  contact: WorkspaceContact | null;
  optedOut: boolean;
  aiPaused: boolean;
  aiPausedUntil: string | null;
}> {
  try {
    const { data } = await supabaseAdmin
      .from('workspace_contacts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', platform)
      .eq('platform_user_id', platformUserId)
      .maybeSingle();

    if (!data) {
      return { contact: null, optedOut: false, aiPaused: false, aiPausedUntil: null };
    }
    const contact = data as WorkspaceContact;
    const pausedMs = contact.ai_paused_until ? Date.parse(contact.ai_paused_until) : 0;
    const aiPaused = Boolean(pausedMs && pausedMs > Date.now());
    return {
      contact,
      optedOut: Boolean(contact.opted_out),
      aiPaused,
      aiPausedUntil: aiPaused ? contact.ai_paused_until || null : null,
    };
  } catch {
    return { contact: null, optedOut: false, aiPaused: false, aiPausedUntil: null };
  }
}

/**
 * Sends the captured lead's resource email via Resend when `send_email_delivery` is enabled.
 */
export async function sendLeadDeliveryEmail(params: {
  toEmail: string;
  recipientName?: string | null;
  brandName: string;
  subject?: string | null;
  body?: string | null;
  resourceUrl?: string | null;
}): Promise<boolean> {
  const apiKey = config.RESEND_API_KEY || process.env.RESEND_API_KEY;
  if (!apiKey || !params.toEmail) return false;

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    const greeting = params.recipientName ? `Hi ${params.recipientName},` : 'Hi there,';
    const subject = params.subject?.trim() || `Here is your link from ${params.brandName}`;
    const bodyText =
      params.body?.trim() ||
      `Thanks for connecting on Instagram! Here is your permanent copy of the link we shared:`;
    const linkHtml = params.resourceUrl
      ? `<p style="margin:20px 0"><a href="${params.resourceUrl}" style="display:inline-block;padding:12px 20px;background:#3D2B1F;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600">Open Resource</a></p><p style="font-size:12px;color:#6E5A48">${params.resourceUrl}</p>`
      : '';

    const { error } = await resend.emails.send({
      from: `${params.brandName} via Unool <notifications@unool.co>`,
      to: params.toEmail,
      subject,
      html: `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#3D2B1F">
        <p>${greeting}</p>
        <p>${bodyText}</p>
        ${linkHtml}
        <hr style="border:none;border-top:1px solid #E4D9C8;margin:24px 0" />
        <p style="font-size:11px;color:#8B7355">You received this because you requested it via Instagram DM with ${params.brandName}.</p>
      </div>`,
    });
    if (error) {
      logger.warn('Resend lead delivery email failed', { error });
      return false;
    }
    return true;
  } catch (err) {
    logger.warn('sendLeadDeliveryEmail exception', {
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

/**
 * Formats a multi-step lead capture response when a contact is actively in `lead_capture_state`.
 */
export function evaluateLeadCaptureTurn(
  inboundText: string,
  state: LeadCaptureState
):
  | { status: 'captured'; email: string | null; phone: string | null; replyText: string }
  | { status: 'declined'; replyText: string }
  | { status: 'reprompt'; replyText: string; nextState: LeadCaptureState }
  | { status: 'fallthrough' } {
  const extracted = extractEmailAndPhone(inboundText);

  if (state.awaiting === 'email' && extracted.email) {
    const base =
      state.confirmText?.trim() ||
      `Got it (${extracted.email})! ${state.deliveryMessage || 'Here is your access:'}`;
    const replyText =
      state.ctaUrl && !base.includes(state.ctaUrl) ? `${base}\n\n${state.ctaUrl}` : base;
    return { status: 'captured', email: extracted.email, phone: extracted.phone, replyText };
  }

  if (state.awaiting === 'phone' && extracted.phone) {
    const base =
      state.confirmText?.trim() ||
      `Got it! ${state.deliveryMessage || 'Here is your access:'}`;
    const replyText =
      state.ctaUrl && !base.includes(state.ctaUrl) ? `${base}\n\n${state.ctaUrl}` : base;
    return { status: 'captured', email: extracted.email, phone: extracted.phone, replyText };
  }

  if (extracted.declined) {
    const replyText =
      state.ctaUrl
        ? `No worries at all! Here is your link directly: ${state.ctaUrl}`
        : `No problem at all! Let me know if I can help with anything else.`;
    return { status: 'declined', replyText };
  }

  // If they asked a real question instead of giving email/phone, allow 1 gentle re-prompt; after 2 attempts fall through cleanly
  if (state.attempts >= 2) {
    return { status: 'fallthrough' };
  }

  const label = state.awaiting === 'email' ? 'email address' : 'phone number';
  return {
    status: 'reprompt',
    replyText: `Quick check — drop your ${label} so I can send your copy over (or say "skip" if you'd rather not) 👇`,
    nextState: { ...state, attempts: state.attempts + 1 },
  };
}
