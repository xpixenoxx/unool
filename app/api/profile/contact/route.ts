import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';
import { ProfileContactLeadSchema } from '@/lib/validation/profileSchemas';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';
import { getClientIp, hashIp } from '@/lib/analytics/events';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';

const profileRepository = new SupabaseProfileRepository();

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await profileRepository.findByWorkspaceId(auth.workspaceId);
    if (!profile) {
      return NextResponse.json({ leads: [] });
    }

    const { data, error } = await supabaseAdmin
      .from('profile_leads')
      .select('id, sender_name, sender_email, message, created_at')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ leads: [] });
      }
      throw error;
    }

    return NextResponse.json({ leads: data || [] });
  } catch (error) {
    logger.error('Failed to list profile leads', { error });
    return NextResponse.json({ error: 'Failed to load profile leads' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const rl = await checkRateLimit(request, 'profileContact');
    const headers = rateLimitHeaders(rl.remaining, rl.reset);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many messages sent. Please try again later.' },
        { status: 429, headers }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = ProfileContactLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Please check your message fields.' },
        { status: 400, headers }
      );
    }

    // Silent honeypot success for automated bots
    if (parsed.data.website && parsed.data.website.trim().length > 0) {
      return NextResponse.json({ success: true }, { headers });
    }

    const cleanSubdomain = parsed.data.subdomain.trim().toLowerCase();
    const profile = await profileRepository.findBySubdomain(cleanSubdomain);
    if (!profile || profile.visibility === 'private') {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404, headers });
    }

    const clientIp = getClientIp(request);
    const ipHash = clientIp ? await hashIp(clientIp) : null;

    const { error: insertError } = await supabaseAdmin.from('profile_leads').insert({
      profile_id: profile.id,
      workspace_id: profile.workspaceId,
      sender_name: parsed.data.senderName,
      sender_email: parsed.data.senderEmail,
      message: parsed.data.message,
      ip_hash: ipHash,
    });

    if (insertError && insertError.code !== '42P01') {
      logger.warn('Failed to persist profile_lead row', { error: insertError.message });
    }

    // Also record CTA analytics signal without leaking PII
    try {
      await supabaseAdmin.from('analytics_events').insert({
        workspace_id: profile.workspaceId,
        profile_id: profile.id,
        event_type: 'profile_cta_click',
        event_data: {
          cta_type: 'contact_form_submit',
          subdomain: profile.subdomain,
          template: profile.theme?.template || 'lone',
        },
        ip_hash: ipHash,
      });
    } catch {
      // Non-critical analytics
    }

    // Best-effort creator email notification via Resend
    if (config.RESEND_API_KEY) {
      try {
        let recipientEmail = profile.email || undefined;
        if (!recipientEmail) {
          const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(profile.userId);
          recipientEmail = userRes?.user?.email ?? undefined;
        }
        if (recipientEmail) {
          const { Resend } = await import('resend');
          const resend = new Resend(config.RESEND_API_KEY);
          const safeName = escapeHtml(parsed.data.senderName);
          const safeEmail = escapeHtml(parsed.data.senderEmail);
          const safeMessage = escapeHtml(parsed.data.message).replace(/\n/g, '<br />');
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'noreply@unool.co',
            to: recipientEmail,
            replyTo: parsed.data.senderEmail,
            subject: `New message on your Unool profile from ${parsed.data.senderName}`,
            html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
              <h2 style="margin:0 0 12px;color:#111827;">New profile inquiry</h2>
              <p style="margin:0 0 8px;color:#4b5563;"><strong>From:</strong> ${safeName} (${safeEmail})</p>
              <div style="margin-top:16px;padding:16px;background:#f9fafb;border-radius:8px;color:#1f2937;line-height:1.6;">${safeMessage}</div>
              <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;">Reply directly to this email to respond to ${safeName}.</p>
            </div>`,
          });
        }
      } catch (mailErr) {
        logger.warn('Failed to send contact lead email notification', { error: String(mailErr) });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Your message has been delivered.',
    }, { headers });
  } catch (error) {
    logger.error('Profile contact API error', { error });
    return NextResponse.json({ error: 'Unable to send message right now' }, { status: 500 });
  }
}

