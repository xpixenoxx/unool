import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { decryptToken } from '@/lib/crypto/encryption';

export type AutomationWebhookEvent =
  | 'lead.captured'
  | 'dm.replied'
  | 'link.clicked'
  | 'vip.detected'
  | 'campaign.triggered';

async function signHmacSha256(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function isSafeWebhookUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('169.254.') ||
      host.endsWith('.internal')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Dispatches signed HMAC-SHA256 outbound webhooks (`Zapier`, `Make`, `n8n`, custom CRM)
 * AND syncs captured emails directly to connected Listmonk instances.
 * Never throws; records `last_status_code` & `last_error` for transparent debugging.
 */
export async function dispatchWorkspaceWebhooks(
  workspaceId: string,
  event: AutomationWebhookEvent,
  data: Record<string, unknown>
): Promise<{ delivered: number; failed: number }> {
  let delivered = 0;
  let failed = 0;

  try {
    const { data: hooks } = await supabaseAdmin
      .from('automation_webhooks')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true);

    if (!Array.isArray(hooks) || hooks.length === 0) {
      return { delivered: 0, failed: 0 };
    }

    const bodyObj = {
      event,
      workspaceId,
      timestamp: new Date().toISOString(),
      data,
    };
    const bodyStr = JSON.stringify(bodyObj);

    for (const hook of hooks) {
      const subscribedEvents: string[] = Array.isArray(hook.events) ? hook.events : [];
      if (subscribedEvents.length > 0 && !subscribedEvents.includes(event)) continue;

      if (hook.target_type === 'listmonk') {
        if (event !== 'lead.captured' || !data.email) continue;
        const ok = await pushSubscriberToListmonk(workspaceId, {
          email: String(data.email),
          name: String(data.fullName || data.username || data.email),
          listId: hook.listmonk_list_id || 1,
          attributes: {
            source: 'unool_signaldm',
            username: data.username || null,
            campaign_id: data.campaignId || null,
          },
        });
        if (ok) delivered++;
        else failed++;
        continue;
      }

      if (!isSafeWebhookUrl(hook.url)) {
        failed++;
        continue;
      }

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Unool-Event': event,
          'User-Agent': 'Unool-SignalDM-Webhooks/1.0',
        };
        if (hook.signing_secret) {
          const sig = await signHmacSha256(bodyStr, hook.signing_secret);
          headers['X-Unool-Signature'] = `sha256=${sig}`;
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(hook.url, {
          method: 'POST',
          headers,
          body: bodyStr,
          signal: controller.signal,
        }).finally(() => clearTimeout(timer));

        await supabaseAdmin
          .from('automation_webhooks')
          .update({
            last_status_code: res.status,
            last_triggered_at: new Date().toISOString(),
            last_error: res.ok ? null : `HTTP ${res.status}`,
          })
          .eq('id', hook.id);

        if (res.ok) delivered++;
        else failed++;
      } catch (err) {
        failed++;
        await supabaseAdmin
          .from('automation_webhooks')
          .update({
            last_status_code: 0,
            last_triggered_at: new Date().toISOString(),
            last_error: err instanceof Error ? err.message.slice(0, 200) : 'Network failure',
          })
          .eq('id', hook.id);
      }
    }
  } catch (err) {
    logger.debug('dispatchWorkspaceWebhooks degraded cleanly', {
      workspaceId,
      event,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return { delivered, failed };
}

async function pushSubscriberToListmonk(
  workspaceId: string,
  subscriber: {
    email: string;
    name: string;
    listId: number;
    attributes?: Record<string, unknown>;
  }
): Promise<boolean> {
  try {
    const { data: conn } = await supabaseAdmin
      .from('platform_connections')
      .select('access_token_encrypted, metadata')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'listmonk')
      .eq('status', 'connected')
      .maybeSingle();

    if (!conn?.access_token_encrypted) return false;
    const rawCreds = await decryptToken(conn.access_token_encrypted);
    const parsed = JSON.parse(rawCreds) as {
      baseUrl?: string;
      apiUrl?: string;
      username?: string;
      password?: string;
      token?: string;
    };
    const baseUrl = (parsed.baseUrl || parsed.apiUrl || (conn.metadata as any)?.baseUrl || '').replace(/\/+$/, '');
    if (!baseUrl || !isSafeWebhookUrl(baseUrl)) return false;

    const authHeader =
      parsed.username && (parsed.password || parsed.token)
        ? `Basic ${Buffer.from(`${parsed.username}:${parsed.password || parsed.token}`).toString('base64')}`
        : parsed.token
          ? `token ${parsed.token}`
          : '';
    if (!authHeader) return false;

    const res = await fetch(`${baseUrl}/api/subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        email: subscriber.email,
        name: subscriber.name,
        status: 'enabled',
        lists: [subscriber.listId || 1],
        attribs: subscriber.attributes || {},
      }),
    });
    // 200/201 created or 409 already subscribed both count as synced
    return res.ok || res.status === 409;
  } catch (err) {
    logger.debug('pushSubscriberToListmonk skipped', {
      workspaceId,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}
