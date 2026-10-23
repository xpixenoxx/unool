'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CashfreeInstance } from '@cashfreepayments/cashfree-js';

// ── Types ───────────────────────────────────────────────────────

interface PlanPricing {
  currency: string;
  monthly: number;
  annual: number;
  annualMonthly: number;
  monthlyDisplay: string;
  annualDisplay: string;
  annualMonthlyDisplay: string;
}

interface PlanData {
  id: string;
  name: string;
  tagline: string;
  isFreeTier: boolean;
  sortOrder: number;
  templateCount: number;
  pricing: PlanPricing;
  limits: Record<string, number>;
  features: Record<string, boolean>;
}

interface CurrentPlan {
  plan: { id: string; name: string; tagline: string };
  subscription: {
    id: string;
    status: string;
    billingCycle: string;
    amount: string;
    amountPaise: number;
    currency: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    trialEnd: string | null;
    cancelAtPeriodEnd: boolean;
    cancelledAt: string | null;
    paymentMethod: string | null;
  } | null;
  isFreeTier: boolean;
}

type BillingCycle = 'monthly' | 'annual';

// ── Component ───────────────────────────────────────────────────

export default function BillingClient() {
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [currentPlan, setCurrentPlan] = useState<CurrentPlan | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{ status: string; message: string } | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // ── Fetch data ─────────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        const [plansRes, currentRes] = await Promise.all([
          fetch('/api/billing/plans?country=IN'),
          fetch('/api/billing/current'),
        ]);

        if (plansRes.ok) {
          const plansData = await plansRes.json();
          setPlans(plansData.plans);
        }

        if (currentRes.ok) {
          const currentData = await currentRes.json();
          setCurrentPlan(currentData);
        }
      } catch (err) {
        console.error('Failed to load billing data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // ── Payment Verification Polling ───────────────────────────
  const pollVerification = useCallback(async (orderId: string) => {
    setVerifying(true);
    const maxAttempts = 10; // 30 seconds (3s intervals)
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setVerifying(false);
        setPaymentResult({
          status: 'TIMEOUT',
          message: 'Payment verification timed out. If payment was deducted, your plan will activate shortly.',
        });
        return;
      }

      try {
        const res = await fetch(`/api/billing/verify?orderId=${orderId}`);
        const data = await res.json();

        if (data.status === 'PAID') {
          setVerifying(false);
          setPaymentResult({ status: 'PAID', message: data.message });
          // Refresh current plan
          const currentRes = await fetch('/api/billing/current');
          if (currentRes.ok) {
            setCurrentPlan(await currentRes.json());
          }
          return;
        }

        if (data.status === 'FAILED') {
          setVerifying(false);
          setPaymentResult({ status: 'FAILED', message: data.message });
          return;
        }

        // Still pending — poll again
        attempts++;
        setTimeout(poll, 3000);
      } catch {
        attempts++;
        setTimeout(poll, 3000);
      }
    };

    poll();
  }, []);

  // ── Handle Plan Selection ──────────────────────────────────
  const handleSelectPlan = async (planId: string) => {
    if (paymentLoading) return;
    setPaymentLoading(planId);
    setPaymentResult(null);

    try {
      // Create order on server
      const res = await fetch('/api/billing/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          billingCycle,
          currency: 'INR',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setPaymentResult({ status: 'ERROR', message: err.error || 'Failed to create order' });
        return;
      }

      const { paymentSessionId, cfOrderId } = await res.json();

      // Load Cashfree SDK and open checkout
      const cashfree = await loadCashfreeSDK();
      if (!cashfree) {
        setPaymentResult({ status: 'ERROR', message: 'Payment system failed to load. Please refresh.' });
        return;
      }

      // Open Cashfree Drop-in checkout modal
      const checkoutOptions = {
        paymentSessionId,
        redirectTarget: '_modal' as const,
      };

      cashfree.checkout(checkoutOptions).then(() => {
        // Modal closed — start polling for verification
        pollVerification(cfOrderId);
      });
    } catch (err) {
      console.error('Payment error:', err);
      setPaymentResult({ status: 'ERROR', message: 'Something went wrong. Please try again.' });
    } finally {
      setPaymentLoading(null);
    }
  };

  // ── Handle Cancellation ────────────────────────────────────
  const handleCancel = async (immediate: boolean = false) => {
    try {
      const res = await fetch('/api/billing/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ immediate }),
      });

      if (res.ok) {
        setShowCancelModal(false);
        // Refresh current plan
        const currentRes = await fetch('/api/billing/current');
        if (currentRes.ok) {
          setCurrentPlan(await currentRes.json());
        }
      }
    } catch (err) {
      console.error('Cancel failed:', err);
    }
  };

  // ── Loading State ──────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid rgba(139, 92, 246, 0.2)',
          borderTopColor: '#8B5CF6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const currentPlanId = currentPlan?.plan?.id || 'spark';
  const isFreeTier = currentPlan?.isFreeTier !== false;

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
          Billing
        </h1>
        <p style={{ fontSize: 15, color: '#94A3B8', marginTop: 6 }}>
          Manage your subscription and billing preferences
        </p>
      </div>

      {/* ── Current Plan Card ────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        borderRadius: 16,
        padding: 24,
        marginBottom: 32,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontSize: 13, fontWeight: 600, color: '#8B5CF6',
                background: 'rgba(139, 92, 246, 0.15)', padding: '4px 12px',
                borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                Current Plan
              </span>
              {currentPlan?.subscription?.status && (
                <span style={{
                  fontSize: 12, fontWeight: 500,
                  color: currentPlan.subscription.status === 'active' ? '#10B981' : '#F59E0B',
                  background: currentPlan.subscription.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  padding: '3px 10px', borderRadius: 12,
                }}>
                  {currentPlan.subscription.status}
                </span>
              )}
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#F8FAFC', marginTop: 10 }}>
              {currentPlan?.plan?.name || 'Spark'} {isFreeTier ? '(Free)' : ''}
            </h2>
            <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>
              {currentPlan?.plan?.tagline}
            </p>
          </div>

          {!isFreeTier && currentPlan?.subscription && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, color: '#94A3B8' }}>Next billing</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#F8FAFC', marginTop: 2 }}>
                {currentPlan.subscription.currentPeriodEnd
                  ? new Date(currentPlan.subscription.currentPeriodEnd).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })
                  : '—'}
              </div>
              <div style={{ fontSize: 14, color: '#8B5CF6', marginTop: 2 }}>
                {currentPlan.subscription.amount}/{currentPlan.subscription.billingCycle === 'annual' ? 'year' : 'month'}
              </div>
              {!currentPlan.subscription.cancelAtPeriodEnd && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  style={{
                    marginTop: 12, fontSize: 13, color: '#EF4444',
                    background: 'none', border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '6px 16px', borderRadius: 8, cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    (e.target as HTMLElement).style.background = 'rgba(239, 68, 68, 0.1)';
                  }}
                  onMouseLeave={e => {
                    (e.target as HTMLElement).style.background = 'none';
                  }}
                >
                  Cancel Subscription
                </button>
              )}
              {currentPlan.subscription.cancelAtPeriodEnd && (
                <div style={{ marginTop: 8, fontSize: 13, color: '#F59E0B' }}>
                  ⚠ Cancels at end of period
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Payment Result Alert ──────────────────────────────── */}
      {paymentResult && (
        <div style={{
          padding: 16, borderRadius: 12, marginBottom: 24,
          background: paymentResult.status === 'PAID'
            ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${paymentResult.status === 'PAID'
            ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: paymentResult.status === 'PAID' ? '#10B981' : '#EF4444',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontWeight: 600 }}>
              {paymentResult.status === 'PAID' ? '✓ Payment Successful' : '✗ Payment Issue'}
            </div>
            <div style={{ fontSize: 14, marginTop: 2, opacity: 0.9 }}>
              {paymentResult.message}
            </div>
          </div>
          <button
            onClick={() => setPaymentResult(null)}
            style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'inherit' }}
          >
            ×
          </button>
        </div>
      )}

      {verifying && (
        <div style={{
          padding: 16, borderRadius: 12, marginBottom: 24,
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          color: '#60A5FA', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 20, height: 20,
            border: '2px solid rgba(96, 165, 250, 0.3)',
            borderTopColor: '#60A5FA',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          Verifying payment...
        </div>
      )}

      {/* ── Billing Cycle Toggle ──────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 12, marginBottom: 32,
      }}>
        <button
          onClick={() => setBillingCycle('monthly')}
          style={{
            padding: '10px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600,
            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            background: billingCycle === 'monthly' ? '#8B5CF6' : 'rgba(148, 163, 184, 0.1)',
            color: billingCycle === 'monthly' ? 'white' : '#94A3B8',
          }}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle('annual')}
          style={{
            padding: '10px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600,
            border: 'none', cursor: 'pointer', transition: 'all 0.2s',
            background: billingCycle === 'annual' ? '#8B5CF6' : 'rgba(148, 163, 184, 0.1)',
            color: billingCycle === 'annual' ? 'white' : '#94A3B8',
          }}
        >
          Annual
          <span style={{
            marginLeft: 8, fontSize: 11, fontWeight: 700,
            background: 'rgba(16, 185, 129, 0.15)', color: '#10B981',
            padding: '2px 8px', borderRadius: 6,
          }}>
            Save 2 months
          </span>
        </button>
      </div>

      {/* ── Plan Cards ────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 20,
      }}>
        {plans.map(plan => {
          const isCurrentPlan = plan.id === currentPlanId;
          const isUpgrade = plan.sortOrder > (plans.find(p => p.id === currentPlanId)?.sortOrder ?? 0);
          const price = billingCycle === 'monthly'
            ? plan.pricing.monthlyDisplay
            : plan.pricing.annualMonthlyDisplay;
          const isPopular = plan.id === 'pro';

          return (
            <div
              key={plan.id}
              style={{
                position: 'relative',
                background: isPopular
                  ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%)'
                  : 'rgba(15, 23, 42, 0.6)',
                border: `1px solid ${isPopular ? 'rgba(139, 92, 246, 0.4)' : isCurrentPlan ? 'rgba(16, 185, 129, 0.4)' : 'rgba(148, 163, 184, 0.1)'}`,
                borderRadius: 16,
                padding: 24,
                display: 'flex', flexDirection: 'column',
                transition: 'all 0.3s',
              }}
            >
              {/* Popular badge */}
              {isPopular && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                  color: 'white', fontSize: 11, fontWeight: 700,
                  padding: '4px 16px', borderRadius: 12,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  Most Popular
                </div>
              )}

              {/* Plan header */}
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
                  {plan.name}
                </h3>
                <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>
                  {plan.tagline}
                </p>
              </div>

              {/* Price */}
              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: '#F8FAFC' }}>
                    {plan.isFreeTier ? 'Free' : price}
                  </span>
                  {!plan.isFreeTier && (
                    <span style={{ fontSize: 14, color: '#64748B' }}>/mo</span>
                  )}
                </div>
                {!plan.isFreeTier && billingCycle === 'annual' && (
                  <div style={{ fontSize: 12, color: '#10B981', marginTop: 4 }}>
                    Billed {plan.pricing.annualDisplay}/year
                  </div>
                )}
              </div>

              {/* Features */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0', flex: 1 }}>
                <FeatureItem text={`${plan.limits.channels === -1 ? 'Unlimited' : plan.limits.channels} channels`} />
                <FeatureItem text={`${plan.limits.posts_per_month === -1 ? 'Unlimited' : plan.limits.posts_per_month} posts/mo`} />
                <FeatureItem text={`${plan.limits.ai_credits_per_month === -1 ? 'Unlimited' : plan.limits.ai_credits_per_month} AI credits/mo`} />
                <FeatureItem text={`${plan.limits.ig_comments_per_month === -1 ? 'Unlimited' : plan.limits.ig_comments_per_month} IG comments/mo`} />
                <FeatureItem text={`${plan.templateCount} templates`} />
                <FeatureItem text={`${plan.limits.team_seats} team seat${plan.limits.team_seats > 1 ? 's' : ''}`} />
                {plan.features.custom_domain && <FeatureItem text="Custom domain" highlight />}
                {plan.features.dm_concierge_full && <FeatureItem text="Full DM Concierge" highlight />}
                {plan.features.lead_scoring && <FeatureItem text="Lead scoring" highlight />}
                {plan.features.white_label && <FeatureItem text="White label" highlight />}
              </ul>

              {/* CTA Button */}
              {isCurrentPlan ? (
                <button
                  disabled
                  style={{
                    padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                    background: 'rgba(16, 185, 129, 0.1)', color: '#10B981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    cursor: 'default',
                  }}
                >
                  ✓ Current Plan
                </button>
              ) : plan.isFreeTier ? (
                <button
                  disabled
                  style={{
                    padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                    background: 'rgba(148, 163, 184, 0.05)', color: '#64748B',
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                    cursor: 'default',
                  }}
                >
                  Free Forever
                </button>
              ) : (
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={!!paymentLoading || !isUpgrade}
                  style={{
                    padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                    background: isUpgrade
                      ? (isPopular ? 'linear-gradient(135deg, #8B5CF6, #6366F1)' : '#8B5CF6')
                      : 'rgba(148, 163, 184, 0.05)',
                    color: isUpgrade ? 'white' : '#64748B',
                    border: 'none', cursor: isUpgrade ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    opacity: paymentLoading === plan.id ? 0.7 : 1,
                  }}
                >
                  {paymentLoading === plan.id ? 'Processing...' : isUpgrade ? `Upgrade to ${plan.name}` : 'Current or lower tier'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Cancel Modal ──────────────────────────────────────── */}
      {showCancelModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#0F172A', borderRadius: 16,
            border: '1px solid rgba(148, 163, 184, 0.15)',
            padding: 32, maxWidth: 440, width: '90%',
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
              Cancel Subscription?
            </h3>
            <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 12 }}>
              Your plan features will remain active until the end of your current billing period.
              After that, you will be downgraded to the Spark (free) plan.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                onClick={() => handleCancel(false)}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 10,
                  background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Cancel at Period End
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 10,
                  background: 'rgba(148, 163, 184, 0.1)', color: '#94A3B8',
                  border: '1px solid rgba(148, 163, 184, 0.15)',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Keep Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function FeatureItem({ text, highlight }: { text: string; highlight?: boolean }) {
  return (
    <li style={{
      display: 'flex', alignItems: 'center', gap: 8,
      fontSize: 13, color: highlight ? '#8B5CF6' : '#CBD5E1',
      padding: '4px 0',
    }}>
      <span style={{ color: highlight ? '#8B5CF6' : '#10B981', fontSize: 12 }}>✓</span>
      {text}
    </li>
  );
}

// ── Cashfree SDK Loader ─────────────────────────────────────────

let cashfreeInstance: CashfreeInstance | null = null;

async function loadCashfreeSDK(): Promise<CashfreeInstance | null> {
  if (cashfreeInstance) return cashfreeInstance;

  try {
    const { load } = await import('@cashfreepayments/cashfree-js');
    cashfreeInstance = await load({
      mode: (process.env.NEXT_PUBLIC_CASHFREE_MODE as 'sandbox' | 'production') || 'sandbox',
    });
    return cashfreeInstance;
  } catch (err) {
    console.error('Failed to load Cashfree SDK:', err);
    return null;
  }
}
