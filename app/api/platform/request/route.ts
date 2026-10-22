import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platformName, platformUrl, capabilities, urgency, useCase, email, workspaceId } = body;

    if (!platformName || typeof platformName !== 'string') {
      return NextResponse.json({ error: 'Platform name is required' }, { status: 400 });
    }

    let auth = null;
    try {
      auth = await getCurrentAuth(request);
    } catch {
      // Non-blocking if auth fails
    }

    const effectiveWorkspaceId = auth?.workspaceId || workspaceId || 'default';
    const effectiveUserId = auth?.userId || null;
    const ticketId = `REQ-${Math.floor(100000 + Math.random() * 900000)}`;

    // Persist as an analytics and product feedback event in analytics_events
    try {
      await supabaseAdmin.from('analytics_events').insert({
        workspace_id: effectiveWorkspaceId,
        user_id: effectiveUserId,
        event_type: 'platform_integration_request',
        event_data: {
          ticket_id: ticketId,
          platform_name: platformName,
          platform_url: platformUrl || null,
          capabilities: capabilities || [],
          urgency: urgency || 'normal',
          use_case: useCase || '',
          contact_email: email || '',
          requested_at: new Date().toISOString(),
        },
      });
    } catch (dbErr) {
      console.warn('[Platform Request] Failed to insert into analytics_events:', dbErr);
    }

    return NextResponse.json({
      success: true,
      ticketId,
      message: `Your request for ${platformName} has been recorded (Ticket: ${ticketId}). Our engineering team prioritizes integrations based on community requests.`,
    });
  } catch (error) {
    console.error('[Platform Request Error]:', error);
    return NextResponse.json({ error: 'Failed to submit integration request' }, { status: 500 });
  }
}
