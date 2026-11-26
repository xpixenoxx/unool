import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { getBucketName, getR2Client } from '@/lib/storage/r2';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_INLINE_DATA_URL_BYTES = 1.5 * 1024 * 1024;

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

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: 'File is too large. Maximum supported size is 10 MB.' },
        { status: 413 }
      );
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
        const client = getR2Client();
        const bucketName = getBucketName('post-media');
        await client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: buffer,
            ContentType: contentType,
          })
        );
        // Completely mask Cloudflare R2 URL behind internal proxy route
        publicUrl = `/api/media/${key}`;
      } catch (r2Error) {
        logger.warn('R2 upload failed, falling back to data URL', { error: r2Error });
      }
    }

    // Fallback if R2 not configured or errored: provide inline base64 Data URL only within safe payload size
    if (!publicUrl) {
      if (buffer.length > MAX_INLINE_DATA_URL_BYTES) {
        return NextResponse.json(
          {
            error:
              'File is too large for inline upload while cloud storage is unavailable. Please use a file under 1.5 MB or paste an asset URL.',
          },
          { status: 413 }
        );
      }
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
