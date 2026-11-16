import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { requireWorkspaceRole } from '@/lib/auth/workspaceAccess';
import { getFeatureFlagsServer } from '@/lib/feature-flags-server';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';
import { SupabaseApiKeyRepository } from '@/lib/repositories/supabase/SupabaseApiKeyRepository';

const apiKeyRepository = new SupabaseApiKeyRepository();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const flags = await getFeatureFlagsServer();
    if (!flags.public_api_enabled) {
      return NextResponse.json(
        { error: 'Public API keys are disabled for this workspace environment.', code: 'FEATURE_DISABLED' },
        { status: 503 }
      );
    }

    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roleCheck = await requireWorkspaceRole(auth.userId, auth.workspaceId, ['owner', 'admin']);
    if (!roleCheck.allowed) {
      return NextResponse.json(
        { error: 'Only workspace owners and admins can modify API keys.' },
        { status: 403 }
      );
    }

    const rate = await checkRateLimit(request, 'apiKeyAction', auth.userId);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Too many API key requests. Please try again later.' },
        { status: 429, headers: rateLimitHeaders(rate.remaining, rate.reset) }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body as { action: 'revoke' };

    // Verify ownership
    const key = await apiKeyRepository.findById(id);
    if (!key || key.workspaceId !== auth.workspaceId) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    if (action === 'revoke') {
      if (key.revokedAt) {
        return NextResponse.json({ error: 'Key already revoked' }, { status: 400 });
      }
      await apiKeyRepository.revoke(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Failed to update API key:', error);
    return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const flags = await getFeatureFlagsServer();
    if (!flags.public_api_enabled) {
      return NextResponse.json(
        { error: 'Public API keys are disabled for this workspace environment.', code: 'FEATURE_DISABLED' },
        { status: 503 }
      );
    }

    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roleCheck = await requireWorkspaceRole(auth.userId, auth.workspaceId, ['owner', 'admin']);
    if (!roleCheck.allowed) {
      return NextResponse.json(
        { error: 'Only workspace owners and admins can delete API keys.' },
        { status: 403 }
      );
    }

    const rate = await checkRateLimit(request, 'apiKeyAction', auth.userId);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Too many API key requests. Please try again later.' },
        { status: 429, headers: rateLimitHeaders(rate.remaining, rate.reset) }
      );
    }

    const { id } = await params;

    // Verify ownership
    const key = await apiKeyRepository.findById(id);
    if (!key || key.workspaceId !== auth.workspaceId) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    await apiKeyRepository.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete API key:', error);
    return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 });
  }
}