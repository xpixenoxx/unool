export type MappedConnectionStatus = 'connected' | 'not_connected' | 'expired';

export interface PlatformConnectionRow {
  platform: string;
  status: string;
  expires_at?: string | null;
  updated_at?: string | null;
}

/**
 * Normalizes database rows from `platform_connections` into dashboard-compatible connection states.
 * Crucially handles 'revoked' (voluntarily disconnected) rows so they are mapped to 'not_connected'
 * rather than defaulting to 'connected'.
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

    if (c.status === 'revoked') {
      connections[c.platform] = { status: 'not_connected' };
    } else if (
      c.status === 'expired' ||
      c.status === 'error' ||
      (c.expires_at && new Date(c.expires_at) <= now)
    ) {
      connections[c.platform] = { status: 'expired' };
    } else if (c.status === 'connected') {
      connections[c.platform] = { status: 'connected' };
    } else {
      connections[c.platform] = { status: 'not_connected' };
    }
  }

  return connections;
}

