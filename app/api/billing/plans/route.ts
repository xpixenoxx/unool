import { NextResponse } from 'next/server';
import { getAllPlans, detectCurrency, formatPrice } from '@/lib/billing/plans';
import type { Currency } from '@/lib/billing/plans';

/**
 * GET /api/billing/plans?country=IN
 * Returns all available plans with pricing for the detected currency.
 * Public endpoint — no auth required (used on pricing page).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const countryCode = url.searchParams.get('country') || undefined;
  const currency: Currency = detectCurrency(countryCode);

  const plans = getAllPlans().map(plan => ({
    id: plan.id,
    name: plan.name,
    tagline: plan.tagline,
    isFreeTier: plan.isFreeTier,
    sortOrder: plan.sortOrder,
    templateCount: plan.templateCount,
    pricing: {
      currency,
      monthly: plan.pricing[currency].monthly,
      annual: plan.pricing[currency].annual,
      annualMonthly: plan.pricing[currency].annualMonthly,
      monthlyDisplay: formatPrice(plan.pricing[currency].monthly, currency),
      annualDisplay: formatPrice(plan.pricing[currency].annual, currency),
      annualMonthlyDisplay: formatPrice(plan.pricing[currency].annualMonthly, currency),
    },
    limits: plan.limits,
    features: plan.features,
  }));

  return NextResponse.json({ plans, currency });
}
