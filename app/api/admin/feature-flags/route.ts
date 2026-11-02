import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';

const adminClient = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

// GET /api/admin/feature-flags — list all feature flags (admin only)
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, 'settings');
  if (auth instanceof NextResponse) return auth;

  try {
    const { data, error } = await adminClient
      .from('admin_feature_flags')
      .select('*')
      .order('flag_key', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ flags: data ?? [] });
  } catch (error) {
    console.error('[admin/feature-flags GET] Failed:', error);
    return NextResponse.json({ error: 'Failed to load feature flags' }, { status: 500 });
  }
}

// POST /api/admin/feature-flags — upsert a flag value (admin only)
// Body: { flag_key: string, flag_value: boolean }
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, 'settings');
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { flag_key, flag_value } = body;

    if (typeof flag_key !== 'string' || flag_key.trim() === '') {
      return NextResponse.json({ error: 'flag_key is required' }, { status: 400 });
    }
    if (typeof flag_value !== 'boolean') {
      return NextResponse.json({ error: 'flag_value must be a boolean' }, { status: 400 });
    }

    const { data, error } = await adminClient
      .from('admin_feature_flags')
      .upsert(
        {
          flag_key: flag_key.trim(),
          flag_value,
          updated_by: auth.admin.email ?? auth.admin.userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'flag_key' }
      )
      .select()
      .single();

    if (error) throw error;

    // Log the admin action for audit trail
    await adminRepository.logAdminAction(
      auth.admin.userId,
      'feature_flag_update',
      'admin_feature_flags',
      flag_key,
      { flag_key, flag_value }
    );

    return NextResponse.json({ flag: data });
  } catch (error) {
    console.error('[admin/feature-flags POST] Failed:', error);
    return NextResponse.json({ error: 'Failed to update feature flag' }, { status: 500 });
  }
}

