export type MappedConnectionStatus = 'connected' | 'not_connected' | 'expired';

export interface PlatformConnectionRow {
  platform: string;
  status: string;
  expires_at?: string | null;
  updated_at?: string | null;
  refresh_token_encrypted?: string | null;
  refresh_token?: string | null;
  access_token_encrypted?: string | null;
}

/**
 * Normalizes database rows from `platform_connections` into dashboard-compatible connection states.
 * Crucially handles 'revoked' (voluntarily disconnected) rows so they are mapped to 'not_connected'
 * rather than defaulting to 'connected'.
 * Also accounts for refresh tokens (e.g. YouTube tokens that expire hourly but remain connected via refresh token)
 * and Kick stream setups.
 */
export function mapConnectionRows(
  rows: PlatformConnectionRow[] | null | undefined
): Record<string, { status: MappedConnectionStatus }> {
  const connections: Record<string, { status: MappedConnectionStatus }> = {};
  if (!rows || rows.length === 0) return connections;

  // If there are multiple rows for the same platform, process the newest updated_at first
  const sorted = [...rows].sort((a, b) => {
    const timeA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
    const timeB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
    return timeB - timeA;
  });

  const now = new Date();

  for (const c of sorted) {
    if (connections[c.platform]) continue;

    const hasRefreshToken = Boolean(c.refresh_token_encrypted || c.refresh_token);
    const expiresAt = c.expires_at ? new Date(c.expires_at) : null;
    const isPastExpiry = expiresAt ? expiresAt <= now : false;

    if (c.status === 'revoked') {
      connections[c.platform] = { status: 'not_connected' };
    } else if (c.status === 'error') {
      connections[c.platform] = { status: 'expired' };
    } else if (isPastExpiry && !hasRefreshToken) {
      connections[c.platform] = { status: 'expired' };
    } else if (c.status === 'expired' && !hasRefreshToken) {
      connections[c.platform] = { status: 'expired' };
    } else if (c.platform === 'kick') {
      connections[c.platform] = {
        status:
          c.status === 'connected' || Boolean(c.access_token_encrypted)
            ? 'connected'
            : 'not_connected',
      };
    } else if (c.status === 'connected' || hasRefreshToken) {
      connections[c.platform] = { status: 'connected' };
    } else {
      connections[c.platform] = { status: 'not_connected' };
    }
  }

  return connections;
}

