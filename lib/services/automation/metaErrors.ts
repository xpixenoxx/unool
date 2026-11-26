export interface MetaErrorClassification {
  permanent: boolean;
  closedDms: boolean;
  windowExpired: boolean;
  tokenExpired: boolean;
  rateLimited: boolean;
  code?: number;
}

/**
 * Classifies Meta Graph API error responses into permanent vs retryable failures
 * so outbound workers never retry closed-DM/window-expired errors and can trigger
 * closed-DM public fallbacks cleanly.
 */
export function classifyMetaError(msg: string): MetaErrorClassification {
  const lower = (msg || '').toLowerCase();
  const codeMatch = msg.match(/"code"\s*:\s*(\d+)/) || msg.match(/code[:\s=]+(\d+)/i);
  const code = codeMatch ? Number(codeMatch[1]) : undefined;

  const rateLimited =
    code === 4 ||
    code === 17 ||
    code === 32 ||
    code === 613 ||
    lower.includes('rate limit') ||
    lower.includes('too many calls');

  const tokenExpired =
    code === 190 ||
    lower.includes('expired') ||
    lower.includes('invalid oauth') ||
    lower.includes('token');

  const closedDms =
    code === 551 ||
    code === 2022 ||
    lower.includes("this person isn't available") ||
    lower.includes('cannot receive messages') ||
    lower.includes('receiver does not allow messages') ||
    lower.includes('2534022') ||
    lower.includes('does not allow message requests');

  const windowExpired =
    code === 10 ||
    lower.includes('outside of allowed window') ||
    lower.includes('24 hour') ||
    lower.includes('7 day') ||
    lower.includes('window') ||
    lower.includes('2018267') ||
    lower.includes('already replied');

  const permanent =
    !rateLimited &&
    (tokenExpired ||
      closedDms ||
      windowExpired ||
      code === 200 ||
      lower.includes('permission') ||
      lower.includes('policy') ||
      lower.includes('invalid recipient') ||
      lower.includes('user not found'));

  return { permanent, closedDms, windowExpired, tokenExpired, rateLimited, code };
}
