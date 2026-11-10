import { describe, it, expect } from 'vitest';
import { mapConnectionRows } from '../connectionStatus';

describe('mapConnectionRows', () => {
  it('returns empty record when input is empty or null', () => {
    expect(mapConnectionRows(null)).toEqual({});
    expect(mapConnectionRows([])).toEqual({});
  });

  it('maps revoked connection to not_connected', () => {
    const rows = [
      {
        platform: 'instagram',
        status: 'revoked',
        expires_at: null,
        updated_at: new Date().toISOString(),
      },
    ];

    const result = mapConnectionRows(rows);
    expect(result.instagram).toEqual({ status: 'not_connected' });
  });

  it('maps active connection to connected', () => {
    const futureDate = new Date(Date.now() + 86400 * 1000).toISOString();
    const rows = [
      {
        platform: 'linkedin',
        status: 'connected',
        expires_at: futureDate,
        updated_at: new Date().toISOString(),
      },
    ];

    const result = mapConnectionRows(rows);
    expect(result.linkedin).toEqual({ status: 'connected' });
  });

  it('maps expired status or past expires_at to expired', () => {
    const pastDate = new Date(Date.now() - 3600 * 1000).toISOString();
    const rows = [
      {
        platform: 'threads',
        status: 'expired',
        expires_at: null,
      },
      {
        platform: 'facebook',
        status: 'connected',
        expires_at: pastDate,
      },
      {
        platform: 'bluesky',
        status: 'error',
        expires_at: null,
      },
    ];

    const result = mapConnectionRows(rows);
    expect(result.threads).toEqual({ status: 'expired' });
    expect(result.facebook).toEqual({ status: 'expired' });
    expect(result.bluesky).toEqual({ status: 'expired' });
  });

  it('prioritizes the newest updated_at record when multiple rows exist', () => {
    const olderConnected = {
      platform: 'instagram',
      status: 'connected',
      expires_at: null,
      updated_at: '2026-10-01T10:00:00.000Z',
    };
    const newerRevoked = {
      platform: 'instagram',
      status: 'revoked',
      expires_at: null,
      updated_at: '2026-10-01T12:00:00.000Z',
    };

    const result = mapConnectionRows([olderConnected, newerRevoked]);
    expect(result.instagram).toEqual({ status: 'not_connected' });
  });
});

