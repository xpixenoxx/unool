/**
 * Poisson-distributed random delay to simulate human reaction time.
 * Mean: ~45 seconds. Range: clamped to [minSeconds, maxSeconds].
 *
 * Instagram's anti-bot detection flags accounts that reply instantly
 * or at machine-regular intervals. This jitter creates organic-looking
 * response timing.
 */
export function getHumanizedDelayMs(
  minSeconds = 25,
  maxSeconds = 120
): number {
  // Poisson-like distribution centered around 45s
  const lambda = 45;
  const u = Math.random();
  // Inverse CDF approximation clamped to [min, max]
  const raw = -lambda * Math.log(1 - u);
  const clamped = Math.max(minSeconds, Math.min(maxSeconds, raw));
  return Math.round(clamped * 1000);
}

/**
 * Sleep for a humanized delay. Use before posting each reply.
 */
export function humanizedSleep(minSeconds = 25, maxSeconds = 120): Promise<void> {
  const delayMs = getHumanizedDelayMs(minSeconds, maxSeconds);
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}
