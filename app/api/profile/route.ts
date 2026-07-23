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

    // Get profile for this workspace
    const profile = await profileRepository.findByWorkspaceId(auth.workspaceId);

    if (!profile) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Get profile failed', { error: err });
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, workspaceId } = auth;

    const body = await request.json();
    const { name, headline, bio, role, company, links, proofPoints, theme, subdomain } = body;

    // Get existing profile or create new
    let profile = await profileRepository.findByWorkspaceId(workspaceId);

    if (profile) {
      // Update existing
      profile = await profileRepository.update(profile.id, {
        name,
        headline,
        bio,
        role,
        company,
        links,
        proofPoints,
        theme,
        subdomain,
      }, profile.version);
    } else {
      // Create new
      profile = await profileRepository.create({
        workspaceId,
        userId,
        subdomain,
        sourceUrl: body.sourceUrl,
        extractionPromptVersion: body.extractionPromptVersion,
      });

      // Update with full data
      profile = await profileRepository.update(profile.id, {
        name,
        headline,
        bio,
        role,
        company,
        links,
        proofPoints,
        theme,
        subdomain,
      }, 1);
    }

    // Check subdomain uniqueness if provided
    if (subdomain && subdomain !== profile.subdomain) {
      const existing = await profileRepository.findBySubdomain(subdomain);
      if (existing && existing.id !== profile.id) {
        return NextResponse.json({ error: 'Subdomain already taken' }, { status: 409 });
      }
      // Update subdomain
      profile = await profileRepository.update(profile.id, { subdomain }, profile.version);
    }

    return NextResponse.json({ profile });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (err.message === 'VERSION_CONFLICT') {
      return NextResponse.json({ error: 'Profile was modified, please refresh and try again' }, { status: 409 });
    }
    logger.error('Update profile failed', { error: err });
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Alias to PUT for creation
  return PUT(request);
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workspaceId } = auth;

    // Get the profile first
    const profile = await profileRepository.findByWorkspaceId(workspaceId);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Delete the profile
    await profileRepository.delete(profile.id);

    return NextResponse.json({ success: true, message: 'Profile deleted successfully' });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Delete profile failed', { error: err });
    return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 });
  }
}