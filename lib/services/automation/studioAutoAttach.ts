import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export interface StudioAutomationRuleInput {
  workspaceId: string;
  postId: string;
  keywords: string[];
  dmMessage: string;
  dmCtaUrl?: string | null;
  dmCtaTitle?: string | null;
  publicReplies?: string[];
  requireFollow?: boolean;
  captureEmail?: boolean;
  capturePhone?: boolean;
}

/**
 * Saves an auto-attach SignalDM automation rule onto a Studio/Composer post BEFORE publish.
 * When `PublishService` finishes publishing the Instagram variant and receives `platformPostId`,
 * `bindStudioAutomationRuleOnPublish()` automatically creates & activates the post-bound campaign!
 */
export async function saveStudioAutomationRule(
  input: StudioAutomationRuleInput
): Promise<{ id: string } | null> {
  const cleanKeywords = (input.keywords || []).map((k) => k.trim()).filter(Boolean);
  if (!input.workspaceId || !input.postId || !input.dmMessage?.trim()) return null;

  try {
    const { data, error } = await supabaseAdmin
      .from('studio_post_automation_rules')
      .upsert(
        {
          workspace_id: input.workspaceId,
          post_id: input.postId,
          keywords: cleanKeywords,
          dm_message: input.dmMessage.trim(),
          dm_cta_url: input.dmCtaUrl?.trim() || null,
          dm_cta_title: input.dmCtaTitle?.trim() || 'Open Link',
          public_replies: (input.publicReplies || []).map((r) => r.trim()).filter(Boolean),
          require_follow: Boolean(input.requireFollow),
          capture_email: Boolean(input.captureEmail),
          capture_phone: Boolean(input.capturePhone),
          status: 'pending',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'post_id' }
      )
      .select('id')
      .maybeSingle();

    if (error) {
      logger.warn('Failed to save studio_post_automation_rules', { error: error.message });
      return null;
    }
    return data?.id ? { id: data.id } : null;
  } catch (err) {
    logger.debug('saveStudioAutomationRule degraded cleanly', {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * Non-blocking post-publish hook called by `PublishService` when an Instagram variant
 * publishes successfully and receives its live `platformPostId`.
 * Automatically binds any pending `studio_post_automation_rules` row to a live `instagram_campaigns` row.
 */
export async function bindStudioAutomationRuleOnPublish(params: {
  workspaceId: string;
  postId: string;
  platformPostId: string;
}): Promise<{ bound: boolean; campaignId?: string }> {
  if (!params.workspaceId || !params.postId || !params.platformPostId) {
    return { bound: false };
  }

  try {
    const { data: rule } = await supabaseAdmin
      .from('studio_post_automation_rules')
      .select('*')
      .eq('workspace_id', params.workspaceId)
      .eq('post_id', params.postId)
      .eq('status', 'pending')
      .maybeSingle();

    if (!rule) return { bound: false };

    const keywords: string[] = Array.isArray(rule.keywords) ? rule.keywords : [];
    const { data: campaign, error: campErr } = await supabaseAdmin
      .from('instagram_campaigns')
      .insert({
        workspace_id: params.workspaceId,
        name: `Auto-DM (${keywords[0] || 'Any Comment'})`,
        trigger_surface: 'comment',
        media_id: params.platformPostId,
        post_id: params.postId,
        trigger_mode: keywords.length > 0 ? 'fuzzy' : 'any',
        keywords,
        public_replies:
          Array.isArray(rule.public_replies) && rule.public_replies.length > 0
            ? rule.public_replies
            : [
                'Just dropped it in your DMs! 🙌',
                'Sent it over to your inbox — check your requests!',
              ],
        dm_message: rule.dm_message,
        dm_cta_url: rule.dm_cta_url || null,
        dm_cta_title: rule.dm_cta_title || 'Open Link',
        require_follow: Boolean(rule.require_follow),
        capture_email: Boolean(rule.capture_email),
        capture_phone: Boolean(rule.capture_phone),
        dm_opening_enabled: Boolean(rule.require_follow || rule.capture_email || rule.capture_phone),
        is_active: true,
        priority: 50,
      })
      .select('id')
      .single();

    if (campErr || !campaign?.id) {
      await supabaseAdmin
        .from('studio_post_automation_rules')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', rule.id);
      return { bound: false };
    }

    await supabaseAdmin
      .from('studio_post_automation_rules')
      .update({
        bound_campaign_id: campaign.id,
        bound_platform_post_id: params.platformPostId,
        status: 'bound',
        updated_at: new Date().toISOString(),
      })
      .eq('id', rule.id);

    logger.info('Studio post auto-attached SignalDM campaign on publish', {
      postId: params.postId,
      platformPostId: params.platformPostId,
      campaignId: campaign.id,
    });
    return { bound: true, campaignId: campaign.id };
  } catch (err) {
    logger.debug('bindStudioAutomationRuleOnPublish skipped cleanly', {
      postId: params.postId,
      error: err instanceof Error ? err.message : String(err),
    });
    return { bound: false };
  }
}
