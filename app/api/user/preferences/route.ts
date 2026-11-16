import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentAuth } from '@/lib/auth/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NO_STORE_HEADERS } from '@/lib/auth/session-cookies';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export interface UserPreferencesDto {
  theme: 'system' | 'light' | 'dark';
  timezone: string;
  timeFormat: '12h' | '24h';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  currencyDisplay: 'INR' | 'USD';
  digestFrequency: 'daily' | 'weekly' | 'never';
  notifyTokenExpiry: boolean;
  notifySecurityAlerts: boolean;
  notifyPublishing: boolean;
  aiPersonalizationEnabled: boolean;
}

const DEFAULT_PREFERENCES: UserPreferencesDto = {
  theme: 'light',
  timezone: 'Asia/Kolkata',
  timeFormat: '12h',
  dateFormat: 'DD/MM/YYYY',
  currencyDisplay: 'INR',
  digestFrequency: 'weekly',
  notifyTokenExpiry: true,
  notifySecurityAlerts: true,
  notifyPublishing: true,
  aiPersonalizationEnabled: true,
};

const patchPreferencesSchema = z.object({
  theme: z.enum(['system', 'light', 'dark']).optional(),
  timezone: z.string().trim().min(2).max(80).optional(),
  timeFormat: z.enum(['12h', '24h']).optional(),
  time_format: z.enum(['12h', '24h']).optional(),
  dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).optional(),
  date_format: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).optional(),
  currencyDisplay: z.enum(['INR', 'USD']).optional(),
  currency_display: z.enum(['INR', 'USD']).optional(),
  digestFrequency: z.enum(['daily', 'weekly', 'never']).optional(),
  digest_frequency: z.enum(['daily', 'weekly', 'never']).optional(),
  notifyTokenExpiry: z.boolean().optional(),
  notify_token_expiry: z.boolean().optional(),
  notifySecurityAlerts: z.boolean().optional(),
  notify_security_alerts: z.boolean().optional(),
  notifyPublishing: z.boolean().optional(),
  notify_publishing: z.boolean().optional(),
  aiPersonalizationEnabled: z.boolean().optional(),
  ai_personalization_enabled: z.boolean().optional(),
});

function normalizePreferences(
  row?: Record<string, unknown> | null,
  wsPrefs?: Record<string, unknown> | null
): UserPreferencesDto {
  const src = row || wsPrefs || {};
  const fallback = wsPrefs || {};

  const rawTheme = src.theme ?? fallback.theme;
  const theme: UserPreferencesDto['theme'] =
    rawTheme === 'dark' || rawTheme === 'system' || rawTheme === 'light' ? rawTheme : 'light';

  const rawTz = src.timezone ?? fallback.timezone;
  const timezone =
    typeof rawTz === 'string' && rawTz.trim().length >= 2 && rawTz.trim().length <= 80
      ? rawTz.trim()
      : DEFAULT_PREFERENCES.timezone;

  const rawTimeFmt = src.time_format ?? src.timeFormat ?? fallback.time_format ?? fallback.timeFormat;
  const timeFormat: UserPreferencesDto['timeFormat'] =
    rawTimeFmt === '24h' || rawTimeFmt === '12h' ? rawTimeFmt : DEFAULT_PREFERENCES.timeFormat;

  const rawDateFmt = src.date_format ?? src.dateFormat ?? fallback.date_format ?? fallback.dateFormat;
  const dateFormat: UserPreferencesDto['dateFormat'] =
    rawDateFmt === 'MM/DD/YYYY' || rawDateFmt === 'YYYY-MM-DD' || rawDateFmt === 'DD/MM/YYYY'
      ? rawDateFmt
      : DEFAULT_PREFERENCES.dateFormat;

  const rawCurrency =
    src.currency_display ?? src.currencyDisplay ?? fallback.currency_display ?? fallback.currencyDisplay;
  const currencyDisplay: UserPreferencesDto['currencyDisplay'] =
    rawCurrency === 'USD' || rawCurrency === 'INR' ? rawCurrency : DEFAULT_PREFERENCES.currencyDisplay;

  const rawDigest = src.digest_frequency ?? src.digestFrequency ?? fallback.digest_frequency ?? fallback.digestFrequency;
  const digestFrequency: UserPreferencesDto['digestFrequency'] =
    rawDigest === 'daily' || rawDigest === 'weekly' || rawDigest === 'never' ? rawDigest : 'weekly';

  const readBool = (snakeKey: string, camelKey: string, def: boolean): boolean => {
    if (typeof src[snakeKey] === 'boolean') return src[snakeKey] as boolean;
    if (typeof src[camelKey] === 'boolean') return src[camelKey] as boolean;
    if (typeof fallback[snakeKey] === 'boolean') return fallback[snakeKey] as boolean;
    if (typeof fallback[camelKey] === 'boolean') return fallback[camelKey] as boolean;
    return def;
  };

  return {
    theme,
    timezone,
    timeFormat,
    dateFormat,
    currencyDisplay,
    digestFrequency,
    notifyTokenExpiry: readBool('notify_token_expiry', 'notifyTokenExpiry', DEFAULT_PREFERENCES.notifyTokenExpiry),
    notifySecurityAlerts: readBool('notify_security_alerts', 'notifySecurityAlerts', DEFAULT_PREFERENCES.notifySecurityAlerts),
    notifyPublishing: readBool('notify_publishing', 'notifyPublishing', DEFAULT_PREFERENCES.notifyPublishing),
    aiPersonalizationEnabled: readBool(
      'ai_personalization_enabled',
      'aiPersonalizationEnabled',
      DEFAULT_PREFERENCES.aiPersonalizationEnabled
    ),
  };
}

