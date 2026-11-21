import { getPlatformAdapter } from '@/lib/platforms';
import { decryptToken, encryptToken } from '@/lib/crypto/encryption';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { invalidateOverviewCache } from '@/lib/cache/overviewCache';
import { invalidateConnectionsCache } from '@/lib/cache/connectionsCache';
import { logger } from '@/lib/logger';

export interface TokenRefreshOutcome {
  ok: boolean;
  accessTokenEncrypted?: string;
  preservedOnly?: boolean;
  error?: string;
}

export interface TokenRefreshOptions {
  /** 'expired' when updating due to background expiry check, 'error' during publish */
  failureStatus?: 'expired' | 'error';
  /** Best-effort email alert on transition from connected -> expired */
  sendExpiryAlert?: boolean;
}

function tryParseJson(raw: string): Record<string, any> | null {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, any>) : null;
  } catch {
    return null;
  }
}

async function mergePreservedCredentials(
  platform: string,
  newAccessToken: string,
  oldEncryptedToken?: string | null
): Promise<{ finalToken: string; hasPreservedFallback: boolean; preservedOnlyToken?: string }> {
  if (platform !== 'kick' && platform !== 'discord') {
    return { finalToken: newAccessToken, hasPreservedFallback: false };
  }

  let oldParsed: Record<string, any> | null = null;
  if (oldEncryptedToken) {
    try {
      const oldDecrypted = await decryptToken(oldEncryptedToken);
      oldParsed = tryParseJson(oldDecrypted);
    } catch {
      oldParsed = null;
    }
  }

  if (platform === 'kick') {
    const hasStream = Boolean(oldParsed?.streamUrl && oldParsed?.streamKey);
    if (hasStream) {
      return {
        finalToken: JSON.stringify({
          accessToken: newAccessToken,
          streamUrl: oldParsed!.streamUrl,
          streamKey: oldParsed!.streamKey,
        }),
        hasPreservedFallback: true,
        preservedOnlyToken: oldEncryptedToken || undefined,
      };
    }
    return { finalToken: newAccessToken, hasPreservedFallback: false };
  }

  // Discord stores { accessToken, webhookUrl, channelId, guildId }; refresh returns no webhook data
  const newParsed = tryParseJson(newAccessToken);
  const webhookUrl = oldParsed?.webhookUrl || newParsed?.webhookUrl || '';
  const channelId = oldParsed?.channelId || newParsed?.channelId || '';
  const guildId = oldParsed?.guildId ?? newParsed?.guildId;
  const rawToken = newParsed?.accessToken || newAccessToken;

  const merged = JSON.stringify({
    accessToken: rawToken,
    webhookUrl,
    channelId,
    ...(guildId !== undefined ? { guildId } : {}),
  });

  return {
    finalToken: merged,
    hasPreservedFallback: Boolean(webhookUrl),
    preservedOnlyToken: Boolean(webhookUrl) ? oldEncryptedToken || undefined : undefined,
  };
}

async function checkPreservedFallbackOnFailure(
  platform: string,
  oldEncryptedToken?: string | null
): Promise<boolean> {
  if (!oldEncryptedToken || (platform !== 'kick' && platform !== 'discord')) {
    return false;
  }
  try {
    const decrypted = await decryptToken(oldEncryptedToken);
    const parsed = tryParseJson(decrypted);
    if (!parsed) return false;
    if (platform === 'kick') return Boolean(parsed.streamUrl && parsed.streamKey);
    if (platform === 'discord') return Boolean(parsed.webhookUrl);
  } catch {
    return false;
  }
  return false;
}

