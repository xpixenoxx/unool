import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config/schema';
import { getCurrentAuth } from '@/lib/auth/server';
import { logger } from '@/lib/logger';
import { uploadToR2 } from '@/lib/storage/r2';

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    const safeFilename = `${auth.userId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
    const key = `avatars/${safeFilename}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { url } = await uploadToR2({
      bucket: 'avatars',
      key,
      body: buffer,
      contentType: file.type,
    });

    return NextResponse.json({ success: true, url });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Avatar upload API error', { error: err });
    return NextResponse.json(
      { error: 'Failed to process avatar upload' },
      { status: 500 }
    );
  }
}
