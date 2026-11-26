import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// PATCH /api/instagram/campaigns/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const workspaceId = body.workspaceId || auth.workspaceId;
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const hasAccess =
      workspaceId === auth.workspaceId || (await verifyWorkspaceAccess(auth.userId, workspaceId));
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Optional 1-click A/B Winner Promotion
    if (body.promoteWinner === 'A' || body.promoteWinner === 'B') {
      const { data: existing } = await supabaseAdmin
        .from('instagram_campaigns')
        .select('*')
        .eq('id', id)
        .eq('workspace_id', workspaceId)
        .single();
      if (!existing) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

      const promotedUpdate: Record<string, unknown> = {
        ab_variant_b_dm: null,
        ab_variant_b_cta_url: null,
        updated_at: new Date().toISOString(),
      };
      if (body.promoteWinner === 'B' && existing.ab_variant_b_dm) {
        promotedUpdate.dm_message = existing.ab_variant_b_dm;
        if (existing.ab_variant_b_cta_url) {
          promotedUpdate.dm_cta_url = existing.ab_variant_b_cta_url;
        }
      }
      const { data, error } = await supabaseAdmin
        .from('instagram_campaigns')
        .update(promotedUpdate)
        .eq('id', id)
        .eq('workspace_id', workspaceId)
        .select('*')
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ campaign: data });
    }

    const allowedFields = [
      'name',
      'trigger_surface',
      'media_id',
      'ad_id',
      'trigger_mode',
      'keywords',
      'exclude_keywords',
      'ignore_sub_comments',
      'ignore_tag_only_comments',
      'dedup_user_post_hours',
      'starts_at',
      'ends_at',
      'max_total_sends',
      'public_replies',
      'dm_opening_enabled',
      'dm_opening_text',
      'dm_opening_button_title',
      'dm_message',
      'dm_card_title',
      'dm_card_subtitle',
      'dm_card_image_url',
      'dm_cta_title',
      'dm_cta_url',
      'dm_extra_bubbles',
      'require_follow',
      'follow_ask_text',
      'follow_verified_text',
      'max_follow_reminders',
      'capture_email',
      'capture_phone',
      'capture_prompt',
      'capture_confirm_text',
      'skip_if_already_captured',
      'send_email_delivery',
      'email_subject',
      'email_body',
      'ab_variant_b_dm',
      'ab_variant_b_cta_url',
      'ab_split_pct',
      'nudge_enabled',
      'nudge_delay_minutes',
      'nudge_text',
      'closed_dm_public_fallback',
      'priority',
      'is_active',
    ];

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowedFields) {
      if (key in body) patch[key] = body[key];
    }

    const { data, error } = await supabaseAdmin
      .from('instagram_campaigns')
      .update(patch)
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ campaign: data });
  } catch (error) {
    logger.error('PATCH /api/instagram/campaigns/[id] error', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/instagram/campaigns/[id]?workspaceId=xxx
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const workspaceId = request.nextUrl.searchParams.get('workspaceId') || auth.workspaceId;
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const hasAccess =
      workspaceId === auth.workspaceId || (await verifyWorkspaceAccess(auth.userId, workspaceId));
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { error } = await supabaseAdmin
      .from('instagram_campaigns')
      .delete()
      .eq('id', id)
      .eq('workspace_id', workspaceId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('DELETE /api/instagram/campaigns/[id] error', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
