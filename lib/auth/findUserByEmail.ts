/**
 * findUserByEmail — shared Supabase auth user lookup by email (BUG-009 / FIX-12).
 *
 * `supabaseAdmin.auth.admin.listUsers()` returns only the first 50 users by default and
 * has no email filter, so filtering that single page in memory makes user #51+ invisible
 * (cannot sign in, verify OTP, reset password, ...). Every email lookup MUST go through
 * this helper instead.
 *
 * Strategy:
 *  1. Fast path (optional): RPC `find_auth_user_id_by_email` (migration
 *     supabase/migrations/20261110000003_auth_user_lookup.sql) → indexed lookup, then
 *     `auth.admin.getUserById`. If the RPC is not deployed (42883 / PGRST202) or fails for any
 *     other reason, we fall back to (2) — correct with no SQL applied.
 *  2. Paged scan: `listUsers({ page, perPage: 1000 })` until a match, an empty page or the last
 *     page, bounded by a hard page cap. Comparison is case-insensitive and whitespace-trimmed.
 *
 * Errors from the auth API are THROWN (never reported as "user not found") so callers cannot
 * mistake an outage for a missing account (e.g. allowing a duplicate signup).
 */
import type { User } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const AUTH_USER_LOOKUP_RPC = 'find_auth_user_id_by_email';
export const LIST_USERS_PER_PAGE = 1000;
/** Hard cap: 200 pages × 1000 = 200k users. Beyond this the RPC fast path must be deployed. */
export const LIST_USERS_MAX_PAGES = 200;

/** Postgres "undefined_function" and PostgREST "function not in schema cache". */
const RPC_MISSING_CODES = new Set(['42883', 'PGRST202']);
/** After the RPC is found missing, don't re-probe on every request for this long. */
const RPC_MISSING_RECHECK_MS = 5 * 60_000;

let rpcMissingUntil = 0;

export class AuthUserLookupError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'AuthUserLookupError';
  }
}

/** Test hook: forget the cached "RPC is missing" state. */
export function __resetFindUserByEmailCache(): void {
  rpcMissingUntil = 0;
}

function normalizeEmail(email: string): string {
  return String(email ?? '').trim().toLowerCase();
}

async function lookupViaRpc(emailNorm: string): Promise<{ handled: boolean; user: User | null }> {
  const admin = supabaseAdmin as any;
  if (typeof admin?.rpc !== 'function' || Date.now() < rpcMissingUntil) {
    return { handled: false, user: null };
  }

  try {
    const { data, error } = await admin.rpc(AUTH_USER_LOOKUP_RPC, { p_email: emailNorm });
    if (error) {
      if (RPC_MISSING_CODES.has(String(error.code))) {
        rpcMissingUntil = Date.now() + RPC_MISSING_RECHECK_MS;
      } else {
        logger.warn('findUserByEmail: RPC failed, falling back to paged scan', {
          code: error.code,
          message: error.message,
        });
      }
      return { handled: false, user: null };
    }

    // RPC authoritative "no such user"
    if (!data) return { handled: true, user: null };

    const userId = typeof data === 'string' ? data : String(data);
    const { data: got, error: getErr } = await admin.auth.admin.getUserById(userId);
    if (getErr || !got?.user) {
      logger.warn('findUserByEmail: getUserById failed after RPC hit, falling back to paged scan', {
        message: getErr?.message,
      });
      return { handled: false, user: null };
    }
    // Defensive: never return a user whose email doesn't match the request.
    if (normalizeEmail(got.user.email ?? '') !== emailNorm) {
      return { handled: false, user: null };
    }
    return { handled: true, user: got.user as User };
  } catch (err) {
    logger.warn('findUserByEmail: RPC threw, falling back to paged scan', {
      message: err instanceof Error ? err.message : String(err),
    });
    return { handled: false, user: null };
  }
}

async function lookupViaPagedScan(emailNorm: string): Promise<User | null> {
  for (let page = 1, scanned = 0; scanned < LIST_USERS_MAX_PAGES; scanned++) {
    const res = await supabaseAdmin.auth.admin.listUsers({ page, perPage: LIST_USERS_PER_PAGE });
    if (res?.error) {
      throw new AuthUserLookupError(`listUsers failed on page ${page}: ${res.error.message}`, res.error);
    }

    const users: User[] = (res?.data?.users as User[] | undefined) ?? [];
    const match = users.find((u) => normalizeEmail(u.email ?? '') === emailNorm);
    if (match) return match;

    if (users.length === 0) return null;

    // Prefer the server's own pagination hints when present, else fall back to "short page = last".
    const nextPage = (res?.data as { nextPage?: number | null } | undefined)?.nextPage;
    if (nextPage === null) return null;
    if (typeof nextPage === 'number' && nextPage > page) {
      page = nextPage;
      continue;
    }
    if (typeof nextPage === 'number' || users.length < LIST_USERS_PER_PAGE) return null;
    page += 1;
  }

  logger.error('findUserByEmail: page cap reached without conclusive result', {
    maxPages: LIST_USERS_MAX_PAGES,
  });
  throw new AuthUserLookupError(
    `User lookup exceeded ${LIST_USERS_MAX_PAGES} pages; deploy ${AUTH_USER_LOOKUP_RPC} RPC migration`
  );
}

/**
 * Find a Supabase auth user by email (case-insensitive). Returns `null` when no such user
 * exists; throws {@link AuthUserLookupError} when the lookup could not be completed.
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  const emailNorm = normalizeEmail(email);
  if (!emailNorm) return null;

  const viaRpc = await lookupViaRpc(emailNorm);
  if (viaRpc.handled) return viaRpc.user;

  return lookupViaPagedScan(emailNorm);
}
