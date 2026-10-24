'use client';

import { useState, useEffect, useCallback, Component } from 'react';
import type { CashfreeInstance } from '@cashfreepayments/cashfree-js';
import { UnoolCheckoutModal } from '@/components/billing/UnoolCheckoutModal';

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

function formatSubscriptionDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

// ── Error Boundary for Checkout Modal ─────────────────────────
interface ErrorBoundaryProps {
  children: React.ReactNode;
  onError: (error: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class CheckoutErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('[BillingClient] Caught checkout modal error:', error);
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

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
  const [checkoutData, setCheckoutData] = useState<{
    plan: PlanData;
    paymentSessionId: string;
    cfOrderId: string;
    mode?: 'sandbox' | 'production';
  } | null>(null);

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
          // Clear active session
          try { sessionStorage.removeItem('unool_active_checkout'); } catch {}
          // Broadcast to other tabs
          try {
            const bc = new BroadcastChannel('unool_billing_sync');
            bc.postMessage({ type: 'CHECKOUT_SUCCESS', orderId });
            bc.close();
          } catch {}
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
          try { sessionStorage.removeItem('unool_active_checkout'); } catch {}
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

  // ── Multi-Tab Sync via BroadcastChannel ─────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    try {
      const channel = new BroadcastChannel('unool_billing_sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'CHECKOUT_SUCCESS') {
          // Another tab completed payment — refresh subscription & close any modal
          setCheckoutData(null);
          fetch('/api/billing/current')
            .then(res => res.json())
            .then(data => {
              setCurrentPlan(data);
              setPaymentResult({ status: 'PAID', message: 'Subscription updated successfully!' });
            })
            .catch(() => {});
        } else if (event.data?.type === 'CHECKOUT_CANCELLED') {
          setCheckoutData(null);
        }
      };
      return () => {
        channel.close();
      };
    } catch {
      // Ignore unsupported browsers
    }
  }, []);

  // ── Clean up lingering Cashfree artifacts & handle page refresh / return_url ──────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Clean DOM artifacts from Cashfree iframes/modals directly attached to body
    try {
      const lingeringCf = document.querySelectorAll(
        'body > [id*="cashfree"], body > [class*="cf-modal"], body > .cf-backdrop, body > .cf-overlay'
      );
      lingeringCf.forEach(el => el.remove());
    } catch {
      // Ignore
    }

    // 2. Handle return_url from Cashfree redirect (?order_id=xxx&status=xxx)
    const params = new URLSearchParams(window.location.search);
    const orderIdFromUrl = params.get('order_id');
    const statusFromUrl = params.get('status');

    if (orderIdFromUrl) {
      try { sessionStorage.removeItem('unool_active_checkout'); } catch {}

      if (statusFromUrl === 'FAILED' || statusFromUrl === 'CANCELLED' || statusFromUrl === 'USER_DROPPED') {
        setPaymentResult({
          status: 'ERROR',
          message: 'Checkout was canceled or interrupted. No changes were made to your subscription.',
        });
      } else {
        pollVerification(orderIdFromUrl);
      }

      // Clean query parameters from URL without reloading
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
      return;
    }

    // 3. Handle refresh during active checkout (network interruption recovery)
    try {
      const savedCheckout = sessionStorage.getItem('unool_active_checkout');
      if (savedCheckout) {
        const parsed = JSON.parse(savedCheckout);
        const ageMs = Date.now() - (parsed.timestamp || 0);
        // If within 15 minutes, check if it was completed or failed
        if (parsed.cfOrderId && ageMs < 15 * 60 * 1000) {
          fetch(`/api/billing/verify?orderId=${parsed.cfOrderId}`)
            .then(res => res.json())
            .then(data => {
              if (data.status === 'PAID') {
                setPaymentResult({ status: 'PAID', message: data.message });
                fetch('/api/billing/current').then(r => r.json()).then(setCurrentPlan);
              } else if (data.status === 'FAILED') {
                setPaymentResult({
                  status: 'ERROR',
                  message: data.message || 'Payment was cancelled or failed.',
                });
              }
              // If PENDING, the user reloaded before paying — do not show an alarming error banner
            })
            .catch(() => {});
        }
        sessionStorage.removeItem('unool_active_checkout');
      }
    } catch {
      // Ignore
    }
  }, [pollVerification]);

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
        const err = await res.json().catch(() => ({}));
        setPaymentResult({ status: 'ERROR', message: err.error || 'Failed to create payment order.' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const { paymentSessionId, cfOrderId, mode } = await res.json();
      const selectedPlan = plans.find(p => p.id === planId);

      if (!selectedPlan) {
        setPaymentResult({ status: 'ERROR', message: 'Plan details not found.' });
        return;
      }

      // Persist active checkout in sessionStorage so refresh or interruption can be tracked
      try {
        sessionStorage.setItem('unool_active_checkout', JSON.stringify({
          cfOrderId,
          planId,
          billingCycle,
          timestamp: Date.now(),
        }));
      } catch {}

      // Open our bespoke Unool Checkout Modal!
      setCheckoutData({
        plan: selectedPlan,
        paymentSessionId,
        cfOrderId,
        mode,
      });
    } catch (err) {
      console.error('Payment order creation error:', err);
      setPaymentResult({ status: 'ERROR', message: 'Something went wrong while initiating checkout. Please try again.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <div style={{ padding: '32px 24px', maxWidth: 1200, margin: '0 auto', color: '#1A1612' }}>
      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1A1612', margin: 0, letterSpacing: '-0.02em' }}>
          Plans &amp; Billing
        </h1>
        <p style={{ fontSize: 15, color: '#7A7265', marginTop: 6 }}>
          Manage your subscription, plan limits, and Cashfree billing preferences
        </p>
      </div>

      {/* ── Current Plan Card ────────────────────────────────── */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E8E0D5',
        borderRadius: 16,
        padding: 24,
        marginBottom: 32,
        boxShadow: '0 4px 20px -4px rgba(42, 36, 30, 0.05)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontSize: 12, fontWeight: 700, color: '#8B5CF6',
                background: 'rgba(139, 92, 246, 0.1)', padding: '4px 12px',
                borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                Current Plan
              </span>
              {currentPlan?.subscription?.status && (
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: currentPlan.subscription.status === 'active' ? '#059669' : '#D97706',
                  background: currentPlan.subscription.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  padding: '3px 10px', borderRadius: 12,
                }}>
                  {currentPlan.subscription.status}
                </span>
              )}
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1A1612', marginTop: 10, letterSpacing: '-0.01em' }}>
              {currentPlan?.plan?.name || 'Spark'} {isFreeTier ? '(Free)' : ''}
            </h2>
            <p style={{ fontSize: 14, color: '#7A7265', marginTop: 4 }}>
              {currentPlan?.plan?.tagline}
            </p>
          </div>

          {!isFreeTier && currentPlan?.subscription && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, color: '#7A7265', fontWeight: 500 }}>Next billing</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1612', marginTop: 2 }}>
                {formatSubscriptionDate(currentPlan.subscription.currentPeriodEnd)}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#8B5CF6', marginTop: 2 }}>
                {currentPlan.subscription.amount}/{currentPlan.subscription.billingCycle === 'annual' ? 'year' : 'month'}
              </div>
              {!currentPlan.subscription.cancelAtPeriodEnd && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  style={{
                    marginTop: 12, fontSize: 13, fontWeight: 600, color: '#DC2626',
                    background: '#FEF2F2', border: '1px solid #FECACA',
                    padding: '6px 16px', borderRadius: 8, cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    (e.target as HTMLElement).style.background = '#FEE2E2';
                  }}
                  onMouseLeave={e => {
                    (e.target as HTMLElement).style.background = '#FEF2F2';
                  }}
                >
                  Cancel Subscription
                </button>
              )}
              {currentPlan.subscription.cancelAtPeriodEnd && (
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: '#D97706' }}>
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
            ? '#ECFDF5' : '#FEF2F2',
          border: `1px solid ${paymentResult.status === 'PAID'
            ? '#A7F3D0' : '#FECACA'}`,
          color: paymentResult.status === 'PAID' ? '#065F46' : '#991B1B',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontWeight: 700 }}>
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
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
          color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: 12,
          fontWeight: 600,
        }}>
          <div style={{
            width: 20, height: 20,
            border: '2px solid rgba(29, 78, 216, 0.3)',
            borderTopColor: '#1D4ED8',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          Verifying payment with Cashfree...
        </div>
      )}

      {/* ── Billing Cycle Toggle ──────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 36,
      }}>
        <div style={{
          display: 'inline-flex',
          background: '#EAE3D9',
          padding: 4,
          borderRadius: 14,
          border: '1px solid #E0D6C8',
          gap: 4,
        }}>
          <button
            onClick={() => setBillingCycle('monthly')}
            style={{
              padding: '10px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              background: billingCycle === 'monthly' ? '#1A1612' : 'transparent',
              color: billingCycle === 'monthly' ? '#FFFFFF' : '#7A7265',
              boxShadow: billingCycle === 'monthly' ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            style={{
              padding: '10px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              background: billingCycle === 'annual' ? '#1A1612' : 'transparent',
              color: billingCycle === 'annual' ? '#FFFFFF' : '#7A7265',
              boxShadow: billingCycle === 'annual' ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
              display: 'flex', alignItems: 'center',
            }}
          >
            Annual
            <span style={{
              marginLeft: 8, fontSize: 11, fontWeight: 700,
              background: billingCycle === 'annual' ? 'rgba(16, 185, 129, 0.25)' : '#D1FAE5',
              color: billingCycle === 'annual' ? '#10B981' : '#065F46',
              padding: '2px 8px', borderRadius: 6,
            }}>
              Save 2 months
            </span>
          </button>
        </div>
      </div>

      {/* ── Plan Cards ────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 24,
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
                background: '#FFFFFF',
                border: isPopular
                  ? '2px solid #8B5CF6'
                  : isCurrentPlan
                    ? '2px solid #10B981'
                    : '1px solid #E8E0D5',
                borderRadius: 20,
                padding: '32px 24px',
                display: 'flex', flexDirection: 'column',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: isPopular
                  ? '0 20px 40px -12px rgba(139, 92, 246, 0.2)'
                  : isCurrentPlan
                    ? '0 12px 32px -8px rgba(16, 185, 129, 0.15)'
                    : '0 4px 20px -4px rgba(42, 36, 30, 0.05)',
              }}
            >
              {/* Popular badge */}
              {isPopular && (
                <div style={{
                  position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                  color: 'white', fontSize: 11, fontWeight: 700,
                  padding: '4px 16px', borderRadius: 12,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.35)',
                }}>
                  Most Popular
                </div>
              )}

              {/* Plan header */}
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: '#1A1612', margin: 0, letterSpacing: '-0.01em' }}>
                  {plan.name}
                </h3>
                <p style={{ fontSize: 13, color: '#7A7265', marginTop: 6, minHeight: 38, lineHeight: 1.4 }}>
                  {plan.tagline}
                </p>
              </div>

              {/* Price */}
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 38, fontWeight: 800, color: '#1A1612', letterSpacing: '-0.03em' }}>
                    {plan.isFreeTier ? 'Free' : price}
                  </span>
                  {!plan.isFreeTier && (
                    <span style={{ fontSize: 14, color: '#7A7265', fontWeight: 500 }}>/mo</span>
                  )}
                </div>
                {!plan.isFreeTier && billingCycle === 'annual' && (
                  <div style={{ fontSize: 12, color: '#059669', fontWeight: 600, marginTop: 4 }}>
                    Billed {plan.pricing.annualDisplay}/year
                  </div>
                )}
              </div>

              {/* Features */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0', flex: 1 }}>
                <FeatureItem text={`${plan.limits?.channels === -1 ? 'Unlimited' : (plan.limits?.channels ?? 0)} channels`} />
                <FeatureItem text={`${plan.limits?.posts_per_month === -1 ? 'Unlimited' : (plan.limits?.posts_per_month ?? 0)} posts/mo`} />
                <FeatureItem text={`${plan.limits?.ai_credits_per_month === -1 ? 'Unlimited' : (plan.limits?.ai_credits_per_month ?? 0)} AI credits/mo`} />
                <FeatureItem text={`${plan.limits?.ig_comments_per_month === -1 ? 'Unlimited' : (plan.limits?.ig_comments_per_month ?? 0)} IG comments/mo`} />
                <FeatureItem text={`${plan.templateCount ?? 0} templates`} />
                <FeatureItem text={`${plan.limits?.team_seats ?? 1} team seat${(plan.limits?.team_seats ?? 1) > 1 ? 's' : ''}`} />
                {plan.features?.custom_domain && <FeatureItem text="Custom domain" highlight />}
                {plan.features?.dm_concierge_full && <FeatureItem text="Full DM Concierge" highlight />}
                {plan.features?.lead_scoring && <FeatureItem text="Lead scoring" highlight />}
                {plan.features?.white_label && <FeatureItem text="White label" highlight />}
              </ul>

              {/* CTA Button */}
              {isCurrentPlan ? (
                <button
                  disabled
                  style={{
                    padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                    background: '#ECFDF5', color: '#065F46',
                    border: '1px solid #A7F3D0',
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
                    background: '#F4EFEA', color: '#7A7265',
                    border: '1px solid #E8E0D5',
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
                    padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                    background: isUpgrade
                      ? (isPopular ? 'linear-gradient(135deg, #8B5CF6, #6366F1)' : '#1A1612')
                      : '#F4EFEA',
                    color: isUpgrade ? 'white' : '#7A7265',
                    border: 'none', cursor: isUpgrade ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    opacity: paymentLoading === plan.id ? 0.7 : 1,
                    boxShadow: isUpgrade && isPopular
                      ? '0 4px 14px rgba(139, 92, 246, 0.35)'
                      : isUpgrade
                        ? '0 4px 12px rgba(26, 22, 18, 0.15)'
                        : 'none',
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
          background: 'rgba(26, 22, 18, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: 18,
            border: '1px solid #E8E0D5',
            padding: 32, maxWidth: 440, width: '90%',
            boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.25)',
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1A1612', margin: 0 }}>
              Cancel Subscription?
            </h3>
            <p style={{ fontSize: 14, color: '#7A7265', marginTop: 12, lineHeight: 1.5 }}>
              Your plan features will remain active until the end of your current billing period.
              After that, you will be downgraded to the Spark (free) plan.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button
                onClick={() => handleCancel(false)}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 10,
                  background: '#FEF2F2', color: '#DC2626',
                  border: '1px solid #FECACA',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Cancel at Period End
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 10,
                  background: '#F4EFEA', color: '#1A1612',
                  border: '1px solid #E8E0D5',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Keep Subscription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bespoke Unool Checkout Modal Protected by Error Boundary ───────────────────── */}
      {checkoutData && (
        <CheckoutErrorBoundary
          key={checkoutData.cfOrderId}
          onError={(_err) => {
            const orderIdToPoll = checkoutData.cfOrderId;
            try { sessionStorage.removeItem('unool_active_checkout'); } catch {}
            setCheckoutData(null);
            setPaymentResult({
              status: 'ERROR',
              message: 'Checkout window encountered an unexpected error loading payment methods. Please try again.',
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (orderIdToPoll) {
              pollVerification(orderIdToPoll);
            }
          }}
        >
          <UnoolCheckoutModal
            isOpen={!!checkoutData}
            onClose={() => {
              const orderIdToPoll = checkoutData.cfOrderId;
              try { sessionStorage.removeItem('unool_active_checkout'); } catch {}
              try {
                const bc = new BroadcastChannel('unool_billing_sync');
                bc.postMessage({ type: 'CHECKOUT_CANCELLED' });
                bc.close();
              } catch {}
              setCheckoutData(null);
              if (orderIdToPoll) {
                pollVerification(orderIdToPoll);
              }
            }}
            plan={checkoutData.plan}
            billingCycle={billingCycle}
            paymentSessionId={checkoutData.paymentSessionId}
            cfOrderId={checkoutData.cfOrderId}
            mode={checkoutData.mode}
            onPaymentSuccess={() => {
              const orderIdToPoll = checkoutData.cfOrderId;
              try { sessionStorage.removeItem('unool_active_checkout'); } catch {}
              setCheckoutData(null);
              if (orderIdToPoll) {
                pollVerification(orderIdToPoll);
              }
            }}
            onPaymentFailed={(msg) => {
              try { sessionStorage.removeItem('unool_active_checkout'); } catch {}
              try {
                const bc = new BroadcastChannel('unool_billing_sync');
                bc.postMessage({ type: 'CHECKOUT_CANCELLED' });
                bc.close();
              } catch {}
              setCheckoutData(null);
              setPaymentResult({ status: 'ERROR', message: msg });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </CheckoutErrorBoundary>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function FeatureItem({ text, highlight }: { text: string; highlight?: boolean }) {
  return (
    <li style={{
      display: 'flex', alignItems: 'center', gap: 8,
      fontSize: 13, color: highlight ? '#8B5CF6' : '#2D241E',
      fontWeight: highlight ? 600 : 400,
      padding: '5px 0',
    }}>
      <span style={{ color: highlight ? '#8B5CF6' : '#10B981', fontSize: 13, fontWeight: 700 }}>✓</span>
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
