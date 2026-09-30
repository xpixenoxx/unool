import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { getCurrentAuth } from '@/lib/auth/server';
import { logger } from '@/lib/logger';

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
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 });
    }

    const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

    // Try to create the avatars bucket (fails safely if it already exists)
    await supabase.storage.createBucket('avatars', { public: true });

    const safeFilename = `${auth.userId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(safeFilename, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      logger.error('Supabase avatar upload error', { error: uploadError });
      return NextResponse.json({ error: `Failed to upload avatar: ${uploadError.message}` }, { status: 500 });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(safeFilename);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Avatar upload API error', { error: err });
    return NextResponse.json({ error: 'Failed to process avatar upload' }, { status: 500 });
  }
}
