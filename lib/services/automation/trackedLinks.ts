import { supabaseAdmin } from '@/lib/supabase/admin';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { queueService } from '@/lib/services/QueueService';
import { computeContactIntentScore } from '@/lib/services/automation/intentScore';
import { dispatchWorkspaceWebhooks } from '@/lib/services/automation/leadSync';
import { getEdgeKv, runEdgeWaitUntil } from '@/lib/cloudflare/edgeBindings';

interface EdgeCachedLink {
  id: string;
  workspace_id: string;
  destination_url: string;
  campaign_id?: string | null;
  enrollment_id?: string | null;
  contact_id?: string | null;
  ab_variant?: string | null;
  click_count?: number;
}

function generateShortCode(length = 8): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
}

export function isValidRedirectUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Creates a tracked redirect link (`{APP_URL}/go/{code}`) for revenue/CTR attribution,
 * A/B variant click measurement, and automatic 3h nudge cancellation on click.
 * Falls back cleanly to the raw destinationUrl if DB insert fails or URL is invalid.
 */
export async function createTrackedLink(params: {
  workspaceId: string;
  destinationUrl: string;
  campaignId?: string | null;
  enrollmentId?: string | null;
  contactId?: string | null;
  postId?: string | null;
  abVariant?: 'A' | 'B';
}): Promise<{ shortUrl: string; code: string | null }> {
  const dest = (params.destinationUrl || '').trim();
  if (!dest || !isValidRedirectUrl(dest)) {
    return { shortUrl: dest, code: null };
  }

  const appUrl = (config.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/+$/, '');
  // Never emit localhost shortlinks into real Instagram DMs
  if (!appUrl || appUrl.includes('localhost') || appUrl.includes('127.0.0.1')) {
    return { shortUrl: dest, code: null };
  }

  try {
    const code = generateShortCode(8);
    const { data: inserted, error } = await supabaseAdmin
      .from('tracked_links')
      .insert({
        workspace_id: params.workspaceId,
        code,
        destination_url: dest,
        campaign_id: params.campaignId || null,
        enrollment_id: params.enrollmentId || null,
        contact_id: params.contactId || null,
        post_id: params.postId || null,
        ab_variant: params.abVariant || 'A',
      })
      .select('id')
      .maybeSingle();

    if (error) {
      logger.debug('createTrackedLink fallback to raw destination', { error: error.message });
      return { shortUrl: dest, code: null };
    }

    // Write-through cache into Cloudflare Edge KV (`UNOOL_EDGE_KV`) for <5ms global redirects
    try {
      const kv = await getEdgeKv();
      if (kv && inserted?.id) {
        const edgePayload: EdgeCachedLink = {
          id: inserted.id,
          workspace_id: params.workspaceId,
          destination_url: dest,
          campaign_id: params.campaignId || null,
          enrollment_id: params.enrollmentId || null,
          contact_id: params.contactId || null,
          ab_variant: params.abVariant || 'A',
          click_count: 0,
        };
        await kv.put(`go:${code}`, JSON.stringify(edgePayload), { expirationTtl: 60 * 60 * 24 * 30 });
      }
    } catch {
      // Non-fatal edge cache warm
    }

    return { shortUrl: `${appUrl}/go/${code}`, code };
  } catch {
    return { shortUrl: dest, code: null };
  }
}

/**
 * Resolves a tracked short code (Cloudflare Edge KV first for <5ms global redirects,
 * falling back to Supabase), logs the click, boosts contact intent score, cancels any
 * pending 3h QStash nudge, and dispatches `link.clicked` webhook via `waitUntil`.
 */
