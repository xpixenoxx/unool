import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';

const adminClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

let cachedFlags: Record<string, boolean> | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 5_000; // 5 seconds cache

export function clearFeatureFlagsCache() {
  cachedFlags = null;
  cacheTime = 0;
}

export async function getFeatureFlagsServer(): Promise<Record<string, boolean>> {
  const now = Date.now();
  if (cachedFlags && now - cacheTime < CACHE_TTL_MS) {
    return cachedFlags;
  }

  const flags: Record<string, boolean> = {
    automation_enabled: true, // Default safe state
  };

  // 1. Try reading from admin_feature_flags table
  try {
    const { data, error } = await adminClient
      .from('admin_feature_flags')
      .select('flag_key, flag_value');

    if (!error && Array.isArray(data) && data.length > 0) {
      for (const row of data) {
        flags[row.flag_key] = Boolean(row.flag_value);
      }
      cachedFlags = flags;
      cacheTime = now;
      return flags;
    }
  } catch (err) {
    // If admin_feature_flags table does not exist yet in Supabase, fall back to audit log
    console.warn('[feature-flags-server] Note: admin_feature_flags table read fell through to audit log');
  }

  // 2. Resilient Fallback: Read latest flag states from admin_audit_log
  try {
    const { data: audits, error: auditErr } = await adminClient
      .from('admin_audit_log')
      .select('target_id, metadata, created_at')
      .eq('action', 'feature_flag_update')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!auditErr && Array.isArray(audits) && audits.length > 0) {
      const seen = new Set<string>();
      for (const row of audits) {
        const meta = (row.metadata as any) || {};
        const key = meta.flag_key || (row.target_id && !row.target_id.includes('-') ? row.target_id : null);
        if (key && !seen.has(key)) {
          seen.add(key);
          const val = meta.flag_value;
          if (typeof val === 'boolean') {
            flags[key] = val;
          }
        }
      }
    }
  } catch (auditErr) {
    console.warn('[feature-flags-server] Audit log fallback read note:', auditErr);
  }

  cachedFlags = flags;
  cacheTime = now;
  return flags;
}

export async function setFeatureFlagServer(
  flagKey: string,
  flagValue: boolean,
  adminIdentifier: string
): Promise<boolean> {
  clearFeatureFlagsCache();

  // 1. Try upserting to admin_feature_flags table
  try {
    const { error: upsertErr } = await adminClient
      .from('admin_feature_flags')
      .upsert(
        {
          flag_key: flagKey,
          flag_value: flagValue,
          updated_by: adminIdentifier,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'flag_key' }
      );
    if (!upsertErr) {
      console.log(`[feature-flags-server] Saved flag ${flagKey}=${flagValue} to admin_feature_flags`);
    } else {
      console.warn('[feature-flags-server] admin_feature_flags upsert note:', upsertErr.message);
    }
  } catch (tableErr) {
    console.warn('[feature-flags-server] admin_feature_flags table upsert skipped:', tableErr);
  }

  // 2. Resilient Fallback: Always record in admin_audit_log (permanent table in production Supabase)
  try {
    // admin_audit_log requires admin_user_id (UUID NOT NULL) and target_id (UUID nullable)
    let adminUserId: string | null = null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (isUuid.test(adminIdentifier)) {
      adminUserId = adminIdentifier;
    } else {
      const { data: firstAdmin } = await adminClient
        .from('admin_users')
        .select('id')
        .limit(1)
        .maybeSingle();
      if (firstAdmin?.id) {
        adminUserId = firstAdmin.id;
      }
    }

    if (adminUserId) {
      const { error: auditErr } = await adminClient
        .from('admin_audit_log')
        .insert({
          admin_user_id: adminUserId,
          action: 'feature_flag_update',
          target_type: 'feature_flag',
          target_id: null, // PostgreSQL UUID column - must be null, not string
          metadata: {
            flag_key: flagKey,
            flag_value: flagValue,
            updated_by: adminIdentifier,
          },
        });
      if (!auditErr) {
        console.log(`[feature-flags-server] Recorded flag ${flagKey}=${flagValue} in admin_audit_log`);
      } else {
        console.warn('[feature-flags-server] admin_audit_log insert note:', auditErr.message);
      }
    } else {
      console.warn('[feature-flags-server] Could not resolve admin_user_id for audit log');
    }
  } catch (logErr) {
    console.error('[feature-flags-server] Failed to write audit log entry:', logErr);
  }

  clearFeatureFlagsCache();
  return true;
}

export async function isAutomationEnabledServer(): Promise<boolean> {
  const flags = await getFeatureFlagsServer();
  return flags['automation_enabled'] !== false;
}
