import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, 'payments');
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    const order = await adminRepository.getPaymentOrderById(id);
    if (!order) {
      return NextResponse.json({ error: 'Payment order not found' }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (error) {
    console.error('Admin get payment order error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment order' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, 'payments');
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    const body = await request.json();
    const { status, reason } = body;

    if (!status || !reason) {
      return NextResponse.json(
        { error: 'Status and reason are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['PENDING', 'PAID', 'FAILED', 'EXPIRED', 'REFUNDED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const updated = await adminRepository.updatePaymentOrderStatus(
      id,
      status,
      auth.admin.userId,
      reason
    );

    if (!updated) {
      return NextResponse.json({ error: 'Payment order not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Admin update payment order error:', error);
    return NextResponse.json(
      { error: 'Failed to update payment order' },
      { status: 500 }
    );
  }
}