export async function resolveAndRecordTrackedClick(
  code: string,
  meta: { userAgent?: string | null; referer?: string | null }
): Promise<{ destinationUrl: string | null }> {
  if (!code || !/^[a-z0-9_-]{4,32}$/i.test(code)) {
    return { destinationUrl: null };
  }

  let link: EdgeCachedLink | null = null;
  let fromEdgeKv = false;

  try {
    const kv = await getEdgeKv();
    if (kv) {
      const cached = await kv.get<EdgeCachedLink>(`go:${code}`, 'json');
      if (cached && cached.destination_url && isValidRedirectUrl(cached.destination_url)) {
        link = cached;
        fromEdgeKv = true;
      }
    }
  } catch {
    // Fall back to Supabase
  }

  if (!link) {
    const { data: dbLink, error } = await supabaseAdmin
      .from('tracked_links')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (error || !dbLink || !isValidRedirectUrl(dbLink.destination_url)) {
      return { destinationUrl: null };
    }
    link = dbLink as EdgeCachedLink;

    // Warm Edge KV on cache miss so subsequent clicks resolve in <5ms
    try {
      const kv = await getEdgeKv();
      if (kv) {
        await kv.put(
          `go:${code}`,
          JSON.stringify({
            id: link.id,
            workspace_id: link.workspace_id,
            destination_url: link.destination_url,
            campaign_id: link.campaign_id || null,
            enrollment_id: link.enrollment_id || null,
            contact_id: link.contact_id || null,
            ab_variant: link.ab_variant || 'A',
            click_count: link.click_count || 0,
          }),
          { expirationTtl: 60 * 60 * 24 * 30 }
        );
      }
    } catch {
      // Non-fatal
    }
  }

  const resolvedLink = link;
  const nowIso = new Date().toISOString();

  // Telemetry & side effects execute in Cloudflare `waitUntil` when served from Edge KV
  const telemetryPromise = (async () => {
    try {
      const latestCount = fromEdgeKv
        ? ((
            await supabaseAdmin
              .from('tracked_links')
              .select('click_count')
              .eq('id', resolvedLink.id)
              .maybeSingle()
          ).data?.click_count ?? resolvedLink.click_count ?? 0)
        : (resolvedLink.click_count || 0);

      await Promise.allSettled([
        supabaseAdmin
          .from('tracked_links')
          .update({
            click_count: latestCount + 1,
            last_clicked_at: nowIso,
          })
          .eq('id', resolvedLink.id),
        supabaseAdmin.from('tracked_link_clicks').insert({
          tracked_link_id: resolvedLink.id,
          workspace_id: resolvedLink.workspace_id,
          contact_id: resolvedLink.contact_id || null,
          campaign_id: resolvedLink.campaign_id || null,
          ab_variant: resolvedLink.ab_variant || 'A',
          user_agent: meta.userAgent ? meta.userAgent.slice(0, 300) : null,
          referer: meta.referer ? meta.referer.slice(0, 300) : null,
          clicked_at: nowIso,
        }),
      ]);

      // Cancel pending 3h follow-up nudge if enrollment exists
      if (resolvedLink.enrollment_id) {
        const { data: enrollment } = await supabaseAdmin
          .from('campaign_enrollments')
          .select('id, nudge_qstash_id')
          .eq('id', resolvedLink.enrollment_id)
          .maybeSingle();

        if (enrollment?.nudge_qstash_id) {
          await queueService.cancelScheduledTask(enrollment.nudge_qstash_id);
        }

        await supabaseAdmin
          .from('campaign_enrollments')
          .update({
            stage: 'clicked',
            link_clicked_at: nowIso,
            nudge_qstash_id: null,
            updated_at: nowIso,
          })
          .eq('id', resolvedLink.enrollment_id);
      }

      // Boost contact's click count & Intent Score
      if (resolvedLink.contact_id) {
        const { data: contact } = await supabaseAdmin
          .from('workspace_contacts')
          .select('*')
          .eq('id', resolvedLink.contact_id)
          .maybeSingle();

        if (contact) {
          const nextClicks = (contact.total_clicks || 0) + 1;
          const recomputed = computeContactIntentScore({
            hasEmail: Boolean(contact.email),
            hasPhone: Boolean(contact.phone),
            isFollowing: contact.is_following_business,
            isVip: Boolean(contact.is_vip),
            totalComments: contact.total_comments,
            totalDms: contact.total_dms,
            totalClicks: nextClicks,
            lastInteractionAt: nowIso,
          });
          await supabaseAdmin
            .from('workspace_contacts')
            .update({
              total_clicks: nextClicks,
              intent_score: Math.max(contact.intent_score || 0, recomputed.score),
              last_interaction_at: nowIso,
              updated_at: nowIso,
            })
            .eq('id', contact.id);
        }
      }

      await dispatchWorkspaceWebhooks(resolvedLink.workspace_id, 'link.clicked', {
        code,
        destinationUrl: resolvedLink.destination_url,
        campaignId: resolvedLink.campaign_id,
        contactId: resolvedLink.contact_id,
        abVariant: resolvedLink.ab_variant,
        clickedAt: nowIso,
      });
    } catch (err) {
      logger.debug('resolveAndRecordTrackedClick non-fatal telemetry error', {
        code,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  })();

  await runEdgeWaitUntil(telemetryPromise);

  return { destinationUrl: resolvedLink.destination_url };
}
