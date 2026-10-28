'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CashfreeInstance } from '@cashfreepayments/cashfree-js';
import { sanitizePaymentError } from '@/lib/billing/sanitizeError';

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

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  }
  return digits;
}

function getCardBrand(num: string): { name: string; brand: 'visa' | 'mastercard' | 'rupay' | 'amex' | 'generic'; color: string } {
  const clean = num.replace(/\s+/g, '');
  if (/^4/.test(clean)) return { name: 'Visa', brand: 'visa', color: '#1A1F71' };
  if (/^(5[1-5]|2[2-7])/.test(clean)) return { name: 'Mastercard', brand: 'mastercard', color: '#EB001B' };
  if (/^(60|65|81|82)/.test(clean)) return { name: 'RuPay', brand: 'rupay', color: '#097939' };
  if (/^3[47]/.test(clean)) return { name: 'Amex', brand: 'amex', color: '#006FCF' };
  return { name: 'Card', brand: 'generic', color: '#7A7265' };
}

const POPULAR_BANKS = [
  { code: '3021', name: 'HDFC Bank', short: 'HDFC', badgeColor: '#004C8F' },
  { code: '3022', name: 'ICICI Bank', short: 'ICICI', badgeColor: '#B02A30' },
  { code: '3044', name: 'State Bank of India', short: 'SBI', badgeColor: '#225894' },
  { code: '3003', name: 'Axis Bank', short: 'Axis', badgeColor: '#97144D' },
  { code: '3032', name: 'Kotak Mahindra Bank', short: 'Kotak', badgeColor: '#ED1C24' },
  { code: '3038', name: 'Punjab National Bank', short: 'PNB', badgeColor: '#A21D22' },
];

const ALL_OTHER_BANKS = [
  { code: '3005', name: 'Bank of Baroda' },
  { code: '3009', name: 'Canara Bank' },
  { code: '3028', name: 'IndusInd Bank' },
  { code: '3055', name: 'Union Bank of India' },
  { code: '3058', name: 'Yes Bank' },
  { code: '3023', name: 'IDBI Bank' },
  { code: '3006', name: 'Bank of India' },
  { code: '3011', name: 'Central Bank of India' },
  { code: '3026', name: 'Indian Bank' },
  { code: '3018', name: 'Federal Bank' },
  { code: '3039', name: 'RBL Bank' },
  { code: '3087', name: 'AU Small Finance Bank' },
  { code: '3043', name: 'Standard Chartered Bank' },
  { code: '3024', name: 'IDFC FIRST Bank' },
  { code: '3042', name: 'South Indian Bank' },
  { code: '3054', name: 'UCO Bank' },
];

// ── In-Memory SWR Cache for 0ms Route Switching ──────────────────
let memoryBillingPlans: PlanData[] | null = null;
let memoryBillingCurrent: CurrentPlan | null = null;

