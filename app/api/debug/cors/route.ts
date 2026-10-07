import { NextResponse } from 'next/server';
import { PutBucketCorsCommand } from '@aws-sdk/client-s3';
import { getR2Client, getBucketName } from '@/lib/storage/r2';

export async function GET() {
  try {
    const client = getR2Client();
    
    // We want to allow GET, PUT, POST, DELETE, HEAD from any origin (or specific origin)
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

    const mediaBucket = getBucketName('post-media');
    const avatarsBucket = getBucketName('avatars');

    await client.send(
      new PutBucketCorsCommand({
        Bucket: mediaBucket,
        CORSConfiguration: corsRules,
      })
    );

    await client.send(
      new PutBucketCorsCommand({
        Bucket: avatarsBucket,
        CORSConfiguration: corsRules,
      })
    );

    return NextResponse.json({
      success: true,
      message: `Successfully set CORS rules on buckets: ${mediaBucket}, ${avatarsBucket}`,
    });
  } catch (error: any) {
    console.error('Failed to setup CORS', error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error configuring CORS',
    }, { status: 500 });
  }
}
