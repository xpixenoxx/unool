import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';

const adminClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

let cachedFlags: Record<string, boolean> | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 15_000; // 15 seconds cache

export async function getFeatureFlagsServer(): Promise<Record<string, boolean>> {
  const now = Date.now();
  if (cachedFlags && now - cacheTime < CACHE_TTL_MS) {
    return cachedFlags;
  }

  try {
    const { data, error } = await adminClient
      .from('admin_feature_flags')
      .select('flag_key, flag_value');

    if (error) throw error;

    const flags: Record<string, boolean> = {};
    for (const row of data ?? []) {
      flags[row.flag_key] = row.flag_value;
    }

    if (!('automation_enabled' in flags)) {
      flags['automation_enabled'] = true;
    }

    cachedFlags = flags;
    cacheTime = now;
    return flags;
  } catch (err) {
    console.error('[feature-flags-server] Failed to load flags:', err);
    return { automation_enabled: true };
  }
}

export async function isAutomationEnabledServer(): Promise<boolean> {
  const flags = await getFeatureFlagsServer();
  return flags['automation_enabled'] !== false;
}