// ── Skeleton Loader ─────────────────────────────────────────────
function BillingSkeleton() {
  return (
    <div style={{ padding: '32px 16px', maxWidth: 1400, margin: '0 auto', color: '#1A1612' }}>
      <style>{`
        @keyframes biscuitPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        .unool-plans-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          width: 100%;
        }
        @media (min-width: 640px) {
          .unool-plans-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
          }
        }
        @media (min-width: 1024px) {
          .unool-plans-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 16px;
          }
        }
        @media (min-width: 1360px) {
          .unool-plans-grid {
            gap: 20px;
          }
        }
      `}</style>
      {/* Header skeleton */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ width: 160, height: 28, borderRadius: 8, background: '#EDE7DD', animation: 'biscuitPulse 1.5s ease-in-out infinite', marginBottom: 10 }} />
        <div style={{ width: 340, height: 16, borderRadius: 6, background: '#E8E0D4', animation: 'biscuitPulse 1.5s ease-in-out infinite' }} />
      </div>

      {/* Cycle switcher skeleton */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
        <div style={{ width: 220, height: 42, borderRadius: 24, background: '#EDE7DD', animation: 'biscuitPulse 1.5s ease-in-out infinite' }} />
      </div>

      {/* 4 cards skeleton */}
      <div className="unool-plans-grid">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              background: '#FFFDF9',
              border: '1px solid #E8E0D4',
              borderRadius: 18,
              padding: '28px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              minWidth: 0,
              boxShadow: '0 4px 20px -2px rgba(61, 43, 31, 0.04)',
            }}
          >
            <div style={{ width: 90, height: 24, borderRadius: 6, background: '#EDE7DD', animation: 'biscuitPulse 1.5s ease-in-out infinite' }} />
            <div style={{ width: 180, height: 36, borderRadius: 8, background: '#E8E0D4', animation: 'biscuitPulse 1.5s ease-in-out infinite' }} />
            <div style={{ width: '100%', height: 14, borderRadius: 4, background: '#FAF7F2', animation: 'biscuitPulse 1.5s ease-in-out infinite' }} />
            <div style={{ height: 1, background: '#EDE7DD', margin: '4px 0' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#EDE7DD', flexShrink: 0 }} />
                  <div style={{ width: `${65 + ((j * 7) % 30)}%`, height: 12, borderRadius: 4, background: '#FAF7F2' }} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 'auto', paddingTop: 16 }}>
              <div style={{ width: '100%', height: 44, borderRadius: 12, background: '#EDE7DD', animation: 'biscuitPulse 1.5s ease-in-out infinite' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Component ───────────────────────────────────────────────────

export default function BillingClient() {
  const [plans, setPlans] = useState<PlanData[]>(() => memoryBillingPlans || []);
  const [currentPlan, setCurrentPlan] = useState<CurrentPlan | null>(() => memoryBillingCurrent || null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [loading, setLoading] = useState(() => !memoryBillingPlans || !memoryBillingCurrent);
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{ status: string; message: string } | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Active Checkout Dialog & Payment States
  const [activeCheckout, setActiveCheckout] = useState<ActiveCheckout | null>(null);
  const [checkoutTab, setCheckoutTab] = useState<'cards' | 'upi' | 'qr' | 'netbanking'>('upi');

  // UPI ID States
  const [upiIdInput, setUpiIdInput] = useState('');
  const [upiSubmitting, setUpiSubmitting] = useState(false);
  const [upiSent, setUpiSent] = useState(false);
  const [upiError, setUpiError] = useState<string | null>(null);

  // Card States
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardSubmitting, setCardSubmitting] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardThreeDSUrl, setCardThreeDSUrl] = useState<string | null>(null);
  const [cardAwaitingVerification, setCardAwaitingVerification] = useState(false);

  // QR States
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [qrString, setQrString] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  // Netbanking States
  const [selectedBank, setSelectedBank] = useState('3021');
  const [selectedBankName, setSelectedBankName] = useState('HDFC Bank');
  const [netbankingSubmitting, setNetbankingSubmitting] = useState(false);
  const [netbankingError, setNetbankingError] = useState<string | null>(null);
  const [netbankingRedirecting, setNetbankingRedirecting] = useState(false);

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
    setCardAwaitingVerification(false);
    setCardSubmitting(false);
    setNetbankingRedirecting(false);
    setNetbankingSubmitting(false);

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

    // 4. Reset active checkout states in UI
    setActiveCheckout(null);
    setUpiSubmitting(false);
    setUpiSent(false);
    setUpiError(null);
    setCardSubmitting(false);
    setCardError(null);
    setCardThreeDSUrl(null);
    setCardNumber('');
    setCardHolder('');
    setCardExpiry('');
    setCardCvv('');
    setQrImageUrl(null);
    setQrString(null);
    setQrLoading(false);
    setQrError(null);
    setNetbankingSubmitting(false);
    setNetbankingError(null);
    setNetbankingRedirecting(false);
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

          const optimisticPlan = {
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
          };
          memoryBillingCurrent = optimisticPlan;
          setCurrentPlan(optimisticPlan);

          window.scrollTo({ top: 0, behavior: 'smooth' });

          // Refresh current plan with cache buster from server
          try {
            const currentRes = await fetch(`/api/billing/current?t=${Date.now()}`, { cache: 'no-store' });
            if (currentRes.ok) {
              const freshPlan = await currentRes.json();
              if (freshPlan && !freshPlan.isFreeTier) {
                // Ensure we never overwrite the verified upgraded plan with a stale or previous plan
                if (!targetPlanId || freshPlan.plan?.id === targetPlanId) {
                  memoryBillingCurrent = freshPlan;
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
                memoryBillingCurrent = data;
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

    // 3. Listen for postMessage from the popup 3DS callback window
    const handlePaymentMessage = (event: MessageEvent) => {
      if (event.data?.type === 'UNO_CF_PAYMENT_STATUS') {
        const { orderId, status } = event.data;
        closeAndCleanCashfree();

        // Close checkout tab immediately
        setActiveCheckout(null);

        if (status === 'USER_DROPPED' || status === 'CANCELLED') {
          setPaymentResult({
            status: 'ERROR',
            message: 'Checkout was cancelled. No changes were made to your subscription.',
          });
        } else if (status === 'PAID' || status === 'SUCCESS') {
          if (orderId) {
            pollVerification(orderId);
          }
        } else if (status === 'FAILED') {
          setPaymentResult({
            status: 'FAILED',
            message: 'Payment was declined or failed. Please try again.',
          });
        }
      }
    };
    window.addEventListener('message', handlePaymentMessage);

    // 4. Handle return_url from Cashfree redirect (?order_id=xxx&status=xxx)
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
        window.removeEventListener('message', handlePaymentMessage);
      };
    }

    // 5. On page refresh during checkout, ensure URL is clean /dashboard/billing
    if (window.location.search || window.location.hash) {
      window.history.replaceState({}, '', '/dashboard/billing');
    }

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      window.removeEventListener('message', handlePaymentMessage);
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
          memoryBillingPlans = plansData.plans;
          setPlans(plansData.plans);
        }

        if (currentRes.ok) {
          const currentData = await currentRes.json();
          memoryBillingCurrent = currentData;
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

      // Open custom Unool checkout with Preferred UPI, QR, Cards, and Netbanking
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
      setCardNumber('');
      setCardHolder('');
      setCardExpiry('');
      setCardCvv('');
      setCardError(null);
      setCardThreeDSUrl(null);
      setUpiIdInput('');
      setUpiError(null);
      setUpiSent(false);
      setQrImageUrl(null);
      setQrString(null);
      setQrError(null);
      setNetbankingError(null);
      setNetbankingRedirecting(false);
    } catch (err) {
      console.error('Payment order creation error:', err);
      setPaymentResult({ status: 'ERROR', message: 'Something went wrong while initiating checkout. Please try again.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setPaymentLoading(null);
    }
  };

  // ── Card Handlers ──────────────────────────────────────────
  const handlePayWithCard = async () => {
    if (!activeCheckout) return;
    const cleanNum = cardNumber.replace(/\s+/g, '');
    if (cleanNum.length < 13 || cleanNum.length > 19) {
      setCardError('Please enter a valid card number.');
      return;
    }
    if (!cardHolder.trim()) {
      setCardError('Please enter the name on your card.');
      return;
    }
    const [month, year] = cardExpiry.split('/');
    if (!month || !year || month.length !== 2 || year.length !== 2) {
      setCardError('Please enter a valid expiry date (MM/YY).');
      return;
    }
    const monthNum = parseInt(month, 10);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      setCardError('Please enter a valid expiry month (01-12).');
      return;
    }
    if (cardCvv.trim().length < 3 || cardCvv.trim().length > 4) {
      setCardError('Please enter a valid CVV (3 or 4 digits).');
      return;
    }

    setCardSubmitting(true);
    setCardError(null);

    // Open popup synchronously in click handler to prevent browser popup blockers
    const authWin = window.open('about:blank', 'unool_3ds_window', 'width=540,height=720,scrollbars=yes,resizable=yes');
    if (authWin) {
      (window as any).__unool_cf_window = authWin;
      try {
        authWin.document.write(`<!DOCTYPE html>
<html><head><title>Secure Verification • Unool</title></head>
<body style="background:#0F0E0D;color:#E6E4DD;font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;">
<div>
  <div style="font-size:24px;margin-bottom:12px;">🛡️</div>
  <p style="font-size:16px;font-weight:600;margin:0 0 6px;color:#FFFFFF;">Connecting to Bank 3D Secure...</p>
  <p style="font-size:13px;color:#8C8476;margin:0;">Please wait, do not close this window.</p>
</div>
</body></html>`);
      } catch {}
    }

    try {
      const res = await fetch('/api/billing/pay-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cfOrderId: activeCheckout.cfOrderId,
          paymentSessionId: activeCheckout.paymentSessionId,
          cardNumber: cleanNum,
          cardHolder: cardHolder.trim(),
          expiryMonth: month,
          expiryYear: year,
          cvv: cardCvv.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        if (authWin && !authWin.closed) authWin.close();
        setCardError(sanitizePaymentError(data.error, 'Card payment processing failed. Please check details and try again.'));
        setCardSubmitting(false);
        setCardAwaitingVerification(false);
        return;
      }

      setCardSubmitting(false);
      setCardAwaitingVerification(true);
      setCardThreeDSUrl(data.url);

      if (authWin && !authWin.closed) {
        authWin.location.href = data.url;
        authWin.focus();
      }

      // Track if user manually closed popup window
      const checkClosedTimer = setInterval(() => {
        if (authWin && authWin.closed) {
          clearInterval(checkClosedTimer);
          setCardAwaitingVerification(false);
          setCardSubmitting(false);
          setActiveCheckout(null);
          setPaymentResult({
            status: 'ERROR',
            message: 'Checkout window was closed. No changes were made to your subscription.',
          });
        }
      }, 1000);

      pollVerification(activeCheckout.cfOrderId);
    } catch {
      if (authWin && !authWin.closed) authWin.close();
      setCardError('Payment gateway communication error. Please try again.');
      setCardSubmitting(false);
      setCardAwaitingVerification(false);
    }
  };

  // ── QR Code Handlers ───────────────────────────────────────
  const handleGenerateQr = useCallback(async (order: ActiveCheckout) => {
    setQrLoading(true);
    setQrError(null);
    try {
      const res = await fetch('/api/billing/pay-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cfOrderId: order.cfOrderId,
          paymentSessionId: order.paymentSessionId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setQrError(data.error || 'Failed to generate dynamic QR code.');
        setQrLoading(false);
        return;
      }
      setQrImageUrl(data.imageUrl || null);
      setQrString(data.qrString || null);
      setQrLoading(false);
      pollVerification(order.cfOrderId);
    } catch {
      setQrError('Failed to generate QR code. Please check your connection.');
      setQrLoading(false);
    }
  }, [pollVerification]);

  // Auto-generate QR code immediately when QR tab is opened
  useEffect(() => {
    if (activeCheckout && checkoutTab === 'qr' && !qrImageUrl && !qrString && !qrLoading) {
      handleGenerateQr(activeCheckout);
    }
  }, [activeCheckout, checkoutTab, qrImageUrl, qrString, qrLoading, handleGenerateQr]);

  // ── Netbanking Handlers ────────────────────────────────────
  const handlePayWithNetbanking = async () => {
    if (!activeCheckout) return;
    setNetbankingSubmitting(true);
    setNetbankingError(null);

    // Open popup synchronously in click handler to prevent browser popup blockers
    const nbWin = window.open('about:blank', 'unool_nb_window', 'width=620,height=760,scrollbars=yes,resizable=yes');
    if (nbWin) {
      (window as any).__unool_cf_window = nbWin;
      try {
        nbWin.document.write(`<!DOCTYPE html>
<html><head><title>Connecting to Bank • Unool</title></head>
<body style="background:#0F0E0D;color:#E6E4DD;font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;">
<div>
  <div style="font-size:24px;margin-bottom:12px;">🏦</div>
  <p style="font-size:16px;font-weight:600;margin:0 0 6px;color:#FFFFFF;">Connecting to ${selectedBankName}...</p>
  <p style="font-size:13px;color:#8C8476;margin:0;">Please wait, redirecting to bank portal...</p>
</div>
</body></html>`);
      } catch {}
    }

    try {
      const res = await fetch('/api/billing/pay-netbanking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cfOrderId: activeCheckout.cfOrderId,
          paymentSessionId: activeCheckout.paymentSessionId,
          netbankingCode: selectedBank,
          bankName: selectedBankName,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        if (nbWin && !nbWin.closed) nbWin.close();
        setNetbankingError(sanitizePaymentError(data.error, 'Failed to initiate Netbanking payment.'));
        setNetbankingSubmitting(false);
        return;
      }

      setNetbankingSubmitting(false);
      setNetbankingRedirecting(true);
      if (nbWin && !nbWin.closed) {
        nbWin.location.href = data.url;
        nbWin.focus();
      }

      // Track if user manually closed netbanking popup
      const checkNbClosed = setInterval(() => {
        if (nbWin && nbWin.closed) {
          clearInterval(checkNbClosed);
          setNetbankingRedirecting(false);
          setNetbankingSubmitting(false);
          setActiveCheckout(null);
          setPaymentResult({
            status: 'ERROR',
            message: 'Netbanking window was closed. No changes were made to your subscription.',
          });
        }
      }, 1000);

      pollVerification(activeCheckout.cfOrderId);
    } catch {
      if (nbWin && !nbWin.closed) nbWin.close();
      setNetbankingError('Failed to connect to netbanking. Please try again.');
      setNetbankingSubmitting(false);
      setNetbankingRedirecting(false);
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
        setUpiError(sanitizePaymentError(data.error, 'Failed to send UPI payment request. Please check your UPI ID and try again.'));
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
          const fresh = await currentRes.json();
          memoryBillingCurrent = fresh;
          setCurrentPlan(fresh);
        }
      }
    } catch (err) {
      console.error('Cancel failed:', err);
    }
  };

  // ── Loading State ──────────────────────────────────────────
  if (loading) {
    return <BillingSkeleton />;
  }

  const currentPlanId = currentPlan?.plan?.id || 'spark';
  const isFreeTier = currentPlan?.isFreeTier !== false;

  return (
    <div style={{ padding: '32px 16px', maxWidth: 1400, margin: '0 auto', color: '#1A1612' }}>
      <style>{`
        .unool-plans-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          width: 100%;
        }
        @media (min-width: 640px) {
          .unool-plans-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
          }
        }
        @media (min-width: 1024px) {
          .unool-plans-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 16px;
          }
        }
        @media (min-width: 1360px) {
          .unool-plans-grid {
            gap: 20px;
          }
        }
      `}</style>
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
      <div className="unool-plans-grid">
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
                borderRadius: 18,
                padding: '28px 18px',
                display: 'flex', flexDirection: 'column',
                minWidth: 0,
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
                  padding: '4px 14px', borderRadius: 12,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.35)',
                  whiteSpace: 'nowrap',
                }}>
                  Most Popular
                </div>
              )}

              {/* Plan header */}
              <div>
                <h3 style={{ fontSize: 21, fontWeight: 800, color: '#1A1612', margin: 0, letterSpacing: '-0.01em' }}>
                  {plan.name}
                </h3>
                <p style={{ fontSize: 12.5, color: '#7A7265', marginTop: 6, minHeight: 38, lineHeight: 1.4 }}>
                  {plan.tagline}
                </p>
              </div>

              {/* Price */}
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 34, fontWeight: 800, color: '#1A1612', letterSpacing: '-0.03em' }}>
                    {plan.isFreeTier ? 'Free' : price}
                  </span>
                  {!plan.isFreeTier && (
                    <span style={{ fontSize: 13, color: '#7A7265', fontWeight: 500 }}>/mo</span>
                  )}
                </div>
                {!plan.isFreeTier && billingCycle === 'annual' && (
                  <div style={{ fontSize: 11.5, color: '#059669', fontWeight: 600, marginTop: 4 }}>
                    Billed {plan.pricing.annualDisplay}/year
                  </div>
                )}
              </div>

              {/* Features */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0', flex: 1 }}>
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
                    padding: '11px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    background: '#ECFDF5', color: '#065F46',
                    border: '1px solid #A7F3D0',
                    cursor: 'default',
                    width: '100%',
                    textAlign: 'center',
                  }}
                >
                  ✓ Current Plan
                </button>
              ) : plan.isFreeTier ? (
                <button
                  disabled
                  style={{
                    padding: '11px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    background: '#F4EFEA', color: '#7A7265',
                    border: '1px solid #E8E0D5',
                    cursor: 'default',
                    width: '100%',
                    textAlign: 'center',
                  }}
                >
                  Free Forever
                </button>
              ) : (
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={!!paymentLoading || !isUpgrade}
                  style={{
                    padding: '11px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                    background: isUpgrade
                      ? (isPopular ? 'linear-gradient(135deg, #8B5CF6, #6366F1)' : '#1A1612')
                      : '#F4EFEA',
                    color: isUpgrade ? 'white' : '#7A7265',
                    border: 'none', cursor: isUpgrade ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    opacity: paymentLoading === plan.id ? 0.7 : 1,
                    width: '100%',
                    textAlign: 'center',
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

      {/* ── Unool Obsidian & Silk Vault Checkout Experience ────────────────────── */}
      {activeCheckout && (() => {
        const cardBrand = getCardBrand(cardNumber);
        const selectedPlan = plans.find((p) => p.id === activeCheckout.planId);

        // Vector Brand Logos (Zero Generic Emojis)
        const renderBrandBadge = (brand: string) => {
          switch (brand) {
            case 'visa':
              return (
                <svg viewBox="0 0 48 30" width="42" height="26" fill="none">
                  <rect width="48" height="30" rx="5" fill="#FFFFFF" />
                  <path d="M18.8 19.8L21 6.5H24L21.8 19.8H18.8ZM32.4 6.8C31.8 6.6 30.8 6.4 29.6 6.4C26.5 6.4 24.3 8 24.3 10.3C24.3 12 25.8 13 27 13.6C28.2 14.2 28.6 14.6 28.6 15.2C28.6 16.1 27.5 16.5 26.5 16.5C25.3 16.5 24.6 16.3 23.6 15.8L23.1 15.6L22.6 18.7C23.5 19.1 25.1 19.5 26.7 19.5C30.2 19.5 32.4 17.8 32.4 15.1C32.4 13.1 31 12.1 29.4 11.3C28.4 10.8 27.8 10.4 27.8 9.8C27.8 9.2 28.5 8.7 29.6 8.7C30.6 8.7 31.3 8.9 32 9.2L32.4 9.4L32.9 6.7L32.4 6.8ZM40.6 6.5H38.1C37.3 6.5 36.7 6.7 36.3 7.6L31 19.8H34.4L35.1 17.9H39.2L39.6 19.8H42.6L40.6 6.5ZM35.8 15.5C36.2 14.4 37.4 11.2 37.4 11.2C37.4 11.2 37.7 10.4 37.9 9.8L38.1 11C38.3 11.9 38.8 14.4 38.8 14.4L35.8 15.5ZM15.5 6.5L12.4 15.5L12.1 14.1C11.6 12.3 9.9 8.1 9.9 8.1C9.5 7.2 8.8 6.6 7.8 6.6H2.4L2.3 6.9C4.1 7.3 6.6 8.2 8 9.9L10.8 19.8H14.3L19.3 6.5H15.5Z" fill="#1A1F71" />
                </svg>
              );
            case 'mastercard':
              return (
                <svg viewBox="0 0 48 30" width="42" height="26" fill="none">
                  <rect width="48" height="30" rx="5" fill="#FFFFFF" />
                  <circ        return (
          <div
            id="unool-checkout-vault"
            role="dialog"
            aria-modal="true"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              background: '#F8FAFC',
              color: '#0F172A',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100vh',
              fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
            }}
          >
            {/* World-Class Typography & High-Performance Micro-Styles */}
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800;900&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap');

              .unool-co-heading {
                font-family: 'Bricolage Grotesque', -apple-system, sans-serif;
                letter-spacing: -0.025em;
              }
              .unool-co-mono {
                font-family: 'JetBrains Mono', monospace;
              }

              @keyframes unoolSpin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              @keyframes unoolPulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.25); opacity: 0.6; }
              }

              .unool-co-tab-btn {
                padding: 10px 14px;
                border-radius: 10px;
                font-size: 13.5px;
                font-weight: 600;
                display: flex;
                align-items: center;
                justifyContent: center;
                gap: 7px;
                cursor: pointer;
                transition: all 0.16s ease;
                border: 1px solid transparent;
              }
              .unool-co-tab-btn:hover:not(.active) {
                background: #E2E8F0;
                color: #0F172A;
              }
              .unool-co-tab-btn.active {
                background: #0F172A;
                color: #FFFFFF;
                box-shadow: 0 2px 8px rgba(15, 23, 42, 0.18);
              }

              .unool-co-pay-btn {
                width: 100%;
                height: 50px;
                border-radius: 12px;
                background: #0F172A;
                color: #FFFFFF;
                font-size: 15.5px;
                font-weight: 700;
                letter-spacing: -0.01em;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justifyContent: center;
                gap: 8px;
                box-shadow: 0 4px 14px rgba(15, 23, 42, 0.18);
                transition: all 0.16s ease;
              }
              .unool-co-pay-btn:hover:not(:disabled) {
                background: #1E293B;
                transform: translateY(-1px);
                box-shadow: 0 6px 20px rgba(15, 23, 42, 0.25);
              }
              .unool-co-pay-btn:disabled {
                opacity: 0.55;
                cursor: not-allowed;
                transform: none;
              }

              .unool-co-layout {
                display: grid;
                grid-template-columns: minmax(320px, 390px) 1fr;
                gap: 36px;
                width: 100%;
                max-width: 1060px;
                margin: 0 auto;
                align-items: start;
              }

              @media (max-width: 860px) {
                .unool-co-layout {
                  grid-template-columns: 1fr;
                  gap: 24px;
                }
                .unool-co-tab-grid {
                  grid-template-columns: repeat(2, 1fr) !important;
                }
              }
            `}</style>

            {/* ── Top Header Navigation ─────────────────────────────────── */}
            <header
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 50,
                height: 64,
                padding: '0 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#FFFFFF',
                borderBottom: '1px solid #E2E8F0',
                flexShrink: 0,
              }}
            >
              {/* Return to plans */}
              <button
                type="button"
                onClick={closeAndCleanCashfree}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 10,
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  color: '#334155',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#F1F5F9';
                  (e.currentTarget as HTMLElement).style.color = '#0F172A';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#F8FAFC';
                  (e.currentTarget as HTMLElement).style.color = '#334155';
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>Return to Plans</span>
              </button>

              {/* Logo & Security Lockup */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  className="unool-co-heading"
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: '#0F172A',
                    letterSpacing: '-0.04em',
                  }}
                >
                  unool
                </span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: '#047857',
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#10B981',
                      animation: 'unoolPulse 2s infinite',
                    }}
                  />
                  Secure Checkout
                </span>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={closeAndCleanCashfree}
                title="Close checkout (Esc)"
                aria-label="Close"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                  color: '#64748B',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#FEE2E2';
                  (e.currentTarget as HTMLElement).style.borderColor = '#FECACA';
                  (e.currentTarget as HTMLElement).style.color = '#DC2626';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#F8FAFC';
                  (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0';
                  (e.currentTarget as HTMLElement).style.color = '#64748B';
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            {/* ── Main Stage ────────────────────────────────────────────── */}
            <main
              style={{
                flex: '1 1 auto',
                padding: '36px 20px 64px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
              }}
            >
              <div className="unool-co-layout">
                {/* ── LEFT COLUMN: Order Summary ─────────────────────────── */}
                <div
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 20,
                    border: '1px solid #E2E8F0',
                    padding: '30px 26px',
                    boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 22,
                  }}
                >
                  {/* Plan Header */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          color: '#1D4ED8',
                          background: '#EFF6FF',
                          padding: '3px 8px',
                          borderRadius: 6,
                          border: '1px solid #DBEAFE',
                        }}
                      >
                        UNOOL {activeCheckout.planName.toUpperCase()}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: activeCheckout.billingCycle === 'annual' ? '#047857' : '#475569',
                          background: activeCheckout.billingCycle === 'annual' ? '#ECFDF5' : '#F1F5F9',
                          padding: '3px 8px',
                          borderRadius: 6,
                          border: activeCheckout.billingCycle === 'annual' ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
                        }}
                      >
                        {activeCheckout.billingCycle === 'annual' ? 'Annual (20% Off)' : 'Monthly Plan'}
                      </span>
                    </div>

                    <h2
                      className="unool-co-heading"
                      style={{
                        fontSize: 26,
                        fontWeight: 900,
                        color: '#0F172A',
                        margin: '0 0 6px',
                        letterSpacing: '-0.03em',
                      }}
                    >
                      Upgrade to {activeCheckout.planName}
                    </h2>
                    <p style={{ fontSize: 13.5, color: '#64748B', margin: 0, lineHeight: 1.45 }}>
                      {selectedPlan?.tagline || 'Professional brand, zero third-party branding.'}
                    </p>
                  </div>

                  {/* Clean Financial Ledger */}
                  <div
                    style={{
                      background: '#F8FAFC',
                      borderRadius: 14,
                      border: '1px solid #E2E8F0',
                      padding: '16px 18px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>
                        Subscription Fee
                      </span>
                      <span className="unool-co-heading" style={{ fontSize: 24, fontWeight: 900, color: '#0F172A' }}>
                        {activeCheckout.priceDisplay}
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#64748B', marginLeft: 3 }}>
                          {activeCheckout.billingCycle === 'annual' ? '/yr' : '/mo'}
                        </span>
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5, color: '#64748B', marginBottom: 8 }}>
                      <span>Gateway &amp; Processing Fees</span>
                      <span style={{ color: '#059669', fontWeight: 700 }}>Included (₹0)</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5, color: '#64748B', marginBottom: 12 }}>
                      <span>Taxes &amp; GST</span>
                      <span style={{ color: '#059669', fontWeight: 700 }}>All-inclusive</span>
                    </div>

                    <div style={{ height: 1, background: '#E2E8F0', margin: '10px 0 12px' }} />

                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                        Total Due Today
                      </span>
                      <span className="unool-co-heading" style={{ fontSize: 24, fontWeight: 900, color: '#0F172A' }}>
                        {activeCheckout.priceDisplay}
                      </span>
                    </div>
                  </div>

                  {/* Unlocked Privileges */}
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: '#64748B',
                        marginBottom: 10,
                      }}
                    >
                      What you're unlocking:
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                      {[
                        'Unlimited AI adaptations across LinkedIn, X, Threads, IG',
                        'Autonomous smart multi-platform schedule & publishing',
                        'SignalDM smart high-intent lead conversion concierge',
                        'Full 4K Ultra-HD media studio & brand asset kits',
                        'Priority 24/7 dedicated creator SLA support',
                      ].map((item, idx) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 12.5, color: '#334155', lineHeight: 1.35 }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 100% Flexible Subscription Assurance */}
                  <div
                    style={{
                      background: '#F0FDF4',
                      border: '1px solid #DCFCE7',
                      borderRadius: 12,
                      padding: '13px 15px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#166534', marginBottom: 2 }}>
                        100% Flexible Subscription
                      </div>
                      <div style={{ fontSize: 11.5, color: '#15803D', lineHeight: 1.4 }}>
                        Cancel anytime with a single click inside your billing settings. Zero lock-in, zero hidden cancellation fees.
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── RIGHT COLUMN: Payment Console ───────────────────────── */}
                <div
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 20,
                    border: '1px solid #E2E8F0',
                    padding: '30px 28px',
                    boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: 0,
                  }}
                >
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748B', marginBottom: 10 }}>
                      Select Payment Method
                    </div>

                    {/* Horizontal High-Clarity Segmented Tabs */}
                    <div
                      className="unool-co-tab-grid"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 6,
                        background: '#F1F5F9',
                        padding: 5,
                        borderRadius: 12,
                      }}
                    >
                      {/* Tab 1: UPI ID */}
                      <button
                        type="button"
                        id="checkout-tab-upi"
                        onClick={() => setCheckoutTab('upi')}
                        className={`unool-co-tab-btn ${checkoutTab === 'upi' ? 'active' : ''}`}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                        <span>UPI ID</span>
                      </button>

                      {/* Tab 2: Scan QR */}
                      <button
                        type="button"
                        id="checkout-tab-qr"
                        onClick={() => {
                          setCheckoutTab('qr');
                          if (!qrImageUrl && !qrString && activeCheckout) {
                            handleGenerateQr(activeCheckout);
                          }
                        }}
                        className={`unool-co-tab-btn ${checkoutTab === 'qr' ? 'active' : ''}`}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="6" height="6" x="3" y="3" rx="1.5" />
                          <rect width="6" height="6" x="15" y="3" rx="1.5" />
                          <rect width="6" height="6" x="3" y="15" rx="1.5" />
                          <path d="M15 15h3v3h-3z" />
                          <path d="M18 18h3v3h-3z" />
                        </svg>
                        <span>Scan QR</span>
                      </button>

                      {/* Tab 3: Cards */}
                      <button
                        type="button"
                        id="checkout-tab-cards"
                        onClick={() => setCheckoutTab('cards')}
                        className={`unool-co-tab-btn ${checkoutTab === 'cards' ? 'active' : ''}`}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="20" height="14" x="2" y="5" rx="3" />
                          <line x1="2" x2="22" y1="10" y2="10" />
                        </svg>
                        <span>Card</span>
                      </button>

                      {/* Tab 4: Net Banking */}
                      <button
                        type="button"
                        id="checkout-tab-netbanking"
                        onClick={() => setCheckoutTab('netbanking')}
                        className={`unool-co-tab-btn ${checkoutTab === 'netbanking' ? 'active' : ''}`}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="3" x2="21" y1="22" y2="22" />
                          <line x1="6" x2="6" y1="18" y2="11" />
                          <line x1="10" x2="10" y1="18" y2="11" />
                          <line x1="14" x2="14" y1="18" y2="11" />
                          <line x1="18" x2="18" y1="18" y2="11" />
                          <polygon points="12 2 20 7 4 7" />
                        </svg>
                        <span>Net Banking</span>
                      </button>
                    </div>
                  </div>

                  <div style={{ height: 1, background: '#F1F5F9', margin: '6px 0 20px' }} />

                  {/* ── TAB 1: UPI ID / VPA ─────────────────────────────────── */}
                  {checkoutTab === 'upi' && (
                    <div>
                      {!upiSent ? (
                        <div>
                          <div style={{ marginBottom: 18 }}>
                            <h3 className="unool-co-heading" style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>
                              Pay via UPI ID
                            </h3>
                            <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.45 }}>
                              Enter your Virtual Payment Address (VPA) to receive an instant payment collect request on Google Pay, PhonePe, Paytm, or BHIM.
                            </p>
                          </div>

                          {/* UPI ID Input */}
                          <div style={{ marginBottom: 18 }}>
                            <label
                              htmlFor="upi-id-input"
                              style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}
                            >
                              UPI ID / VPA
                            </label>
                            <div style={{ position: 'relative' }}>
                              <span
                                style={{
                                  position: 'absolute',
                                  left: 14,
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  color: '#64748B',
                                  fontWeight: 700,
                                  fontSize: 16,
                                }}
                              >
                                @
                              </span>
                              <input
                                type="text"
                                id="upi-id-input"
                                value={upiIdInput}
                                onChange={(e) => {
                                  setUpiIdInput(e.target.value);
                                  setUpiError(null);
                                }}
                                placeholder="e.g. yourname@okhdfcbank or 9876543210@upi"
                                className="unool-co-mono"
                                style={{
                                  width: '100%',
                                  padding: '13px 14px 13px 38px',
                                  borderRadius: 10,
                                  border: upiError ? '1.5px solid #EF4444' : '1.5px solid #CBD5E1',
                                  fontSize: 14.5,
                                  color: '#0F172A',
                                  background: '#FFFFFF',
                                  outline: 'none',
                                  boxSizing: 'border-box',
                                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                                }}
                                onFocus={(e) => {
                                  if (!upiError) {
                                    e.target.style.borderColor = '#0F172A';
                                    e.target.style.boxShadow = '0 0 0 3px rgba(15, 23, 42, 0.08)';
                                  }
                                }}
                                onBlur={(e) => {
                                  if (!upiError) {
                                    e.target.style.borderColor = '#CBD5E1';
                                    e.target.style.boxShadow = 'none';
                                  }
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
                          </div>

                          {/* Popular UPI Handles */}
                          <div style={{ marginBottom: 22 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B', marginBottom: 8 }}>
                              Popular UPI Handles (click to append):
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {['@okhdfcbank', '@okaxis', '@oksbi', '@okicici', '@ybl', '@paytm', '@ibl', '@apl'].map((handle) => (
                                <button
                                  key={handle}
                                  type="button"
                                  onClick={() => handleAppendUpiChip(handle)}
                                  className="unool-co-mono"
                                  style={{
                                    padding: '5px 10px',
                                    borderRadius: 8,
                                    border: '1px solid #E2E8F0',
                                    background: '#F8FAFC',
                                    color: '#334155',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLElement).style.background = '#E2E8F0';
                                    (e.currentTarget as HTMLElement).style.color = '#0F172A';
                                  }}
                                  onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLElement).style.background = '#F8FAFC';
                                    (e.currentTarget as HTMLElement).style.color = '#334155';
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
                                padding: '11px 14px',
                                borderRadius: 10,
                                background: '#FEF2F2',
                                border: '1px solid #FECACA',
                                color: '#DC2626',
                                fontSize: 13,
                                fontWeight: 500,
                                marginBottom: 18,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                              </svg>
                              <span>{upiError}</span>
                            </div>
                          )}

                          {/* Primary Authorize Button */}
                          <button
                            type="button"
                            id="submit-upi-pay-btn"
                            onClick={handlePayWithUpi}
                            disabled={upiSubmitting || !upiIdInput.trim()}
                            className="unool-co-pay-btn unool-co-heading"
                          >
                            {upiSubmitting ? (
                              <>
                                <div
                                  style={{
                                    width: 17,
                                    height: 17,
                                    border: '2px solid rgba(255, 255, 255, 0.3)',
                                    borderTopColor: '#FFFFFF',
                                    borderRadius: '50%',
                                    animation: 'unoolSpin 0.7s linear infinite',
                                  }}
                                />
                                <span>Sending Collect Request...</span>
                              </>
                            ) : (
                              <>
                                <span>Authorize {activeCheckout.priceDisplay} via UPI</span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="5" y1="12" x2="19" y2="12" />
                                  <polyline points="12 5 19 12 12 19" />
                                </svg>
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        /* Dispatched State */
                        <div style={{ textAlign: 'center', padding: '16px 8px' }}>
                          <div
                            style={{
                              width: 58,
                              height: 58,
                              borderRadius: '50%',
                              background: '#ECFDF5',
                              border: '2px solid #10B981',
                              margin: '0 auto 16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#059669',
                            }}
                          >
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
                              <path d="M12 18h.01" />
                            </svg>
                          </div>

                          <h4 className="unool-co-heading" style={{ fontSize: 19, fontWeight: 900, color: '#0F172A', margin: '0 0 6px' }}>
                            Collect Request Sent
                          </h4>
                          <p style={{ fontSize: 13.5, color: '#475569', margin: '0 0 20px', lineHeight: 1.5 }}>
                            A payment collect notification of <strong>{activeCheckout.priceDisplay}</strong> has been transmitted to{' '}
                            <strong className="unool-co-mono" style={{ color: '#0F172A' }}>
                              {upiIdInput.trim().toLowerCase()}
                            </strong>.
                          </p>

                          <div
                            style={{
                              background: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              borderRadius: 12,
                              padding: '16px 18px',
                              textAlign: 'left',
                              fontSize: 13,
                              color: '#334155',
                              lineHeight: 1.6,
                              marginBottom: 20,
                            }}
                          >
                            <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                              How to complete:
                            </div>
                            <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <li>Open your UPI app (Google Pay, PhonePe, Paytm, or BHIM).</li>
                              <li>Approve the incoming payment request from Cashfree / Unool.</li>
                              <li>Enter your UPI PIN to finalize your membership.</li>
                            </ol>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 8,
                              fontSize: 12.5,
                              color: '#047857',
                              fontWeight: 700,
                              background: '#ECFDF5',
                              border: '1px solid #A7F3D0',
                              borderRadius: 10,
                              padding: '10px 14px',
                              marginBottom: 16,
                            }}
                          >
                            <span
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                background: '#10B981',
                                animation: 'unoolPulse 1.5s infinite',
                              }}
                            />
                            <span>Waiting for approval on your mobile device...</span>
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
                              color: '#64748B',
                              fontSize: 12.5,
                              textDecoration: 'underline',
                              cursor: 'pointer',
                              padding: 4,
                            }}
                          >
                            Need to modify UPI ID or retry?
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── TAB 2: SCAN QR CODE ─────────────────────────────────── */}
                  {checkoutTab === 'qr' && (
                    <div style={{ textAlign: 'center', padding: '10px 4px' }}>
                      <div style={{ marginBottom: 18 }}>
                        <h3 className="unool-co-heading" style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>
                          Scan to Pay via Any UPI App
                        </h3>
                        <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                          Point your phone camera or any UPI app scanner at the code below to pay {activeCheckout.priceDisplay}.
                        </p>
                      </div>

                      {/* QR Viewfinder */}
                      <div
                        style={{
                          width: 230,
                          height: 230,
                          margin: '0 auto 18px',
                          background: '#FFFFFF',
                          borderRadius: 16,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid #E2E8F0',
                          boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.06)',
                          position: 'relative',
                          padding: 12,
                          boxSizing: 'border-box',
                        }}
                      >
                        {qrLoading ? (
                          <div style={{ textAlign: 'center' }}>
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                border: '3px solid #E2E8F0',
                                borderTopColor: '#0F172A',
                                borderRadius: '50%',
                                animation: 'unoolSpin 0.8s linear infinite',
                                margin: '0 auto 10px',
                              }}
                            />
                            <span style={{ fontSize: 12.5, color: '#64748B', fontWeight: 600 }}>
                              Generating QR...
                            </span>
                          </div>
                        ) : qrImageUrl || qrString ? (
                          <img
                            src={
                              qrImageUrl ||
                              `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=4&data=${encodeURIComponent(
                                qrString || ''
                              )}`
                            }
                            alt="Dynamic UPI QR Code"
                            style={{
                              width: 200,
                              height: 200,
                              borderRadius: 8,
                              objectFit: 'contain',
                            }}
                          />
                        ) : (
                          <div style={{ textAlign: 'center', padding: 10 }}>
                            <button
                              type="button"
                              onClick={() => handleGenerateQr(activeCheckout)}
                              className="unool-co-pay-btn unool-co-heading"
                              style={{ padding: '8px 16px', fontSize: 13, height: 'auto' }}
                            >
                              Generate QR Code
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Ecosystem Badges */}
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          justifyContent: 'center',
                          gap: 6,
                          marginBottom: 16,
                        }}
                      >
                        {['Google Pay', 'PhonePe', 'Paytm', 'BHIM', 'Cred', 'Amazon Pay'].map((app) => (
                          <span
                            key={app}
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#475569',
                              background: '#F1F5F9',
                              borderRadius: 6,
                              padding: '3px 8px',
                            }}
                          >
                            {app}
                          </span>
                        ))}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          fontSize: 12.5,
                          color: '#047857',
                          fontWeight: 700,
                          background: '#ECFDF5',
                          border: '1px solid #A7F3D0',
                          borderRadius: 10,
                          padding: '10px 14px',
                          marginBottom: 14,
                        }}
                      >
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            background: '#10B981',
                            animation: 'unoolPulse 1.5s infinite',
                          }}
                        />
                        <span>Listening for scan &amp; instant bank confirmation...</span>
                      </div>

                      {qrString && (
                        <a
                          href={qrString}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            fontSize: 12.5,
                            color: '#1D4ED8',
                            fontWeight: 700,
                            textDecoration: 'none',
                          }}
                        >
                          <span>Paying on this phone? Tap to open UPI app</span>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      )}
                    </div>
                  )}

                  {/* ── TAB 3: CARDS ────────────────────────────────────────── */}
                  {checkoutTab === 'cards' && (
                    <div>
                      <div style={{ marginBottom: 18 }}>
                        <h3 className="unool-co-heading" style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>
                          Pay with Card
                        </h3>
                        <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                          Visa, Mastercard, RuPay, and American Express accepted.
                        </p>
                      </div>

                      {/* Card Number */}
                      <div style={{ marginBottom: 14 }}>
                        <label
                          htmlFor="unool-card-number"
                          style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}
                        >
                          Card Number
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="text"
                            id="unool-card-number"
                            value={cardNumber}
                            onChange={(e) => {
                              const val = formatCardNumber(e.target.value);
                              setCardNumber(val);
                              setCardError(null);
                            }}
                            placeholder="4000 1234 5678 9010"
                            maxLength={19}
                            className="unool-co-mono"
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              paddingRight: 64,
                              borderRadius: 10,
                              border: '1.5px solid #CBD5E1',
                              fontSize: 14.5,
                              letterSpacing: '1px',
                              color: '#0F172A',
                              background: '#FFFFFF',
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = '#0F172A';
                              e.target.style.boxShadow = '0 0 0 3px rgba(15, 23, 42, 0.08)';
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = '#CBD5E1';
                              e.target.style.boxShadow = 'none';
                            }}
                          />
                          <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
                            {renderBrandBadge(cardBrand.brand)}
                          </div>
                        </div>
                      </div>

                      {/* Cardholder Name */}
                      <div style={{ marginBottom: 14 }}>
                        <label
                          htmlFor="unool-card-holder"
                          style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}
                        >
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          id="unool-card-holder"
                          value={cardHolder}
                          onChange={(e) => {
                            setCardHolder(e.target.value);
                            setCardError(null);
                          }}
                          placeholder="Name as printed on card"
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            borderRadius: 10,
                            border: '1.5px solid #CBD5E1',
                            fontSize: 14,
                            color: '#0F172A',
                            background: '#FFFFFF',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#0F172A';
                            e.target.style.boxShadow = '0 0 0 3px rgba(15, 23, 42, 0.08)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#CBD5E1';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      </div>

                      {/* Expiry & CVV */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                        <div>
                          <label
                            htmlFor="unool-card-expiry"
                            style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}
                          >
                            Expiry (MM/YY)
                          </label>
                          <input
                            type="text"
                            id="unool-card-expiry"
                            value={cardExpiry}
                            onChange={(e) => {
                              const val = formatExpiry(e.target.value);
                              setCardExpiry(val);
                              setCardError(null);
                            }}
                            placeholder="MM/YY"
                            maxLength={5}
                            className="unool-co-mono"
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              borderRadius: 10,
                              border: '1.5px solid #CBD5E1',
                              fontSize: 14,
                              color: '#0F172A',
                              background: '#FFFFFF',
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = '#0F172A';
                              e.target.style.boxShadow = '0 0 0 3px rgba(15, 23, 42, 0.08)';
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = '#CBD5E1';
                              e.target.style.boxShadow = 'none';
                            }}
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="unool-card-cvv"
                            style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}
                          >
                            CVV / CVC
                          </label>
                          <input
                            type="password"
                            id="unool-card-cvv"
                            value={cardCvv}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                              setCardCvv(digits);
                              setCardError(null);
                            }}
                            placeholder="•••"
                            maxLength={4}
                            className="unool-co-mono"
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              borderRadius: 10,
                              border: '1.5px solid #CBD5E1',
                              fontSize: 14,
                              letterSpacing: '2px',
                              color: '#0F172A',
                              background: '#FFFFFF',
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = '#0F172A';
                              e.target.style.boxShadow = '0 0 0 3px rgba(15, 23, 42, 0.08)';
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = '#CBD5E1';
                              e.target.style.boxShadow = 'none';
                            }}
                          />
                        </div>
                      </div>

                      {cardError && (
                        <div
                          style={{
                            padding: '11px 14px',
                            borderRadius: 10,
                            background: '#FEF2F2',
                            border: '1px solid #FECACA',
                            color: '#DC2626',
                            fontSize: 13,
                            fontWeight: 500,
                            marginBottom: 18,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          <span>{cardError}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        id="unool-submit-card-pay"
                        onClick={handlePayWithCard}
                        disabled={cardSubmitting || !cardNumber || !cardHolder || !cardExpiry || !cardCvv}
                        className="unool-co-pay-btn unool-co-heading"
                      >
                        {cardSubmitting ? (
                          <>
                            <div
                              style={{
                                width: 17,
                                height: 17,
                                border: '2px solid rgba(255, 255, 255, 0.3)',
                                borderTopColor: '#FFFFFF',
                                borderRadius: '50%',
                                animation: 'unoolSpin 0.7s linear infinite',
                              }}
                            />
                            <span>Securing 3D Bank Channel...</span>
                          </>
                        ) : (
                          <>
                            <span>Pay {activeCheckout.priceDisplay} via Card</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="5" y1="12" x2="19" y2="12" />
                              <polyline points="12 5 19 12 12 19" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* ── TAB 4: NET BANKING ──────────────────────────────────── */}
                  {checkoutTab === 'netbanking' && (
                    <div>
                      <div style={{ marginBottom: 18 }}>
                        <h3 className="unool-co-heading" style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>
                          Select Your Bank
                        </h3>
                        <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                          Direct debit authorization supported for all major Indian banks.
                        </p>
                      </div>

                      {/* Top 6 Banks */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: 10,
                          marginBottom: 18,
                        }}
                      >
                        {POPULAR_BANKS.map((b) => {
                          const isSelected = selectedBank === b.code;
                          return (
                            <button
                              key={b.code}
                              type="button"
                              onClick={() => {
                                setSelectedBank(b.code);
                                setSelectedBankName(b.name);
                                setNetbankingError(null);
                              }}
                              style={{
                                padding: '12px 10px',
                                borderRadius: 10,
                                border: isSelected ? '2px solid #0F172A' : '1px solid #E2E8F0',
                                background: isSelected ? '#F1F5F9' : '#FFFFFF',
                                color: '#0F172A',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 5,
                                transition: 'all 0.15s ease',
                                textAlign: 'center',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 800,
                                  color: b.badgeColor === '#004C8F' ? '#1D4ED8' : b.badgeColor === '#225894' ? '#2563EB' : '#DC2626',
                                  background: '#F8FAFC',
                                  padding: '2px 7px',
                                  borderRadius: 5,
                                  border: '1px solid #E2E8F0',
                                }}
                              >
                                {b.short}
                              </span>
                              <span style={{ fontSize: 12.5, fontWeight: isSelected ? 800 : 600 }}>
                                {b.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Other Banks Dropdown */}
                      <div style={{ marginBottom: 20 }}>
                        <label
                          htmlFor="unool-bank-select"
                          style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}
                        >
                          Or select other bank (50+ available):
                        </label>
                        <select
                          id="unool-bank-select"
                          value={selectedBank}
                          onChange={(e) => {
                            const code = e.target.value;
                            setSelectedBank(code);
                            const found =
                              POPULAR_BANKS.find((b) => b.code === code) ||
                              ALL_OTHER_BANKS.find((b) => b.code === code);
                            setSelectedBankName(found?.name || 'Selected Bank');
                            setNetbankingError(null);
                          }}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            borderRadius: 10,
                            border: '1.5px solid #CBD5E1',
                            fontSize: 14,
                            color: '#0F172A',
                            background: '#FFFFFF',
                            outline: 'none',
                            boxSizing: 'border-box',
                            cursor: 'pointer',
                          }}
                        >
                          <optgroup label="Popular Banks">
                            {POPULAR_BANKS.map((b) => (
                              <option key={b.code} value={b.code}>
                                {b.name}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="All Other Indian Banks">
                            {ALL_OTHER_BANKS.map((b) => (
                              <option key={b.code} value={b.code}>
                                {b.name}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>

                      {netbankingError && (
                        <div
                          style={{
                            padding: '11px 14px',
                            borderRadius: 10,
                            background: '#FEF2F2',
                            border: '1px solid #FECACA',
                            color: '#DC2626',
                            fontSize: 13,
                            fontWeight: 500,
                            marginBottom: 18,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          <span>{netbankingError}</span>
                        </div>
                      )}

                      {netbankingRedirecting && (
                        <div
                          style={{
                            padding: '14px 16px',
                            borderRadius: 10,
                            background: '#ECFDF5',
                            border: '1px solid #A7F3D0',
                            marginBottom: 18,
                            textAlign: 'center',
                          }}
                        >
                          <div style={{ fontSize: 13.5, fontWeight: 800, color: '#065F46', marginBottom: 3 }}>
                            Redirecting to {selectedBankName} Portal
                          </div>
                          <div style={{ fontSize: 12, color: '#047857' }}>
                            Please authorize payment on your bank screen. Unool will update automatically.
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        id="unool-submit-netbanking-pay"
                        onClick={handlePayWithNetbanking}
                        disabled={netbankingSubmitting}
                        className="unool-co-pay-btn unool-co-heading"
                      >
                        {netbankingSubmitting ? (
                          <>
                            <div
                              style={{
                                width: 17,
                                height: 17,
                                border: '2px solid rgba(255, 255, 255, 0.3)',
                                borderTopColor: '#FFFFFF',
                                borderRadius: '50%',
                                animation: 'unoolSpin 0.7s linear infinite',
                              }}
                            />
                            <span>Connecting to {selectedBankName}...</span>
                          </>
                        ) : (
                          <>
                            <span>Proceed with {selectedBankName}</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="5" y1="12" x2="19" y2="12" />
                              <polyline points="12 5 19 12 12 19" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* ── Security Trust Footer ───────────────────────────────── */}
                  <div
                    style={{
                      marginTop: 22,
                      paddingTop: 16,
                      borderTop: '1px solid #F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      fontSize: 12,
                      color: '#64748B',
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span>Direct Cashfree UPI Collect • Bank-Grade 256-Bit SSL Protection</span>
                  </div>
                </div>
              </div>
            </main>
          </div>
        );
      })()}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function FeatureItem({ text, highlight }: { text: string; highlight?: boolean }) {
  return (
    <li style={{
      display: 'flex', alignItems: 'center', gap: 8,
      fontSize: 12.5, color: highlight ? '#8B5CF6' : '#2D241E',
      fontWeight: highlight ? 600 : 400,
      padding: '4.5px 0',
      lineHeight: 1.35,
    }}>
      <span style={{ color: highlight ? '#8B5CF6' : '#10B981', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>✓</span>
      <span>{text}</span>
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
