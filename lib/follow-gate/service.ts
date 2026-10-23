// ============================================================
// Follow-Gate Service — lib/follow-gate/service.ts
// All DB + business logic. No HTTP here.
// ============================================================
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import type {
  FollowGate,
  FollowGateSession,
  CreateGateInput,
  CheckFollowResult,
} from './types';

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

// ── Helpers ────────────────────────────────────────────────────────────────────

function rowToGate(row: Record<string, unknown>): FollowGate {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    title: row.title as string,
    description: (row.description as string) ?? null,
    igUsername: row.ig_username as string,
    igUserId: row.ig_user_id as string,
    unlockedContent: row.unlocked_content as FollowGate['unlockedContent'],
    ctaText: (row.cta_text as string) ?? 'Follow to unlock',
    thumbnailUrl: (row.thumbnail_url as string) ?? null,
    isActive: row.is_active as boolean,
    viewCount: (row.view_count as number) ?? 0,
    unlockCount: (row.unlock_count as number) ?? 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToSession(row: Record<string, unknown>): FollowGateSession {
  return {
    id: row.id as string,
    gateId: row.gate_id as string,
    workspaceId: row.workspace_id as string,
    visitorIgUserId: (row.visitor_ig_user_id as string) ?? null,
    visitorIgUsername: (row.visitor_ig_username as string) ?? null,
    followVerified: row.follow_verified as boolean,
    verifiedAt: (row.verified_at as string) ?? null,
    verificationMethod: (row.verification_method as FollowGateSession['verificationMethod']) ?? null,
    sessionToken: row.session_token as string,
    expiresAt: row.expires_at as string,
    createdAt: row.created_at as string,
  };
}

function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

// ── Gate CRUD ──────────────────────────────────────────────────────────────────

export async function createGate(input: CreateGateInput): Promise<FollowGate> {
  const { data, error } = await supabase
    .from('follow_gates')
    .insert({
      workspace_id: input.workspaceId,
      title: input.title,
      description: input.description ?? null,
      ig_username: input.igUsername,
      ig_user_id: input.igUserId,
      unlocked_content: input.unlockedContent,
      cta_text: input.ctaText ?? 'Follow to unlock',
      thumbnail_url: input.thumbnailUrl ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`createGate: ${error.message}`);
  return rowToGate(data as Record<string, unknown>);
}

export async function getGate(gateId: string): Promise<FollowGate | null> {
  const { data, error } = await supabase
    .from('follow_gates')
    .select('*')
    .eq('id', gateId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`getGate: ${error.message}`);
  }
  return rowToGate(data as Record<string, unknown>);
}

export async function listGates(workspaceId: string): Promise<FollowGate[]> {
  const { data, error } = await supabase
    .from('follow_gates')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`listGates: ${error.message}`);
  return (data as Record<string, unknown>[]).map(rowToGate);
}

export async function updateGate(
  gateId: string,
  workspaceId: string,
  updates: Partial<Omit<CreateGateInput, 'workspaceId'>>
): Promise<FollowGate> {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.title !== undefined) patch.title = updates.title;
  if (updates.description !== undefined) patch.description = updates.description;
  if (updates.igUsername !== undefined) patch.ig_username = updates.igUsername;
  if (updates.igUserId !== undefined) patch.ig_user_id = updates.igUserId;
  if (updates.unlockedContent !== undefined) patch.unlocked_content = updates.unlockedContent;
  if (updates.ctaText !== undefined) patch.cta_text = updates.ctaText;
  if (updates.thumbnailUrl !== undefined) patch.thumbnail_url = updates.thumbnailUrl;

  const { data, error } = await supabase
    .from('follow_gates')
    .update(patch)
    .eq('id', gateId)
    .eq('workspace_id', workspaceId)
    .select()
    .single();

  if (error) throw new Error(`updateGate: ${error.message}`);
  return rowToGate(data as Record<string, unknown>);
}

export async function toggleGate(gateId: string, workspaceId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('follow_gates')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', gateId)
    .eq('workspace_id', workspaceId);

  if (error) throw new Error(`toggleGate: ${error.message}`);
}

