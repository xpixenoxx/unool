import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { planEnforcement } from '@/lib/middleware/plan-enforcement-middleware';
import { createR2PresignedUploadUrl, buildR2Key, getR2Client, getBucketName } from '@/lib/storage/r2';
import { PutBucketCorsCommand } from '@aws-sdk/client-s3';

let corsConfigured = false;

async function ensureCorsConfigured() {
  if (corsConfigured) return;
  
  try {
    const client = getR2Client();
    const corsRules = {
      CORSRules: [
        {
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
          AllowedOrigins: ['*'],
          ExposeHeaders: ['ETag', 'x-amz-meta-custom-header'],
          MaxAgeSeconds: 3000,
        },
      ],
    };

    // Apply to both buckets
    await Promise.all([
      client.send(new PutBucketCorsCommand({
        Bucket: getBucketName('post-media'),
        CORSConfiguration: corsRules,
      })),
      client.send(new PutBucketCorsCommand({
        Bucket: getBucketName('avatars'),
        CORSConfiguration: corsRules,
      }))
    ]);
    
    corsConfigured = true;
    logger.info('Successfully configured R2 CORS policies');
  } catch (error) {
    logger.error('Failed to configure R2 CORS policies', { error });
    // Don't throw, let the upload attempt proceed. If CORS fails, it fails in the browser.
  }
}

export async function POST(request: NextRequest) {
  return planEnforcement.createPost(request, async (request) => {
    try {
      // Ensure CORS is configured for Cloudflare R2 on cold starts
      await ensureCorsConfigured();

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
