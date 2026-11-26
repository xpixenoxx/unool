/**
 * Deterministic human-review flagging policy for classified comments and replies.
 * Ensures negative sentiment, spam, and harmful interactions are reliably routed
 * to the Triage Queue according to workspace toggles, even if the LLM omits
 * `shouldFlagForReview`.
 */
export function resolveCommentReviewFlag(
  classified: { classification?: string; shouldFlagForReview?: boolean },
  options: { flagNegative?: boolean; flagSpam?: boolean }
): boolean {
  if (classified.classification === 'harmful') {
    return true;
  }
  if (classified.classification === 'negative') {
    return options.flagNegative !== false;
  }
  if (classified.classification === 'spam') {
    return options.flagSpam !== false;
  }
  return Boolean(classified.shouldFlagForReview);
}
