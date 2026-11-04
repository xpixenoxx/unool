// Re-export browser client for backwards compatibility with any @/lib/supabase/client imports
export {
  getSupabaseBrowserClient,
  getSupabaseBrowserClient as createSupabaseBrowserClient,
  getAccessToken,
} from './browser';
