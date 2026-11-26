import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * VelocityThrottle — enforces per-workspace hourly reply limits.
 *
 * Meta's rate limit is ~200 API actions/hour, but we stay conservative
 * at 30 replies/hour (default) to avoid triggering anti-spam systems.
 *
 * Uses the `instagram_reply_velocity` DB table for persistence across
 * serverless function invocations (no in-memory state that would be
 * lost between Vercel cold starts).
 */
export class VelocityThrottle {
  private supabase = supabaseAdmin;

  private parseKey(key: string, explicitChannel?: string): { workspaceId: string; channel: string } {
    if (key.startsWith('dm:')) {
      return { workspaceId: key.slice(3), channel: 'dm' };
    }
    if (key.startsWith('fb:')) {
      return { workspaceId: key.slice(3), channel: 'fb_comment' };
    }
    if (key.startsWith('fb-dm:')) {
      return { workspaceId: key.slice(6), channel: 'fb_dm' };
    }
    if (key.startsWith('threads:')) {
      return { workspaceId: key.slice(8), channel: 'threads_reply' };
    }
    return { workspaceId: key, channel: explicitChannel || 'comment' };
  }

  /**
   * Check if a workspace can send another reply this hour.
   */
  async canReply(key: string, maxPerHour = 30, channel?: string): Promise<boolean> {
    const { workspaceId, channel: ch } = this.parseKey(key, channel);
    const hourBucket = this.getCurrentHourBucket();

    try {
      const { data } = await this.supabase
        .from('instagram_reply_velocity')
        .select('reply_count')
        .eq('workspace_id', workspaceId)
        .eq('channel', ch)
        .eq('hour_bucket', hourBucket)
        .single();

      if (!data) return true; // No entry = no replies this hour
      return data.reply_count < maxPerHour;
    } catch {
      // Table might not exist yet or other error — allow reply (fail open)
      return true;
    }
  }

  /**
   * Record a reply action in the velocity tracker.
   * Uses atomic Postgres RPC `increment_reply_velocity` when available to prevent
   * read-modify-write race conditions under concurrent viral bursts, with a clean
   * fallback to SELECT/UPDATE/INSERT for pre-migration environments and unit test mocks.
   */
  async recordReply(key: string, channel?: 'comment' | 'dm'): Promise<void> {
    const { workspaceId, channel: ch } = this.parseKey(key, channel);
    const hourBucket = this.getCurrentHourBucket();

    try {
      if (typeof (this.supabase as any)?.rpc === 'function') {
        const rpcRes = await (this.supabase as any).rpc('increment_reply_velocity', {
          p_workspace_id: workspaceId,
          p_channel: ch,
          p_hour_bucket: hourBucket,
        });
        if (!rpcRes?.error) {
          return;
        }
      }

      // Fallback: upsert via SELECT then UPDATE/INSERT
      const { data: existing } = await this.supabase
        .from('instagram_reply_velocity')
        .select('reply_count')
        .eq('workspace_id', workspaceId)
        .eq('channel', ch)
        .eq('hour_bucket', hourBucket)
        .single();

      if (existing) {
        await this.supabase
          .from('instagram_reply_velocity')
          .update({ reply_count: existing.reply_count + 1 })
          .eq('workspace_id', workspaceId)
          .eq('channel', ch)
          .eq('hour_bucket', hourBucket);
      } else {
        await this.supabase
          .from('instagram_reply_velocity')
          .insert({
            workspace_id: workspaceId,
            channel: ch,
            hour_bucket: hourBucket,
            reply_count: 1,
          });
      }
    } catch (error) {
      logger.warn('Failed to record reply velocity', { error, workspaceId, channel: ch });
    }
  }

  /**
   * Get current reply count for this hour.
   */
  async getCurrentCount(key: string, channel?: 'comment' | 'dm'): Promise<number> {
    const { workspaceId, channel: ch } = this.parseKey(key, channel);
    const hourBucket = this.getCurrentHourBucket();

    try {
      const { data } = await this.supabase
        .from('instagram_reply_velocity')
        .select('reply_count')
        .eq('workspace_id', workspaceId)
        .eq('channel', ch)
        .eq('hour_bucket', hourBucket)
        .single();

      return data?.reply_count ?? 0;
    } catch {
      return 0;
    }
  }

  /**
   * Returns the current hour bucket as an ISO timestamp
   * (truncated to the hour).
   */
  private getCurrentHourBucket(): string {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    return now.toISOString();
  }

  /**
   * Calculates the number of seconds until the next hour bucket starts,
   * plus a randomized jitter window so queued jobs do not thundering-herd
   * at minute 00:00 of the next hour.
   */
  getSecondsUntilNextHourBucket(jitterMinSeconds = 30, jitterMaxSeconds = 180): number {
    const now = new Date();
    const secondsIntoHour = now.getMinutes() * 60 + now.getSeconds();
    const secondsRemaining = Math.max(60, 3600 - secondsIntoHour);
    const jitter = Math.floor(
      jitterMinSeconds + Math.random() * Math.max(1, jitterMaxSeconds - jitterMinSeconds)
    );
    return secondsRemaining + jitter;
  }
}

// Singleton for reuse across the app
export const velocityThrottle = new VelocityThrottle();