async function readWorkspaceFallbackPrefs(workspaceId: string): Promise<Record<string, unknown> | null> {
  try {
    const { data } = await supabaseAdmin
      .from('workspaces')
      .select('settings')
      .eq('id', workspaceId)
      .limit(1)
      .maybeSingle();
    const settings = (data?.settings as Record<string, unknown> | null) || null;
    return (settings?.preferences as Record<string, unknown> | null) || null;
  } catch {
    return null;
  }
}

/**
 * GET /api/user/preferences
 * Reads per-user notification/theme/AI preferences from `public.user_preferences`
 * with pre-migration fallback to `workspaces.settings.preferences`.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
    }

    let tableRow: Record<string, unknown> | null = null;
    let source: 'table' | 'workspace-fallback' | 'defaults' = 'defaults';

    try {
      const { data, error } = await supabaseAdmin
        .from('user_preferences')
        .select(
          'theme, timezone, time_format, date_format, currency_display, digest_frequency, notify_token_expiry, notify_security_alerts, notify_publishing, ai_personalization_enabled'
        )
        .eq('user_id', auth.userId)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        tableRow = data as unknown as Record<string, unknown>;
        source = 'table';
      }
    } catch {
      // Pre-migration: user_preferences may not exist yet
    }

    const wsPrefs = tableRow ? null : await readWorkspaceFallbackPrefs(auth.workspaceId);
    if (!tableRow && wsPrefs) {
      source = 'workspace-fallback';
    }

    return NextResponse.json(
      {
        preferences: normalizePreferences(tableRow, wsPrefs),
        source,
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (err) {
    logger.error('GET /api/user/preferences failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: 'Failed to load preferences.' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

/**
 * PATCH /api/user/preferences
 * Updates per-user notification, theme, and AI personalization preferences cleanly,
 * persisting to `user_preferences` and keeping `workspaces.settings.preferences` synced pre-migration.
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS });
    }

    const rate = await checkRateLimit(request, 'accountAction', auth.userId);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Too many preference updates. Please wait a moment.' },
        { status: 429, headers: { ...NO_STORE_HEADERS, ...rateLimitHeaders(rate.remaining, rate.reset) } }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = patchPreferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid preferences payload.' },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const p = parsed.data;
    const existingTable = await (async () => {
      try {
        const { data } = await supabaseAdmin
          .from('user_preferences')
          .select(
            'theme, timezone, time_format, date_format, currency_display, digest_frequency, notify_token_expiry, notify_security_alerts, notify_publishing, ai_personalization_enabled'
          )
          .eq('user_id', auth.userId)
          .limit(1)
          .maybeSingle();
        return (data as Record<string, unknown> | null) ?? null;
      } catch {
        return null;
      }
    })();

    const wsPrefs = existingTable ? null : await readWorkspaceFallbackPrefs(auth.workspaceId);
    const current = normalizePreferences(existingTable, wsPrefs);

    const next: UserPreferencesDto = {
      theme: p.theme ?? current.theme,
      timezone: p.timezone ?? current.timezone,
      timeFormat: p.timeFormat ?? p.time_format ?? current.timeFormat,
      dateFormat: p.dateFormat ?? p.date_format ?? current.dateFormat,
      currencyDisplay: p.currencyDisplay ?? p.currency_display ?? current.currencyDisplay,
      digestFrequency: p.digestFrequency ?? p.digest_frequency ?? current.digestFrequency,
      notifyTokenExpiry: p.notifyTokenExpiry ?? p.notify_token_expiry ?? current.notifyTokenExpiry,
      notifySecurityAlerts: p.notifySecurityAlerts ?? p.notify_security_alerts ?? current.notifySecurityAlerts,
      notifyPublishing: p.notifyPublishing ?? p.notify_publishing ?? current.notifyPublishing,
      aiPersonalizationEnabled:
        p.aiPersonalizationEnabled ?? p.ai_personalization_enabled ?? current.aiPersonalizationEnabled,
    };

    const snakeRow = {
      user_id: auth.userId,
      theme: next.theme,
      timezone: next.timezone,
      time_format: next.timeFormat,
      date_format: next.dateFormat,
      currency_display: next.currencyDisplay,
      digest_frequency: next.digestFrequency,
      notify_token_expiry: next.notifyTokenExpiry,
      notify_security_alerts: next.notifySecurityAlerts,
      notify_publishing: next.notifyPublishing,
      ai_personalization_enabled: next.aiPersonalizationEnabled,
      updated_at: new Date().toISOString(),
    };

    let savedToTable = false;
    try {
      const { error: upsertErr } = await supabaseAdmin
        .from('user_preferences')
        .upsert(snakeRow, { onConflict: 'user_id' });
      if (!upsertErr) {
        savedToTable = true;
      }
    } catch {
      // Fallback to workspaces.settings.preferences below
    }

    if (!savedToTable) {
      const { data: wsRow } = await supabaseAdmin
        .from('workspaces')
        .select('settings')
        .eq('id', auth.workspaceId)
        .limit(1)
        .maybeSingle();

      const existingSettings = ((wsRow?.settings as Record<string, unknown>) || {});
      const { error: wsErr } = await supabaseAdmin
        .from('workspaces')
        .update({
          settings: {
            ...existingSettings,
            preferences: {
              theme: next.theme,
              timezone: next.timezone,
              time_format: next.timeFormat,
              date_format: next.dateFormat,
              currency_display: next.currencyDisplay,
              digest_frequency: next.digestFrequency,
              notify_token_expiry: next.notifyTokenExpiry,
              notify_security_alerts: next.notifySecurityAlerts,
              notify_publishing: next.notifyPublishing,
              ai_personalization_enabled: next.aiPersonalizationEnabled,
            },
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', auth.workspaceId);

      if (wsErr) {
        throw new Error(wsErr.message || 'Failed to persist preferences');
      }
    }

    return NextResponse.json(
      {
        success: true,
        preferences: next,
        storage: savedToTable ? 'user_preferences' : 'workspace-fallback',
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (err) {
    logger.error('PATCH /api/user/preferences failed', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: 'Failed to save preferences.' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}