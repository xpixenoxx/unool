import sharp from 'sharp';
import type { Platform, PostMedia } from '@/lib/repositories/interfaces/IPostRepository';
import { logger } from '@/lib/logger';
import { uploadToR2 } from '@/lib/storage/r2';

// ---------------------------------------------------------------------------
// Platform Image Specification Registry
// ---------------------------------------------------------------------------
// Every supported platform is listed here. When a new platform is added,
// just drop another entry into PLATFORM_IMAGE_SPECS — the rest of the
// pipeline handles it automatically.
// ---------------------------------------------------------------------------

export interface PlatformImageSpec {
  /** Ideal width / height ratio (e.g. 4/5 = 0.8). `null` = no constraint. */
  targetRatio: number | null;
  /** Minimum width in pixels the platform accepts. */
  minWidth?: number;
  /** Minimum height in pixels the platform accepts. */
  minHeight?: number;
  /** Maximum width in pixels the platform accepts. */
  maxWidth: number;
  /** Maximum height in pixels the platform accepts. */
  maxHeight: number;
  /** Enforce mathematically exact integer ratio (e.g. 4:3 where width * 3 === height * 4). */
  exactRatio?: { wRatio: number; hRatio: number };
  /** Maximum file size in bytes after encoding. */
  maxFileSizeBytes: number;
  /** Preferred output format. */
  format: 'jpeg' | 'png' | 'webp';
  /** Starting quality (1-100). The optimizer will step down if the file is too big. */
  quality: number;
  /** Pad colour when letter-boxing to hit the target ratio. */
  background: { r: number; g: number; b: number; alpha: number };
}

/**
 * A sensible baseline used for platforms without strict image requirements.
 * Ensures every image is at least reasonably compressed and capped in size.
 */
const DEFAULT_SPEC: PlatformImageSpec = {
  targetRatio: null,
  maxWidth: 4096,
  maxHeight: 4096,
  maxFileSizeBytes: 10 * 1024 * 1024, // 10 MB
  format: 'jpeg',
  quality: 90,
  background: { r: 255, g: 255, b: 255, alpha: 1 },
};

/**
 * Platform-specific overrides — only list platforms that differ from DEFAULT_SPEC.
 *
 * Any platform NOT listed here automatically inherits DEFAULT_SPEC, so adding
 * a brand-new platform to the `Platform` type requires ZERO changes in this file.
 * You only need to add an entry here if the platform has a specific aspect ratio,
 * a tighter file-size limit, a non-JPEG format, or a non-white background.
 *
 * Sources for constraints:
 *  - Official developer docs / API docs for each platform.
 *  - Where exact numbers aren't published, conservative best-practice values
 *    are used.
 */
