export type MappedConnectionStatus = 'connected' | 'not_connected' | 'expired';

export interface PlatformConnectionRow {
  id?: string;
  platform: string;
  platform_user_id?: string | null;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  status: string;
  expires_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  refresh_token_encrypted?: string | null;
  refresh_token?: string | null;
  access_token_encrypted?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface ConnectedAccountSummary {
  id: string;
  platform: string;
  platformUserId?: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  status: MappedConnectionStatus;
  connectedAt?: string;
  expiresAt?: string;
}

export function resolveConnectionRowStatus(
  c: PlatformConnectionRow,
  now: Date = new Date()
): MappedConnectionStatus {
  const hasRefreshToken = Boolean(c.refresh_token_encrypted || c.refresh_token);
  const expiresAt = c.expires_at ? new Date(c.expires_at) : null;
  const isPastExpiry = expiresAt ? expiresAt <= now : false;

  if (c.status === 'revoked') {
    return 'not_connected';
  }
  if (c.status === 'error') {
    return 'expired';
  }
  if (isPastExpiry && !hasRefreshToken) {
    return 'expired';
  }
  if (c.status === 'expired' && !hasRefreshToken) {
    return 'expired';
  }
  if (c.platform === 'kick') {
    return c.status === 'connected' || Boolean(c.access_token_encrypted)
      ? 'connected'
      : 'not_connected';
  }
  if (c.status === 'connected' || hasRefreshToken) {
    return 'connected';
  }
  return 'not_connected';
}

const STATUS_PRIORITY: Record<MappedConnectionStatus, number> = {
  connected: 3,
  expired: 2,
  not_connected: 1,
};

/**
 * Normalizes database rows from `platform_connections` into dashboard-compatible connection states.
 * Crucially handles 'revoked' (voluntarily disconnected) rows so they are mapped to 'not_connected'
 * rather than defaulting to 'connected'.
 * Also accounts for refresh tokens (e.g. YouTube tokens that expire hourly but remain connected via refresh token),
 * Kick stream setups, and multiple accounts per platform (connected > expired > not_connected).
 */
export function mapConnectionRows(
  rows: PlatformConnectionRow[] | null | undefined
): Record<string, { status: MappedConnectionStatus }> {
  const connections: Record<string, { status: MappedConnectionStatus }> = {};
  if (!rows || rows.length === 0) return connections;

  const sorted = [...rows].sort((a, b) => {
    const timeA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
    const timeB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
    return timeB - timeA;
  });

  const now = new Date();
  const seenAccountKeys = new Set<string>();

  for (const c of sorted) {
    const accountKey = `${c.platform}:${c.platform_user_id || c.id || ''}`;
    if (seenAccountKeys.has(accountKey)) {
      continue;
    }
    seenAccountKeys.add(accountKey);

    const resolved = resolveConnectionRowStatus(c, now);
    const existing = connections[c.platform];
    if (!existing || STATUS_PRIORITY[resolved] > STATUS_PRIORITY[existing.status]) {
      connections[c.platform] = { status: resolved };
    }
  }

  return connections;
}

export function mapConnectionAccounts(
  rows: PlatformConnectionRow[] | null | undefined
): Record<string, ConnectedAccountSummary[]> {
  const byPlatform: Record<string, ConnectedAccountSummary[]> = {};
  if (!rows || rows.length === 0) return byPlatform;

  const now = new Date();
  for (const row of rows) {
    const status = resolveConnectionRowStatus(row, now);
    if (status === 'not_connected') continue;
    const list = byPlatform[row.platform] ?? [];
    list.push({
      id: row.id || `${row.platform}:${row.platform_user_id || row.username || list.length}`,
      platform: row.platform,
      platformUserId: row.platform_user_id || undefined,
      username: row.username || undefined,
      displayName: row.display_name || undefined,
      avatarUrl: row.avatar_url || undefined,
      status,
      connectedAt: row.created_at || undefined,
      expiresAt: row.expires_at || undefined,
    });
    byPlatform[row.platform] = list;
  }

  return byPlatform;
}

