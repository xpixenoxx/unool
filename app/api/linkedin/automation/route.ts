import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';

export const dynamic = 'force-dynamic';

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

const DEFAULT_LINKEDIN_CONFIG = {
  enabled: false,
  autoReplyPositive: true,
  autoReplyQuestions: true,
  autoReplyLinkRequests: true,
  autoReplyPurchaseIntent: true,
  linkUrl: null as string | null,
  customInstructions: 'Never mention competitor platforms. Keep replies under 2 sentences. Direct technical queries to our documentation.',
  brandPersona: 'Thoughtful, consultative founder tone. Direct, insightful, and authoritative. Never corporate jargon or sycophantic. Reflects high standards.',
  flagNegative: true,
  flagSpam: true,
  maxRepliesPerHour: 20,
  jitterMinSeconds: 30,
  jitterMaxSeconds: 180,
  threadChainingEnabled: true,
  dmTemplate: null,
  autoHideSpam: false,
  dmAutoReplyEnabled: false,
  dmWelcomeMessage: 'Hello! Thank you for connecting. How can I assist you with our services today?',
  dmKnowledgeBase: 'Product FAQs:\n- Enterprise package includes 1-on-1 team onboarding\n- Consultative partnership inquiries welcomed\n- Guaranteed SLAs for custom enterprise tiers',
  dmEscalationEnabled: true,
  dmMaxRepliesPerHour: 15,
};

// GET /api/linkedin/automation?workspaceId=xxx
export async function GET(request: NextRequest) {
  try {
    const userClient = await createSupabaseServerClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const workspaceId = request.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const hasAccess = await verifyWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Try fetching from platform_automations or workspace metadata
    let defaultLinkUrl: string | null = null;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subdomain')
        .eq('user_id', user.id)
        .single();
      if (profile?.subdomain) {
        const appUrl = config.NEXT_PUBLIC_APP_URL || 'https://unool.co';
        defaultLinkUrl = `${appUrl}/u/${profile.subdomain}`;
      }
    } catch {}

    const { data: ws } = await supabase
      .from('workspaces')
      .select('metadata')
      .eq('id', workspaceId)
      .single();

    const stored = ws?.metadata?.linkedin_automation_config || null;

    if (!stored) {
      return NextResponse.json({
        ...DEFAULT_LINKEDIN_CONFIG,
        linkUrl: defaultLinkUrl,
      });
    }

    return NextResponse.json({
      ...DEFAULT_LINKEDIN_CONFIG,
      ...stored,
      linkUrl: stored.linkUrl || defaultLinkUrl,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('GET /api/linkedin/automation error', { error: err });
    return NextResponse.json(DEFAULT_LINKEDIN_CONFIG);
  }
}

// PUT /api/linkedin/automation
export async function PUT(request: NextRequest) {
  try {
    const userClient = await createSupabaseServerClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { workspaceId, ...rest } = body;

    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const hasAccess = await verifyWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Fetch existing workspace metadata to preserve other properties
    const { data: ws } = await supabase
      .from('workspaces')
      .select('metadata')
      .eq('id', workspaceId)
      .single();

    const currentMetadata = ws?.metadata || {};
    const updatedMetadata = {
      ...currentMetadata,
      linkedin_automation_config: {
        ...rest,
        updated_at: new Date().toISOString(),
      },
    };

    const { error } = await supabase
      .from('workspaces')
      .update({ metadata: updatedMetadata })
      .eq('id', workspaceId);

    if (error) {
      logger.error('Failed to update LinkedIn automation config in workspace metadata', { error, workspaceId });
      return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
    }

    logger.info('LinkedIn automation config saved', { workspaceId, enabled: rest.enabled });
    return NextResponse.json({ success: true, data: updatedMetadata.linkedin_automation_config });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('PUT /api/linkedin/automation error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
