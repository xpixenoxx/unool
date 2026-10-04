import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import type { Platform } from '@/lib/repositories/interfaces/IPostRepository';
import type { PostMedia } from '@/lib/repositories/interfaces/IPostRepository';
import { logger } from '@/lib/logger';

const adminSupabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

interface AspectRatioConstraint {
  targetRatio: number;
}

const PLATFORM_CONSTRAINTS: Partial<Record<Platform, AspectRatioConstraint>> = {
  instagram: { targetRatio: 4 / 5 }, // 4:5 is best for IG feed
  pinterest: { targetRatio: 2 / 3 }, // 2:3 is best for Pinterest
};

export async function optimizeMediaForPlatform(
  mediaUrls: PostMedia[],
  platform: Platform
): Promise<PostMedia[]> {
  const constraint = PLATFORM_CONSTRAINTS[platform];
  
  if (!constraint) {
    // Platform does not have strict constraints; return original
    return mediaUrls;
  }

  const optimizedMedia: PostMedia[] = [];

  for (const media of mediaUrls) {
    if (media.type !== 'image') {
      optimizedMedia.push(media);
      continue;
    }

    try {
      // 1. Download original image
      const response = await fetch(media.url);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 2. Inspect image
      const image = sharp(buffer);
      const metadata = await image.metadata();
      
      if (!metadata.width || !metadata.height) {
        optimizedMedia.push(media);
        continue;
      }

      const currentRatio = metadata.width / metadata.height;
      const targetRatio = constraint.targetRatio;

      // Close enough to avoid unnecessary processing
      if (Math.abs(currentRatio - targetRatio) < 0.05) {
        optimizedMedia.push(media);
        continue;
      }

      logger.info('Optimizing image for platform', { 
        platform, 
        currentRatio, 
        targetRatio 
      });

      // 3. Calculate new dimensions based on contain (padding)
      let newWidth, newHeight;
      if (currentRatio > targetRatio) {
        // Image is wider than target. Width is bottleneck. Pad height.
        newWidth = metadata.width;
        newHeight = Math.round(metadata.width / targetRatio);
      } else {
        // Image is taller than target. Height is bottleneck. Pad width.
        newHeight = metadata.height;
        newWidth = Math.round(metadata.height * targetRatio);
      }

      // 4. Resize and pad
      const optimizedBuffer = await image
        .resize({
          width: newWidth,
          height: newHeight,
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 } // White padding
        })
        .jpeg({ quality: 90 })
        .toBuffer();

      // 5. Upload back to Supabase
      const fileName = `optimized/${platform}_${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await adminSupabase.storage
        .from('post-media')
        .upload(fileName, optimizedBuffer, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = adminSupabase.storage
        .from('post-media')
        .getPublicUrl(fileName);

      optimizedMedia.push({
        ...media,
        url: publicUrl,
      });

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to optimize image, falling back to original', { error: err, platform });
      optimizedMedia.push(media);
    }
  }

  return optimizedMedia;
}
