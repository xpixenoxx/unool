import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';
import { logger } from '@/lib/logger';

const profileRepository = new SupabaseProfileRepository();

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ subdomain: string }> }
) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subdomain } = await params;

    // Find the profile for this workspace
    const profile = await profileRepository.findByWorkspaceId(auth.workspaceId);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Verify the subdomain matches
    if (profile.subdomain !== subdomain) {
      return NextResponse.json({ error: 'Subdomain mismatch' }, { status: 400 });
    }

    // Clear the subdomain (set to null)
    await profileRepository.update(profile.id, { subdomain: null }, profile.version);

    return NextResponse.json({ success: true, message: 'Subdomain deleted successfully' });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Delete subdomain failed', { error: err });
    if (err.message === 'VERSION_CONFLICT') {
      return NextResponse.json({ error: 'Profile was modified, please refresh and try again' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to delete subdomain' }, { status: 500 });
  }
}