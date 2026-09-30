import { getSupabaseBrowserClient } from './browser';

export async function uploadMediaFile(file: File, path: string): Promise<{ url: string; path: string }> {
  const supabase = getSupabaseBrowserClient();
  
  // Upload to Supabase Storage (post-media bucket)
  const { data, error } = await supabase.storage
    .from('post-media')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload media: ${error.message}`);
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('post-media')
    .getPublicUrl(data.path);

  return {
    url: publicUrlData.publicUrl,
    path: data.path,
  };
}
