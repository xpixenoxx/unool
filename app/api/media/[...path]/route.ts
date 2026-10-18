import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getR2Client, getBucketName } from '@/lib/storage/r2';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    if (!path || path.length === 0) {
      return NextResponse.json({ error: 'File path required' }, { status: 400 });
    }

    const key = path.join('/');

    // Security check: prevent directory traversal
    if (key.includes('..') || key.startsWith('/')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const client = getR2Client();
    const command = new GetObjectCommand({
      Bucket: getBucketName('post-media'),
      Key: key,
    });

    const response = await client.send(command);

    if (!response.Body) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const headers = new Headers();
    if (response.ContentType) {
      headers.set('Content-Type', response.ContentType);
    }
    if (response.ContentLength) {
      headers.set('Content-Length', response.ContentLength.toString());
    }
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('X-Content-Type-Options', 'nosniff');

    // Return the stream directly — masking Cloudflare completely
    return new Response(response.Body as any, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    if (error?.name === 'NoSuchKey' || error?.$metadata?.httpStatusCode === 404) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    logger.error('Error serving media via proxy', { error });
    return NextResponse.json({ error: 'Failed to retrieve media' }, { status: 500 });
  }
}
