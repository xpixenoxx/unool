import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * LexicalEntropyGuard — prevents the AI from generating
 * near-identical replies that would trigger Meta's anti-spam.
 *
 * Tracks the last 50 reply openings per workspace and thread, providing
 * them as context to the AI prompt so it can vary its output.
 *
 * Thread-specific anti-duplication ensures that comments under the same
 * post/reel never receive repetitive-sounding replies.
 *
 * Uses DB-backed storage for persistence across serverless invocations.
 * Falls back to an in-memory cache for performance during burst processing.
 */
export class LexicalEntropyGuard {
  private supabase = supabaseAdmin;

  // In-memory cache:
  // Key: workspaceId (for workspace-wide) or `${workspaceId}:${mediaId}` (for thread-specific)
  private cache: Map<string, string[]> = new Map();

  /**
   * Get the last N reply texts for a workspace (and optionally a specific media thread).
   * Thread replies are prioritized first so the AI avoids repeating patterns in the exact same post.
   */
  async getRecentReplies(workspaceId: string, limit = 20, mediaId?: string): Promise<string[]> {
    const threadKey = mediaId?.trim() ? `${workspaceId}:${mediaId.trim()}` : null;

    // Check thread-specific cache first if mediaId was passed
    if (threadKey) {
      const cachedThread = this.cache.get(threadKey);
      if (cachedThread && cachedThread.length > 0) {
        return cachedThread.slice(-limit);
      }
    } else {
      // Check workspace cache
      const cachedWorkspace = this.cache.get(workspaceId);
      if (cachedWorkspace && cachedWorkspace.length > 0) {
        return cachedWorkspace.slice(-limit);
      }
    }

    try {
      if (mediaId?.trim()) {
        const cleanMediaId = mediaId.trim();

        // 1. Fetch thread-specific replies for this media
        const { data: threadData } = await this.supabase
          .from('instagram_comment_logs')
          .select('suggested_reply')
          .eq('workspace_id', workspaceId)
          .eq('media_id', cleanMediaId)
          .eq('auto_replied', true)
          .not('suggested_reply', 'is', null)
          .order('created_at', { ascending: false })
          .limit(limit);

        const threadReplies = (threadData || [])
          .map((r: { suggested_reply: string | null }) => r.suggested_reply)
          .filter((r): r is string => !!r && r !== 'SKIP');

        // 2. Fetch recent workspace replies to fill any remaining slots
        const workspaceLimit = Math.max(5, Math.floor(limit / 2));
        const { data: wsData } = await this.supabase
          .from('instagram_comment_logs')
          .select('suggested_reply')
          .eq('workspace_id', workspaceId)
          .eq('auto_replied', true)
          .not('suggested_reply', 'is', null)
          .order('created_at', { ascending: false })
          .limit(workspaceLimit);

        const wsReplies = (wsData || [])
          .map((r: { suggested_reply: string | null }) => r.suggested_reply)
          .filter((r): r is string => !!r && r !== 'SKIP');

        // Merge: thread replies first, then unique workspace replies
        const combined = [...threadReplies];
        for (const r of wsReplies) {
          if (!combined.includes(r) && combined.length < limit) {
            combined.push(r);
          }
        }

        if (threadKey) {
          this.cache.set(threadKey, combined);
        }
        if (wsReplies.length > 0) {
          this.cache.set(workspaceId, wsReplies);
        }

        return combined;
      }

      // Workspace-wide fetch (fallback when no mediaId)
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

      this.cache.set(workspaceId, replies);
      return replies;
    } catch (error) {
      logger.debug('LexicalEntropyGuard: could not fetch recent replies', { error, workspaceId, mediaId });
      return [];
    }
  }

  /**
   * Record a new reply for future anti-duplication tracking.
   * Updates both the workspace cache and thread-specific cache if mediaId is provided.
   */
  recordReply(workspaceId: string, reply: string, mediaId?: string): void {
    // Record into workspace-wide cache
    const wsList = this.cache.get(workspaceId) || [];
    wsList.push(reply);
    if (wsList.length > 50) wsList.shift();
    this.cache.set(workspaceId, wsList);

    // If mediaId is provided, also record into thread-specific cache
    if (mediaId?.trim()) {
      const threadKey = `${workspaceId}:${mediaId.trim()}`;
      const threadList = this.cache.get(threadKey) || [];
      threadList.push(reply);
      if (threadList.length > 50) threadList.shift();
      this.cache.set(threadKey, threadList);
    }
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

      // Check if openings match (same first 2 words)
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
   * Get the opening words of a reply (normalized).
   */
  private getOpening(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .slice(0, 2)
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
