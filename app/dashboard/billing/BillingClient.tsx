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

interface ActiveCheckout {
  planId: string;
  planName: string;
  priceDisplay: string;
  billingCycle: BillingCycle;
  paymentSessionId: string;
  cfOrderId: string;
  mode?: 'sandbox' | 'production';
}

if (typeof window !== 'undefined' && !(window as any).__unool_open_hooked) {
  (window as any).__unool_open_hooked = true;
  const originalOpen = window.open;
  window.open = function (...args: any[]) {
    const win = originalOpen.apply(this, args as any);
    if (win) {
      (window as any).__unool_cf_window = win;
    }
    return win;
  };
}

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

  // Active Checkout Dialog & UPI ID States
  const [activeCheckout, setActiveCheckout] = useState<ActiveCheckout | null>(null);
  const [checkoutTab, setCheckoutTab] = useState<'upi' | 'gateway'>('upi');
  const [upiIdInput, setUpiIdInput] = useState('');
  const [upiSubmitting, setUpiSubmitting] = useState(false);
  const [upiSent, setUpiSent] = useState(false);
  const [upiError, setUpiError] = useState<string | null>(null);

  // ── Clean & Close Checkout Helper ──────────────────────────
  const closeAndCleanCashfree = useCallback(() => {
    // 1. Close any child window or tab opened by Cashfree SDK or 3DS
    try {
      const cfWin = (window as any).__unool_cf_window;
      if (cfWin && !cfWin.closed) {
        cfWin.close();
        (window as any).__unool_cf_window = null;
      }
    } catch {
      // Ignore cross-origin close restrictions
    }

    // 2. Remove all Cashfree injected modals, iframes, backdrops
    try {
      const lingeringElements = document.querySelectorAll(
        '#cashfree-modal-container, [id*="cashfree"], [class*="cf-modal"], .cf-backdrop, .cf-overlay, iframe[src*="cashfree"]'
      );
      lingeringElements.forEach((el) => el.remove());
    } catch {
      // Ignore DOM removal errors
    }

    // 3. Restore scrolling on body and html
    try {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    } catch {
      // Ignore
    }

    // 4. Reset active checkout state in UI
    setActiveCheckout(null);
    setUpiSubmitting(false);
    setUpiSent(false);
    setUpiError(null);
    try {
      sessionStorage.removeItem('unool_active_checkout');
    } catch {}
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
        const res = await fetch(`/api/billing/verify?orderId=${orderId}&t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();

        if (data.status === 'PAID') {
          closeAndCleanCashfree();
          setVerifying(false);
          setPaymentResult({ status: 'PAID', message: data.message || 'Payment successful! Your plan is now active.' });
          // Clear active session
          try { sessionStorage.removeItem('unool_active_checkout'); } catch {}
          // Broadcast to other tabs
          try {
            const bc = new BroadcastChannel('unool_billing_sync');
            bc.postMessage({ type: 'CHECKOUT_SUCCESS', orderId, planId: data.planId });
            bc.close();
          } catch {}
          // Optimistic plan upgrade so the user instantly sees their new plan
          const targetPlanId = data.planId;
          const upgraded = plans.find(p => p.id === targetPlanId);
          const cyc = data.billingCycle || billingCycle;
          const planName = upgraded?.name || (targetPlanId ? targetPlanId.charAt(0).toUpperCase() + targetPlanId.slice(1) : 'Pro');
          const planTagline = upgraded?.tagline || '';

          setCurrentPlan({
            plan: { id: targetPlanId, name: planName, tagline: planTagline },
            subscription: {
              id: 'sub_' + orderId,
              status: 'active',
              billingCycle: cyc,
              amount: cyc === 'annual' ? (upgraded?.pricing?.annualDisplay || '') : (upgraded?.pricing?.monthlyDisplay || ''),
              amountPaise: cyc === 'annual' ? (upgraded?.pricing?.annual || 0) : (upgraded?.pricing?.monthly || 0),
              currency: upgraded?.pricing?.currency || 'INR',
              currentPeriodStart: new Date().toISOString(),
              currentPeriodEnd: new Date(Date.now() + (cyc === 'annual' ? 365 : 30) * 86400000).toISOString(),
              trialEnd: null,
              cancelAtPeriodEnd: false,
              cancelledAt: null,
              paymentMethod: null,
            },
            isFreeTier: false,
          });

          window.scrollTo({ top: 0, behavior: 'smooth' });

          // Refresh current plan with cache buster from server
          try {
            const currentRes = await fetch(`/api/billing/current?t=${Date.now()}`, { cache: 'no-store' });
            if (currentRes.ok) {
              const freshPlan = await currentRes.json();
              if (freshPlan && !freshPlan.isFreeTier) {
                // Ensure we never overwrite the verified upgraded plan with a stale or previous plan
                if (!targetPlanId || freshPlan.plan?.id === targetPlanId) {
                  setCurrentPlan(freshPlan);
                }
              }
            }
          } catch {}
          return;
        }

        if (data.status === 'FAILED') {
          closeAndCleanCashfree();
          setVerifying(false);
          setPaymentResult({ status: 'FAILED', message: data.message || 'Payment was cancelled or failed.' });
          try { sessionStorage.removeItem('unool_active_checkout'); } catch {}
          return;
        }

        // Still pending — poll again
        attempts++;
        setTimeout(poll, 2500);
      } catch {
        attempts++;
        setTimeout(poll, 2500);
      }
    };

    poll();
  }, [plans, billingCycle, closeAndCleanCashfree]);

  // ── Multi-Tab Sync via BroadcastChannel ─────────────────────
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    try {
      const channel = new BroadcastChannel('unool_billing_sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'CHECKOUT_SUCCESS') {
          // Another tab completed payment — refresh subscription
          fetch(`/api/billing/current?t=${Date.now()}`, { cache: 'no-store' })
            .then(res => res.json())
            .then(data => {
              if (data && (!event.data?.planId || data.plan?.id === event.data.planId)) {
                setCurrentPlan(data);
              }
              setPaymentResult({ status: 'PAID', message: 'Subscription updated successfully!' });
            })
            .catch(() => {});
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

    // 1. Immediately close any open checkout popup/window and clean lingering DOM elements
    closeAndCleanCashfree();

    // 2. Attach listeners to close popup window and clean up on beforeunload and pagehide
    const handleUnload = () => {
      closeAndCleanCashfree();
    };
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    // 3. Handle return_url from Cashfree redirect (?order_id=xxx&status=xxx)
    const params = new URLSearchParams(window.location.search);
    const orderIdFromUrl = params.get('order_id');
    const statusFromUrl = params.get('status');

    if (orderIdFromUrl) {
      if (statusFromUrl === 'FAILED' || statusFromUrl === 'CANCELLED' || statusFromUrl === 'USER_DROPPED') {
        setPaymentResult({
          status: 'ERROR',
          message: 'Checkout was canceled or interrupted. No changes were made to your subscription.',
        });
      } else {
        pollVerification(orderIdFromUrl);
      }

      // Redirect cleanly to /dashboard/billing without query parameters
      window.history.replaceState({}, '', '/dashboard/billing');
      return () => {
        window.removeEventListener('beforeunload', handleUnload);
        window.removeEventListener('pagehide', handleUnload);
      };
    }

    // 4. On page refresh during checkout, ensure URL is clean /dashboard/billing
    if (window.location.search || window.location.hash) {
      window.history.replaceState({}, '', '/dashboard/billing');
    }

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, [closeAndCleanCashfree, pollVerification]);

  // ── Close Checkout on Escape Key ───────────────────────────
  useEffect(() => {
    if (!activeCheckout) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAndCleanCashfree();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCheckout, closeAndCleanCashfree]);

  // ── Fetch data ─────────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        const [plansRes, currentRes] = await Promise.all([
          fetch('/api/billing/plans?country=IN', { cache: 'no-store' }),
          fetch(`/api/billing/current?t=${Date.now()}`, { cache: 'no-store' }),
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

      // Open custom checkout dialog with UPI ID option & Gateway tab
      setActiveCheckout({
        planId,
        planName: selectedPlan.name,
        priceDisplay: billingCycle === 'annual' ? selectedPlan.pricing.annualDisplay : selectedPlan.pricing.monthlyDisplay,
        billingCycle,
        paymentSessionId,
        cfOrderId,
        mode: mode || (process.env.NEXT_PUBLIC_CASHFREE_MODE as 'sandbox' | 'production') || 'sandbox',
      });
      setCheckoutTab('upi');
      setUpiIdInput('');
      setUpiError(null);
      setUpiSent(false);
    } catch (err) {
      console.error('Payment order creation error:', err);
      setPaymentResult({ status: 'ERROR', message: 'Something went wrong while initiating checkout. Please try again.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setPaymentLoading(null);
    }
  };

  // ── UPI Helpers & Handlers ─────────────────────────────────
  const handleAppendUpiChip = (handle: string) => {
    setUpiError(null);
    if (!upiIdInput) {
      setUpiIdInput(handle);
      return;
    }
    const atIndex = upiIdInput.indexOf('@');
    if (atIndex !== -1) {
      setUpiIdInput(upiIdInput.slice(0, atIndex) + handle);
    } else {
      setUpiIdInput(upiIdInput + handle);
    }
  };

  const handlePayWithUpi = async () => {
    if (!activeCheckout) return;
    const cleanUpi = upiIdInput.trim().toLowerCase();
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z0-9]{2,64}$/;
    if (!upiRegex.test(cleanUpi)) {
      setUpiError('Please enter a valid UPI ID (e.g. yourname@okhdfcbank or 9876543210@upi)');
      return;
    }

    setUpiSubmitting(true);
    setUpiError(null);

    try {
      const res = await fetch('/api/billing/pay-upi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cfOrderId: activeCheckout.cfOrderId,
          paymentSessionId: activeCheckout.paymentSessionId,
          upiId: cleanUpi,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setUpiError(data.error || 'Failed to send UPI payment request. Please check your UPI ID and try again.');
        setUpiSubmitting(false);
        return;
      }

      setUpiSent(true);
      setUpiSubmitting(false);
      // Start polling for approval verification
      pollVerification(activeCheckout.cfOrderId);
    } catch (err) {
      setUpiError('Failed to communicate with payment gateway. Please try again.');
      setUpiSubmitting(false);
    }
  };

  const handleLaunchGateway = async () => {
    if (!activeCheckout) return;
    setPaymentLoading(activeCheckout.planId);

    try {
      const cashfreeMode = activeCheckout.mode || (process.env.NEXT_PUBLIC_CASHFREE_MODE as 'sandbox' | 'production') || 'sandbox';
      const cashfree = await loadCashfreeSDK(cashfreeMode);
      if (!cashfree) {
        setPaymentResult({
          status: 'ERROR',
          message: 'Payment gateway failed to load. Please check your connection.',
        });
        return;
      }

      cashfree
        .checkout({
          paymentSessionId: activeCheckout.paymentSessionId,
          redirectTarget: '_modal',
        })
        .then((result: any) => {
          if (result?.error) {
            console.warn('[BillingClient] Cashfree checkout modal closed or error:', result.error);
          }
          pollVerification(activeCheckout.cfOrderId);
        })
        .catch((err: any) => {
          console.error('[BillingClient] Cashfree checkout error:', err);
          pollVerification(activeCheckout.cfOrderId);
        });
    } catch (err) {
      console.error('Cashfree launch error:', err);
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
        const currentRes = await fetch(`/api/billing/current?t=${Date.now()}`, { cache: 'no-store' });
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

      {/* ── Checkout Dialog with UPI ID & Gateway Tabs ──────────────── */}
      {activeCheckout && (
        <div
          id="unool-checkout-modal"
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(26, 22, 18, 0.72)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            overflowY: 'auto',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeAndCleanCashfree();
            }
          }}
        >
          <style>{`
            @keyframes unoolSpin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes unoolPulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.08); opacity: 0.85; }
            }
            @keyframes unoolScaleUp {
              from { opacity: 0; transform: scale(0.96) translateY(8px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              border: '1px solid #E8E0D5',
              width: '100%',
              maxWidth: 480,
              boxShadow: '0 25px 60px -15px rgba(26, 22, 18, 0.3), 0 0 0 1px rgba(0,0,0,0.04)',
              overflow: 'hidden',
              animation: 'unoolScaleUp 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #F0ECE6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(180deg, #FAF8F5 0%, #FFFFFF 100%)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#7C3AED',
                      background: '#F5F3FF',
                      padding: '3px 8px',
                      borderRadius: 6,
                    }}
                  >
                    Checkout
                  </span>
                  <span style={{ fontSize: 13, color: '#7A7265' }}>
                    {activeCheckout.billingCycle === 'annual' ? 'Billed Annually' : 'Billed Monthly'}
                  </span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1A1612', margin: '4px 0 0' }}>
                  Upgrade to {activeCheckout.planName}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeAndCleanCashfree}
                title="Close checkout (Esc)"
                aria-label="Close"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  border: '1px solid #E8E0D5',
                  background: '#FFFFFF',
                  color: '#7A7265',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#F4EFEA';
                  (e.currentTarget as HTMLElement).style.color = '#1A1612';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#FFFFFF';
                  (e.currentTarget as HTMLElement).style.color = '#7A7265';
                }}
              >
                ✕
              </button>
            </div>

            {/* Navigation Tabs */}
            <div
              style={{
                display: 'flex',
                background: '#FAF7F3',
                padding: '6px 8px',
                borderBottom: '1px solid #F0ECE6',
                gap: 6,
              }}
            >
              <button
                type="button"
                id="checkout-tab-upi"
                onClick={() => {
                  setCheckoutTab('upi');
                  setUpiError(null);
                }}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: checkoutTab === 'upi' ? '1px solid #DDD6FE' : '1px solid transparent',
                  background: checkoutTab === 'upi' ? '#FFFFFF' : 'transparent',
                  color: checkoutTab === 'upi' ? '#7C3AED' : '#6B655B',
                  fontSize: 13,
                  fontWeight: checkoutTab === 'upi' ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: checkoutTab === 'upi' ? '0 2px 4px rgba(124,58,237,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: 15 }}>⚡</span>
                <span>UPI ID / VPA</span>
              </button>
              <button
                type="button"
                id="checkout-tab-gateway"
                onClick={() => {
                  setCheckoutTab('gateway');
                  setUpiError(null);
                }}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: checkoutTab === 'gateway' ? '1px solid #E8E0D5' : '1px solid transparent',
                  background: checkoutTab === 'gateway' ? '#FFFFFF' : 'transparent',
                  color: checkoutTab === 'gateway' ? '#1A1612' : '#6B655B',
                  fontSize: 13,
                  fontWeight: checkoutTab === 'gateway' ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: checkoutTab === 'gateway' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: 14 }}>💳</span>
                <span>Cards, Netbanking & QR</span>
              </button>
            </div>

            {/* Tab Body */}
            <div style={{ padding: '24px' }}>
              {checkoutTab === 'upi' ? (
                <div>
                  {!upiSent ? (
                    <div>
                      <label
                        htmlFor="upi-id-input"
                        style={{
                          display: 'block',
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#1A1612',
                          marginBottom: 6,
                        }}
                      >
                        Enter UPI ID (Virtual Payment Address)
                      </label>
                      <p style={{ fontSize: 12, color: '#7A7265', margin: '0 0 12px', lineHeight: 1.45 }}>
                        Enter your UPI ID to receive a direct collect request on Google Pay, PhonePe, Paytm, BHIM, or any UPI app.
                      </p>

                      <div style={{ position: 'relative', marginBottom: 12 }}>
                        <input
                          type="text"
                          id="upi-id-input"
                          value={upiIdInput}
                          onChange={(e) => {
                            setUpiIdInput(e.target.value);
                            setUpiError(null);
                          }}
                          placeholder="e.g. yourname@okhdfcbank or 9876543210@upi"
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            borderRadius: 10,
                            border: upiError ? '1.5px solid #EF4444' : '1.5px solid #E8E0D5',
                            fontSize: 14,
                            color: '#1A1612',
                            background: '#FAF8F5',
                            outline: 'none',
                            fontFamily: 'inherit',
                            transition: 'border-color 0.15s ease',
                            boxSizing: 'border-box',
                          }}
                          onFocus={(e) => {
                            if (!upiError) e.target.style.borderColor = '#7C3AED';
                          }}
                          onBlur={(e) => {
                            if (!upiError) e.target.style.borderColor = '#E8E0D5';
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handlePayWithUpi();
                            }
                          }}
                          autoFocus
                        />
                      </div>

                      {/* Quick handle chips */}
                      <div style={{ marginBottom: 18 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#8C8476', marginBottom: 6 }}>
                          Popular UPI Handles (click to append):
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {['@okhdfcbank', '@okaxis', '@oksbi', '@okicici', '@ybl', '@paytm', '@ibl', '@apl'].map((handle) => (
                            <button
                              key={handle}
                              type="button"
                              onClick={() => handleAppendUpiChip(handle)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: 6,
                                border: '1px solid #E8E0D5',
                                background: '#FFFFFF',
                                color: '#4B4339',
                                fontSize: 11,
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.1s ease',
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.background = '#EDE9FE';
                                (e.currentTarget as HTMLElement).style.borderColor = '#C4B5FD';
                                (e.currentTarget as HTMLElement).style.color = '#7C3AED';
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.background = '#FFFFFF';
                                (e.currentTarget as HTMLElement).style.borderColor = '#E8E0D5';
                                (e.currentTarget as HTMLElement).style.color = '#4B4339';
                              }}
                            >
                              {handle}
                            </button>
                          ))}
                        </div>
                      </div>

                      {upiError && (
                        <div
                          style={{
                            padding: '10px 12px',
                            borderRadius: 8,
                            background: '#FEF2F2',
                            border: '1px solid #FECACA',
                            color: '#DC2626',
                            fontSize: 12,
                            fontWeight: 500,
                            marginBottom: 16,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <span>⚠️</span>
                          <span>{upiError}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        id="submit-upi-pay-btn"
                        onClick={handlePayWithUpi}
                        disabled={upiSubmitting || !upiIdInput.trim()}
                        style={{
                          width: '100%',
                          padding: '13px 18px',
                          borderRadius: 12,
                          background: upiSubmitting || !upiIdInput.trim()
                            ? '#C4B5FD'
                            : 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                          color: '#FFFFFF',
                          fontSize: 14,
                          fontWeight: 700,
                          border: 'none',
                          cursor: upiSubmitting || !upiIdInput.trim() ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          boxShadow: upiSubmitting || !upiIdInput.trim() ? 'none' : '0 4px 14px rgba(124,58,237,0.3)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {upiSubmitting ? (
                          <>
                            <div
                              style={{
                                width: 16,
                                height: 16,
                                border: '2px solid rgba(255,255,255,0.4)',
                                borderTopColor: '#FFFFFF',
                                borderRadius: '50%',
                                animation: 'unoolSpin 0.8s linear infinite',
                              }}
                            />
                            <span>Sending UPI Request...</span>
                          </>
                        ) : (
                          <>
                            <span>Pay via UPI ID</span>
                            <span style={{ fontSize: 16 }}>→</span>
                          </>
                        )}
                      </button>

                      <div
                        style={{
                          marginTop: 14,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          fontSize: 11,
                          color: '#8C8476',
                        }}
                      >
                        <span>🔒</span>
                        <span>Direct Cashfree UPI Collect • Bank-Grade 256-bit Encryption</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '12px 8px' }}>
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: '50%',
                          background: '#F5F3FF',
                          border: '2px solid #DDD6FE',
                          margin: '0 auto 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 24,
                          animation: 'unoolPulse 2s infinite',
                        }}
                      >
                        📲
                      </div>

                      <h4 style={{ fontSize: 16, fontWeight: 800, color: '#1A1612', margin: '0 0 6px' }}>
                        Payment Request Dispatched!
                      </h4>

                      <p style={{ fontSize: 13, color: '#5A5245', margin: '0 0 16px', lineHeight: 1.5 }}>
                        A collect request has been sent to{' '}
                        <strong style={{ color: '#7C3AED' }}>{upiIdInput.trim().toLowerCase()}</strong>.
                      </p>

                      <div
                        style={{
                          background: '#FAF7F3',
                          border: '1px solid #E8E0D5',
                          borderRadius: 12,
                          padding: '14px 16px',
                          textAlign: 'left',
                          fontSize: 12,
                          color: '#4B4339',
                          lineHeight: 1.6,
                          marginBottom: 18,
                        }}
                      >
                        <div style={{ fontWeight: 700, color: '#1A1612', marginBottom: 6 }}>
                          Next Steps to Complete Payment:
                        </div>
                        <ol style={{ margin: 0, paddingLeft: 18 }}>
                          <li>Open your UPI app (Google Pay, PhonePe, Paytm, BHIM, etc.).</li>
                          <li>Approve the pending collect request from Cashfree.</li>
                          <li>Enter your UPI PIN to finalize payment.</li>
                        </ol>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          fontSize: 12,
                          color: '#7C3AED',
                          fontWeight: 600,
                          marginBottom: 16,
                        }}
                      >
                        <div
                          style={{
                            width: 14,
                            height: 14,
                            border: '2px solid #DDD6FE',
                            borderTopColor: '#7C3AED',
                            borderRadius: '50%',
                            animation: 'unoolSpin 0.8s linear infinite',
                          }}
                        />
                        <span>Waiting for your UPI approval...</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setUpiSent(false);
                          setUpiSubmitting(false);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#6B655B',
                          fontSize: 12,
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          padding: 4,
                        }}
                      >
                        Need to change UPI ID or retry?
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '8px 4px' }}>
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        background: '#FAF8F5',
                        border: '1px solid #E8E0D5',
                        margin: '0 auto 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 22,
                      }}
                    >
                      💳
                    </div>
                    <h4 style={{ fontSize: 16, fontWeight: 800, color: '#1A1612', margin: '0 0 6px' }}>
                      Cards, Netbanking & QR Code
                    </h4>
                    <p style={{ fontSize: 13, color: '#7A7265', margin: 0, lineHeight: 1.45 }}>
                      Pay using Visa, Mastercard, RuPay, 50+ Netbanking banks, or scan dynamic UPI QR code.
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      gap: 8,
                      marginBottom: 20,
                    }}
                  >
                    {['Cards', 'Netbanking', 'UPI QR Code', 'Wallets'].map((badge) => (
                      <span
                        key={badge}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#4B4339',
                          background: '#F4EFEA',
                          border: '1px solid #E8E0D5',
                          borderRadius: 6,
                          padding: '4px 10px',
                        }}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleLaunchGateway}
                    disabled={paymentLoading === activeCheckout.planId}
                    style={{
                      width: '100%',
                      padding: '13px 18px',
                      borderRadius: 12,
                      background: '#1A1612',
                      color: '#FFFFFF',
                      fontSize: 14,
                      fontWeight: 700,
                      border: 'none',
                      cursor: paymentLoading === activeCheckout.planId ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {paymentLoading === activeCheckout.planId ? (
                      <>
                        <div
                          style={{
                            width: 16,
                            height: 16,
                            border: '2px solid rgba(255,255,255,0.3)',
                            borderTopColor: '#FFFFFF',
                            borderRadius: '50%',
                            animation: 'unoolSpin 0.8s linear infinite',
                          }}
                        />
                        <span>Launching Gateway...</span>
                      </>
                    ) : (
                      <>
                        <span>Open Gateway (Cards, Netbanking & QR)</span>
                        <span style={{ fontSize: 16 }}>→</span>
                      </>
                    )}
                  </button>

                  <div
                    style={{
                      marginTop: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      fontSize: 11,
                      color: '#8C8476',
                    }}
                  >
                    <span>🔒</span>
                    <span>PCI-DSS Level 1 Compliant • 100% Secure</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '14px 24px',
                background: '#FAF8F5',
                borderTop: '1px solid #F0ECE6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ fontSize: 12, color: '#7A7265' }}>
                Need help? <span style={{ color: '#1A1612', fontWeight: 600 }}>support@unool.com</span>
              </div>
              <button
                type="button"
                onClick={closeAndCleanCashfree}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#7A7265',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 6,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = '#1A1612';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = '#7A7265';
                }}
              >
                Cancel & Close
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
let cachedCashfreeMode: string | null = null;

async function loadCashfreeSDK(modeOverride?: 'sandbox' | 'production'): Promise<CashfreeInstance | null> {
  const targetMode = modeOverride || (process.env.NEXT_PUBLIC_CASHFREE_MODE as 'sandbox' | 'production') || 'sandbox';
  if (cashfreeInstance && cachedCashfreeMode === targetMode) return cashfreeInstance;

  try {
    const { load } = await import('@cashfreepayments/cashfree-js');
    cashfreeInstance = await load({
      mode: targetMode,
    });
    cachedCashfreeMode = targetMode;
    return cashfreeInstance;
  } catch (err) {
    console.error('Failed to load Cashfree SDK:', err);
    return null;
  }
}
