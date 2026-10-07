import { createBrowserClient } from '@supabase/ssr';

// Browser-side Supabase client using @supabase/ssr
// This correctly syncs session cookies between client and server,
// preventing "session expired" errors after OAuth login.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!_client) {
    _client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return _client;
}

/**
 * Returns the current user's access_token from the browser session.
 * Returns null if the user is not signed in.
 */
export async function getAccessToken(): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}
