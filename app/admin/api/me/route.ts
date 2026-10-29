import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({
    admin: {
      userId: auth.admin.userId,
      email: auth.admin.email,
      role: auth.admin.role,
      permissions: auth.admin.permissions,
    },
  });
}

