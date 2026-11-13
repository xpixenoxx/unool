import { describe, it, expect } from 'vitest';
import { mapConnectionRows, mapConnectionAccounts } from '../connectionStatus';

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

  it('maps connection with past expires_at but valid refresh_token to connected (e.g. YouTube)', () => {
    const pastDate = new Date(Date.now() - 3600 * 1000).toISOString();
    const rows = [
      {
        platform: 'youtube',
        status: 'connected',
        expires_at: pastDate,
        refresh_token_encrypted: 'enc_refresh_token_xyz',
      },
    ];

    const result = mapConnectionRows(rows);
    expect(result.youtube).toEqual({ status: 'connected' });
  });

  it('maps Kick with stream configuration to connected', () => {
    const rows = [
      {
        platform: 'kick',
        status: 'not_connected',
        access_token_encrypted: 'enc_stream_payload',
      },
    ];

    const result = mapConnectionRows(rows);
    expect(result.kick).toEqual({ status: 'connected' });
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

  it('keeps platform connected when a second distinct account is revoked or expired', () => {
    const primaryConnected = {
      id: 'conn-ig-1',
      platform: 'instagram',
      platform_user_id: 'ig-user-1',
      username: 'brand_main',
      status: 'connected',
      expires_at: null,
      updated_at: '2026-10-01T10:00:00.000Z',
    };
    const secondaryRevoked = {
      id: 'conn-ig-2',
      platform: 'instagram',
      platform_user_id: 'ig-user-2',
      username: 'brand_alt',
      status: 'revoked',
      expires_at: null,
      updated_at: '2026-10-01T12:00:00.000Z',
    };

    const result = mapConnectionRows([primaryConnected, secondaryRevoked]);
    expect(result.instagram).toEqual({ status: 'connected' });
  });
});

describe('mapConnectionAccounts', () => {
  it('returns active and expired accounts per platform while omitting revoked rows', () => {
    const rows = [
      {
        id: 'conn-1',
        platform: 'instagram',
        platform_user_id: 'ig-1',
        username: 'main_brand',
        display_name: 'Main Brand',
        avatar_url: 'https://cdn.example.com/1.jpg',
        status: 'connected',
        expires_at: null,
        created_at: '2026-10-01T08:00:00.000Z',
      },
      {
        id: 'conn-2',
        platform: 'instagram',
        platform_user_id: 'ig-2',
        username: 'founder_ig',
        status: 'expired',
        expires_at: null,
      },
      {
        id: 'conn-3',
        platform: 'instagram',
        platform_user_id: 'ig-3',
        username: 'old_revoked',
        status: 'revoked',
        expires_at: null,
      },
    ];

    const grouped = mapConnectionAccounts(rows);
    expect(grouped.instagram).toHaveLength(2);
    expect(grouped.instagram[0]).toMatchObject({
      id: 'conn-1',
      platform: 'instagram',
      platformUserId: 'ig-1',
      username: 'main_brand',
      displayName: 'Main Brand',
      avatarUrl: 'https://cdn.example.com/1.jpg',
      status: 'connected',
    });
    expect(grouped.instagram[1]).toMatchObject({
      id: 'conn-2',
      username: 'founder_ig',
      status: 'expired',
    });
  });
});

