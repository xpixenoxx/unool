import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPublishJSON, mockDeleteMessage } = vi.hoisted(() => ({
  mockPublishJSON: vi.fn(),
  mockDeleteMessage: vi.fn(),
}));

vi.mock('@upstash/qstash', () => ({
  Client: vi.fn().mockImplementation(() => ({
    publishJSON: mockPublishJSON,
    messages: {
      delete: mockDeleteMessage,
    },
  })),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/config/schema', () => ({
  config: {
    QSTASH_TOKEN: 'mock-token',
    NEXT_PUBLIC_APP_URL: 'https://app.unool.co',
  },
}));

import { queueService } from '../QueueService';

describe('QueueService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('enqueueScheduledPublishTask', () => {
    it('converts scheduledAt milliseconds to seconds for QStash notBefore header', async () => {
      mockPublishJSON.mockResolvedValue({ messageId: 'msg-scheduled-1' });

      // Target time 1 hour in the future
      const targetTimeMs = Date.now() + 3600_000;
      const scheduledAt = new Date(targetTimeMs);
      const expectedSeconds = Math.floor(targetTimeMs / 1000);

      const messageId = await queueService.enqueueScheduledPublishTask({
        postId: 'post-1',
        workspaceId: 'ws-1',
        scheduledAt,
      });

      expect(messageId).toBe('msg-scheduled-1');
      expect(mockPublishJSON).toHaveBeenCalledTimes(1);

      const publishCall = mockPublishJSON.mock.calls[0][0];
      expect(publishCall.url).toBe('https://app.unool.co/api/webhooks/qstash/publish');
      expect(publishCall.body).toEqual({
        postId: 'post-1',
        workspaceId: 'ws-1',
        variantId: null,
        autoFirstComment: null,
        isScheduled: true,
      });

      // Verify notBefore is in SECONDS (10 digits), not milliseconds (13 digits)
      expect(publishCall.notBefore).toBe(expectedSeconds);
      expect(String(publishCall.notBefore).length).toBe(10);

      // Verify 300s timeout header is present
      expect(publishCall.headers).toEqual({
        'Upstash-Timeout': '300s',
      });
      expect(publishCall.retries).toBe(3);
    });

    it('falls back to immediate publish if scheduled time is in the past', async () => {
      mockPublishJSON.mockResolvedValue({ messageId: 'msg-immediate-1' });

      const pastDate = new Date(Date.now() - 10_000);

      const messageId = await queueService.enqueueScheduledPublishTask({
        postId: 'post-past',
        workspaceId: 'ws-1',
        scheduledAt: pastDate,
      });

      expect(messageId).toBe('msg-immediate-1');
      expect(mockPublishJSON).toHaveBeenCalledTimes(1);
      const publishCall = mockPublishJSON.mock.calls[0][0];
      expect(publishCall.body.isScheduled).toBe(false);
      expect(publishCall.notBefore).toBeUndefined();
    });

    it('rejects scheduling more than 1 year in the future', async () => {
      const farFutureDate = new Date(Date.now() + 400 * 24 * 60 * 60 * 1000);

      const messageId = await queueService.enqueueScheduledPublishTask({
        postId: 'post-too-far',
        workspaceId: 'ws-1',
        scheduledAt: farFutureDate,
      });

      expect(messageId).toBeNull();
      expect(mockPublishJSON).not.toHaveBeenCalled();
    });

    it('handles QStash API failure gracefully without throwing', async () => {
      mockPublishJSON.mockRejectedValue(new Error('QStash network error'));

      const scheduledAt = new Date(Date.now() + 60_000);
      const messageId = await queueService.enqueueScheduledPublishTask({
        postId: 'post-err',
        workspaceId: 'ws-1',
        scheduledAt,
      });

      expect(messageId).toBeNull();
    });
  });

  describe('cancelScheduledTask', () => {
    it('calls client.messages.delete with messageId', async () => {
      mockDeleteMessage.mockResolvedValue(true);

      const success = await queueService.cancelScheduledTask('msg-to-delete');

      expect(success).toBe(true);
      expect(mockDeleteMessage).toHaveBeenCalledWith('msg-to-delete');
    });

    it('returns false gracefully when QStash delete fails', async () => {
      mockDeleteMessage.mockRejectedValue(new Error('Not found'));

      const success = await queueService.cancelScheduledTask('msg-missing');

      expect(success).toBe(false);
    });
  });
});
