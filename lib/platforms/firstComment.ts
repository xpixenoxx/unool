import { fetchWithRetry } from '@/lib/utils/retry';
import { logger } from '@/lib/logger';

/**
 * Posts a first comment on a published Instagram post.
 *
 * Called by the QStash first-comment handler 90 seconds after publish.
 * Instagram's algorithm treats the first comment (especially with hashtags
 * or a CTA) differently from the caption — keeps the caption clean while
 * boosting discoverability.
 */
export async function postFirstComment(
  accessToken: string,
  platformPostId: string,
  commentText: string,
  platform: string
): Promise<void> {
  if (platform !== 'instagram') {
    // Other platforms can be added later
    logger.debug('First comment not supported for platform', { platform });
    return;
  }

  if (!commentText || !commentText.trim()) {
    logger.debug('Empty first comment text — skipping');
    return;
  }

  if (!platformPostId) {
    logger.warn('Missing platformPostId for first comment');
    return;
  }

  const params = new URLSearchParams({
    message: commentText,
    access_token: accessToken,
  });

  const response = await fetchWithRetry(
    `https://graph.instagram.com/v20.0/${platformPostId}/comments`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`First comment failed (${response.status}): ${error}`);
  }

  const data = await response.json();
  logger.info('First comment posted successfully', {
    platformPostId,
    commentId: data.id,
    platform,
  });
}