async function maybeSendExpiryAlert(row: Record<string, any>): Promise<void> {
  if (row.status !== 'connected' || !row.user_id) return;
  try {
    let shouldNotify = true;
    const { data: prefRow, error: prefErr } = await supabaseAdmin
      .from('user_preferences')
      .select('notify_token_expiry')
      .eq('user_id', row.user_id)
      .limit(1)
      .maybeSingle();

    if (!prefErr && prefRow && prefRow.notify_token_expiry === false) {
      shouldNotify = false;
    } else if (row.workspace_id) {
      const { data: wsRow } = await supabaseAdmin
        .from('workspaces')
        .select('settings')
        .eq('id', row.workspace_id)
        .limit(1)
        .maybeSingle();
      const wsPrefs = (wsRow?.settings as Record<string, any> | undefined)?.preferences;
      if (wsPrefs?.notifyTokenExpiry === false || wsPrefs?.notify_token_expiry === false) {
        shouldNotify = false;
      }
    }

    if (shouldNotify) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(row.user_id);
      const email = authUser?.user?.email;
      if (email) {
        const { sendTokenExpiredAlertEmail } = await import('@/lib/auth/email');
        await sendTokenExpiredAlertEmail({
          to: email,
          platform: row.platform,
          username: row.username || undefined,
        });
      }
    }
  } catch {
    // Non-fatal alert dispatch
  }
}

/**
 * Shared token refresh handler across GET /api/platform/connections, PublishService, and cron.
 * Preserves Discord webhookUrl/channelId/guildId and Kick streamUrl/streamKey across refreshes.
 */
export async function refreshPlatformConnectionToken(
  row: Record<string, any>,
  options: TokenRefreshOptions = {}
): Promise<TokenRefreshOutcome> {
  const failureStatus = options.failureStatus || 'expired';
  const oldEncrypted = row.access_token_encrypted || row.access_token;

  try {
    const adapter = getPlatformAdapter(row.platform);
    if (!adapter) {
      return { ok: false, error: `Unsupported platform: ${row.platform}` };
    }

    const refreshTokenEncrypted = row.refresh_token_encrypted || row.refresh_token;
    if (!refreshTokenEncrypted) {
      const preserved = await checkPreservedFallbackOnFailure(row.platform, oldEncrypted);
      if (preserved) {
        return { ok: true, accessTokenEncrypted: oldEncrypted, preservedOnly: true };
      }
      return { ok: false, error: 'No refresh token available' };
    }

    const refreshToken = await decryptToken(refreshTokenEncrypted);
    const tokenResponse = await adapter.refreshAccessToken(refreshToken);

    const { finalToken } = await mergePreservedCredentials(
      row.platform,
      tokenResponse.accessToken,
      oldEncrypted
    );

    const newAccessTokenEncrypted = await encryptToken(finalToken);
    const newRefreshTokenEncrypted = tokenResponse.refreshToken
      ? await encryptToken(tokenResponse.refreshToken)
      : refreshTokenEncrypted;
    const newExpiresAt = tokenResponse.expiresIn
      ? new Date(Date.now() + tokenResponse.expiresIn * 1000)
      : null;

    await supabaseAdmin
      .from('platform_connections')
      .update({
        access_token_encrypted: newAccessTokenEncrypted,
        refresh_token_encrypted: newRefreshTokenEncrypted,
        expires_at: newExpiresAt?.toISOString() ?? null,
        status: 'connected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id);

    if (row.workspace_id) {
      invalidateOverviewCache(row.workspace_id);
      await invalidateConnectionsCache(row.workspace_id);
    }

    logger.info('Token refresh succeeded', {
      platform: row.platform,
      connectionId: row.id,
      newExpiresIn: tokenResponse.expiresIn,
    });

    return { ok: true, accessTokenEncrypted: newAccessTokenEncrypted };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.warn('Token refresh failed', {
      platform: row.platform,
      connectionId: row.id,
      error: err.message,
    });

    const hasPreservedCredentials = await checkPreservedFallbackOnFailure(row.platform, oldEncrypted);
    if (hasPreservedCredentials) {
      if (row.status !== 'connected') {
        await supabaseAdmin
          .from('platform_connections')
          .update({ status: 'connected', updated_at: new Date().toISOString() })
          .eq('id', row.id);
      }
      return { ok: true, accessTokenEncrypted: oldEncrypted, preservedOnly: true };
    }

    await supabaseAdmin
      .from('platform_connections')
      .update({ status: failureStatus, updated_at: new Date().toISOString() })
      .eq('id', row.id);

    if (row.workspace_id) {
      invalidateOverviewCache(row.workspace_id);
      await invalidateConnectionsCache(row.workspace_id);
    }

    if (options.sendExpiryAlert) {
      await maybeSendExpiryAlert(row);
    }

    return { ok: false, error: err.message };
  }
}
