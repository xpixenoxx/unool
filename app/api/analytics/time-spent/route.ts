import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentAuth } from '@/lib/auth/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';

// Valid sections in Unool Dashboard
export const VALID_DASHBOARD_SECTIONS = [
  'overview',
  'studio',
  'flightplan',
  'signal',
  'automation',
  'unlock-gates',
  'referrals',
  'profile',
  'billing',
  'settings',
] as const;

export type DashboardSection = (typeof VALID_DASHBOARD_SECTIONS)[number];

export function normalizeSectionName(raw: string): DashboardSection {
  const clean = raw.toLowerCase().trim().replace(/^\/dashboard\/?/, '');
  if (!clean || clean === 'overview') return 'overview';
  if (clean.startsWith('studio')) return 'studio';
  if (clean.startsWith('flightplan') || clean.startsWith('flight-plan')) return 'flightplan';
  if (clean.startsWith('signal')) return 'signal';
  if (clean.startsWith('automation')) return 'automation';
  if (clean.startsWith('unlock-gates') || clean.startsWith('follow-gates') || clean.startsWith('gates')) return 'unlock-gates';
  if (clean.startsWith('referral')) return 'referrals';
  if (clean.startsWith('profile')) return 'profile';
  if (clean.startsWith('billing')) return 'billing';
  if (clean.startsWith('setting')) return 'settings';
  if (clean.startsWith('composer')) return 'studio';
  return 'overview';
}

const TimeSpentPayloadSchema = z.object({
  section: z.string().min(1),
  durationSeconds: z.number().int().min(1).max(3600), // Cap at 1 hour per heartbeat
  userId: z.string().optional(),
  workspaceId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = TimeSpentPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid time spent payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { section: rawSection, durationSeconds, userId: bodyUserId, workspaceId: bodyWorkspaceId } = parsed.data;
    const section = normalizeSectionName(rawSection);

    // Multi-tier authentication resolution
    let userId: string | null = null;
    let workspaceId: string | null = bodyWorkspaceId || null;

    // 1. Check current auth via server helper (checks middleware header, Bearer token, SSR cookies)
    try {
      const auth = await getCurrentAuth(request);
      if (auth?.userId) {
        userId = auth.userId;
        if (!workspaceId && auth.workspaceId) {
          workspaceId = auth.workspaceId;
        }
      }
    } catch {
      // Proceed to next fallback
    }

    // 2. Direct Bearer token fallback if auth helper didn't resolve
    if (!userId) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        try {
          const anonClient = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
          const { data: { user } } = await anonClient.auth.getUser(token);
          if (user?.id) {
            userId = user.id;
          }
        } catch {
          // Continue to next fallback
        }
      }
    }

    // 3. Fallback: verified userId from request body or header
    const candidateUserId = request.headers.get('x-user-id') || bodyUserId;
    if (!userId && candidateUserId) {
      try {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(candidateUserId);
        if (userData?.user?.id && (userData.user as any).user_metadata?.is_deleted !== true) {
          userId = userData.user.id;
        }
      } catch {
        // Unverified user
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }

    const nowIso = new Date().toISOString();

    // 1. Primary persistence: user_section_time table
    try {
      const { data: existingRow } = await supabaseAdmin
        .from('user_section_time')
        .select('id, duration_seconds')
        .eq('user_id', userId)
        .eq('section', section)
        .maybeSingle();

      if (existingRow?.id) {
        const nextDuration = (Number(existingRow.duration_seconds) || 0) + durationSeconds;
        await supabaseAdmin
          .from('user_section_time')
          .update({
            duration_seconds: nextDuration,
            last_active_at: nowIso,
            updated_at: nowIso,
          })
          .eq('id', existingRow.id);
      } else {
        await supabaseAdmin.from('user_section_time').insert({
          user_id: userId,
          workspace_id: workspaceId || null,
          section,
          duration_seconds: durationSeconds,
          last_active_at: nowIso,
        });
      }
    } catch (tableErr) {
      logger.warn('user_section_time table write skipped (may not exist yet)', { error: tableErr });
    }

    // 2. Dual-layer persistence: user_metadata in auth.users
    try {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (authUser?.user) {
        const existingMeta = authUser.user.user_metadata || {};
        const sectionTimes: Record<string, number> = {
          ...(existingMeta.section_time_spent || {}),
        };

        sectionTimes[section] = (sectionTimes[section] || 0) + durationSeconds;
        sectionTimes.total = (sectionTimes.total || 0) + durationSeconds;

        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...existingMeta,
            section_time_spent: sectionTimes,
            last_dashboard_active_at: nowIso,
          },
        });
      }
    } catch (metaErr) {
      logger.warn('user_metadata section_time_spent update error', { error: metaErr });
    }

    return NextResponse.json({
      success: true,
      section,
      durationSeconds,
      timestamp: nowIso,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Time-spent tracking error', { error: err });
    return NextResponse.json({ error: 'Failed to record time spent' }, { status: 500 });
  }
}
