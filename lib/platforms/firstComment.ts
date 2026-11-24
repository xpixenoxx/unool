import { fetchWithRetry } from '@/lib/utils/retry';
import { logger } from '@/lib/logger';
import { API_VERSIONS } from '@/lib/platforms/apiVersions';
import { threadsAdapter } from '@/lib/platforms/ThreadsAdapter';
import { xAdapter } from '@/lib/platforms/XAdapter';

export interface FirstCommentOptions {
  platformUserId?: string | null;
}

async function resolveLinkedInActorUrn(
  accessToken: string,
  platformUserId?: string | null
): Promise<string> {
  if (platformUserId && !platformUserId.includes('@')) {
    return platformUserId.startsWith('urn:li:')
      ? platformUserId
      : `urn:li:person:${platformUserId}`;
  }

  const profileRes = await fetchWithRetry('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!profileRes.ok) {
    const errText = await profileRes.text().catch(() => '');
    throw new Error(`Failed to resolve LinkedIn actor URN (${profileRes.status}): ${errText}`);
  }
  const profile = await profileRes.json();
  const sub = String(profile?.sub || '');
  if (!sub) {
    throw new Error('LinkedIn userinfo did not return sub for first comment');
  }
  return sub.startsWith('urn:li:') ? sub : `urn:li:person:${sub}`;
}

async function postLinkedInFirstComment(
  accessToken: string,
  platformPostId: string,
  commentText: string,
  platformUserId?: string | null
): Promise<string | undefined> {
  const actorUrn = await resolveLinkedInActorUrn(accessToken, platformUserId);
  const rawId = platformPostId.trim();
  const primaryUrn = rawId.startsWith('urn:') ? rawId : `urn:li:share:${rawId}`;
  const candidateUrns = [primaryUrn];
  if (!rawId.startsWith('urn:li:ugcPost:')) {
    const cleanId = rawId.replace(/^urn:li:[^:]+:/, '');
    candidateUrns.push(`urn:li:ugcPost:${cleanId}`);
  }

  let lastError = '';
  for (const objectUrn of candidateUrns) {
    const response = await fetchWithRetry(
      `https://api.linkedin.com/rest/socialActions/${encodeURIComponent(objectUrn)}/comments`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': API_VERSIONS.linkedin,
        },
        body: JSON.stringify({
          actor: actorUrn,
          object: objectUrn,
          message: { text: commentText },
        }),
      }
    );

    if (response.ok) {
      const restliId = response.headers.get('x-restli-id') || undefined;
      if (restliId) return restliId;
      const body = await response.json().catch(() => ({}));
      return body?.id || body?.$URN || undefined;
    }

    lastError = `(${response.status}) ${await response.text().catch(() => '')}`;
    if (response.status !== 404) {
      break;
    }
  }

  throw new Error(`LinkedIn first comment failed ${lastError}`);
}

/**
 * Posts an automated first comment / reply on a published social post.
 *
 * Supports Instagram, X (Twitter), LinkedIn, and Threads.
 * Called by the QStash first-comment handler 90 seconds after publish (or immediately
 * as a fallback when QStash is not configured).
 */
export async function postFirstComment(
  accessToken: string,
  platformPostId: string,
  commentText: string,
  platform: string,
  options?: FirstCommentOptions
): Promise<void> {
  const normalizedPlatform = (platform || '').trim().toLowerCase();
  const trimmedText = (commentText || '').trim();

  if (!trimmedText) {
    logger.debug('Empty first comment text — skipping');
    return;
  }

  if (!platformPostId) {
    logger.warn('Missing platformPostId for first comment', { platform: normalizedPlatform });
    return;
  }

  if (normalizedPlatform === 'instagram') {
    const params = new URLSearchParams({
      message: trimmedText,
      access_token: accessToken,
    });

    const response = await fetchWithRetry(
      `https://graph.instagram.com/${API_VERSIONS.instagram}/${platformPostId}/comments`,
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
      platform: normalizedPlatform,
    });
    return;
  }

  if (normalizedPlatform === 'x' || normalizedPlatform === 'twitter') {
    const res = await xAdapter.postReply(accessToken, platformPostId, trimmedText);
    logger.info('First comment posted successfully', {
      platformPostId,
      commentId: res.id,
      platform: normalizedPlatform,
    });
    return;
  }

  if (normalizedPlatform === 'linkedin') {
    const commentId = await postLinkedInFirstComment(
      accessToken,
      platformPostId,
      trimmedText,
      options?.platformUserId
    );
    logger.info('First comment posted successfully', {
      platformPostId,
      commentId,
      platform: normalizedPlatform,
    });
    return;
  }

  if (normalizedPlatform === 'threads') {
    const res = await threadsAdapter.postReply(accessToken, platformPostId, trimmedText);
    logger.info('First comment posted successfully', {
      platformPostId,
      commentId: res.id,
      platform: normalizedPlatform,
    });
    return;
  }

  logger.debug('First comment not supported for platform', { platform: normalizedPlatform });
}
