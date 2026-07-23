import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { SupabaseApiKeyRepository } from '@/lib/repositories/supabase/SupabaseApiKeyRepository';

const apiKeyRepository = new SupabaseApiKeyRepository();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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