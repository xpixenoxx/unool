import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDeletePostThreads = vi.fn();
const mockDeletePostFacebook = vi.fn();
const mockDeletePostInstagram = vi.fn();
const mockDecryptToken = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/crypto/encryption', () => ({
  decryptToken: (...args: unknown[]) => mockDecryptToken(...args),
}));

vi.mock('@/lib/platforms', () => ({
  getPlatformAdapter: (platform: string) => {
    if (platform === 'threads') return { deletePost: mockDeletePostThreads };
    if (platform === 'facebook') return { deletePost: mockDeletePostFacebook };
    if (platform === 'instagram') return { deletePost: mockDeletePostInstagram };
    return null;
  },
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import { deleteRemotePlatformPosts } from '../deleteRemotePlatformPosts';
import { supportsRemotePostDeletion } from '@/lib/platforms/deletionSupport';

describe('deleteRemotePlatformPosts & supportsRemotePostDeletion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDecryptToken.mockResolvedValue('decrypted_token');
  });

  it('correctly classifies remote delete support across platforms', () => {
    expect(supportsRemotePostDeletion('threads')).toBe(true);
    expect(supportsRemotePostDeletion('facebook')).toBe(true);
    expect(supportsRemotePostDeletion('instagram')).toBe(false);
    expect(supportsRemotePostDeletion('manual')).toBe(false);
  });

  it('deletes Threads and Facebook live posts and skips Instagram as unsupported', async () => {
    mockDeletePostThreads.mockResolvedValue(undefined);
    mockDeletePostFacebook.mockResolvedValue(undefined);

    mockFrom.mockImplementation((table: string) => {
      if (table === 'platform_posts') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              not: vi.fn().mockResolvedValue({
                data: [
                  { id: 'pp-th', post_variant_id: 'v-th', platform_connection_id: 'c-th', platform_post_id: 'th_123' },
                  { id: 'pp-fb', post_variant_id: 'v-fb', platform_connection_id: 'c-fb', platform_post_id: 'fb_456' },
                  { id: 'pp-ig', post_variant_id: 'v-ig', platform_connection_id: 'c-ig', platform_post_id: 'ig_789' },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'platform_connections') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  { id: 'c-th', platform: 'threads', access_token_encrypted: 'enc_th', status: 'connected' },
                  { id: 'c-fb', platform: 'facebook', access_token_encrypted: 'enc_fb', status: 'connected' },
                  { id: 'c-ig', platform: 'instagram', access_token_encrypted: 'enc_ig', status: 'connected' },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });

    const result = await deleteRemotePlatformPosts('ws-1', [
      { id: 'v-th', platform: 'threads', platform_connection_id: 'c-th' },
      { id: 'v-fb', platform: 'facebook', platform_connection_id: 'c-fb' },
      { id: 'v-ig', platform: 'instagram', platform_connection_id: 'c-ig' },
    ]);

    expect(mockDeletePostThreads).toHaveBeenCalledWith('decrypted_token', 'th_123');
    expect(mockDeletePostFacebook).toHaveBeenCalledWith('decrypted_token', 'fb_456');
    expect(mockDeletePostInstagram).not.toHaveBeenCalled();

    expect(result.deleted).toHaveLength(2);
    expect(result.deleted.map((d) => d.platform)).toEqual(['threads', 'facebook']);
    expect(result.unsupported).toEqual([
      {
        variantId: 'v-ig',
        platform: 'instagram',
        reason: 'Instagram API does not support deleting published posts.',
      },
    ]);
    expect(result.failed).toHaveLength(0);
  });

  it('captures adapter failure in failed[] without throwing', async () => {
    mockDeletePostThreads.mockRejectedValue(new Error('Missing threads_delete permission'));

    mockFrom.mockImplementation((table: string) => {
      if (table === 'platform_posts') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              not: vi.fn().mockResolvedValue({
                data: [
                  { id: 'pp-th', post_variant_id: 'v-th', platform_connection_id: 'c-th', platform_post_id: 'th_999' },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'platform_connections') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  { id: 'c-th', platform: 'threads', access_token_encrypted: 'enc_th', status: 'connected' },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });

    const result = await deleteRemotePlatformPosts('ws-1', [
      { id: 'v-th', platform: 'threads', platform_connection_id: 'c-th' },
    ]);

    expect(result.deleted).toHaveLength(0);
    expect(result.failed).toEqual([
      {
        variantId: 'v-th',
        platform: 'threads',
        platformPostId: 'th_999',
        error: 'Missing threads_delete permission',
      },
    ]);
  });
});
