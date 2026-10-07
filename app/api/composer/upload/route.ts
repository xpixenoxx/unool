import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { planEnforcement } from '@/lib/middleware/plan-enforcement-middleware';
import { createR2PresignedUploadUrl, buildR2Key } from '@/lib/storage/r2';

export async function POST(request: NextRequest) {
  return planEnforcement.createPost(request, async (request) => {
    try {
      const { filename, contentType } = await request.json();

      if (!filename || !contentType) {
        return NextResponse.json(
          { error: 'Filename and content type are required' },
          { status: 400 }
        );
      }

      const key = buildR2Key('uploads', filename);

      // Generate a presigned PUT URL — the browser uploads directly to R2
      const { signedUrl, publicUrl } = await createR2PresignedUploadUrl({
        bucket: 'post-media',
        key,
        contentType,
      });

      const type =
        contentType === 'application/pdf'
          ? 'document'
          : contentType.startsWith('video/')
            ? 'video'
            : 'image';

      return NextResponse.json({
        success: true,
        signedUrl,
        path: key,
        url: publicUrl,
        type,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Upload API error', { error: err });
      return NextResponse.json(
        { error: 'Failed to process upload' },
        { status: 500 }
      );
    }
  });
}
