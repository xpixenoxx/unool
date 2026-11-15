import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';
import { findUserByEmail } from '@/lib/auth/findUserByEmail';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const profileRepository = new SupabaseProfileRepository();

const AddViewerSchema = z
  .object({
    userId: z.string().uuid('Invalid user ID format').optional(),
    email: z.string().trim().email('Invalid email address').max(254).optional(),
  })
  .refine((v) => Boolean(v.userId || v.email), {
    message: 'Provide either an account email or viewer userId',
  });

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await profileRepository.findByWorkspaceId(auth.workspaceId);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const viewers = await profileRepository.getViewers(profile.id);
    return NextResponse.json({ viewers });
  } catch (error) {
    logger.error('Error getting profile viewers', { error });
    return NextResponse.json({ error: 'Failed to retrieve viewers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = AddViewerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid viewer request' },
        { status: 400 }
      );
    }

    const profile = await profileRepository.findByWorkspaceId(auth.workspaceId);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    let targetUserId = parsed.data.userId;
    if (!targetUserId && parsed.data.email) {
      const user = await findUserByEmail(parsed.data.email);
      if (!user) {
        return NextResponse.json(
          { error: `No Unool account found for ${parsed.data.email}. They need an account before being granted private access.` },
          { status: 404 }
        );
      }
      targetUserId = user.id;
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'Viewer user ID could not be resolved' }, { status: 400 });
    }

    if (targetUserId === auth.userId || targetUserId === profile.userId) {
      return NextResponse.json({ error: 'As the owner, you already have access' }, { status: 400 });
    }

    await profileRepository.addViewer(profile.id, targetUserId);
    const viewers = await profileRepository.getViewers(profile.id);

    return NextResponse.json({
      success: true,
      viewerUserId: targetUserId,
      viewers,
    });
  } catch (error) {
    logger.error('Error adding viewer', { error });
    return NextResponse.json({ error: 'Failed to add viewer' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const viewerUserId = request.nextUrl.searchParams.get('userId');
    if (!viewerUserId) {
      return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 });
    }

    const profile = await profileRepository.findByWorkspaceId(auth.workspaceId);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    await profileRepository.removeViewer(profile.id, viewerUserId);
    const viewers = await profileRepository.getViewers(profile.id);

    return NextResponse.json({ success: true, viewers });
  } catch (error) {
    logger.error('Error removing viewer', { error });
    return NextResponse.json({ error: 'Failed to remove viewer' }, { status: 500 });
  }
}
