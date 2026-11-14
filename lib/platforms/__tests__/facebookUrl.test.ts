import { describe, it, expect } from 'vitest';
import { formatFacebookPostUrl, normalizeFacebookUrl } from '../facebookUrl';

describe('formatFacebookPostUrl', () => {
  it('formats composite {pageId}_{postId} into canonical /posts/ URL', () => {
    const result = formatFacebookPostUrl('105432109876543_1234567890123456');
    expect(result).toBe('https://www.facebook.com/105432109876543/posts/1234567890123456');
  });

  it('formats single ID with pageId for standard feed posts', () => {
    const result = formatFacebookPostUrl('1234567890123456', '105432109876543');
    expect(result).toBe('https://www.facebook.com/105432109876543/posts/1234567890123456');
  });

  it('formats single ID with pageId for video posts', () => {
    const result = formatFacebookPostUrl('987654321', '105432109876543', true);
    expect(result).toBe('https://www.facebook.com/105432109876543/videos/987654321');
  });

  it('formats video ID without pageId using facebook watch', () => {
    const result = formatFacebookPostUrl('987654321', undefined, true);
    expect(result).toBe('https://www.facebook.com/watch/?v=987654321');
  });

  it('handles empty input gracefully', () => {
    expect(formatFacebookPostUrl('')).toBe('https://www.facebook.com');
  });
});

describe('normalizeFacebookUrl', () => {
  it('rewrites broken composite url https://www.facebook.com/{pageId}_{postId} to canonical /posts/', () => {
    const broken = 'https://www.facebook.com/105432109876543_1234567890123456';
    expect(normalizeFacebookUrl(broken)).toBe('https://www.facebook.com/105432109876543/posts/1234567890123456');
  });

  it('rewrites broken composite url without www and with trailing slash and query params', () => {
    const broken = 'https://facebook.com/105432109876543_1234567890123456/?mibextid=ZbWKwL';
    expect(normalizeFacebookUrl(broken)).toBe('https://www.facebook.com/105432109876543/posts/1234567890123456?mibextid=ZbWKwL');
  });

  it('resolves root facebook url to post url when platformPostId is provided', () => {
    const root = 'https://www.facebook.com';
    expect(normalizeFacebookUrl(root, '105432109876543_1234567890123456')).toBe(
      'https://www.facebook.com/105432109876543/posts/1234567890123456'
    );
  });

  it('resolves empty or null url to post url when platformPostId is provided', () => {
    expect(normalizeFacebookUrl(null, '105432109876543_1234567890123456')).toBe(
      'https://www.facebook.com/105432109876543/posts/1234567890123456'
    );
    expect(normalizeFacebookUrl('', '105432109876543_1234567890123456')).toBe(
      'https://www.facebook.com/105432109876543/posts/1234567890123456'
    );
  });

  it('preserves already valid canonical post url', () => {
    const valid = 'https://www.facebook.com/MyAwesomePage/posts/1234567890123456';
    expect(normalizeFacebookUrl(valid)).toBe(valid);
  });

  it('preserves already valid video and watch urls', () => {
    const video = 'https://www.facebook.com/105432109876543/videos/987654321';
    expect(normalizeFacebookUrl(video)).toBe(video);

    const watch = 'https://www.facebook.com/watch/?v=987654321';
    expect(normalizeFacebookUrl(watch)).toBe(watch);
  });

  it('preserves older permalink.php query URLs', () => {
    const permalink = 'https://www.facebook.com/permalink.php?story_fbid=12345&id=67890';
    expect(normalizeFacebookUrl(permalink)).toBe(permalink);
  });

  it('leaves non-facebook URLs completely untouched', () => {
    const linkedin = 'https://www.linkedin.com/feed/update/urn:li:activity:123456';
    expect(normalizeFacebookUrl(linkedin, '105432109876543_1234567890123456')).toBe(linkedin);

    const twitter = 'https://x.com/i/status/987654321';
    expect(normalizeFacebookUrl(twitter)).toBe(twitter);
  });
});

