import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';

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
  private supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

  /**
   * Check if a workspace can send another reply this hour.
   */
  async canReply(workspaceId: string, maxPerHour = 30): Promise<boolean> {
    const hourBucket = this.getCurrentHourBucket();

    try {
      const { data } = await this.supabase
        .from('instagram_reply_velocity')
        .select('reply_count')
        .eq('workspace_id', workspaceId)
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
   */
  async recordReply(workspaceId: string): Promise<void> {
    const hourBucket = this.getCurrentHourBucket();

    try {
      // Upsert: increment if exists, create if not
      const { data: existing } = await this.supabase
        .from('instagram_reply_velocity')
        .select('reply_count')
        .eq('workspace_id', workspaceId)
        .eq('hour_bucket', hourBucket)
        .single();

      if (existing) {
        await this.supabase
          .from('instagram_reply_velocity')
          .update({ reply_count: existing.reply_count + 1 })
          .eq('workspace_id', workspaceId)
          .eq('hour_bucket', hourBucket);
      } else {
        await this.supabase
          .from('instagram_reply_velocity')
          .insert({
            workspace_id: workspaceId,
            hour_bucket: hourBucket,
            reply_count: 1,
          });
      }
    } catch (error) {
      logger.warn('Failed to record reply velocity', { error, workspaceId });
    }
  }

  /**
   * Get current reply count for this hour.
   */
  async getCurrentCount(workspaceId: string): Promise<number> {
    const hourBucket = this.getCurrentHourBucket();

    try {
      const { data } = await this.supabase
        .from('instagram_reply_velocity')
        .select('reply_count')
        .eq('workspace_id', workspaceId)
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
}

// Singleton for reuse across the app
export const velocityThrottle = new VelocityThrottle();
