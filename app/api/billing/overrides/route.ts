import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { getAllOverridesForWorkspace } from '@/lib/billing/overrides';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/billing/overrides
 * Returns all active custom-pricing overrides for the authenticated workspace.
 * Used by the billing page to show "Special pricing" badges to the user.
 * Response: { overrides: Record<planId, { monthlyInr, yearlyInr, annualMonthlyInr, note }> }
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ overrides: {} }, { status: 401 });
    }

    const raw = await getAllOverridesForWorkspace(auth.workspaceId);

    // Convert paise → rupees for the client; only expose display values (no raw IDs)
    const overrides: Record<string, {
      monthlyInr: number | null;
      yearlyInr: number | null;
      annualMonthlyInr: number | null;
      note: string | null;
    }> = {};

    for (const [planId, o] of Object.entries(raw)) {
      overrides[planId] = {
        monthlyInr: o.custom_monthly_inr != null ? Math.round(o.custom_monthly_inr / 100) : null,
        yearlyInr: o.custom_yearly_inr != null ? Math.round(o.custom_yearly_inr / 100) : null,
        annualMonthlyInr: o.custom_annual_monthly_inr != null ? Math.round(o.custom_annual_monthly_inr / 100) : null,
        note: o.note ?? null,
      };
    }

    return NextResponse.json(
      { overrides },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
        },
      }
    );
  } catch (err) {
    console.error('[billing/overrides] GET error:', err);
    return NextResponse.json({ overrides: {} });
  }
}

