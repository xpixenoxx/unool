import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { planEnforcement } from '@/lib/middleware/plan-enforcement-middleware';

export async function POST(request: NextRequest) {
  return planEnforcement.createPost(request, async (request) => {
    try {
      const { filename, contentType } = await request.json();
      
      if (!filename || !contentType) {
        return NextResponse.json({ error: 'Filename and content type are required' }, { status: 400 });
      }

      const safeFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${filename.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
      const path = `uploads/${safeFilename}`;

      const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

      // Try to create the bucket (fails safely if it already exists)
      await supabase.storage.createBucket('post-media', { public: true });

      // Generate a signed upload URL
      const { data, error } = await supabase.storage
        .from('post-media')
        .createSignedUploadUrl(path);

      if (error) {
        logger.error('Supabase signed URL error', { error });
        return NextResponse.json({ error: `Failed to generate upload URL: ${error.message}` }, { status: 500 });
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('post-media')
        .getPublicUrl(path);

      return NextResponse.json({
        success: true,
        signedUrl: data.signedUrl,
        token: data.token,
        path: data.path,
        url: publicUrlData.publicUrl,
        type: contentType.startsWith('video/') ? 'video' : 'image',
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Upload API error', { error: err });
      return NextResponse.json({ error: 'Failed to process upload' }, { status: 500 });
    }
  });
}
