/**
 * Cloudflare R2 Storage Client
 * S3-compatible — uses @aws-sdk/client-s3 + @aws-sdk/s3-request-presigner
 *
 * Buckets used:
 *   - post-media  → composer uploads, optimized images
 *   - avatars     → profile pictures
 *
 * Required env vars:
 *   CF_R2_ACCOUNT_ID           – Cloudflare Account ID
 *   CF_R2_ACCESS_KEY_ID        – R2 API token access key
 *   CF_R2_SECRET_ACCESS_KEY    – R2 API token secret key
 *   CF_R2_MEDIA_BUCKET_NAME    – name of the post-media bucket
 *   CF_R2_AVATARS_BUCKET_NAME  – name of the avatars bucket
 *   CF_R2_MEDIA_PUBLIC_URL     – public base URL for post-media bucket
 *   CF_R2_AVATARS_PUBLIC_URL   – public base URL for avatars bucket
 *
 * ⚠️  CORS: Cloudflare R2 does NOT support the S3 PutBucketCors API.
 *   CORS must be configured manually in the Cloudflare Dashboard:
 *     Dashboard → R2 → <bucket> → Settings → CORS Policy
 *   Visit GET /api/debug/cors to get the exact JSON to paste there.
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// ---------------------------------------------------------------------------
// Client singleton — one shared instance per server process
// ---------------------------------------------------------------------------

let _r2Client: S3Client | null = null;

export function getR2Client(): S3Client {
  if (_r2Client) return _r2Client;

  const accountId = process.env.CF_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CF_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CF_R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Cloudflare R2 is not configured. ' +
        'Set CF_R2_ACCOUNT_ID, CF_R2_ACCESS_KEY_ID, and CF_R2_SECRET_ACCESS_KEY in your environment.'
    );
  }

  _r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    // ⚠️  CRITICAL: Do NOT add forcePathStyle: true.
    //
    // With forcePathStyle the SDK generates path-style URLs:
    //   https://<accountId>.r2.cloudflarestorage.com/<bucket>/<key>?X-Amz-Signature=...
    //
    // R2 presigned PUT URLs require virtual-hosted-style:
    //   https://<bucket>.<accountId>.r2.cloudflarestorage.com/<key>?X-Amz-Signature=...
    //
    // Path-style presigned URLs silently fail (403 / "Failed to fetch") in R2.
    // The default (no forcePathStyle) is correct. Do not change this.
  });

  return _r2Client;
}

// ---------------------------------------------------------------------------
// Bucket resolution helpers
// ---------------------------------------------------------------------------

export type R2Bucket = 'post-media' | 'avatars';

export function getBucketName(bucket: R2Bucket): string {
  const envMap: Record<R2Bucket, string | undefined> = {
    'post-media': process.env.CF_R2_MEDIA_BUCKET_NAME,
    avatars: process.env.CF_R2_AVATARS_BUCKET_NAME,
  };
  const resolved = envMap[bucket] || process.env.CF_R2_BUCKET_NAME;
  if (!resolved) {
    throw new Error(
      `R2 bucket name not configured. Set CF_R2_BUCKET_NAME (or CF_R2_${bucket === 'avatars' ? 'AVATARS' : 'MEDIA'}_BUCKET_NAME) in your environment.`
    );
  }
  return resolved;
}

function getPublicUrl(bucket: R2Bucket, key: string): string {
  const envMap: Record<R2Bucket, string | undefined> = {
    'post-media': process.env.CF_R2_MEDIA_PUBLIC_URL,
    avatars: process.env.CF_R2_AVATARS_PUBLIC_URL,
  };
  const base = envMap[bucket] || process.env.CF_R2_PUBLIC_URL;
  if (!base) {
    throw new Error(`Public URL not configured for bucket ${bucket}. Set CF_R2_MEDIA_PUBLIC_URL and CF_R2_AVATARS_PUBLIC_URL.`);
  }
  const baseUrl = base.replace(/\/$/, '');
  return `${baseUrl}/${key}`;
}

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

/**
 * Upload a Buffer / Uint8Array directly to R2 (server-side).
 * Returns the public URL of the uploaded file.
 */
export async function uploadToR2({
  bucket,
  key,
  body,
  contentType,
}: {
  bucket: R2Bucket;
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}): Promise<{ url: string; key: string }> {
  const client = getR2Client();
  const bucketName = getBucketName(bucket);

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return {
    url: getPublicUrl(bucket, key),
    key,
  };
}

/**
 * Generate a presigned PUT URL so the browser can upload directly to R2
 * without routing the binary data through your server.
 * Expires in 10 minutes.
 */
export async function createR2PresignedUploadUrl({
  bucket,
  key,
  contentType,
  expiresInSeconds = 600,
}: {
  bucket: R2Bucket;
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}): Promise<{ signedUrl: string; publicUrl: string; key: string }> {
  const client = getR2Client();
  const bucketName = getBucketName(bucket);

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  const signedUrl = await getSignedUrl(client, command, {
    expiresIn: expiresInSeconds,
  });

  return {
    signedUrl,
    publicUrl: getPublicUrl(bucket, key),
    key,
  };
}

/**
 * Delete an object from R2 by key.
 */
export async function deleteFromR2({
  bucket,
  key,
}: {
  bucket: R2Bucket;
  key: string;
}): Promise<void> {
  const client = getR2Client();
  const bucketName = getBucketName(bucket);

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
  );
}

/**
 * Check if an object exists in R2.
 */
export async function existsInR2({
  bucket,
  key,
}: {
  bucket: R2Bucket;
  key: string;
}): Promise<boolean> {
  try {
    const client = getR2Client();
    const bucketName = getBucketName(bucket);
    await client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Build a safe, unique file key from a filename.
 * Example: uploads/1234567890-abc123-myfile.jpg
 */
export function buildR2Key(folder: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9.\-_]/g, '');
  const unique = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  return `${folder}/${unique}-${safe}`;
}
