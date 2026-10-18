import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { uploadToR2 } from '@/lib/storage/r2';

export async function POST(request: NextRequest) {
  try {
    const userClient = await createSupabaseServerClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const safeFilename = `${user.id}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
    const contentType = file.type || 'application/octet-stream';
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let publicUrl = '';

    // Check if Cloudflare R2 is configured
    const r2Configured = Boolean(
      process.env.CF_R2_ACCOUNT_ID &&
      process.env.CF_R2_ACCESS_KEY_ID &&
      process.env.CF_R2_SECRET_ACCESS_KEY
    );

    if (r2Configured) {
      try {
        const key = `materials/${safeFilename}`;
        const res = await uploadToR2({
          bucket: 'post-media',
          key,
          body: buffer,
          contentType,
        });
        publicUrl = res.url;
      } catch (r2Error) {
        logger.warn('R2 upload failed, falling back to data URL', { error: r2Error });
      }
    }

    // Fallback if R2 not configured or errored: provide inline base64 Data URL
    if (!publicUrl) {
      const base64 = buffer.toString('base64');
      publicUrl = `data:${contentType};base64,${base64}`;
    }

    // Determine type category
    let materialType: 'image' | 'pdf' | 'doc' | 'website' = 'doc';
    if (contentType.startsWith('image/')) {
      materialType = 'image';
    } else if (contentType === 'application/pdf' || file.name.endsWith('.pdf')) {
      materialType = 'pdf';
    }

    const sizeFormatted = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      name: file.name,
      type: materialType,
      size: sizeFormatted,
      contentType,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Brand materials upload API error', { error: err });
    return NextResponse.json({ error: 'Failed to upload material' }, { status: 500 });
  }
}
