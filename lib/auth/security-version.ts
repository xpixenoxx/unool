import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

/**
 * Resolves and increments a user's `security_version` counter.
 *
 * Uses `public.users.security_version` when the migration column exists, and
 * falls back cleanly to `auth.users.user_metadata.sv` so environments without
 * the SQL migration applied still invalidate stale account-switch tokens immediately.
 */
export async function getUserSecurityVersion(userId: string): Promise<number> {
  if (!userId) return 1;

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('security_version')
      .eq('id', userId)
      .limit(1)
      .maybeSingle();

    if (!error && data && typeof (data as { security_version?: unknown }).security_version === 'number') {
      return (data as { security_version: number }).security_version;
    }
  } catch {
    // Column may not exist yet prior to migration
  }

  try {
    const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId);
    const metaSv = authData?.user?.user_metadata?.sv;
    if (typeof metaSv === 'number' && Number.isInteger(metaSv) && metaSv >= 1) {
      return metaSv;
    }
  } catch (err) {
    logger.warn('Failed to resolve user security version from auth metadata', {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return 1;
}

export async function bumpUserSecurityVersion(userId: string): Promise<number> {
  if (!userId) return 1;
  const current = await getUserSecurityVersion(userId);
  const next = current + 1;

  try {
    await supabaseAdmin
      .from('users')
      .update({ security_version: next })
      .eq('id', userId);
  } catch {
    // Ignore if security_version column has not been migrated yet
  }

  try {
    const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (authData?.user) {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...(authData.user.user_metadata || {}),
          sv: next,
        },
      });
    }
  } catch (err) {
    logger.warn('Failed to bump auth metadata security version', {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return next;
}

