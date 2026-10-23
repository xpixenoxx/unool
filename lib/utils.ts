import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

/**
 * Parses raw platform error strings (e.g. JSON strings from LinkedIn, Pinterest, etc.)
 * into clear, user-friendly and actionable messages.
 */
export function formatPlatformError(rawError?: string | null): string {
  if (!rawError) return 'Publishing failed. Please reconnect account or verify permissions.';

  const str = String(rawError).trim();

  // 1. Detect duplicate post error across platforms (especially LinkedIn)
  if (
    /duplicate\s*post/i.test(str) ||
    /DUPLICATE_POST/.test(str) ||
    /Content is a duplicate of urn:li:/i.test(str)
  ) {
    return 'Duplicate post detected: LinkedIn does not allow publishing identical content within a short period. Please edit your post slightly before retrying.';
  }

  // 2. Token decryption failure
  if (/Failed to decrypt access token/i.test(str)) {
    return 'Failed to decrypt access token. Please reconnect your account in Settings.';
  }

  // 3. Token expired / unauthorized
  if (/token expired/i.test(str) || /invalid access token/i.test(str) || /UNAUTHORIZED/i.test(str)) {
    return 'Access token expired or revoked. Please reconnect your account in Settings.';
  }

  // 4. Try parsing JSON if error string embeds JSON
  const jsonMatch = str.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.errorDetails?.inputErrors?.[0]?.description) {
        const desc = parsed.errorDetails.inputErrors[0].description;
        if (/duplicate/i.test(desc)) {
          return 'Duplicate post detected: LinkedIn does not allow publishing identical content within a short period. Please edit your post slightly before retrying.';
        }
        return desc;
      }
      if (parsed.message) {
        const cleanMsg = parsed.message.replace(/^[a-zA-Z0-9_.]+(?:Exception|Error):\s*/, '');
        if (/duplicate/i.test(cleanMsg)) {
          return 'Duplicate post detected: LinkedIn does not allow publishing identical content within a short period. Please edit your post slightly before retrying.';
        }
        return cleanMsg;
      }
      if (parsed.error?.message) {
        return parsed.error.message;
      }
    } catch {
      // not valid JSON
    }
  }

  // 5. Clean up "Platform publish failed: 422 Unprocessable Entity - ..."
  const cleaned = str.replace(/^(?:[A-Za-z]+ publish failed:\s*\d+\s*[A-Za-z ]+\s*-\s*)/i, '');
  if (cleaned && cleaned.length > 0 && !cleaned.startsWith('{')) {
    return cleaned;
  }

  return str;
}