export async function deleteGate(gateId: string, workspaceId: string): Promise<void> {
  const { error } = await supabase
    .from('follow_gates')
    .delete()
    .eq('id', gateId)
    .eq('workspace_id', workspaceId);

  if (error) throw new Error(`deleteGate: ${error.message}`);
}

// ── Session Management ─────────────────────────────────────────────────────────

export async function createSession(
  gateId: string,
  workspaceId: string
): Promise<FollowGateSession> {
  const sessionToken = generateSessionToken();

  const { data, error } = await supabase
    .from('follow_gate_sessions')
    .insert({
      gate_id: gateId,
      workspace_id: workspaceId,
      session_token: sessionToken,
      follow_verified: false,
    })
    .select()
    .single();

  if (error) throw new Error(`createSession: ${error.message}`);

  // Best-effort view count increment (non-blocking)
  // Read current value then write incremented value
  void (async () => {
    try {
      const { data: gateRow } = await supabase
        .from('follow_gates')
        .select('view_count')
        .eq('id', gateId)
        .single();
      if (gateRow) {
        await supabase
          .from('follow_gates')
          .update({ view_count: ((gateRow as Record<string, unknown>).view_count as number ?? 0) + 1 })
          .eq('id', gateId);
      }
    } catch {
      // non-blocking — ignore
    }
  })();

  return rowToSession(data as Record<string, unknown>);
}

export async function getSession(sessionToken: string): Promise<FollowGateSession | null> {
  const { data, error } = await supabase
    .from('follow_gate_sessions')
    .select('*')
    .eq('session_token', sessionToken)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`getSession: ${error.message}`);
  }
  return rowToSession(data as Record<string, unknown>);
}

export async function markSessionVerified(
  sessionToken: string,
  visitorIgUserId: string,
  visitorIgUsername: string,
  method: 'webhook' | 'polling' | 'manual'
): Promise<void> {
  const now = new Date().toISOString();

  const { data: sessionRow, error: fetchErr } = await supabase
    .from('follow_gate_sessions')
    .select('gate_id')
    .eq('session_token', sessionToken)
    .single();

  if (fetchErr) throw new Error(`markSessionVerified fetch: ${fetchErr.message}`);

  const { error: updateErr } = await supabase
    .from('follow_gate_sessions')
    .update({
      follow_verified: true,
      verified_at: now,
      verification_method: method,
      visitor_ig_user_id: visitorIgUserId,
      visitor_ig_username: visitorIgUsername,
    })
    .eq('session_token', sessionToken);

  if (updateErr) throw new Error(`markSessionVerified update: ${updateErr.message}`);

  // Best-effort unlock count increment (non-blocking)
  const gateId = (sessionRow as Record<string, unknown>).gate_id as string;
  void (async () => {
    try {
      const { data: gateRow } = await supabase
        .from('follow_gates')
        .select('unlock_count')
        .eq('id', gateId)
        .single();
      if (gateRow) {
        await supabase
          .from('follow_gates')
          .update({ unlock_count: ((gateRow as Record<string, unknown>).unlock_count as number ?? 0) + 1 })
          .eq('id', gateId);
      }
    } catch {
      // non-blocking — ignore
    }
  })();
}

// ── Instagram Follow Check via Graph API ───────────────────────────────────────

/**
 * Check if visitorIgUserId follows the gate's creatorIgUserId.
 * Uses the IG Graph API with the creator's access token (Long-lived token from platform_connections).
 *
 * Meta limitation: The IG Basic Display API does NOT expose follower lists.
 * The only reliable way to check follows is:
 *   1. The creator's Business/Creator account via Graph API (followers endpoint)
 *   2. Webhook follow events (when the user follows, Meta sends a webhook)
 *
 * This function uses approach #1: check the creator's followers list.
 * Rate limit: 200 calls per hour per token.
 */
