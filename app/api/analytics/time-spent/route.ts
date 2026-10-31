import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';

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
  'composer',
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
  if (clean.startsWith('composer')) return 'composer';
  return 'overview';
}

const TimeSpentPayloadSchema = z.object({
  section: z.string().min(1),
  durationSeconds: z.number().int().min(1).max(3600), // Cap at 1 hour per heartbeat
  workspaceId: z.string().uuid().optional(),
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

    const { section: rawSection, durationSeconds, workspaceId } = parsed.data;
    const section = normalizeSectionName(rawSection);

    // Identify user from Supabase session
    const cookieStore = await cookies();
    const supabase = createServerClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    });

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }

    const nowIso = new Date().toISOString();

    // 1. Primary persistence: user_section_time table
    try {
      // Query existing row to increment duration
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
    // Guarantees persistence even before or without external SQL migrations
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
