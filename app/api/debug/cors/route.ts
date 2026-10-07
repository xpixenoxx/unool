/**
 * GET /api/debug/cors
 *
 * Diagnostic endpoint for Cloudflare R2 storage connectivity.
 *
 * IMPORTANT: Cloudflare R2 does NOT support the S3 PutBucketCors API.
 * CORS on R2 must be configured manually via the Cloudflare Dashboard:
 *   Dashboard → R2 → <bucket> → Settings → CORS Policy
 *
 * This endpoint instead:
 *  1. Verifies R2 credentials are present
 *  2. Verifies bucket names are configured
 *  3. Returns the exact CORS JSON you should paste into the Dashboard
 */
import { NextResponse } from 'next/server';
import { getBucketName } from '@/lib/storage/r2';

export async function GET() {
  const accountId = process.env.CF_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CF_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CF_R2_SECRET_ACCESS_KEY;

  const checks: Record<string, { ok: boolean; value?: string; message: string }> = {
    CF_R2_ACCOUNT_ID: {
      ok: Boolean(accountId),
      value: accountId ? `${accountId.slice(0, 6)}…` : undefined,
      message: accountId ? 'Set ✓' : '❌ Missing — set in your environment variables',
    },
    CF_R2_ACCESS_KEY_ID: {
      ok: Boolean(accessKeyId),
      value: accessKeyId ? `${accessKeyId.slice(0, 6)}…` : undefined,
      message: accessKeyId ? 'Set ✓' : '❌ Missing',
    },
    CF_R2_SECRET_ACCESS_KEY: {
      ok: Boolean(secretAccessKey),
      message: secretAccessKey ? 'Set ✓' : '❌ Missing',
    },
  };

  let mediaBucket: string | null = null;
  let avatarsBucket: string | null = null;

  try {
    mediaBucket = getBucketName('post-media');
    checks['CF_R2_MEDIA_BUCKET_NAME'] = { ok: true, value: mediaBucket, message: 'Set ✓' };
  } catch {
    checks['CF_R2_MEDIA_BUCKET_NAME'] = { ok: false, message: '❌ Missing — set CF_R2_MEDIA_BUCKET_NAME or CF_R2_BUCKET_NAME' };
  }

  try {
    avatarsBucket = getBucketName('avatars');
    checks['CF_R2_AVATARS_BUCKET_NAME'] = { ok: true, value: avatarsBucket, message: 'Set ✓' };
  } catch {
    checks['CF_R2_AVATARS_BUCKET_NAME'] = { ok: false, message: '❌ Missing — set CF_R2_AVATARS_BUCKET_NAME or CF_R2_BUCKET_NAME' };
  }

  const mediaPublicUrl = process.env.CF_R2_MEDIA_PUBLIC_URL;
  const avatarsPublicUrl = process.env.CF_R2_AVATARS_PUBLIC_URL;

  checks['CF_R2_MEDIA_PUBLIC_URL'] = {
    ok: Boolean(mediaPublicUrl),
    value: mediaPublicUrl,
    message: mediaPublicUrl ? 'Set ✓' : '❌ Missing — get from R2 bucket → Settings → Public Access',
  };

  checks['CF_R2_AVATARS_PUBLIC_URL'] = {
    ok: Boolean(avatarsPublicUrl),
    value: avatarsPublicUrl,
    message: avatarsPublicUrl ? 'Set ✓' : '❌ Missing — get from R2 bucket → Settings → Public Access',
  };

  const allOk = Object.values(checks).every((c) => c.ok);

  // The exact CORS JSON to paste into the Cloudflare Dashboard for each bucket:
  //   Dashboard → R2 → <bucket> → Settings → CORS Policy → Add rule (paste JSON)
  const corsPolicy = [
    {
      AllowedOrigins: ['*'],
      AllowedMethods: ['GET', 'PUT', 'HEAD'],
      AllowedHeaders: ['*'],
      ExposeHeaders: ['ETag'],
      MaxAgeSeconds: 3600,
    },
  ];

  return NextResponse.json({
    status: allOk ? 'ok' : 'misconfigured',
    checks,
    important: {
      message:
        'Cloudflare R2 does NOT support the S3 CORS API (PutBucketCorsCommand). ' +
        'CORS must be configured manually in the Cloudflare Dashboard for browser direct uploads (presigned PUT URLs) to work.',
      steps: [
        `1. Go to: https://dash.cloudflare.com → R2 → "${mediaBucket ?? 'post-media'}" → Settings → CORS Policy`,
        '2. Click "Add CORS policy" and paste the corsPolicy JSON below',
        `3. Repeat for: "${avatarsBucket ?? 'avatars'}"`,
        '4. Save — no server restart needed',
      ],
      corsPolicy,
    },
  });
}
