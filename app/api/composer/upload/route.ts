import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { planEnforcement } from '@/lib/middleware/plan-enforcement-middleware';

export async function POST(request: NextRequest) {
  return planEnforcement.createPost(request, async (request) => {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      // Read file into buffer
      const buffer = await file.arrayBuffer();
      const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${file.name}`;
      const path = `uploads/${filename}`;

      const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

      // Try to create the bucket (fails safely if it already exists)
      await supabase.storage.createBucket('post-media', { public: true });

      // Upload to post-media bucket
      const { data, error } = await supabase.storage
        .from('post-media')
        .upload(path, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        logger.error('Supabase storage upload error', { error });
        return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('post-media')
        .getPublicUrl(data.path);

      return NextResponse.json({
        success: true,
        url: publicUrlData.publicUrl,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Upload API error', { error: err });
      return NextResponse.json({ error: 'Failed to process upload' }, { status: 500 });
    }
  });
}
