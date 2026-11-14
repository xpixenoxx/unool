/**
 * Facebook Post & Video URL Canonicalization Utilities
 *
 * Resolves Facebook's Graph API post ID representations (composite `pageId_postId`,
 * numeric IDs, video IDs) into canonical, clickable URLs that redirect directly
 * to the specific post rather than the Facebook homepage.
 */

/**
 * Deterministically formats a Facebook post or video URL from platform identifiers.
 *
 * Facebook Graph API feed endpoints return post IDs in composite `{pageId}_{postId}` format
 * (e.g., `105432109876543_1234567890123456`). If linked as `facebook.com/{pageId}_{postId}`,
 * Facebook fails username resolution and redirects to the homepage. The canonical post URL is
 * `facebook.com/{pageId}/posts/{postId}`.
 */
export function formatFacebookPostUrl(
  postIdOrComposite?: string | null,
  pageId?: string | null,
  isVideo = false
): string {
  const cleanId = (postIdOrComposite || '').trim();
  const cleanPageId = (pageId || '').trim();

  if (!cleanId) {
    return 'https://www.facebook.com';
  }

  const subPath = isVideo ? 'videos' : 'posts';

  // 1. If pageId is provided and cleanId starts with `${pageId}_`
  if (cleanPageId && cleanId.startsWith(`${cleanPageId}_`)) {
    const actualPostId = cleanId.slice(cleanPageId.length + 1);
    if (actualPostId) {
      return `https://www.facebook.com/${cleanPageId}/${subPath}/${actualPostId}`;
    }
  }

  // 2. Standard Facebook Graph API composite ID: "{numericPageId}_{postId}"
  const compositeMatch = cleanId.match(/^(\d+)_([a-zA-Z0-9]+)$/);
  if (compositeMatch) {
    const extractedPageId = compositeMatch[1];
    const actualPostId = compositeMatch[2];
    return `https://www.facebook.com/${extractedPageId}/${subPath}/${actualPostId}`;
  }

  // 3. Fallback for composite IDs with arbitrary prefix (e.g. page_12345_67890)
  if (cleanId.includes('_')) {
    const lastUnderscore = cleanId.lastIndexOf('_');
    const extractedPageId = cleanPageId || cleanId.slice(0, lastUnderscore);
    const actualPostId = cleanId.slice(lastUnderscore + 1);
    if (extractedPageId && actualPostId) {
      return `https://www.facebook.com/${extractedPageId}/${subPath}/${actualPostId}`;
    }
  }

  // 4. Single ID with known pageId
  if (cleanPageId) {
    return `https://www.facebook.com/${cleanPageId}/${subPath}/${cleanId}`;
  }

  // 5. Single ID without known pageId
  if (isVideo) {
    return `https://www.facebook.com/watch/?v=${cleanId}`;
  }

  // 6. Generic Facebook post permalink
  return `https://www.facebook.com/posts/${cleanId}`;
}

/**
 * Normalizes any Facebook URL or fallback to ensure it navigates to the actual post
 * rather than redirecting to the Facebook home feed.
 *
 * Handles:
 * - Broken composite URLs: `https://facebook.com/{pageId}_{postId}` -> `https://www.facebook.com/{pageId}/posts/{postId}`
 * - Root Facebook fallbacks with a known post ID: `https://facebook.com` -> `https://www.facebook.com/{pageId}/posts/{postId}`
 * - Preserves already canonical URLs (`/posts/`, `/videos/`, `/watch/`, `/reel/`, `permalink.php`)
 * - Leaves non-Facebook URLs untouched
 */
export function normalizeFacebookUrl(
  url?: string | null,
  platformPostId?: string | null
): string {
  const cleanPostId = (platformPostId || '').trim();

  // If no URL provided, format using the platformPostId
  if (!url || typeof url !== 'string' || !url.trim() || url.trim() === '#') {
    return cleanPostId ? formatFacebookPostUrl(cleanPostId) : 'https://www.facebook.com';
  }

  const trimmed = url.trim();

  // If this is not a Facebook URL (e.g. LinkedIn, X, Instagram), return untouched
  if (!trimmed.toLowerCase().includes('facebook.com')) {
    return trimmed;
  }

  // Detect broken composite pattern: https://facebook.com/{pageId}_{postId}
  const compositeMatch = trimmed.match(
    /^(https?:\/\/(?:www\.|web\.|m\.)?facebook\.com\/)(\d+)_([a-zA-Z0-9]+)\/?(\?.*)?$/i
  );
  if (compositeMatch) {
    const pageId = compositeMatch[2];
    const postId = compositeMatch[3];
    const query = compositeMatch[4] || '';
    return `https://www.facebook.com/${pageId}/posts/${postId}${query}`;
  }

  // Detect root/homepage fallbacks (e.g. "https://www.facebook.com" or "https://facebook.com/")
  const isRootFacebook = /^https?:\/\/(?:www\.|web\.|m\.)?facebook\.com\/?(?:\?.*)?$/i.test(trimmed);
  if (isRootFacebook) {
    if (cleanPostId) {
      return formatFacebookPostUrl(cleanPostId);
    }
    return 'https://www.facebook.com';
  }

  // If already a valid canonical permalink, preserve as is
  const isCanonicalPostOrVideo =
    trimmed.includes('/posts/') ||
    trimmed.includes('/videos/') ||
    trimmed.includes('/watch') ||
    trimmed.includes('/reel/') ||
    trimmed.includes('permalink.php') ||
    trimmed.includes('story_fbid');

  if (isCanonicalPostOrVideo) {
    return trimmed;
  }

  // If the URL has a single slug that doesn't match canonical and we have a composite postId
  if (cleanPostId && cleanPostId.includes('_')) {
    return formatFacebookPostUrl(cleanPostId);
  }

  return trimmed;
}
