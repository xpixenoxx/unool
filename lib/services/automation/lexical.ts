import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';

/**
 * LexicalEntropyGuard — prevents the AI from generating
 * near-identical replies that would trigger Meta's anti-spam.
 *
 * Tracks the last 50 reply openings per workspace and provides
 * them as context to the AI prompt so it can vary its output.
 *
 * Uses DB-backed storage for persistence across serverless invocations.
 * Falls back to an in-memory cache for performance during burst processing.
 */
export class LexicalEntropyGuard {
  private supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

  // In-memory cache (populated from DB, survives within a single invocation)
  private cache: Map<string, string[]> = new Map();

  /**
   * Get the last N reply texts for a workspace (for AI anti-duplication context).
   */
  async getRecentReplies(workspaceId: string, limit = 20): Promise<string[]> {
    // Check cache first
    const cached = this.cache.get(workspaceId);
    if (cached && cached.length > 0) {
      return cached.slice(-limit);
    }

    try {
      const { data } = await this.supabase
        .from('instagram_comment_logs')
        .select('suggested_reply')
        .eq('workspace_id', workspaceId)
        .eq('auto_replied', true)
        .not('suggested_reply', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      const replies = (data || [])
        .map((r: { suggested_reply: string | null }) => r.suggested_reply)
        .filter((r): r is string => !!r && r !== 'SKIP');

      // Populate cache
      this.cache.set(workspaceId, replies);
      return replies;
    } catch (error) {
      logger.debug('LexicalEntropyGuard: could not fetch recent replies', { error });
      return [];
    }
  }

  /**
   * Record a new reply for future anti-duplication tracking.
   * (The reply is also stored in instagram_comment_logs, but this
   * keeps the in-memory cache warm during burst processing.)
   */
  recordReply(workspaceId: string, reply: string): void {
    const list = this.cache.get(workspaceId) || [];
    list.push(reply);
    // Keep only the last 50
    if (list.length > 50) list.shift();
    this.cache.set(workspaceId, list);
  }

  /**
   * Check if a reply is too similar to recent replies.
   * Returns true if the reply should be rejected for being too repetitive.
   */
  isTooSimilar(reply: string, recentReplies: string[]): boolean {
    if (recentReplies.length === 0) return false;

    const replyOpening = this.getOpening(reply);

    for (const recent of recentReplies) {
      const recentOpening = this.getOpening(recent);

      // Check if openings match (same first 3 words)
      if (replyOpening === recentOpening && replyOpening.length > 0) {
        return true;
      }

      // Check Jaccard similarity of word sets
      if (this.jaccardSimilarity(reply, recent) > 0.7) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get the opening 3 words of a reply (normalized).
   */
  private getOpening(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .slice(0, 3)
      .join(' ')
      .trim();
  }

  /**
   * Jaccard similarity between two texts (word-level).
   * Returns 0–1 where 1 = identical word sets.
   */
  private jaccardSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean));
    const wordsB = new Set(b.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean));

    if (wordsA.size === 0 && wordsB.size === 0) return 1;
    if (wordsA.size === 0 || wordsB.size === 0) return 0;

    let intersection = 0;
    for (const word of wordsA) {
      if (wordsB.has(word)) intersection++;
    }

    const union = wordsA.size + wordsB.size - intersection;
    return union === 0 ? 0 : intersection / union;
  }
}

// Singleton
export const lexicalEntropyGuard = new LexicalEntropyGuard();
