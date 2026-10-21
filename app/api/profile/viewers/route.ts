import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';
import { logger } from '@/lib/logger';

const profileRepository = new SupabaseProfileRepository();

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the profile owned by the authenticated user
    const profile = await profileRepository.findByUserId(auth.userId);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Verify workspace membership (defense in depth)
    if (profile.workspaceId !== auth.workspaceId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const viewers = await profileRepository.getViewers(profile.id);
    return NextResponse.json({ viewers });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to get viewers', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { viewerUserId } = await request.json();
    if (!viewerUserId) {
      return NextResponse.json({ error: 'viewerUserId is required' }, { status: 400 });
    }

    // Find the profile owned by the authenticated user
    const profile = await profileRepository.findByUserId(auth.userId);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Verify workspace membership (defense in depth)
    if (profile.workspaceId !== auth.workspaceId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prevent adding self as viewer
    if (viewerUserId === auth.userId) {
      return NextResponse.json({ error: 'Cannot add yourself as a viewer' }, { status: 400 });
    }

    await profileRepository.addViewer(profile.id, viewerUserId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to add viewer', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const viewerUserId = searchParams.get('viewerUserId');
    if (!viewerUserId) {
      return NextResponse.json({ error: 'viewerUserId is required' }, { status: 400 });
    }

    // Find the profile owned by the authenticated user
    const profile = await profileRepository.findByUserId(auth.userId);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Verify workspace membership (defense in depth)
    if (profile.workspaceId !== auth.workspaceId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await profileRepository.removeViewer(profile.id, viewerUserId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to remove viewer', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}