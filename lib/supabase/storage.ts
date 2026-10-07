/**
 * lib/supabase/storage.ts
 *
 * Re-exported as a thin wrapper around R2 so any existing imports of
 * `uploadMediaFile` from this module continue to work without changes.
 */

import { uploadToR2, buildR2Key } from '@/lib/storage/r2';

export async function uploadMediaFile(
  file: File,
  _path: string
): Promise<{ url: string; path: string }> {
  const key = buildR2Key('uploads', file.name);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { url, key: uploadedKey } = await uploadToR2({
    bucket: 'post-media',
    key,
    body: buffer,
    contentType: file.type,
  });

  return { url, path: uploadedKey };
}
