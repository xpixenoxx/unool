import { describe, it, expect } from 'vitest';
import {
  ALL_EXISTING_PLATFORMS,
  getSortedBroadcastPlatforms,
} from '@/app/dashboard/DashboardClient';

describe('Broadcast Network Overview - Platform Sorting and Display', () => {
  it('contains exactly 27 existing platforms in the system', () => {
    expect(ALL_EXISTING_PLATFORMS).toHaveLength(27);

    // Verify key platforms exist
    const ids = ALL_EXISTING_PLATFORMS.map((p) => p.id);
    expect(ids).toContain('linkedin');
    expect(ids).toContain('threads');
    expect(ids).toContain('instagram');
    expect(ids).toContain('bluesky');
    expect(ids).toContain('youtube');
    expect(ids).toContain('x');
    expect(ids).toContain('facebook');
    expect(ids).toContain('discord');
    expect(ids).toContain('manual');
  });

  it('shows exactly 8 platforms when 0 platforms are connected', () => {
    const emptyConnections = {};
    const result = getSortedBroadcastPlatforms(emptyConnections);

    expect(result).toHaveLength(8);
    expect(result.every((p) => p.connected === false)).toBe(true);
    // The top 8 default platforms are displayed
    expect(result.map((p) => p.id)).toEqual([
      'linkedin',
      'threads',
      'instagram',
      'bluesky',
      'mastodon',
      'slack',
      'telegram',
      'dribbble',
    ]);
  });

  it('sorts connected platforms first and fills remainder up to exactly 8 platforms (user scenario: 7 connected)', () => {
    const connections = {
      linkedin: { status: 'connected' },
      threads: { status: 'connected' },
      instagram: { status: 'connected' },
      bluesky: { status: 'connected' },
      mastodon: { status: 'connected' },
      slack: { status: 'connected' },
      telegram: { status: 'connected' },
      dribbble: { status: 'not_connected' },
      youtube: { status: 'not_connected' },
    };

    const result = getSortedBroadcastPlatforms(connections);

    expect(result).toHaveLength(8);

    // The first 7 must be connected
    expect(result.slice(0, 7).every((p) => p.connected === true)).toBe(true);
    expect(result.slice(0, 7).map((p) => p.id)).toEqual([
      'linkedin',
      'threads',
      'instagram',
      'bluesky',
      'mastodon',
      'slack',
      'telegram',
    ]);

    // The 8th must be not connected (dribbble)
    expect(result[7].id).toBe('dribbble');
    expect(result[7].connected).toBe(false);
  });

  it('promotes any connected platform from the 27 platforms into the top 8 (e.g. YouTube connected)', () => {
    const connections = {
      youtube: { status: 'connected' },
      discord: { status: 'connected' },
    };

    const result = getSortedBroadcastPlatforms(connections);

    expect(result).toHaveLength(8);

    // First two are connected: youtube and discord
    expect(result[0].id).toBe('youtube');
    expect(result[0].connected).toBe(true);
    expect(result[1].id).toBe('discord');
    expect(result[1].connected).toBe(true);

    // Next 6 are not connected, preserving base order
    expect(result.slice(2)).toHaveLength(6);
    expect(result.slice(2).every((p) => p.connected === false)).toBe(true);
    expect(result[2].id).toBe('linkedin');
    expect(result[3].id).toBe('threads');
    expect(result[4].id).toBe('instagram');
    expect(result[5].id).toBe('bluesky');
    expect(result[6].id).toBe('mastodon');
    expect(result[7].id).toBe('slack');
  });

  it('always caps at exactly 8 platforms even if more than 8 platforms are connected', () => {
    const connections: Record<string, { status: string }> = {};
    // Connect 12 platforms
    const twelveIds = [
      'linkedin',
      'threads',
      'instagram',
      'bluesky',
      'mastodon',
      'slack',
      'telegram',
      'dribbble',
      'x',
      'facebook',
      'youtube',
      'pinterest',
    ];
    for (const id of twelveIds) {
      connections[id] = { status: 'connected' };
    }

    const result = getSortedBroadcastPlatforms(connections);

    expect(result).toHaveLength(8);
    expect(result.every((p) => p.connected === true)).toBe(true);
    expect(result.map((p) => p.id)).toEqual(twelveIds.slice(0, 8));
  });

  it('dynamically adapts when a platform is disconnected', () => {
    const connections: Record<string, { status: string }> = {
      linkedin: { status: 'connected' },
      threads: { status: 'connected' },
      instagram: { status: 'connected' },
    };

    let result = getSortedBroadcastPlatforms(connections);
    expect(result).toHaveLength(8);
    expect(result[0].id).toBe('linkedin');
    expect(result[0].connected).toBe(true);

    // Now disconnect LinkedIn
    connections.linkedin = { status: 'not_connected' };
    result = getSortedBroadcastPlatforms(connections);

    expect(result).toHaveLength(8);
    // Threads and Instagram are now the only connected ones
    expect(result[0].id).toBe('threads');
    expect(result[0].connected).toBe(true);
    expect(result[1].id).toBe('instagram');
    expect(result[1].connected).toBe(true);

    // LinkedIn is now in the not-connected section
    expect(result[2].id).toBe('linkedin');
    expect(result[2].connected).toBe(false);
  });
});