export async function checkFollowViaApi(
  creatorIgUserId: string,
  visitorIgUserId: string,
  creatorAccessToken: string
): Promise<CheckFollowResult> {
  const checkedAt = new Date().toISOString();

  try {
    // Fetch followers of the creator's account
    // This requires the creator to have a professional IG account with instagram_manage_insights permission
    const res = await fetch(
      `https://graph.instagram.com/v20.0/${creatorIgUserId}/followers?fields=id&limit=50&access_token=${creatorAccessToken}`
    );

    if (!res.ok) {
      const errorBody = await res.text();
      logger.warn('IG follower check API error', { status: res.status, body: errorBody });
      return { isFollowing: false, source: 'api', checkedAt };
    }

    const json = await res.json() as { data?: Array<{ id: string }>; paging?: { next?: string } };
    const followers = json.data ?? [];

    // Check immediate result (up to 50 recent followers)
    const found = followers.some((f) => f.id === visitorIgUserId);
    if (found) {
      return { isFollowing: true, source: 'api', checkedAt };
    }

    // Paginate up to 3 pages (150 followers) to handle recently followed
    let nextCursor = json.paging?.next;
    let page = 1;
    while (nextCursor && page < 3) {
      const pageRes = await fetch(nextCursor);
      if (!pageRes.ok) break;
      const pageJson = await pageRes.json() as { data?: Array<{ id: string }>; paging?: { next?: string } };
      const pageFollowers = pageJson.data ?? [];
      if (pageFollowers.some((f) => f.id === visitorIgUserId)) {
        return { isFollowing: true, source: 'api', checkedAt };
      }
      nextCursor = pageJson.paging?.next;
      page++;
    }

    return { isFollowing: false, source: 'api', checkedAt };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('checkFollowViaApi exception', { error });
    return { isFollowing: false, source: 'api', checkedAt };
  }
}

/**
 * Get the creator's access token from platform_connections.
 */
export async function getCreatorAccessToken(
  workspaceId: string,
  igUserId: string
): Promise<string | null> {
  const { decryptToken } = await import('@/lib/crypto/encryption');

  const { data, error } = await supabase
    .from('platform_connections')
    .select('access_token_encrypted')
    .eq('workspace_id', workspaceId)
    .eq('platform', 'instagram')
    .eq('platform_user_id', igUserId)
    .eq('status', 'connected')
    .single();

  if (error || !data) return null;

  try {
    return await decryptToken((data as Record<string, unknown>).access_token_encrypted as string);
  } catch {
    return null;
  }
}

// ── Webhook-based verification ─────────────────────────────────────────────────

/**
 * Called by the Instagram webhook when a "follow" change event arrives.
 * Looks up any pending sessions for this workspace+gate and marks them verified.
 */
export async function handleFollowWebhookEvent(
  creatorIgUserId: string,
  followerIgUserId: string,
  followerIgUsername: string
): Promise<void> {
  // Find all active (unverified, unexpired) sessions for gates owned by this creator
  const { data: gates, error: gatesErr } = await supabase
    .from('follow_gates')
    .select('id, workspace_id')
    .eq('ig_user_id', creatorIgUserId)
    .eq('is_active', true);

  if (gatesErr || !gates || gates.length === 0) return;

  for (const gate of gates as Array<{ id: string; workspace_id: string }>) {
    const { data: sessions } = await supabase
      .from('follow_gate_sessions')
      .select('session_token')
      .eq('gate_id', gate.id)
      .eq('follow_verified', false)
      .eq('visitor_ig_user_id', followerIgUserId)
      .gt('expires_at', new Date().toISOString());

    if (!sessions || sessions.length === 0) continue;

    for (const session of sessions as Array<{ session_token: string }>) {
      await markSessionVerified(session.session_token, followerIgUserId, followerIgUsername, 'webhook').catch(
        (err: unknown) => {
          logger.error('Failed to mark follow gate session verified via webhook', {
            error: err instanceof Error ? err : new Error(String(err)),
          });
        }
      );
    }

    logger.info('Follow gate session(s) verified via webhook', {
      creatorIgUserId,
      followerIgUserId,
      gateId: gate.id,
    });
  }
}
