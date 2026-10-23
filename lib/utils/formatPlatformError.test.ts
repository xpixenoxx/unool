import { describe, it, expect } from 'vitest';
import { formatPlatformError } from '../utils';

describe('formatPlatformError', () => {
  it('converts raw LinkedIn 422 duplicate post error to human-friendly guidance', () => {
    const rawLinkedInError =
      'LinkedIn publish failed: 422 Unprocessable Entity - {"errorDetailType":"com.linkedin.common.error.BadRequest","message":"com.linkedin.content.common.exception.BadRequestResponseException: Content is a duplicate of urn:li:share:7519277834922758145","errorDetails":{"inputErrors":[{"description":"Duplicate post is detected","input":{},"code":"DUPLICATE_POST"}]},"status":422}';

    const formatted = formatPlatformError(rawLinkedInError);
    expect(formatted).toContain('Duplicate post detected');
    expect(formatted).toContain('LinkedIn does not allow publishing identical content within a short period');
  });

  it('converts token decryption error to actionable reconnection guidance', () => {
    const rawDecryptionError = 'Failed to decrypt access token. Please reconnect account.';
    const formatted = formatPlatformError(rawDecryptionError);
    expect(formatted).toContain('Failed to decrypt access token');
    expect(formatted).toContain('Settings');
  });

  it('converts Pinterest trial app error to clean message', () => {
    const rawPinterestError =
      'Permission denied (403): {"code":29,"message":"Apps with Trial access may not create Pins in production https://api.pinterest.com - use API Sandbox https://api-sandbox.pinterest.com instead."}';

    const formatted = formatPlatformError(rawPinterestError);
    expect(formatted).toBe(
      'Apps with Trial access may not create Pins in production https://api.pinterest.com - use API Sandbox https://api-sandbox.pinterest.com instead.'
    );
  });

  it('returns default fallback when error is null or undefined', () => {
    expect(formatPlatformError(null)).toBe('Publishing failed. Please reconnect account or verify permissions.');
    expect(formatPlatformError(undefined)).toBe('Publishing failed. Please reconnect account or verify permissions.');
  });
});
