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
                  <circle cx="19" cy="15" r="8.5" fill="#EB001B" />
                  <circle cx="29" cy="15" r="8.5" fill="#F79E1B" />
                  <path d="M24 9.6A8.5 8.5 0 0 1 27.1 15 8.5 8.5 0 0 1 24 20.4 8.5 8.5 0 0 1 20.9 15 8.5 8.5 0 0 1 24 9.6Z" fill="#FF5F00" />
                </svg>
              );
            case 'rupay':
              return (
                <svg viewBox="0 0 48 30" width="42" height="26" fill="none">
                  <rect width="48" height="30" rx="5" fill="#FFFFFF" />
                  <path d="M10 8.5H21C23 8.5 24.5 10 24.5 12C24.5 14 23 15.5 21 15.5H14.5L21.5 21.5H17L10.5 16V21.5H8V8.5H10Z" fill="#097939" />
                  <path d="M28 8.5L22.5 21.5H26.5L32 8.5H28Z" fill="#F26522" />
                  <path d="M33 8.5L27.5 21.5H31.5L37 8.5H33Z" fill="#0072BC" />
                </svg>
              );
            case 'amex':
              return (
                <svg viewBox="0 0 48 30" width="42" height="26" fill="none">
                  <rect width="48" height="30" rx="5" fill="#006FCF" />
                  <text x="24" y="19" fill="#FFFFFF" fontSize="9.5" fontWeight="900" fontFamily="system-ui, sans-serif" textAnchor="middle" letterSpacing="1">AMEX</text>
                </svg>
              );
            default:
              return (
                <svg viewBox="0 0 48 30" width="42" height="26" fill="none">
                  <rect width="48" height="30" rx="5" fill="#1F151B" stroke="rgba(229,169,60,0.3)" strokeWidth="1" />
                  <rect x="5" y="6" width="38" height="4" rx="1" fill="rgba(229,169,60,0.4)" />
                  <circle cx="11" cy="18" r="2.5" fill="#C84B31" />
                  <circle cx="17" cy="18" r="2.5" fill="#E5A93C" />
                </svg>
              );
          }
        };

        return (
          <div
            id="unool-checkout-vault"
            role="dialog"
            aria-modal="true"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 10000,
              background: '#0D080B',
              color: '#FBF8F3',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100vh',
            }}
          >
            {/* World-Class Bespoke Typography & Silk Animations */}
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800;900&family=DM+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@500;600;700&display=swap');

              .unool-vault-font-heading {
                font-family: 'Bricolage Grotesque', -apple-system, sans-serif;
                letter-spacing: -0.03em;
              }
              .unool-vault-font-serif {
                font-family: 'Instrument Serif', Georgia, serif;
                font-style: italic;
              }
              .unool-vault-font-mono {
                font-family: 'JetBrains Mono', monospace;
              }
              .unool-vault-font-body {
                font-family: 'DM Sans', -apple-system, sans-serif;
              }

              /* Silky Fluid Waves */
              @keyframes unoolSilkWave1 {
                0% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
                50% { transform: translate3d(-30px, 15px, 0) scale(1.03) rotate(0.8deg); }
                100% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
              }
              @keyframes unoolSilkWave2 {
                0% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
                50% { transform: translate3d(35px, -15px, 0) scale(0.97) rotate(-0.8deg); }
                100% { transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
              }
              @keyframes unoolSilkOrbGlow {
                0%, 100% { opacity: 0.35; transform: scale(1); }
                50% { opacity: 0.55; transform: scale(1.12); }
              }
              @keyframes unoolCardLightSweep {
                0% { transform: translateX(-150%) skewX(-25deg); opacity: 0; }
                20% { opacity: 1; }
                40%, 100% { transform: translateX(250%) skewX(-25deg); opacity: 0; }
              }
              @keyframes unoolScanlineMove {
                0% { top: 6%; opacity: 0; }
                15% { opacity: 1; }
                85% { opacity: 1; }
                100% { top: 92%; opacity: 0; }
              }
              @keyframes unoolRadarSonar {
                0% { transform: scale(0.85); opacity: 0.8; }
                100% { transform: scale(2.4); opacity: 0; }
              }
              @keyframes unoolSpinFast {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              @keyframes unoolGoldBeacon {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.3); opacity: 0.5; }
              }

              .unool-vault-layout {
                display: grid;
                grid-template-columns: minmax(340px, 420px) 1fr;
                gap: 32px;
                width: 100%;
                max-width: 1260px;
                margin: 0 auto;
                align-items: start;
              }
              .unool-vault-console {
                display: flex;
                flex-direction: row;
                border-radius: 28px;
                background: linear-gradient(170deg, rgba(26, 17, 23, 0.92) 0%, rgba(16, 9, 13, 0.95) 100%);
                border: 1px solid rgba(229, 169, 60, 0.28);
                box-shadow: 0 35px 90px -15px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 240, 215, 0.12);
                backdrop-filter: blur(32px);
                overflow: hidden;
                min-height: 600px;
              }
              .unool-vault-sidebar {
                width: 245px;
                flex-shrink: 0;
                background: rgba(14, 8, 12, 0.7);
                border-right: 1px solid rgba(229, 169, 60, 0.14);
                padding: 24px 14px;
                display: flex;
                flex-direction: column;
                gap: 6px;
              }
              .unool-tab-nav-btn {
                position: relative;
                width: 100%;
                padding: 13px 14px;
                border-radius: 14px;
                display: flex;
                align-items: center;
                justifyContent: space-between;
                text-align: left;
                cursor: pointer;
                transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                border: 1px solid transparent;
              }
              .unool-tab-nav-btn:hover {
                background: rgba(229, 169, 60, 0.08);
                border-color: rgba(229, 169, 60, 0.2);
              }
              .unool-tab-nav-btn.active {
                background: linear-gradient(135deg, rgba(200, 75, 49, 0.22) 0%, rgba(124, 58, 237, 0.18) 100%);
                border: 1px solid rgba(229, 169, 60, 0.45);
                box-shadow: 0 4px 20px rgba(200, 75, 49, 0.15);
              }
              .unool-primary-cta {
                width: 100%;
                padding: 15px 22px;
                border-radius: 14px;
                background: linear-gradient(135deg, #C84B31 0%, #A2273C 45%, #7C3AED 100%);
                color: #FFFFFF;
                font-size: 15px;
                font-weight: 700;
                letter-spacing: -0.01em;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justifyContent: center;
                gap: 10px;
                box-shadow: 0 10px 28px -4px rgba(200, 75, 49, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.3);
                transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
              }
              .unool-primary-cta:hover:not(:disabled) {
                transform: translateY(-1.5px);
                box-shadow: 0 14px 34px -4px rgba(200, 75, 49, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.4);
              }
              .unool-primary-cta:active:not(:disabled) {
                transform: translateY(0.5px);
              }
              .unool-primary-cta:disabled {
                opacity: 0.55;
                cursor: not-allowed;
                transform: none;
              }

              @media (max-width: 980px) {
                .unool-vault-layout {
                  grid-template-columns: 1fr;
                  gap: 24px;
                }
                .unool-vault-console {
                  flex-direction: column;
                }
                .unool-vault-sidebar {
                  width: 100%;
                  border-right: none;
                  border-bottom: 1px solid rgba(229, 169, 60, 0.14);
                  flex-direction: row;
                  overflow-x: auto;
                  padding: 12px;
                }
                .unool-tab-nav-btn {
                  flex-shrink: 0;
                  width: auto;
                  min-width: 150px;
                }
              }
            `}</style>

            {/* ── Background Fluid Silk Wave Canvas ─────────────────────────── */}
            <div
              style={{
                position: 'fixed',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 0,
                overflow: 'hidden',
              }}
            >
              {/* Luminous Warm Wine & Honey Amber Radial Glows */}
              <div
                style={{
                  position: 'absolute',
                  top: '-10%',
                  left: '15%',
                  width: '750px',
                  height: '750px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(200, 75, 49, 0.26) 0%, rgba(61, 12, 26, 0.18) 45%, transparent 70%)',
                  filter: 'blur(100px)',
                  animation: 'unoolSilkOrbGlow 9s ease-in-out infinite',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '-15%',
                  right: '10%',
                  width: '700px',
                  height: '700px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(124, 58, 237, 0.22) 0%, rgba(229, 169, 60, 0.16) 45%, transparent 70%)',
                  filter: 'blur(110px)',
                  animation: 'unoolSilkOrbGlow 11s ease-in-out infinite 2.5s',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '45%',
                  left: '-10%',
                  width: '500px',
                  height: '500px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(229, 169, 60, 0.14) 0%, transparent 70%)',
                  filter: 'blur(80px)',
                }}
              />

              {/* Multi-layered Hypnotic Silk Wave Curves in Unool Palette */}
              <svg
                style={{
                  position: 'absolute',
                  width: '130%',
                  height: '110%',
                  left: '-15%',
                  top: '-5%',
                  opacity: 0.5,
                  animation: 'unoolSilkWave1 20s ease-in-out infinite',
                }}
                viewBox="0 0 1600 1000"
                fill="none"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="unoolSilkGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#C84B31" stopOpacity="0.45" />
                    <stop offset="35%" stopColor="#59191A" stopOpacity="0.35" />
                    <stop offset="70%" stopColor="#7C3AED" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#E5A93C" stopOpacity="0.12" />
                  </linearGradient>
                </defs>
                <path
                  d="M-80 500 C 260 300, 520 650, 840 430 C 1160 210, 1420 580, 1680 440 L 1680 1100 L -80 1100 Z"
                  fill="url(#unoolSilkGrad1)"
                />
              </svg>

              <svg
                style={{
                  position: 'absolute',
                  width: '130%',
                  height: '110%',
                  left: '-10%',
                  top: '5%',
                  opacity: 0.4,
                  animation: 'unoolSilkWave2 24s ease-in-out infinite',
                }}
                viewBox="0 0 1600 1000"
                fill="none"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="unoolSilkGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#E5A93C" stopOpacity="0.32" />
                    <stop offset="45%" stopColor="#832723" stopOpacity="0.22" />
                    <stop offset="85%" stopColor="#3D0C1A" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#0D080B" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M-80 620 C 340 450, 640 780, 980 580 C 1300 390, 1480 720, 1680 610 L 1680 1100 L -80 1100 Z"
                  fill="url(#unoolSilkGrad2)"
                />
              </svg>

              {/* Fine Artisanal Stipple Weave Overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: 'radial-gradient(rgba(245, 230, 205, 0.09) 1px, transparent 1px)',
                  backgroundSize: '32px 32px',
                  opacity: 0.4,
                }}
              />
            </div>

            {/* ── Top Executive Navigation & Guarantee Bar ──────────────────── */}
            <header
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 50,
                height: 70,
                padding: '0 32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(13, 8, 11, 0.78)',
                backdropFilter: 'blur(24px)',
                borderBottom: '1px solid rgba(229, 169, 60, 0.16)',
                flexShrink: 0,
              }}
            >
              {/* Return to plans pill */}
              <button
                type="button"
                onClick={closeAndCleanCashfree}
                className="unool-vault-font-body"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 16px',
                  borderRadius: 12,
                  background: 'rgba(255, 245, 230, 0.05)',
                  border: '1px solid rgba(229, 169, 60, 0.2)',
                  color: '#F4ECE1',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(229, 169, 60, 0.12)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(229, 169, 60, 0.45)';
                  (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
                  (e.currentTarget as HTMLElement).style.transform = 'translateX(-2px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255, 245, 230, 0.05)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(229, 169, 60, 0.2)';
                  (e.currentTarget as HTMLElement).style.color = '#F4ECE1';
                  (e.currentTarget as HTMLElement).style.transform = 'none';
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>Return to Plans</span>
              </button>

              {/* Unool Vault Insignia Lockup */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span
                  className="unool-vault-font-heading"
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    letterSpacing: '-0.04em',
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #F5D38A 50%, #E5A93C 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textTransform: 'lowercase',
                  }}
                >
                  unool
                </span>
                <span
                  className="unool-vault-font-mono"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '4px 11px',
                    borderRadius: 20,
                    background: 'rgba(229, 169, 60, 0.12)',
                    border: '1px solid rgba(229, 169, 60, 0.35)',
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: '#F5D38A',
                    textTransform: 'uppercase',
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#10B981',
                      boxShadow: '0 0 8px #10B981',
                      animation: 'unoolGoldBeacon 2s infinite',
                    }}
                  />
                  Official Vault Checkout
                </span>
              </div>

              {/* Security Credential Badges & Close Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    display: 'none',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: '#C7B9A5',
                    fontWeight: 500,
                  }}
                  className="sm:flex"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E5A93C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span className="unool-vault-font-body">256-Bit Bank Grade SSL</span>
                </div>

                <button
                  type="button"
                  onClick={closeAndCleanCashfree}
                  title="Close checkout (Esc)"
                  aria-label="Close"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    border: '1px solid rgba(229, 169, 60, 0.2)',
                    background: 'rgba(255, 245, 230, 0.05)',
                    color: '#C7B9A5',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(200, 75, 49, 0.2)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(200, 75, 49, 0.5)';
                    (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255, 245, 230, 0.05)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(229, 169, 60, 0.2)';
                    (e.currentTarget as HTMLElement).style.color = '#C7B9A5';
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </header>

            {/* ── Main Canvas Stage: 2-Column Architectural Layout ──────────── */}
            <main
              style={{
                position: 'relative',
                zIndex: 10,
                flex: '1 1 auto',
                padding: '36px 28px 72px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div className="unool-vault-layout">
                {/* ── LEFT COLUMN: The "Executive Membership Pass" ───────────── */}
                <div
                  style={{
                    background: 'linear-gradient(175deg, rgba(28, 17, 24, 0.94) 0%, rgba(16, 9, 14, 0.96) 100%)',
                    backdropFilter: 'blur(32px)',
                    borderRadius: 28,
                    border: '1px solid rgba(229, 169, 60, 0.32)',
                    boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 240, 215, 0.16)',
                    padding: '32px 28px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 24,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Ambient Gold Pass Watermark */}
                  <div
                    style={{
                      position: 'absolute',
                      right: -30,
                      top: -30,
                      width: 180,
                      height: 180,
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, rgba(229, 169, 60, 0.12) 0%, transparent 70%)',
                      pointerEvents: 'none',
                    }}
                  />

                  {/* Pass Ribbon Stamp */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span
                        className="unool-vault-font-mono"
                        style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: '#FDE68A',
                          background: 'linear-gradient(135deg, rgba(229, 169, 60, 0.22) 0%, rgba(200, 75, 49, 0.18) 100%)',
                          padding: '4px 11px',
                          borderRadius: 6,
                          border: '1px solid rgba(229, 169, 60, 0.4)',
                        }}
                      >
                        MEMBERSHIP PASS • {activeCheckout.planName.toUpperCase()}
                      </span>

                      <span
                        className="unool-vault-font-body"
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: activeCheckout.billingCycle === 'annual' ? '#34D399' : '#FDE68A',
                          background: activeCheckout.billingCycle === 'annual' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(229, 169, 60, 0.14)',
                          padding: '3px 10px',
                          borderRadius: 20,
                          border: activeCheckout.billingCycle === 'annual' ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(229, 169, 60, 0.3)',
                        }}
                      >
                        {activeCheckout.billingCycle === 'annual' ? 'Annual (20% Founder Savings)' : 'Monthly Freedom'}
                      </span>
                    </div>

                    <h2
                      className="unool-vault-font-heading"
                      style={{
                        fontSize: 26,
                        fontWeight: 900,
                        color: '#FFFFFF',
                        margin: '0 0 6px',
                        letterSpacing: '-0.03em',
                      }}
                    >
                      Upgrade to {activeCheckout.planName}
                    </h2>
                    <p
                      className="unool-vault-font-serif"
                      style={{
                        fontSize: 15.5,
                        color: '#D4C4B2',
                        margin: 0,
                        lineHeight: 1.45,
                      }}
                    >
                      {selectedPlan?.tagline || 'The definitive engine for ambitious creators and studios.'}
                    </p>
                  </div>

                  {/* Financial Ledger Breakdown */}
                  <div
                    style={{
                      background: 'rgba(12, 6, 10, 0.7)',
                      borderRadius: 18,
                      border: '1px solid rgba(229, 169, 60, 0.18)',
                      padding: '20px 22px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span className="unool-vault-font-body" style={{ fontSize: 13, color: '#C7B9A5', fontWeight: 500 }}>
                        Base Subscription
                      </span>
                      <span className="unool-vault-font-heading" style={{ fontSize: 26, fontWeight: 900, color: '#FFFFFF' }}>
                        {activeCheckout.priceDisplay}
                        <span className="unool-vault-font-body" style={{ fontSize: 13, fontWeight: 500, color: '#A59683', marginLeft: 4 }}>
                          {activeCheckout.billingCycle === 'annual' ? '/yr' : '/mo'}
                        </span>
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5, color: '#A59683', marginBottom: 9 }}>
                      <span className="unool-vault-font-body">GST &amp; Government Levies</span>
                      <span className="unool-vault-font-mono" style={{ color: '#34D399', fontWeight: 600 }}>Included (₹0.00)</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5, color: '#A59683', marginBottom: 14 }}>
                      <span className="unool-vault-font-body">Payment Gateway Charges</span>
                      <span className="unool-vault-font-mono" style={{ color: '#34D399', fontWeight: 600 }}>Waived (₹0.00)</span>
                    </div>

                    <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(229, 169, 60, 0.3), transparent)', margin: '12px 0 14px' }} />

                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <span className="unool-vault-font-body" style={{ fontSize: 14, fontWeight: 700, color: '#F4ECE1' }}>
                        Total Payable Today
                      </span>
                      <span
                        className="unool-vault-font-heading"
                        style={{
                          fontSize: 26,
                          fontWeight: 900,
                          background: 'linear-gradient(135deg, #FFFFFF 0%, #F5D38A 50%, #E5A93C 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        {activeCheckout.priceDisplay}
                      </span>
                    </div>
                  </div>

                  {/* Flagship Privileges (Curated Tactile Cards) */}
                  <div>
                    <div
                      className="unool-vault-font-mono"
                      style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: '#A59683',
                        marginBottom: 12,
                      }}
                    >
                      Instant Unlocked Privileges:
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                      {[
                        { title: 'Unlimited High-Velocity AI Engines', sub: 'LinkedIn, X, Threads, Instagram auto-generation' },
                        { title: 'Multi-Network Autonomous Sync', sub: 'Intelligent schedule dispatch with zero manual work' },
                        { title: 'SignalDM Lead Concierge', sub: 'Instant conversion triggers and high-intent engagement' },
                        { title: '4K Ultra-HD Media Studio', sub: 'Brand kits, lossless asset export, and watermarking removal' },
                        { title: 'Dedicated Founder 24/7 SLA', sub: 'Direct line to core product engineering and priority servers' },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 10,
                            padding: '8px 12px',
                            borderRadius: 10,
                            background: 'rgba(255, 245, 230, 0.03)',
                            border: '1px solid rgba(229, 169, 60, 0.1)',
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E5A93C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <div>
                            <div className="unool-vault-font-body" style={{ fontSize: 12.5, fontWeight: 700, color: '#F4ECE1', lineHeight: 1.25 }}>
                              {item.title}
                            </div>
                            <div className="unool-vault-font-body" style={{ fontSize: 11, color: '#A59683', marginTop: 2 }}>
                              {item.sub}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* The Wax Seal Peace of Mind Guarantee */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, rgba(200, 75, 49, 0.12) 0%, rgba(229, 169, 60, 0.08) 100%)',
                      borderRadius: 16,
                      border: '1px solid rgba(229, 169, 60, 0.28)',
                      padding: '16px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #E5A93C 0%, #C84B31 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#0E080B',
                        flexShrink: 0,
                        boxShadow: '0 4px 14px rgba(200, 75, 49, 0.3)',
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </div>

                    <div>
                      <div className="unool-vault-font-heading" style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF', marginBottom: 2 }}>
                        Unconditional 1-Click Flexibility
                      </div>
                      <div className="unool-vault-font-body" style={{ fontSize: 11.5, color: '#D4C4B2', lineHeight: 1.4 }}>
                        Cancel or pause your subscription anytime with zero friction directly from your settings. No lock-in, no questions asked.
                      </div>
                    </div>
                  </div>

                  {/* Concierge Support Line */}
                  <div className="unool-vault-font-body" style={{ fontSize: 11.5, color: '#8E7F6F', textAlign: 'center' }}>
                    Personal VIP billing concierge: <span style={{ color: '#F5D38A', fontWeight: 600 }}>founders@unool.com</span>
                  </div>
                </div>

                {/* ── RIGHT COLUMN: The Tactile Payment Console ──────────────── */}
                <div className="unool-vault-console">
                  {/* Vertical Tactile Side Navbar */}
                  <nav className="unool-vault-sidebar" aria-label="Payment Methods">
                    <div
                      className="unool-vault-font-mono"
                      style={{
                        fontSize: 9.5,
                        fontWeight: 800,
                        letterSpacing: '0.12em',
                        color: '#E5A93C',
                        textTransform: 'uppercase',
                        padding: '4px 8px 6px',
                      }}
                    >
                      Instant in India
                    </div>

                    {/* Method 1: UPI ID */}
                    <button
                      type="button"
                      id="checkout-tab-upi"
                      onClick={() => setCheckoutTab('upi')}
                      className={`unool-tab-nav-btn ${checkoutTab === 'upi' ? 'active' : ''}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            background: checkoutTab === 'upi' ? 'linear-gradient(135deg, #C84B31 0%, #7C3AED 100%)' : 'rgba(255, 245, 230, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            flexShrink: 0,
                            transition: 'all 0.18s ease',
                          }}
                        >
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                          </svg>
                        </div>
                        <div>
                          <div className="unool-vault-font-heading" style={{ fontSize: 13.5, fontWeight: checkoutTab === 'upi' ? 800 : 700, color: checkoutTab === 'upi' ? '#FFFFFF' : '#E0D4C5' }}>
                            UPI ID / VPA
                          </div>
                          <div className="unool-vault-font-body" style={{ fontSize: 11, color: '#A59683' }}>
                            GPay, PhonePe, Paytm
                          </div>
                        </div>
                      </div>

                      <span
                        className="unool-vault-font-mono"
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          letterSpacing: '0.06em',
                          color: '#FDE68A',
                          background: 'rgba(229, 169, 60, 0.16)',
                          padding: '2px 6px',
                          borderRadius: 4,
                          border: '1px solid rgba(229, 169, 60, 0.4)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Fastest
                      </span>
                    </button>

                    {/* Method 2: Scan QR Code */}
                    <button
                      type="button"
                      id="checkout-tab-qr"
                      onClick={() => {
                        setCheckoutTab('qr');
                        if (!qrImageUrl && !qrString && activeCheckout) {
                          handleGenerateQr(activeCheckout);
                        }
                      }}
                      className={`unool-tab-nav-btn ${checkoutTab === 'qr' ? 'active' : ''}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            background: checkoutTab === 'qr' ? 'linear-gradient(135deg, #C84B31 0%, #7C3AED 100%)' : 'rgba(255, 245, 230, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            flexShrink: 0,
                            transition: 'all 0.18s ease',
                          }}
                        >
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="6" height="6" x="3" y="3" rx="1.5" />
                            <rect width="6" height="6" x="15" y="3" rx="1.5" />
                            <rect width="6" height="6" x="3" y="15" rx="1.5" />
                            <path d="M15 15h3v3h-3z" />
                            <path d="M18 18h3v3h-3z" />
                          </svg>
                        </div>
                        <div>
                          <div className="unool-vault-font-heading" style={{ fontSize: 13.5, fontWeight: checkoutTab === 'qr' ? 800 : 700, color: checkoutTab === 'qr' ? '#FFFFFF' : '#E0D4C5' }}>
                            Scan QR Code
                          </div>
                          <div className="unool-vault-font-body" style={{ fontSize: 11, color: '#A59683' }}>
                            Camera scan to pay
                          </div>
                        </div>
                      </div>

                      <span
                        className="unool-vault-font-mono"
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          letterSpacing: '0.06em',
                          color: '#34D399',
                          background: 'rgba(16, 185, 129, 0.16)',
                          padding: '2px 6px',
                          borderRadius: 4,
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Instant
                      </span>
                    </button>

                    <div
                      className="unool-vault-font-mono"
                      style={{
                        fontSize: 9.5,
                        fontWeight: 800,
                        letterSpacing: '0.12em',
                        color: '#A59683',
                        textTransform: 'uppercase',
                        padding: '16px 8px 6px',
                      }}
                    >
                      Cards &amp; Banking
                    </div>

                    {/* Method 3: Cards */}
                    <button
                      type="button"
                      id="checkout-tab-cards"
                      onClick={() => setCheckoutTab('cards')}
                      className={`unool-tab-nav-btn ${checkoutTab === 'cards' ? 'active' : ''}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            background: checkoutTab === 'cards' ? 'linear-gradient(135deg, #C84B31 0%, #7C3AED 100%)' : 'rgba(255, 245, 230, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            flexShrink: 0,
                            transition: 'all 0.18s ease',
                          }}
                        >
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="20" height="14" x="2" y="5" rx="3" />
                            <line x1="2" x2="22" y1="10" y2="10" />
                          </svg>
                        </div>
                        <div>
                          <div className="unool-vault-font-heading" style={{ fontSize: 13.5, fontWeight: checkoutTab === 'cards' ? 800 : 700, color: checkoutTab === 'cards' ? '#FFFFFF' : '#E0D4C5' }}>
                            Titanium Cards
                          </div>
                          <div className="unool-vault-font-body" style={{ fontSize: 11, color: '#A59683' }}>
                            Visa, MC, RuPay, Amex
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Method 4: Net Banking */}
                    <button
                      type="button"
                      id="checkout-tab-netbanking"
                      onClick={() => setCheckoutTab('netbanking')}
                      className={`unool-tab-nav-btn ${checkoutTab === 'netbanking' ? 'active' : ''}`}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            background: checkoutTab === 'netbanking' ? 'linear-gradient(135deg, #C84B31 0%, #7C3AED 100%)' : 'rgba(255, 245, 230, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                            flexShrink: 0,
                            transition: 'all 0.18s ease',
                          }}
                        >
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="3" x2="21" y1="22" y2="22" />
                            <line x1="6" x2="6" y1="18" y2="11" />
                            <line x1="10" x2="10" y1="18" y2="11" />
                            <line x1="14" x2="14" y1="18" y2="11" />
                            <line x1="18" x2="18" y1="18" y2="11" />
                            <polygon points="12 2 20 7 4 7" />
                          </svg>
                        </div>
                        <div>
                          <div className="unool-vault-font-heading" style={{ fontSize: 13.5, fontWeight: checkoutTab === 'netbanking' ? 800 : 700, color: checkoutTab === 'netbanking' ? '#FFFFFF' : '#E0D4C5' }}>
                            Net Banking
                          </div>
                          <div className="unool-vault-font-body" style={{ fontSize: 11, color: '#A59683' }}>
                            50+ Indian banks direct
                          </div>
                        </div>
                      </div>
                    </button>
                  </nav>

                  {/* Right Terminal Body */}
                  <div
                    style={{
                      flex: '1 1 auto',
                      padding: '32px 32px',
                      display: 'flex',
                      flexDirection: 'column',
                      minWidth: 0,
                    }}
                  >
                    {/* ── TAB 1: UPI ID / VPA (Collect Flow) ────────────────── */}
                    {checkoutTab === 'upi' && (
                      <div>
                        {!upiSent ? (
                          <div>
                            <div style={{ marginBottom: 22 }}>
                              <h3
                                className="unool-vault-font-heading"
                                style={{
                                  fontSize: 22,
                                  fontWeight: 900,
                                  color: '#FFFFFF',
                                  margin: '0 0 6px',
                                  letterSpacing: '-0.02em',
                                }}
                              >
                                Pay via UPI ID (VPA)
                              </h3>
                              <p className="unool-vault-font-body" style={{ fontSize: 13.5, color: '#C7B9A5', margin: 0, lineHeight: 1.5 }}>
                                Enter your Virtual Payment Address to trigger an instant collect notification on your Google Pay, PhonePe, Paytm, or BHIM app.
                              </p>
                            </div>

                            {/* Tactile Monospace VPA Input */}
                            <div style={{ marginBottom: 20 }}>
                              <label
                                htmlFor="upi-id-input"
                                className="unool-vault-font-mono"
                                style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#F5D38A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}
                              >
                                Virtual Payment Address (UPI ID)
                              </label>
                              <div style={{ position: 'relative' }}>
                                <div
                                  className="unool-vault-font-heading"
                                  style={{
                                    position: 'absolute',
                                    left: 15,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#E5A93C',
                                    fontWeight: 900,
                                    fontSize: 18,
                                  }}
                                >
                                  @
                                </div>
                                <input
                                  type="text"
                                  id="upi-id-input"
                                  value={upiIdInput}
                                  onChange={(e) => {
                                    setUpiIdInput(e.target.value);
                                    setUpiError(null);
                                  }}
                                  placeholder="yourname@okhdfcbank or 9876543210@upi"
                                  className="unool-vault-font-mono"
                                  style={{
                                    width: '100%',
                                    padding: '15px 14px 15px 40px',
                                    borderRadius: 14,
                                    border: upiError ? '1.5px solid #EF4444' : '1.5px solid rgba(229, 169, 60, 0.25)',
                                    fontSize: 14.5,
                                    color: '#FFFFFF',
                                    background: 'rgba(10, 6, 9, 0.75)',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                                  }}
                                  onFocus={(e) => {
                                    if (!upiError) {
                                      e.target.style.borderColor = '#E5A93C';
                                      e.target.style.boxShadow = '0 0 0 3px rgba(229, 169, 60, 0.2)';
                                    }
                                  }}
                                  onBlur={(e) => {
                                    if (!upiError) {
                                      e.target.style.borderColor = 'rgba(229, 169, 60, 0.25)';
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

                            {/* Popular UPI Handles Quick Chips */}
                            <div style={{ marginBottom: 26 }}>
                              <div
                                className="unool-vault-font-mono"
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 800,
                                  color: '#A59683',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.08em',
                                  marginBottom: 10,
                                }}
                              >
                                Popular Bank Handles (Click to Append):
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                                {['@okhdfcbank', '@okaxis', '@oksbi', '@okicici', '@ybl', '@paytm', '@ibl', '@apl'].map((handle) => (
                                  <button
                                    key={handle}
                                    type="button"
                                    onClick={() => handleAppendUpiChip(handle)}
                                    className="unool-vault-font-mono"
                                    style={{
                                      padding: '6px 11px',
                                      borderRadius: 9,
                                      border: '1px solid rgba(229, 169, 60, 0.2)',
                                      background: 'rgba(255, 245, 230, 0.04)',
                                      color: '#E0D4C5',
                                      fontSize: 11.5,
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                      (e.currentTarget as HTMLElement).style.background = 'rgba(229, 169, 60, 0.16)';
                                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(229, 169, 60, 0.5)';
                                      (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
                                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={(e) => {
                                      (e.currentTarget as HTMLElement).style.background = 'rgba(255, 245, 230, 0.04)';
                                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(229, 169, 60, 0.2)';
                                      (e.currentTarget as HTMLElement).style.color = '#E0D4C5';
                                      (e.currentTarget as HTMLElement).style.transform = 'none';
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
                                  padding: '12px 16px',
                                  borderRadius: 12,
                                  background: 'rgba(239, 68, 68, 0.14)',
                                  border: '1px solid rgba(239, 68, 68, 0.4)',
                                  color: '#FCA5A5',
                                  fontSize: 13,
                                  fontWeight: 500,
                                  marginBottom: 20,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 9,
                                }}
                              >
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="12" y1="8" x2="12" y2="12" />
                                  <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                <span className="unool-vault-font-body">{upiError}</span>
                              </div>
                            )}

                            {/* Liquid Metal Primary CTA */}
                            <button
                              type="button"
                              id="submit-upi-pay-btn"
                              onClick={handlePayWithUpi}
                              disabled={upiSubmitting || !upiIdInput.trim()}
                              className="unool-primary-cta unool-vault-font-heading"
                            >
                              {upiSubmitting ? (
                                <>
                                  <div
                                    style={{
                                      width: 18,
                                      height: 18,
                                      border: '2px solid rgba(255, 255, 255, 0.3)',
                                      borderTopColor: '#FFFFFF',
                                      borderRadius: '50%',
                                      animation: 'unoolSpinFast 0.7s linear infinite',
                                    }}
                                  />
                                  <span>Dispatching Direct UPI Request...</span>
                                </>
                              ) : (
                                <>
                                  <span>Authorize {activeCheckout.priceDisplay} via UPI</span>
                                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                  </svg>
                                </>
                              )}
                            </button>

                            <div
                              className="unool-vault-font-body"
                              style={{
                                marginTop: 18,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 7,
                                fontSize: 11.5,
                                color: '#A59683',
                              }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E5A93C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              </svg>
                              <span>Direct Cashfree Native UPI Collect • 256-Bit Bank Gateway Encryption</span>
                            </div>
                          </div>
                        ) : (
                          /* Dispatched State with Golden Sonar */
                          <div style={{ textAlign: 'center', padding: '18px 8px' }}>
                            <div
                              style={{
                                position: 'relative',
                                width: 92,
                                height: 92,
                                margin: '0 auto 22px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <div
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  borderRadius: '50%',
                                  background: 'rgba(229, 169, 60, 0.25)',
                                  animation: 'unoolRadarSonar 2.2s cubic-bezier(0, 0.2, 0.8, 1) infinite',
                                }}
                              />
                              <div
                                style={{
                                  position: 'absolute',
                                  inset: 10,
                                  borderRadius: '50%',
                                  background: 'rgba(200, 75, 49, 0.3)',
                                  animation: 'unoolRadarSonar 2.2s cubic-bezier(0, 0.2, 0.8, 1) infinite 0.7s',
                                }}
                              />
                              <div
                                style={{
                                  position: 'relative',
                                  width: 62,
                                  height: 62,
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #C84B31 0%, #E5A93C 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#0E080B',
                                  boxShadow: '0 8px 26px rgba(200, 75, 49, 0.5)',
                                }}
                              >
                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
                                  <path d="M12 18h.01" />
                                </svg>
                              </div>
                            </div>

                            <h4 className="unool-vault-font-heading" style={{ fontSize: 20, fontWeight: 900, color: '#FFFFFF', margin: '0 0 6px' }}>
                              Payment Collect Request Dispatched
                            </h4>
                            <p className="unool-vault-font-body" style={{ fontSize: 13.5, color: '#D4C4B2', margin: '0 0 22px', lineHeight: 1.5 }}>
                              A real-time notification has been transmitted to{' '}
                              <strong className="unool-vault-font-mono" style={{ color: '#F5D38A' }}>
                                {upiIdInput.trim().toLowerCase()}
                              </strong>.
                            </p>

                            {/* 3-Step Walkthrough Card */}
                            <div
                              style={{
                                background: 'rgba(12, 6, 10, 0.75)',
                                border: '1px solid rgba(229, 169, 60, 0.2)',
                                borderRadius: 16,
                                padding: '18px 20px',
                                textAlign: 'left',
                                fontSize: 13,
                                color: '#E0D4C5',
                                lineHeight: 1.6,
                                marginBottom: 22,
                              }}
                            >
                              <div className="unool-vault-font-heading" style={{ fontWeight: 800, color: '#F5D38A', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E5A93C" strokeWidth="2.4">
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="12" y1="16" x2="12" y2="12" />
                                  <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                                <span>Complete in 3 Simple Steps:</span>
                              </div>
                              <ol className="unool-vault-font-body" style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 7 }}>
                                <li>Open your UPI app on your phone (Google Pay, PhonePe, Paytm, or BHIM).</li>
                                <li>Approve the incoming collect request issued by Cashfree / Unool.</li>
                                <li>Authenticate with your private UPI PIN to seal your membership.</li>
                              </ol>
                            </div>

                            {/* Live Pulsing Sonar Badge */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 9,
                                fontSize: 13,
                                color: '#34D399',
                                fontWeight: 700,
                                background: 'rgba(16, 185, 129, 0.12)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                borderRadius: 12,
                                padding: '12px 18px',
                                marginBottom: 18,
                              }}
                            >
                              <div
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  background: '#10B981',
                                  boxShadow: '0 0 8px #10B981',
                                  animation: 'unoolGoldBeacon 1.5s infinite',
                                }}
                              />
                              <span className="unool-vault-font-body">Awaiting your approval on mobile device...</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setUpiSent(false);
                                setUpiSubmitting(false);
                              }}
                              className="unool-vault-font-body"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#C7B9A5',
                                fontSize: 13,
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                padding: 6,
                              }}
                            >
                              Need to modify your UPI address or retry?
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── TAB 2: SCAN QR CODE (With Live Cyber Scanline) ──────── */}
                    {checkoutTab === 'qr' && (
                      <div style={{ textAlign: 'center', padding: '10px 4px' }}>
                        <div style={{ marginBottom: 20 }}>
                          <h3
                            className="unool-vault-font-heading"
                            style={{
                              fontSize: 22,
                              fontWeight: 900,
                              color: '#FFFFFF',
                              margin: '0 0 6px',
                              letterSpacing: '-0.02em',
                            }}
                          >
                            Scan to Authorize Instantly
                          </h3>
                          <p className="unool-vault-font-body" style={{ fontSize: 13.5, color: '#C7B9A5', margin: 0 }}>
                            Point any mobile UPI scanner at the dynamic QR code below. Your plan activates instantaneously upon authorization.
                          </p>
                        </div>

                        {/* Scanner Viewfinder with Live Laser Scanline */}
                        <div
                          style={{
                            width: 250,
                            height: 250,
                            margin: '0 auto 22px',
                            background: '#FFFFFF',
                            borderRadius: 22,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 16px 42px -4px rgba(200, 75, 49, 0.4), 0 0 0 1px rgba(255, 240, 215, 0.2)',
                            position: 'relative',
                            padding: 14,
                            boxSizing: 'border-box',
                            overflow: 'hidden',
                          }}
                        >
                          {/* 4 Gold Viewfinder Reticle Corners */}
                          <div style={{ position: 'absolute', top: -3, left: -3, width: 24, height: 24, borderTop: '4px solid #E5A93C', borderLeft: '4px solid #E5A93C', borderRadius: '7px 0 0 0' }} />
                          <div style={{ position: 'absolute', top: -3, right: -3, width: 24, height: 24, borderTop: '4px solid #E5A93C', borderRight: '4px solid #E5A93C', borderRadius: '0 7px 0 0' }} />
                          <div style={{ position: 'absolute', bottom: -3, left: -3, width: 24, height: 24, borderBottom: '4px solid #E5A93C', borderLeft: '4px solid #E5A93C', borderRadius: '0 0 0 7px' }} />
                          <div style={{ position: 'absolute', bottom: -3, right: -3, width: 24, height: 24, borderBottom: '4px solid #E5A93C', borderRight: '4px solid #E5A93C', borderRadius: '0 0 7px 0' }} />

                          {/* Live Sweeping Laser Scanline */}
                          <div
                            style={{
                              position: 'absolute',
                              left: 12,
                              right: 12,
                              height: 3,
                              background: 'linear-gradient(90deg, transparent, #C84B31 20%, #E5A93C 50%, #C84B31 80%, transparent)',
                              boxShadow: '0 0 14px #E5A93C, 0 0 6px #C84B31',
                              animation: 'unoolScanlineMove 3s ease-in-out infinite',
                              pointerEvents: 'none',
                              zIndex: 10,
                            }}
                          />

                          {qrLoading ? (
                            <div style={{ textAlign: 'center' }}>
                              <div
                                style={{
                                  width: 36,
                                  height: 36,
                                  border: '3px solid rgba(200, 75, 49, 0.2)',
                                  borderTopColor: '#C84B31',
                                  borderRadius: '50%',
                                  animation: 'unoolSpinFast 0.8s linear infinite',
                                  margin: '0 auto 12px',
                                }}
                              />
                              <span className="unool-vault-font-body" style={{ fontSize: 13, color: '#3D0C1A', fontWeight: 700 }}>
                                Generating Secure QR...
                              </span>
                            </div>
                          ) : qrImageUrl || qrString ? (
                            <img
                              src={
                                qrImageUrl ||
                                `https://api.qrserver.com/v1/create-qr-code/?size=210x210&margin=4&data=${encodeURIComponent(
                                  qrString || ''
                                )}`
                              }
                              alt="Dynamic UPI QR Code"
                              style={{
                                width: 210,
                                height: 210,
                                borderRadius: 12,
                                objectFit: 'contain',
                              }}
                            />
                          ) : (
                            <div style={{ textAlign: 'center', padding: 12 }}>
                              <button
                                type="button"
                                onClick={() => handleGenerateQr(activeCheckout)}
                                className="unool-primary-cta unool-vault-font-heading"
                                style={{ padding: '10px 18px', fontSize: 13 }}
                              >
                                Generate QR Code
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Supported Indian UPI Ecosystem Chips */}
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            gap: 7,
                            marginBottom: 22,
                          }}
                        >
                          {['Google Pay', 'PhonePe', 'Paytm', 'BHIM', 'Cred', 'Amazon Pay'].map((app) => (
                            <span
                              key={app}
                              className="unool-vault-font-body"
                              style={{
                                fontSize: 11.5,
                                fontWeight: 700,
                                color: '#E0D4C5',
                                background: 'rgba(255, 245, 230, 0.04)',
                                border: '1px solid rgba(229, 169, 60, 0.16)',
                                borderRadius: 7,
                                padding: '4px 10px',
                              }}
                            >
                              {app}
                            </span>
                          ))}
                        </div>

                        {/* Live Listener Banner */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 9,
                            fontSize: 13,
                            color: '#34D399',
                            fontWeight: 700,
                            background: 'rgba(16, 185, 129, 0.12)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: 12,
                            padding: '12px 18px',
                            marginBottom: 16,
                          }}
                        >
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: '#10B981',
                              boxShadow: '0 0 8px #10B981',
                              animation: 'unoolGoldBeacon 1.5s infinite',
                            }}
                          />
                          <span className="unool-vault-font-body">Listening for QR scan &amp; instant bank authorization...</span>
                        </div>

                        {qrString && (
                          <a
                            href={qrString}
                            className="unool-vault-font-body"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: 13,
                              color: '#F5D38A',
                              fontWeight: 700,
                              textDecoration: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <span>Paying on this mobile phone? Tap here to launch UPI app directly</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </a>
                        )}
                      </div>
                    )}

                    {/* ── TAB 3: TITANIUM CARDS (Brushed Metal Apple Card Feel) ─ */}
                    {checkoutTab === 'cards' && (
                      <div>
                        {/* 3D Brushed Obsidian Titanium Metal Card */}
                        <div
                          style={{
                            width: '100%',
                            maxWidth: 390,
                            margin: '0 auto 24px',
                            borderRadius: 20,
                            padding: '22px 24px',
                            background: 'linear-gradient(145deg, #22141C 0%, #11090F 50%, #2A1722 100%)',
                            color: '#FFFFFF',
                            boxShadow: '0 25px 60px -10px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,240,215,0.22)',
                            border: '1px solid rgba(229, 169, 60, 0.35)',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                        >
                          {/* Specular Diagonal Sheen Sweep */}
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              bottom: 0,
                              width: '70px',
                              background: 'linear-gradient(90deg, transparent, rgba(255,240,215,0.25), transparent)',
                              animation: 'unoolCardLightSweep 7s infinite',
                              pointerEvents: 'none',
                            }}
                          />

                          {/* Card Top: Real 24K Gold EMV Chip + NFC Waves + Gold Badge */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                              {/* 24K Gold EMV Chip Vector SVG */}
                              <svg width="44" height="30" viewBox="0 0 42 32" fill="none">
                                <defs>
                                  <linearGradient id="vaultChipGold" x1="0" y1="0" x2="42" y2="32" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#FDE68A" />
                                    <stop offset="0.5" stopColor="#E5A93C" />
                                    <stop offset="1" stopColor="#92400E" />
                                  </linearGradient>
                                </defs>
                                <rect width="42" height="32" rx="6" fill="url(#vaultChipGold)" stroke="#B45309" strokeWidth="0.8" />
                                <rect x="4" y="4" width="34" height="24" rx="3" stroke="#832723" strokeWidth="0.8" fill="none" opacity="0.65" />
                                <line x1="4" y1="12" x2="38" y2="12" stroke="#832723" strokeWidth="0.8" opacity="0.65" />
                                <line x1="4" y1="20" x2="38" y2="20" stroke="#832723" strokeWidth="0.8" opacity="0.65" />
                                <line x1="16" y1="4" x2="16" y2="28" stroke="#832723" strokeWidth="0.8" opacity="0.65" />
                                <line x1="26" y1="4" x2="26" y2="28" stroke="#832723" strokeWidth="0.8" opacity="0.65" />
                                <circle cx="21" cy="16" r="3.2" fill="#832723" opacity="0.45" />
                              </svg>

                              {/* Contactless Wave Lines */}
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,240,215,0.7)" strokeWidth="2.2" strokeLinecap="round">
                                <path d="M8.5 15.5c1.2-1.2 1.2-3.1 0-4.3" />
                                <path d="M11.5 18.5c2.8-2.8 2.8-7.4 0-10.2" />
                                <path d="M14.5 21.5c4.4-4.4 4.4-11.6 0-16" />
                              </svg>
                            </div>

                            <span
                              className="unool-vault-font-mono"
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                letterSpacing: '0.14em',
                                color: '#FDE68A',
                                textTransform: 'uppercase',
                                background: 'rgba(229, 169, 60, 0.16)',
                                padding: '3px 9px',
                                borderRadius: 5,
                                border: '1px solid rgba(229, 169, 60, 0.4)',
                              }}
                            >
                              UNOOL {activeCheckout.planName.toUpperCase()}
                            </span>
                          </div>

                          {/* 16-Digit Monospace Debossed Typography */}
                          <div
                            className="unool-vault-font-mono"
                            style={{
                              fontSize: 21,
                              letterSpacing: '3.5px',
                              color: '#FFFFFF',
                              marginBottom: 22,
                              textShadow: '0 2px 10px rgba(0,0,0,0.75)',
                              fontWeight: 700,
                            }}
                          >
                            {cardNumber ? formatCardNumber(cardNumber) : '•••• •••• •••• ••••'}
                          </div>

                          {/* Card Bottom: Holder Name, Expiry, Authentic Vector Brand Badge */}
                          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                            <div>
                              <div className="unool-vault-font-mono" style={{ fontSize: 9, color: 'rgba(255,240,215,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
                                Cardholder Name
                              </div>
                              <div className="unool-vault-font-heading" style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                {cardHolder.trim() || 'YOUR NAME'}
                              </div>
                            </div>

                            <div>
                              <div className="unool-vault-font-mono" style={{ fontSize: 9, color: 'rgba(255,240,215,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
                                Valid Thru
                              </div>
                              <div className="unool-vault-font-mono" style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.06em' }}>
                                {cardExpiry || 'MM/YY'}
                              </div>
                            </div>

                            <div>
                              {renderBrandBadge(cardBrand.brand)}
                            </div>
                          </div>
                        </div>

                        {/* Card Input Form */}
                        <div>
                          {/* Card Number Input */}
                          <div style={{ marginBottom: 16 }}>
                            <label
                              htmlFor="unool-card-number"
                              className="unool-vault-font-mono"
                              style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#F5D38A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}
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
                                className="unool-vault-font-mono"
                                style={{
                                  width: '100%',
                                  padding: '14px 14px',
                                  paddingRight: 72,
                                  borderRadius: 14,
                                  border: '1.5px solid rgba(229, 169, 60, 0.25)',
                                  fontSize: 14.5,
                                  letterSpacing: '1px',
                                  color: '#FFFFFF',
                                  background: 'rgba(10, 6, 9, 0.75)',
                                  outline: 'none',
                                  boxSizing: 'border-box',
                                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                                }}
                                onFocus={(e) => {
                                  e.target.style.borderColor = '#E5A93C';
                                  e.target.style.boxShadow = '0 0 0 3px rgba(229, 169, 60, 0.2)';
                                }}
                                onBlur={(e) => {
                                  e.target.style.borderColor = 'rgba(229, 169, 60, 0.25)';
                                  e.target.style.boxShadow = 'none';
                                }}
                              />
                              <div
                                style={{
                                  position: 'absolute',
                                  right: 12,
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                }}
                              >
                                {renderBrandBadge(cardBrand.brand)}
                              </div>
                            </div>
                          </div>

                          {/* Cardholder Name Input */}
                          <div style={{ marginBottom: 16 }}>
                            <label
                              htmlFor="unool-card-holder"
                              className="unool-vault-font-mono"
                              style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#F5D38A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}
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
                              placeholder="Name exactly as printed on card"
                              className="unool-vault-font-body"
                              style={{
                                width: '100%',
                                padding: '14px 14px',
                                borderRadius: 14,
                                border: '1.5px solid rgba(229, 169, 60, 0.25)',
                                fontSize: 14,
                                color: '#FFFFFF',
                                background: 'rgba(10, 6, 9, 0.75)',
                                outline: 'none',
                                boxSizing: 'border-box',
                                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                              }}
                              onFocus={(e) => {
                                e.target.style.borderColor = '#E5A93C';
                                e.target.style.boxShadow = '0 0 0 3px rgba(229, 169, 60, 0.2)';
                              }}
                              onBlur={(e) => {
                                e.target.style.borderColor = 'rgba(229, 169, 60, 0.25)';
                                e.target.style.boxShadow = 'none';
                              }}
                            />
                          </div>

                          {/* Expiry & CVV in 2 columns */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 22 }}>
                            <div>
                              <label
                                htmlFor="unool-card-expiry"
                                className="unool-vault-font-mono"
                                style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#F5D38A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}
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
                                className="unool-vault-font-mono"
                                style={{
                                  width: '100%',
                                  padding: '14px 14px',
                                  borderRadius: 14,
                                  border: '1.5px solid rgba(229, 169, 60, 0.25)',
                                  fontSize: 14,
                                  color: '#FFFFFF',
                                  background: 'rgba(10, 6, 9, 0.75)',
                                  outline: 'none',
                                  boxSizing: 'border-box',
                                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                                }}
                                onFocus={(e) => {
                                  e.target.style.borderColor = '#E5A93C';
                                  e.target.style.boxShadow = '0 0 0 3px rgba(229, 169, 60, 0.2)';
                                }}
                                onBlur={(e) => {
                                  e.target.style.borderColor = 'rgba(229, 169, 60, 0.25)';
                                  e.target.style.boxShadow = 'none';
                                }}
                              />
                            </div>

                            <div>
                              <label
                                htmlFor="unool-card-cvv"
                                className="unool-vault-font-mono"
                                style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#F5D38A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}
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
                                className="unool-vault-font-mono"
                                style={{
                                  width: '100%',
                                  padding: '14px 14px',
                                  borderRadius: 14,
                                  border: '1.5px solid rgba(229, 169, 60, 0.25)',
                                  fontSize: 14,
                                  letterSpacing: '3px',
                                  color: '#FFFFFF',
                                  background: 'rgba(10, 6, 9, 0.75)',
                                  outline: 'none',
                                  boxSizing: 'border-box',
                                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                                }}
                                onFocus={(e) => {
                                  e.target.style.borderColor = '#E5A93C';
                                  e.target.style.boxShadow = '0 0 0 3px rgba(229, 169, 60, 0.2)';
                                }}
                                onBlur={(e) => {
                                  e.target.style.borderColor = 'rgba(229, 169, 60, 0.25)';
                                  e.target.style.boxShadow = 'none';
                                }}
                              />
                            </div>
                          </div>

                          {cardError && (
                            <div
                              style={{
                                padding: '12px 16px',
                                borderRadius: 12,
                                background: 'rgba(239, 68, 68, 0.14)',
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                color: '#FCA5A5',
                                fontSize: 13,
                                fontWeight: 500,
                                marginBottom: 20,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 9,
                              }}
                            >
                              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                              </svg>
                              <span className="unool-vault-font-body">{cardError}</span>
                            </div>
                          )}

                          <button
                            type="button"
                            id="unool-submit-card-pay"
                            onClick={handlePayWithCard}
                            disabled={cardSubmitting || !cardNumber || !cardHolder || !cardExpiry || !cardCvv}
                            className="unool-primary-cta unool-vault-font-heading"
                          >
                            {cardSubmitting ? (
                              <>
                                <div
                                  style={{
                                    width: 18,
                                    height: 18,
                                    border: '2px solid rgba(255, 255, 255, 0.3)',
                                    borderTopColor: '#FFFFFF',
                                    borderRadius: '50%',
                                    animation: 'unoolSpinFast 0.7s linear infinite',
                                  }}
                                />
                                <span>Securing 3D Bank Channel...</span>
                              </>
                            ) : (
                              <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <span>Pay {activeCheckout.priceDisplay} with Titanium Card</span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="5" y1="12" x2="19" y2="12" />
                                  <polyline points="12 5 19 12 12 19" />
                                </svg>
                              </>
                            )}
                          </button>

                          <div
                            className="unool-vault-font-body"
                            style={{
                              marginTop: 16,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              fontSize: 11.5,
                              color: '#A59683',
                            }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E5A93C" strokeWidth="2">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            <span>256-bit SSL • RBI Tokenization Compliant • Zero Raw Storage</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── TAB 4: NET BANKING (Premier Indian Institutions) ────── */}
                    {checkoutTab === 'netbanking' && (
                      <div>
                        <div style={{ marginBottom: 20 }}>
                          <h3
                            className="unool-vault-font-heading"
                            style={{
                              fontSize: 22,
                              fontWeight: 900,
                              color: '#FFFFFF',
                              margin: '0 0 6px',
                              letterSpacing: '-0.02em',
                            }}
                          >
                            Select Net Banking Gateway
                          </h3>
                          <p className="unool-vault-font-body" style={{ fontSize: 13.5, color: '#C7B9A5', margin: 0 }}>
                            Choose your preferred banking institution for instant direct debit authorization through Cashfree.
                          </p>
                        </div>

                        {/* Top 6 Indian Banks Grid */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 12,
                            marginBottom: 22,
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
                                  padding: '16px 12px',
                                  borderRadius: 16,
                                  border: isSelected ? '2px solid #E5A93C' : '1px solid rgba(229, 169, 60, 0.18)',
                                  background: isSelected ? 'linear-gradient(135deg, rgba(200, 75, 49, 0.22) 0%, rgba(229, 169, 60, 0.16) 100%)' : 'rgba(12, 6, 10, 0.65)',
                                  color: isSelected ? '#FFFFFF' : '#E0D4C5',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 7,
                                  transition: 'all 0.18s ease',
                                  textAlign: 'center',
                                  boxShadow: isSelected ? '0 6px 20px rgba(229, 169, 60, 0.25)' : 'none',
                                }}
                              >
                                <span
                                  className="unool-vault-font-mono"
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 800,
                                    color: b.badgeColor === '#004C8F' ? '#60A5FA' : b.badgeColor === '#225894' ? '#93C5FD' : '#FCA5A5',
                                    background: 'rgba(255, 245, 230, 0.08)',
                                    padding: '3px 9px',
                                    borderRadius: 6,
                                    border: '1px solid rgba(229, 169, 60, 0.2)',
                                  }}
                                >
                                  {b.short}
                                </span>
                                <span className="unool-vault-font-heading" style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.25 }}>
                                  {b.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* All Other Banks Dropdown */}
                        <div style={{ marginBottom: 24 }}>
                          <label
                            htmlFor="unool-bank-select"
                            className="unool-vault-font-mono"
                            style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#F5D38A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}
                          >
                            Or Select Other Indian Bank (50+ Supported):
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
                            className="unool-vault-font-body"
                            style={{
                              width: '100%',
                              padding: '14px 14px',
                              borderRadius: 14,
                              border: '1.5px solid rgba(229, 169, 60, 0.25)',
                              fontSize: 14,
                              color: '#FFFFFF',
                              background: '#150A11',
                              outline: 'none',
                              boxSizing: 'border-box',
                              cursor: 'pointer',
                            }}
                          >
                            <optgroup label="Popular Banks" style={{ background: '#150A11', color: '#FFFFFF' }}>
                              {POPULAR_BANKS.map((b) => (
                                <option key={b.code} value={b.code}>
                                  {b.name}
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="All Other Indian Banks" style={{ background: '#150A11', color: '#FFFFFF' }}>
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
                              padding: '12px 16px',
                              borderRadius: 12,
                              background: 'rgba(239, 68, 68, 0.14)',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              color: '#FCA5A5',
                              fontSize: 13,
                              fontWeight: 500,
                              marginBottom: 20,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 9,
                            }}
                          >
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="8" x2="12" y2="12" />
                              <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span className="unool-vault-font-body">{netbankingError}</span>
                          </div>
                        )}

                        {netbankingRedirecting && (
                          <div
                            style={{
                              padding: '16px 18px',
                              borderRadius: 14,
                              background: 'rgba(16, 185, 129, 0.14)',
                              border: '1px solid rgba(16, 185, 129, 0.35)',
                              marginBottom: 22,
                              textAlign: 'center',
                            }}
                          >
                            <div className="unool-vault-font-heading" style={{ fontSize: 14, fontWeight: 800, color: '#34D399', marginBottom: 4 }}>
                              Redirecting to {selectedBankName} Portal
                            </div>
                            <div className="unool-vault-font-body" style={{ fontSize: 12.5, color: '#A7F3D0' }}>
                              Please complete authorization on your bank portal. Membership updates automatically upon confirmation.
                            </div>
                          </div>
                        )}

                        <button
                          type="button"
                          id="unool-submit-netbanking-pay"
                          onClick={handlePayWithNetbanking}
                          disabled={netbankingSubmitting}
                          className="unool-primary-cta unool-vault-font-heading"
                        >
                          {netbankingSubmitting ? (
                            <>
                              <div
                                style={{
                                  width: 18,
                                  height: 18,
                                  border: '2px solid rgba(255, 255, 255, 0.3)',
                                  borderTopColor: '#FFFFFF',
                                  borderRadius: '50%',
                                  animation: 'unoolSpinFast 0.7s linear infinite',
                                }}
                              />
                              <span>Connecting to {selectedBankName}...</span>
                            </>
                          ) : (
                            <>
                              <span>Proceed with {selectedBankName} Gateway</span>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                              </svg>
                            </>
                          )}
                        </button>

                        <div
                          className="unool-vault-font-body"
                          style={{
                            marginTop: 16,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            fontSize: 11.5,
                            color: '#A59683',
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E5A93C" strokeWidth="2">
                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          <span>Direct 256-Bit Encrypted Indian Banking Gateway</span>
                        </div>
                      </div>
                    )}
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
