import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentAuth } from '@/lib/auth/server';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

const PlatformRequestSchema = z.object({
  platformName: z.string().trim().min(1, 'Platform name is required').max(120),
  platformUrl: z.string().trim().max(500).optional().nullable(),
  capabilities: z.array(z.string().trim().max(60)).max(20).optional().default([]),
  urgency: z.enum(['low', 'normal', 'high', 'critical']).optional().default('normal'),
  useCase: z.string().trim().max(2000).optional().default(''),
  email: z.string().trim().email().max(320).optional().or(z.literal('')).default(''),
  workspaceId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = PlatformRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid integration request payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { platformName, platformUrl, capabilities, urgency, useCase, email, workspaceId } = parsed.data;
    const effectiveWorkspaceId = workspaceId || auth.workspaceId;

    if (!effectiveWorkspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    if (effectiveWorkspaceId !== auth.workspaceId) {
      const hasAccess = await verifyWorkspaceAccess(auth.userId, effectiveWorkspaceId);
      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const ticketId = `REQ-${Math.floor(100000 + Math.random() * 900000)}`;

    const { error: dbErr } = await supabaseAdmin.from('analytics_events').insert({
      workspace_id: effectiveWorkspaceId,
      user_id: auth.userId,
      event_type: 'platform_integration_request',
      event_data: {
        ticket_id: ticketId,
        platform_name: platformName,
        platform_url: platformUrl || null,
        capabilities,
        urgency,
        use_case: useCase,
        contact_email: email,
        requested_at: new Date().toISOString(),
      },
    });

    if (dbErr) {
      logger.error('Failed to persist platform integration request', { error: dbErr.message, ticketId });
      return NextResponse.json({ error: 'Failed to record integration request' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      ticketId,
      message: `Your request for ${platformName} has been recorded (Ticket: ${ticketId}). Our engineering team prioritizes integrations based on community requests.`,
    });
  } catch (error) {
    logger.error('Platform Request Error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Failed to submit integration request' }, { status: 500 });
  }
}
