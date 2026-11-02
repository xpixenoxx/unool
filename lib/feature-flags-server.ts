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
    const { data: audits } = await adminClient
      .from('admin_audit_log')
      .select('target_id, metadata, created_at')
      .eq('action', 'feature_flag_update')
      .order('created_at', { ascending: false })
      .limit(30);

    if (Array.isArray(audits) && audits.length > 0) {
      const seen = new Set<string>();
      for (const row of audits) {
        const key = row.target_id;
        if (key && !seen.has(key)) {
          seen.add(key);
          const val = (row.metadata as any)?.flag_value;
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
    await adminClient
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
  } catch (tableErr) {
    console.warn('[feature-flags-server] Note: admin_feature_flags table upsert skipped:', tableErr);
  }

  // 2. Always record in admin_audit_log (permanent table in production Supabase)
  try {
    await adminClient
      .from('admin_audit_log')
      .insert({
        admin_user_id: null,
        action: 'feature_flag_update',
        target_type: 'admin_feature_flags',
        target_id: flagKey,
        metadata: { flag_key: flagKey, flag_value: flagValue, updated_by: adminIdentifier },
      });
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
