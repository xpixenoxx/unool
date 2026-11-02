import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { getFeatureFlagsServer, setFeatureFlagServer } from '@/lib/feature-flags-server';

export const dynamic = 'force-dynamic';

// GET /api/admin/feature-flags — list all feature flags (any authenticated admin)
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const flagsObj = await getFeatureFlagsServer();
    const flagsList = Object.entries(flagsObj).map(([flag_key, flag_value]) => ({
      flag_key,
      flag_value,
    }));
    return NextResponse.json({ flags: flagsList });
  } catch (error) {
    console.error('[admin/feature-flags GET] Failed:', error);
    return NextResponse.json({ error: 'Failed to load feature flags' }, { status: 500 });
  }
}

// POST /api/admin/feature-flags — upsert a flag value (any authenticated admin)
// Body: { flag_key: string, flag_value: boolean }
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
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

    const adminEmail = auth.admin.email || auth.admin.userId || 'admin';
    await setFeatureFlagServer(flag_key.trim(), flag_value, adminEmail);

    return NextResponse.json({
      success: true,
      flag: { flag_key: flag_key.trim(), flag_value },
    });
  } catch (error) {
    console.error('[admin/feature-flags POST] Failed:', error);
    return NextResponse.json({ error: 'Failed to update feature flag' }, { status: 500 });
  }
}
