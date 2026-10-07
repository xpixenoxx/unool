/**
 * Cloudflare R2 Storage Client
 * S3-compatible — uses @aws-sdk/client-s3 + @aws-sdk/s3-request-presigner
 *
 * Buckets used:
 *   - post-media  → composer uploads, optimized images
 *   - avatars     → profile pictures
 *
 * Required env vars:
 *   CF_R2_ACCOUNT_ID, CF_R2_ACCESS_KEY_ID, CF_R2_SECRET_ACCESS_KEY,
 *   CF_R2_BUCKET_NAME (default bucket), CF_R2_PUBLIC_URL
 *
 * Optional per-bucket overrides:
 *   CF_R2_AVATARS_BUCKET_NAME   (defaults to CF_R2_BUCKET_NAME)
 *   CF_R2_MEDIA_BUCKET_NAME     (defaults to CF_R2_BUCKET_NAME)
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// ---------------------------------------------------------------------------
// Client singleton
// ---------------------------------------------------------------------------

export function getR2Client(): S3Client {
  const accountId = process.env.CF_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CF_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CF_R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Cloudflare R2 is not configured. Please set CF_R2_ACCOUNT_ID, CF_R2_ACCESS_KEY_ID, and CF_R2_SECRET_ACCESS_KEY in your environment.'
    );
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
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
