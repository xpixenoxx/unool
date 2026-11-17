import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export interface ResolvedPasswordHash {
  hash: string | null;
  source: 'table' | 'metadata' | 'none';
}

export interface SavePasswordHashResult {
  persistedInTable: boolean;
  persistedInMetadataFallback: boolean;
}

function getMetadataPasswordHash(metadata?: Record<string, unknown> | null): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const raw = metadata.password_hash;
  return typeof raw === 'string' && raw.length > 0 ? raw : null;
}

async function scrubMetadataPasswordHash(
  userId: string,
  existingMetadata?: Record<string, unknown> | null
): Promise<void> {
  if (existingMetadata && !getMetadataPasswordHash(existingMetadata)) {
    return;
  }

  try {
    const adminAuth = supabaseAdmin?.auth?.admin;
    if (!adminAuth || typeof adminAuth.updateUserById !== 'function') {
      return;
    }

    await adminAuth.updateUserById(userId, {
      user_metadata: {
        ...(existingMetadata || {}),
        password_hash: null,
      },
    });
  } catch (err) {
    logger.warn('Failed to scrub legacy password_hash from auth user_metadata (non-fatal)', {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Reads the user's Argon2id password hash from `public.user_credentials` first,
 * falling back to legacy `auth.users.user_metadata.password_hash` pre-migration
 * and lazily migrating + scrubbing metadata when `user_credentials` is available.
 */
export async function getUserPasswordHash(user: {
  id: string;
  user_metadata?: Record<string, unknown> | null;
}): Promise<ResolvedPasswordHash> {
  const metadataHash = getMetadataPasswordHash(user.user_metadata);

  try {
    const tableRef = supabaseAdmin?.from?.('user_credentials') as unknown as {
      select?: (cols: string) => {
        eq: (col: string, val: string) => {
          limit: (n: number) => {
            maybeSingle?: () => Promise<{ data?: { password_hash?: string | null } | null; error?: unknown }>;
          };
        };
      };
      upsert?: (
        values: Record<string, unknown>,
        opts?: { onConflict?: string }
      ) => Promise<{ error?: unknown }>;
    };

    const queryChain = tableRef?.select?.('password_hash')?.eq('user_id', user.id)?.limit(1);
    if (queryChain && typeof queryChain.maybeSingle === 'function') {
      const { data, error } = await queryChain.maybeSingle();
      if (!error && typeof data?.password_hash === 'string' && data.password_hash.length > 0) {
        if (metadataHash) {
          void scrubMetadataPasswordHash(user.id, user.user_metadata);
        }
        return { hash: data.password_hash, source: 'table' };
      }

      if (!error && metadataHash && typeof tableRef.upsert === 'function') {
        const { error: migrateError } = await tableRef.upsert(
          {
            user_id: user.id,
            password_hash: metadataHash,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
        if (!migrateError) {
          await scrubMetadataPasswordHash(user.id, user.user_metadata);
        }
      }
    }
  } catch (err) {
    logger.warn('user_credentials lookup fell back to metadata check', {
      userId: user.id,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  if (metadataHash) {
    return { hash: metadataHash, source: 'metadata' };
  }

  return { hash: null, source: 'none' };
}

/**
 * Persists an Argon2id password hash to `public.user_credentials` and scrubs any
 * legacy hash stored inside `auth.users.user_metadata`. Falls back to `user_metadata`
 * only if `user_credentials` has not been migrated into Postgres yet.
 */
export async function saveUserPasswordHash(
  userId: string,
  passwordHash: string,
  existingMetadata?: Record<string, unknown> | null
): Promise<SavePasswordHashResult> {
  try {
    const tableRef = supabaseAdmin?.from?.('user_credentials') as unknown as {
      upsert?: (
        values: Record<string, unknown>,
        opts?: { onConflict?: string }
      ) => Promise<{ error?: { message?: string; code?: string } | null }>;
    };

    if (tableRef && typeof tableRef.upsert === 'function') {
      const { error } = await tableRef.upsert(
        {
          user_id: userId,
          password_hash: passwordHash,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      if (!error) {
        if (getMetadataPasswordHash(existingMetadata)) {
          await scrubMetadataPasswordHash(userId, existingMetadata);
        }
        return { persistedInTable: true, persistedInMetadataFallback: false };
      }

      logger.warn('user_credentials upsert failed; falling back to auth metadata', {
        userId,
        code: error.code,
        message: error.message,
      });
    }
  } catch (err) {
    logger.warn('user_credentials upsert exception; falling back to auth metadata', {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  const { error: metaError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...(existingMetadata || {}),
      password_hash: passwordHash,
    },
  });

  if (metaError) {
    throw new Error(metaError.message || 'Failed to persist user credentials');
  }

  return { persistedInTable: false, persistedInMetadataFallback: true };
}

