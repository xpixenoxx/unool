import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getR2Client, getBucketName, R2Bucket } from '@/lib/storage/r2';
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

    const isAvatar = key.startsWith('avatars/') || key.startsWith('avatar/');
    const bucketTypes: R2Bucket[] = isAvatar ? ['avatars', 'post-media'] : ['post-media', 'avatars'];

    let response: any = null;

    try {
      const client = getR2Client();

      for (const bType of bucketTypes) {
        try {
          const bucketName = getBucketName(bType);

          // Try exact key first
          try {
            const command = new GetObjectCommand({
              Bucket: bucketName,
              Key: key,
            });
            response = await client.send(command);
            if (response?.Body) break;
          } catch {
            // If in avatars bucket and key has avatars/ prefix, also try stripped key
            if (bType === 'avatars' && key.startsWith('avatars/')) {
              const strippedKey = key.replace(/^avatars\//, '');
              const command = new GetObjectCommand({
                Bucket: bucketName,
                Key: strippedKey,
              });
              response = await client.send(command);
              if (response?.Body) break;
            }
          }
        } catch {
          // Continue to next bucket
        }
      }
    } catch (clientErr) {
      logger.warn('Failed to initialize R2 client in media proxy, trying public fallback', { error: clientErr });
    }

    // Direct stream if S3 GetObject succeeded
    if (response?.Body) {
      const headers = new Headers();
      if (response.ContentType) {
        headers.set('Content-Type', response.ContentType);
      }
      if (response.ContentLength) {
        headers.set('Content-Length', response.ContentLength.toString());
      }
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      headers.set('X-Content-Type-Options', 'nosniff');

      return new Response(response.Body as any, {
        status: 200,
        headers,
      });
    }

    // Fallback: If S3 direct access fails, attempt to fetch from public R2 CDN url
    const publicBase = isAvatar
      ? (process.env.CF_R2_AVATARS_PUBLIC_URL || process.env.CF_R2_PUBLIC_URL || 'https://pub-57d0363ef140459e84fc586c4719e4a4.r2.dev')
      : (process.env.CF_R2_MEDIA_PUBLIC_URL || process.env.CF_R2_PUBLIC_URL || 'https://pub-57d0363ef140459e84fc586c4719e4a4.r2.dev');

    if (publicBase) {
      try {
        const cleanBase = publicBase.replace(/\/$/, '');
        const targetUrl = `${cleanBase}/${key}`;
        const fetchRes = await fetch(targetUrl);
        if (fetchRes.ok && fetchRes.body) {
          const headers = new Headers();
          const ct = fetchRes.headers.get('content-type');
          if (ct) headers.set('Content-Type', ct);
          const cl = fetchRes.headers.get('content-length');
          if (cl) headers.set('Content-Length', cl);
          headers.set('Cache-Control', 'public, max-age=31536000, immutable');
          headers.set('X-Content-Type-Options', 'nosniff');
          return new Response(fetchRes.body, { status: 200, headers });
        }
      } catch (fetchErr) {
        logger.warn('Fallback public fetch failed in media proxy', { error: fetchErr, key });
      }
    }

    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  } catch (error: any) {
    if (error?.name === 'NoSuchKey' || error?.$metadata?.httpStatusCode === 404) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    logger.error('Error serving media via proxy', { error });
    return NextResponse.json({ error: 'Failed to retrieve media' }, { status: 500 });
  }
}