const PLATFORM_IMAGE_SPECS: Partial<Record<Platform, PlatformImageSpec>> = {
  // ── Social / Feed ──────────────────────────────────────────────────────
  instagram: {
    targetRatio: 4 / 5,         // 4:5 portrait for max feed real-estate
    maxWidth: 1080,
    maxHeight: 1350,
    maxFileSizeBytes: 8 * 1024 * 1024,
    format: 'jpeg',
    quality: 90,
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  },
  facebook: {
    targetRatio: 1 / 1,         // 1:1 square performs best in feed
    maxWidth: 2048,
    maxHeight: 2048,
    maxFileSizeBytes: 10 * 1024 * 1024,
    format: 'jpeg',
    quality: 85,
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  },
  threads: {
    targetRatio: 4 / 5,         // same as IG
    maxWidth: 1080,
    maxHeight: 1350,
    maxFileSizeBytes: 8 * 1024 * 1024,
    format: 'jpeg',
    quality: 90,
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  },
  linkedin: {
    targetRatio: 1.91 / 1,      // 1.91:1 landscape recommended
    maxWidth: 1200,
    maxHeight: 628,
    maxFileSizeBytes: 10 * 1024 * 1024,
    format: 'jpeg',
    quality: 85,
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  },
  x: {
    targetRatio: 16 / 9,        // 16:9 landscape for timeline cards
    maxWidth: 1600,
    maxHeight: 900,
    maxFileSizeBytes: 5 * 1024 * 1024,
    format: 'jpeg',
    quality: 85,
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  },
  bluesky: {                    // 1 MB hard limit — needs aggressive compression
    targetRatio: null,
    maxWidth: 2000,
    maxHeight: 2000,
    maxFileSizeBytes: 1 * 1024 * 1024,
    format: 'jpeg',
    quality: 80,
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  },

  // ── Visual / Creative ──────────────────────────────────────────────────
  pinterest: {
    targetRatio: 2 / 3,         // 2:3 tall pin for best visibility
    maxWidth: 1000,
    maxHeight: 1500,
    maxFileSizeBytes: 20 * 1024 * 1024,
    format: 'jpeg',
    quality: 90,
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  },
  dribbble: {
    targetRatio: 4 / 3,         // 800×600 or 1600×1200 "shot" standard (4:3)
    minWidth: 400,
    minHeight: 300,
    maxWidth: 1600,
    maxHeight: 1200,
    exactRatio: { wRatio: 4, hRatio: 3 },
    maxFileSizeBytes: 10 * 1024 * 1024,
    format: 'png',              // designers prefer lossless on Dribbble
    quality: 95,
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  },
  youtube: {
    targetRatio: 16 / 9,        // standard video thumbnail
    maxWidth: 1280,
    maxHeight: 720,
    maxFileSizeBytes: 2 * 1024 * 1024,
    format: 'jpeg',
    quality: 85,
    background: { r: 0, g: 0, b: 0, alpha: 1 },  // black letterbox
  },

  // ── Streaming (16:9 with black letterbox) ──────────────────────────────
  twitch: {
    targetRatio: 16 / 9,
    maxWidth: 1920,
    maxHeight: 1080,
    maxFileSizeBytes: 10 * 1024 * 1024,
    format: 'jpeg',
    quality: 85,
    background: { r: 0, g: 0, b: 0, alpha: 1 },
  },
  kick: {
    targetRatio: 16 / 9,
    maxWidth: 1920,
    maxHeight: 1080,
    maxFileSizeBytes: 10 * 1024 * 1024,
    format: 'jpeg',
    quality: 85,
    background: { r: 0, g: 0, b: 0, alpha: 1 },
  },

  // ── Blogging ───────────────────────────────────────────────────────────
  hashnode: {
    targetRatio: 16 / 9,        // cover image best practice
    maxWidth: 1600,
    maxHeight: 900,
    maxFileSizeBytes: 10 * 1024 * 1024,
    format: 'jpeg',
    quality: 85,
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  },

  // ── Newsletters (email-safe width) ─────────────────────────────────────
  listmonk: {
    targetRatio: null,
    maxWidth: 600,               // email clients cap visible width ~600px
    maxHeight: 2000,
    maxFileSizeBytes: 5 * 1024 * 1024,
    format: 'jpeg',
    quality: 80,
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  },

  // ── Utility ────────────────────────────────────────────────────────────
  manual: {
    targetRatio: null,
    maxWidth: 4096,
    maxHeight: 4096,
    maxFileSizeBytes: 50 * 1024 * 1024,
    format: 'jpeg',
    quality: 90,
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  },

  // ─────────────────────────────────────────────────────────────────────
  // Platforms NOT listed here (mastodon, telegram, discord, slack, reddit,
  // medium, devto, warpcast, nostr, lemmy, mewe, vk, skool, whop, and
  // any future platform) automatically use DEFAULT_SPEC.
  // ─────────────────────────────────────────────────────────────────────
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Look up the spec for a platform, falling back to sensible defaults. */
export function getImageSpecForPlatform(platform: Platform): PlatformImageSpec {
  return PLATFORM_IMAGE_SPECS[platform] ?? DEFAULT_SPEC;
}

// ---------------------------------------------------------------------------
// Core optimiser — single entry point
// ---------------------------------------------------------------------------

/**
 * Optimise an array of `PostMedia` items for a given platform.
 *
 * The pipeline for each image:
 *  1. Download the original.
 *  2. Resize / letter-box to hit the platform's target aspect ratio (if any).
 *  3. Clamp to the platform's maximum dimensions.
 *  4. Encode in the preferred format, stepping quality down if the file
 *     exceeds the platform's size limit.
 *  5. Upload the result to R2 and return the new URL.
 *
 * Non-image media (video) is passed through untouched.
 */
export async function optimizeMediaForPlatform(
  mediaUrls: PostMedia[],
  platform: Platform
): Promise<PostMedia[]> {
  const spec = getImageSpecForPlatform(platform);
  const optimizedMedia: PostMedia[] = [];

  for (const media of mediaUrls) {
    if (media.type !== 'image') {
      optimizedMedia.push(media);
      continue;
    }

    try {
      // 1. Fetch original image ------------------------------------------------
      let buffer: Buffer;
      if (media.url.startsWith('data:')) {
        const base64Data = media.url.split(',')[1];
        buffer = Buffer.from(base64Data, 'base64');
      } else {
        const response = await fetch(media.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        buffer = Buffer.from(await response.arrayBuffer());
      }

      // 2. Read metadata -------------------------------------------------------
      const image = sharp(buffer);
      const metadata = await image.metadata();

      if (!metadata.width || !metadata.height) {
        optimizedMedia.push(media);
        continue;
      }

      let targetWidth = metadata.width;
      let targetHeight = metadata.height;

      // 3. Aspect-ratio adjustment (letter-box / pillar-box) -------------------
      if (spec.exactRatio) {
        // Platform requires mathematically exact integer ratio (e.g. Dribbble 4:3)
        // Standard Dribbble resolutions: 1600x1200 (Retina) or 800x600 (Standard)
        const origW = metadata.width;
        const origH = metadata.height;
        const targetW = (origW <= 800 && origH <= 600) ? 800 : 1600;
        const targetH = Math.round((targetW * spec.exactRatio.hRatio) / spec.exactRatio.wRatio);
        targetWidth = targetW;
        targetHeight = targetH;
      } else if (spec.targetRatio !== null) {
        const currentRatio = targetWidth / targetHeight;

        // Pad to target ratio if difference exceeds 0.5%
        if (Math.abs(currentRatio - spec.targetRatio) >= 0.005) {
          if (currentRatio > spec.targetRatio) {
            // Wider than target → pad height
            targetHeight = Math.round(targetWidth / spec.targetRatio);
          } else {
            // Taller than target → pad width
            targetWidth = Math.round(targetHeight * spec.targetRatio);
          }

          logger.info('Adjusting aspect ratio for platform', {
            platform,
            from: `${metadata.width}×${metadata.height}`,
            to: `${targetWidth}×${targetHeight}`,
            targetRatio: spec.targetRatio,
          });
        }
      }

      // 4. Clamp to maximum & minimum dimensions --------------------------------
      if (targetWidth > spec.maxWidth || targetHeight > spec.maxHeight) {
        const scale = Math.min(
          spec.maxWidth / targetWidth,
          spec.maxHeight / targetHeight
        );
        targetWidth = Math.round(targetWidth * scale);
        targetHeight = Math.round(targetHeight * scale);
      }

      if (spec.minWidth && targetWidth < spec.minWidth) {
        const scale = spec.minWidth / targetWidth;
        targetWidth = spec.minWidth;
        targetHeight = Math.round(targetHeight * scale);
      }
      if (spec.minHeight && targetHeight < spec.minHeight) {
        const scale = spec.minHeight / targetHeight;
        targetHeight = spec.minHeight;
        targetWidth = Math.round(targetWidth * scale);
      }

      // If exact integer ratio is required, ensure width * hRatio === height * wRatio exactly
      if (spec.exactRatio) {
        const { wRatio, hRatio } = spec.exactRatio;
        targetWidth = Math.round(targetWidth / wRatio) * wRatio;
        targetHeight = Math.round((targetWidth / wRatio) * hRatio);
        if (spec.maxWidth && targetWidth > spec.maxWidth) {
          targetWidth = spec.maxWidth;
          targetHeight = Math.round((targetWidth / wRatio) * hRatio);
        }
        if (spec.minWidth && targetWidth < spec.minWidth) {
          targetWidth = spec.minWidth;
          targetHeight = Math.round((targetWidth / wRatio) * hRatio);
        }
      }

      // Skip processing only if dimensions, format, and ratio are already 100% compliant
      const exactRatioMatches = !spec.exactRatio || (metadata.width * spec.exactRatio.hRatio === metadata.height * spec.exactRatio.wRatio);
      const boundsMatch = (!spec.minWidth || metadata.width >= spec.minWidth) &&
                          (!spec.minHeight || metadata.height >= spec.minHeight) &&
                          (!spec.maxWidth || metadata.width <= spec.maxWidth) &&
                          (!spec.maxHeight || metadata.height <= spec.maxHeight);
      const dimensionsUnchanged = targetWidth === metadata.width && targetHeight === metadata.height;
      const ratioUnchanged = spec.targetRatio === null || (exactRatioMatches && boundsMatch);

      if (dimensionsUnchanged && ratioUnchanged && metadata.format === spec.format) {
        optimizedMedia.push(media);
        continue;
      }

      // 5. Resize / pad --------------------------------------------------------
      let pipeline = sharp(buffer).resize({
        width: targetWidth,
        height: targetHeight,
        fit: 'contain',
        background: spec.background,
      });

      // 6. Encode in preferred format ------------------------------------------
      let quality = spec.quality;
      let outputBuffer: Buffer;

      // Encode once, then step quality down if the file is too large
      const encode = async (q: number): Promise<Buffer> => {
        const p = sharp(buffer).resize({
          width: targetWidth,
          height: targetHeight,
          fit: 'contain',
          background: spec.background,
        });

        switch (spec.format) {
          case 'png':
            return p.png({ quality: q, compressionLevel: 9 }).toBuffer();
          case 'webp':
            return p.webp({ quality: q }).toBuffer();
          case 'jpeg':
          default:
            return p.jpeg({ quality: q }).toBuffer();
        }
      };

      outputBuffer = await encode(quality);

      // Step quality down in increments of 5 until within the size limit
      const MIN_QUALITY = 40;
      while (
        outputBuffer.length > spec.maxFileSizeBytes &&
        quality > MIN_QUALITY
      ) {
        quality -= 5;
        logger.info('Reducing quality to meet size limit', {
          platform,
          quality,
          currentSizeKB: Math.round(outputBuffer.length / 1024),
          limitKB: Math.round(spec.maxFileSizeBytes / 1024),
        });
        outputBuffer = await encode(quality);
      }

      // 7. Upload to R2 / Supabase Storage with Data URI fallback ---------------
      const mimeType =
        spec.format === 'png'
          ? 'image/png'
          : spec.format === 'webp'
            ? 'image/webp'
            : 'image/jpeg';
      const ext = spec.format === 'jpeg' ? 'jpg' : spec.format;

      const key = `optimized/${platform}_${crypto.randomUUID()}.${ext}`;
      let publicUrl = '';

      try {
        const { uploadToR2 } = await import('@/lib/storage/r2');
        const res = await uploadToR2({
          bucket: 'post-media',
          key,
          body: outputBuffer,
          contentType: mimeType,
        });
        publicUrl = res.url;
      } catch (r2Err) {
        logger.warn('ImageOptimizer: R2 upload failed, attempting Supabase fallback', { error: r2Err });
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const { config } = await import('@/lib/config/schema');
          if (config.SUPABASE_URL && config.SUPABASE_SERVICE_ROLE_KEY && !config.SUPABASE_URL.includes('your-project')) {
            const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
            const { error: supaErr } = await supabase.storage.from('post-media').upload(key, outputBuffer, {
              contentType: mimeType,
              upsert: true,
            });
            if (!supaErr) {
              const { data: pubData } = supabase.storage.from('post-media').getPublicUrl(key);
              publicUrl = pubData.publicUrl;
            }
          }
        } catch (supaErr) {
          logger.warn('ImageOptimizer: Supabase fallback upload failed', { error: supaErr });
        }

        // If remote storage is unconfigured or failed, use self-contained Data URI
        // Node.js fetch() natively supports data: URIs, preserving the optimized image buffer
        if (!publicUrl) {
          publicUrl = `data:${mimeType};base64,${outputBuffer.toString('base64')}`;
        }
      }

      optimizedMedia.push({ ...media, url: publicUrl });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to optimize image, falling back to original', {
        error: err,
        platform,
      });
      // Graceful degradation — use the original rather than blocking publish
      optimizedMedia.push(media);
    }
  }

  return optimizedMedia;
}
