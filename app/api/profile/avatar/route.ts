import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { logger } from '@/lib/logger';
import { uploadToR2, deleteFromR2 } from '@/lib/storage/r2';
import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const profileRepository = new SupabaseProfileRepository();

interface DetectedImageType {
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
  extension: 'jpg' | 'png' | 'webp' | 'gif';
}

/**
 * Inspects file magic bytes instead of trusting client Content-Type or extension.
 * Rejects SVG, HTML, scripts, and disguised payloads.
 */
function detectSafeImageMagicBytes(buf: Buffer): DetectedImageType | null {
  if (buf.length < 12) return null;

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { mimeType: 'image/jpeg', extension: 'jpg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return { mimeType: 'image/png', extension: 'png' };
  }

  // GIF87a / GIF89a
  const header6 = buf.subarray(0, 6).toString('ascii');
  if (header6 === 'GIF87a' || header6 === 'GIF89a') {
    return { mimeType: 'image/gif', extension: 'gif' };
  }

  // WEBP: RIFF....WEBP
  const riff = buf.subarray(0, 4).toString('ascii');
  const webp = buf.subarray(8, 12).toString('ascii');
  if (riff === 'RIFF' && webp === 'WEBP') {
    return { mimeType: 'image/webp', extension: 'webp' };
  }

  return null;
}

function extractOwnedAvatarKey(avatarUrl: string | null | undefined, userId: string): string | null {
  if (!avatarUrl || typeof avatarUrl !== 'string') return null;
  try {
    const u = new URL(avatarUrl);
    const idx = u.pathname.indexOf(`avatars/${userId}-`);
    if (idx >= 0) {
      return u.pathname.slice(idx);
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: 'Uploaded file is empty' }, { status: 400 });
    }

    if (file.size > MAX_AVATAR_BYTES) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const detected = detectSafeImageMagicBytes(buffer);
    if (!detected) {
      return NextResponse.json(
        { error: 'Unsupported or invalid image file. Only binary JPEG, PNG, WebP, and GIF images are allowed.' },
        { status: 400 }
      );
    }

    // Look up existing avatar key before overwriting so orphaned files don't accumulate
    let previousAvatarKey: string | null = null;
    try {
      const existingProfile = await profileRepository.findByWorkspaceId(auth.workspaceId);
      previousAvatarKey = extractOwnedAvatarKey(existingProfile?.avatarUrl, auth.userId);
    } catch {
      // Non-critical lookup
    }

    const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) || 'avatar';
    const key = `avatars/${auth.userId}-${Date.now()}-${baseName}.${detected.extension}`;

    const { url } = await uploadToR2({
      bucket: 'avatars',
      key,
      body: buffer,
      contentType: detected.mimeType,
    });

    if (previousAvatarKey && previousAvatarKey !== key) {
      deleteFromR2({ bucket: 'avatars', key: previousAvatarKey }).catch((delErr) => {
        logger.warn('Failed to clean up previous avatar object', { previousAvatarKey, error: String(delErr) });
      });
    }

    return NextResponse.json({ url, key });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Avatar upload API error', { error: err });
    return NextResponse.json(
      { error: 'Failed to process avatar upload' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingProfile = await profileRepository.findByWorkspaceId(auth.workspaceId);
    if (!existingProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const oldKey = extractOwnedAvatarKey(existingProfile.avatarUrl, auth.userId);
    await profileRepository.update(
      existingProfile.id,
      { avatarUrl: null },
      existingProfile.version
    );

    if (oldKey) {
      deleteFromR2({ bucket: 'avatars', key: oldKey }).catch((delErr) => {
        logger.warn('Failed to delete avatar from R2', { oldKey, error: String(delErr) });
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Avatar delete API error', { error: err });
    return NextResponse.json({ error: 'Failed to remove avatar' }, { status: 500 });
  }
}
