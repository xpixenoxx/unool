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
  const [checkoutTab, setCheckoutTab] = useState<'cards' | 'upi' | 'qr' | 'netbanking'>('cards');

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

      // Open custom Unool checkout dialog with Cards, UPI, QR, and Netbanking tabs
      setActiveCheckout({
        planId,
        planName: selectedPlan.name,
        priceDisplay: billingCycle === 'annual' ? selectedPlan.pricing.annualDisplay : selectedPlan.pricing.monthlyDisplay,
        billingCycle,
        paymentSessionId,
        cfOrderId,
        mode: mode || (process.env.NEXT_PUBLIC_CASHFREE_MODE as 'sandbox' | 'production') || 'sandbox',
      });
      setCheckoutTab('cards');
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

      {/* ── Custom Made Unool Checkout Modal ────────────────────── */}
      {activeCheckout && (() => {
        const cardBrand = getCardBrand(cardNumber);

        return (
          <div
            id="unool-checkout-modal"
            role="dialog"
            aria-modal="true"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1000,
              background: 'rgba(26, 22, 18, 0.75)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              justifyContent: 'center',
              padding: '16px 12px',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
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
                from { opacity: 0; transform: scale(0.97) translateY(8px); }
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
                maxHeight: 'calc(100vh - 32px)',
                margin: 'auto',
                boxShadow: '0 25px 60px -15px rgba(26, 22, 18, 0.35), 0 0 0 1px rgba(0,0,0,0.04)',
                overflow: 'hidden',
                animation: 'unoolScaleUp 0.2s ease-out',
                display: 'flex',
                flexDirection: 'column',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #F0ECE6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'linear-gradient(180deg, #FAF8F5 0%, #FFFFFF 100%)',
                  flexShrink: 0,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: '#7C3AED',
                        background: '#F5F3FF',
                        padding: '3px 8px',
                        borderRadius: 6,
                        border: '1px solid #DDD6FE',
                      }}
                    >
                      UNOOL CHECKOUT
                    </span>
                    <span style={{ fontSize: 13, color: '#7A7265', fontWeight: 500 }}>
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
                    borderRadius: 8,
                    border: '1px solid #E8E0D5',
                    background: '#FFFFFF',
                    color: '#7A7265',
                    fontSize: 15,
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

              {/* Navigation Tabs - 4 Custom Unool Options */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  background: '#FAF7F3',
                  padding: '5px 8px',
                  borderBottom: '1px solid #F0ECE6',
                  gap: 5,
                  flexShrink: 0,
                }}
              >
                {[
                  { id: 'cards' as const, label: 'Cards', icon: '💳' },
                  { id: 'upi' as const, label: 'UPI ID', icon: '⚡' },
                  { id: 'qr' as const, label: 'Scan QR', icon: '📱' },
                  { id: 'netbanking' as const, label: 'Net Banking', icon: '🏛️' },
                ].map((tab) => {
                  const isActive = checkoutTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      id={`checkout-tab-${tab.id}`}
                      onClick={() => {
                        setCheckoutTab(tab.id);
                        if (tab.id === 'qr' && !qrImageUrl && !qrString && activeCheckout) {
                          handleGenerateQr(activeCheckout);
                        }
                      }}
                      style={{
                        padding: '8px 4px',
                        borderRadius: 8,
                        border: isActive ? '1px solid #DDD6FE' : '1px solid transparent',
                        background: isActive ? '#FFFFFF' : 'transparent',
                        color: isActive ? '#7C3AED' : '#6B655B',
                        fontSize: 12,
                        fontWeight: isActive ? 700 : 500,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                        boxShadow: isActive ? '0 2px 6px rgba(124,58,237,0.1)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: 15 }}>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Body */}
              <div
                style={{
                  padding: '20px',
                  flex: '1 1 auto',
                  overflowY: 'auto',
                  minHeight: 0,
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {/* ── TAB 1: CARDS (Custom Unool Card Checkout) ──────────────── */}
                {checkoutTab === 'cards' && (
                  <div>
                    {/* Virtual Interactive Unool Card Preview */}
                    <div
                      style={{
                        width: '100%',
                        maxWidth: 360,
                        margin: '0 auto 16px',
                        borderRadius: 14,
                        padding: '16px 18px',
                        background: 'linear-gradient(135deg, #181412 0%, #2A211B 50%, #3D2F24 100%)',
                        color: '#FFFFFF',
                        boxShadow: '0 16px 36px -10px rgba(26,22,18,0.45), 0 0 0 1px rgba(255,255,255,0.08) inset',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Decorative ambient glow */}
                      <div
                        style={{
                          position: 'absolute',
                          top: -50,
                          right: -50,
                          width: 150,
                          height: 150,
                          borderRadius: '50%',
                          background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
                          pointerEvents: 'none',
                        }}
                      />

                      {/* Card Top Row: EMV Chip + Unool Plan Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {/* Gold Chip */}
                          <div
                            style={{
                              width: 36,
                              height: 26,
                              borderRadius: 5,
                              background: 'linear-gradient(135deg, #FDE68A 0%, #D97706 100%)',
                              border: '1px solid #B45309',
                              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.6)',
                              position: 'relative',
                            }}
                          >
                            <div
                              style={{
                                position: 'absolute',
                                inset: 3,
                                border: '1px solid rgba(180,83,9,0.5)',
                                borderRadius: 2,
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', letterSpacing: 1 }}>
                            (((•
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            letterSpacing: '0.12em',
                            color: '#FDE68A',
                            textTransform: 'uppercase',
                            background: 'rgba(253,230,138,0.12)',
                            padding: '3px 8px',
                            borderRadius: 4,
                            border: '1px solid rgba(253,230,138,0.3)',
                          }}
                        >
                          UNOOL {activeCheckout.planName.toUpperCase()}
                        </span>
                      </div>

                      {/* Card Number */}
                      <div
                        style={{
                          fontSize: 18,
                          fontFamily: 'monospace',
                          letterSpacing: '2.5px',
                          color: '#FFFFFF',
                          marginBottom: 18,
                          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                          fontWeight: 600,
                        }}
                      >
                        {cardNumber ? formatCardNumber(cardNumber) : '•••• •••• •••• ••••'}
                      </div>

                      {/* Card Bottom Row: Holder Name, Expiry, Brand Badge */}
                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                            Cardholder Name
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            {cardHolder.trim() || 'YOUR NAME'}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                            Expires
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.05em' }}>
                            {cardExpiry || 'MM/YY'}
                          </div>
                        </div>

                        <div
                          style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            background: 'rgba(255,255,255,0.16)',
                            backdropFilter: 'blur(4px)',
                            fontSize: 11,
                            fontWeight: 800,
                            color: '#FFFFFF',
                            letterSpacing: '0.04em',
                            border: '1px solid rgba(255,255,255,0.2)',
                          }}
                        >
                          {cardBrand.name}
                        </div>
                      </div>
                    </div>

                    {/* Card Input Form */}
                    <div>
                      {/* Card Number Input */}
                      <div style={{ marginBottom: 14 }}>
                        <label
                          htmlFor="unool-card-number"
                          style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1A1612', marginBottom: 6 }}
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
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              paddingRight: 64,
                              borderRadius: 10,
                              border: '1.5px solid #E8E0D5',
                              fontSize: 14,
                              fontFamily: 'monospace',
                              letterSpacing: '1px',
                              color: '#1A1612',
                              background: '#FAF8F5',
                              outline: 'none',
                              boxSizing: 'border-box',
                              transition: 'border-color 0.15s ease',
                            }}
                            onFocus={(e) => (e.target.style.borderColor = '#7C3AED')}
                            onBlur={(e) => (e.target.style.borderColor = '#E8E0D5')}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              right: 12,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              fontSize: 11,
                              fontWeight: 700,
                              color: cardBrand.color,
                              background: '#EDE9FE',
                              padding: '3px 8px',
                              borderRadius: 4,
                            }}
                          >
                            {cardBrand.name}
                          </div>
                        </div>
                      </div>

                      {/* Cardholder Name Input */}
                      <div style={{ marginBottom: 14 }}>
                        <label
                          htmlFor="unool-card-holder"
                          style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1A1612', marginBottom: 6 }}
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
                            border: '1.5px solid #E8E0D5',
                            fontSize: 14,
                            color: '#1A1612',
                            background: '#FAF8F5',
                            outline: 'none',
                            boxSizing: 'border-box',
                            transition: 'border-color 0.15s ease',
                          }}
                          onFocus={(e) => (e.target.style.borderColor = '#7C3AED')}
                          onBlur={(e) => (e.target.style.borderColor = '#E8E0D5')}
                        />
                      </div>

                      {/* Expiry & CVV in 2 columns */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                        <div>
                          <label
                            htmlFor="unool-card-expiry"
                            style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1A1612', marginBottom: 6 }}
                          >
                            Valid Thru (MM/YY)
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
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              borderRadius: 10,
                              border: '1.5px solid #E8E0D5',
                              fontSize: 14,
                              fontFamily: 'monospace',
                              color: '#1A1612',
                              background: '#FAF8F5',
                              outline: 'none',
                              boxSizing: 'border-box',
                              transition: 'border-color 0.15s ease',
                            }}
                            onFocus={(e) => (e.target.style.borderColor = '#7C3AED')}
                            onBlur={(e) => (e.target.style.borderColor = '#E8E0D5')}
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="unool-card-cvv"
                            style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1A1612', marginBottom: 6 }}
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
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              borderRadius: 10,
                              border: '1.5px solid #E8E0D5',
                              fontSize: 14,
                              fontFamily: 'monospace',
                              letterSpacing: '2px',
                              color: '#1A1612',
                              background: '#FAF8F5',
                              outline: 'none',
                              boxSizing: 'border-box',
                              transition: 'border-color 0.15s ease',
                            }}
                            onFocus={(e) => (e.target.style.borderColor = '#7C3AED')}
                            onBlur={(e) => (e.target.style.borderColor = '#E8E0D5')}
                          />
                        </div>
                      </div>

                      {cardError && (
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
                          <span>{cardError}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        id="unool-submit-card-pay"
                        onClick={handlePayWithCard}
                        disabled={cardSubmitting || !cardNumber || !cardHolder || !cardExpiry || !cardCvv}
                          style={{
                            width: '100%',
                            padding: '13px 18px',
                            borderRadius: 12,
                            background: cardSubmitting || !cardNumber || !cardHolder || !cardExpiry || !cardCvv
                              ? '#C4B5FD'
                              : 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                            color: '#FFFFFF',
                            fontSize: 14,
                            fontWeight: 700,
                            border: 'none',
                            cursor: cardSubmitting || !cardNumber || !cardHolder || !cardExpiry || !cardCvv ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            boxShadow: '0 4px 14px rgba(124,58,237,0.25)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {cardSubmitting ? (
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
                              <span>Connecting to Bank 3DS...</span>
                            </>
                          ) : (
                            <>
                              <span>🔒 Pay Securely with Card</span>
                              <span style={{ fontSize: 16 }}>→</span>
                            </>
                          )}
                        </button>

                      <div
                        style={{
                          marginTop: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          fontSize: 11,
                          color: '#8C8476',
                        }}
                      >
                        <span>🔒</span>
                        <span>256-bit SSL Encryption • RBI Tokenization Ready • 100% Secure</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 2: UPI ID (Collect Flow) ─────────────────────────── */}
                {checkoutTab === 'upi' && (
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
                        <p style={{ fontSize: 12, color: '#7A7265', margin: '0 0 14px', lineHeight: 1.45 }}>
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
                )}

                {/* ── TAB 3: SCAN QR (Dynamic UPI QR Code) ─────────────────── */}
                {checkoutTab === 'qr' && (
                  <div style={{ textAlign: 'center', padding: '6px 4px' }}>
                    <div style={{ marginBottom: 16 }}>
                      <h4 style={{ fontSize: 16, fontWeight: 800, color: '#1A1612', margin: '0 0 4px' }}>
                        Scan QR Code to Pay
                      </h4>
                      <p style={{ fontSize: 13, color: '#7A7265', margin: 0 }}>
                        Scan using any UPI app on your phone to complete payment instantly.
                      </p>
                    </div>

                    {/* QR Code Container */}
                    <div
                      style={{
                        width: 220,
                        height: 220,
                        margin: '0 auto 16px',
                        background: '#FFFFFF',
                        borderRadius: 16,
                        border: '2px solid #E8E0D5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 24px -4px rgba(26,22,18,0.12)',
                        position: 'relative',
                        padding: 12,
                        boxSizing: 'border-box',
                      }}
                    >
                      {qrLoading ? (
                        <div style={{ textAlign: 'center' }}>
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              border: '3px solid #DDD6FE',
                              borderTopColor: '#7C3AED',
                              borderRadius: '50%',
                              animation: 'unoolSpin 0.8s linear infinite',
                              margin: '0 auto 10px',
                            }}
                          />
                          <span style={{ fontSize: 12, color: '#7A7265', fontWeight: 600 }}>
                            Generating Dynamic QR...
                          </span>
                        </div>
                      ) : qrImageUrl || qrString ? (
                        <img
                          src={
                            qrImageUrl ||
                            `https://api.qrserver.com/v1/create-qr-code/?size=190x190&margin=4&data=${encodeURIComponent(
                              qrString || ''
                            )}`
                          }
                          alt="Dynamic UPI QR Code"
                          style={{
                            width: 190,
                            height: 190,
                            borderRadius: 10,
                            objectFit: 'contain',
                          }}
                        />
                      ) : (
                        <div style={{ textAlign: 'center', padding: 12 }}>
                          <span style={{ fontSize: 24, display: 'block', marginBottom: 6 }}>⚠️</span>
                          <button
                            type="button"
                            onClick={() => handleGenerateQr(activeCheckout)}
                            style={{
                              padding: '8px 14px',
                              borderRadius: 8,
                              background: '#7C3AED',
                              color: '#FFFFFF',
                              border: 'none',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Generate QR Code
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Supported UPI Apps Row */}
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
                            color: '#4B4339',
                            background: '#FAF7F3',
                            border: '1px solid #E8E0D5',
                            borderRadius: 6,
                            padding: '3px 8px',
                          }}
                        >
                          {app}
                        </span>
                      ))}
                    </div>

                    {/* Live Listening Status */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        fontSize: 12,
                        color: '#10B981',
                        fontWeight: 600,
                        background: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        borderRadius: 10,
                        padding: '10px 14px',
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#10B981',
                          animation: 'unoolPulse 1.5s infinite',
                        }}
                      />
                      <span>Listening for QR scan & payment confirmation...</span>
                    </div>

                    {qrString && (
                      <a
                        href={qrString}
                        style={{
                          display: 'inline-block',
                          fontSize: 12,
                          color: '#7C3AED',
                          fontWeight: 600,
                          textDecoration: 'underline',
                          cursor: 'pointer',
                        }}
                      >
                        Paying on this mobile device? Click here to launch UPI app directly
                      </a>
                    )}
                  </div>
                )}

                {/* ── TAB 4: NET BANKING ───────────────────────────────────── */}
                {checkoutTab === 'netbanking' && (
                  <div>
                    <div style={{ marginBottom: 14 }}>
                      <h4 style={{ fontSize: 15, fontWeight: 800, color: '#1A1612', margin: '0 0 4px' }}>
                        Select Your Bank
                      </h4>
                      <p style={{ fontSize: 12, color: '#7A7265', margin: 0 }}>
                        Choose your bank to authorize payment directly via secure netbanking.
                      </p>
                    </div>

                    {/* Popular Banks Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 8,
                        marginBottom: 16,
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
                              padding: '10px 8px',
                              borderRadius: 10,
                              border: isSelected ? '2px solid #7C3AED' : '1px solid #E8E0D5',
                              background: isSelected ? '#F5F3FF' : '#FFFFFF',
                              color: isSelected ? '#7C3AED' : '#1A1612',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 4,
                              transition: 'all 0.12s ease',
                              textAlign: 'center',
                            }}
                          >
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 800,
                                color: b.badgeColor,
                                background: '#FAF8F5',
                                padding: '2px 6px',
                                borderRadius: 4,
                                border: '1px solid #E8E0D5',
                              }}
                            >
                              {b.short}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.2 }}>
                              {b.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* All Other Banks Dropdown */}
                    <div style={{ marginBottom: 18 }}>
                      <label
                        htmlFor="unool-bank-select"
                        style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1A1612', marginBottom: 6 }}
                      >
                        Or Select Other Bank (50+ Supported):
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
                          padding: '11px 12px',
                          borderRadius: 10,
                          border: '1.5px solid #E8E0D5',
                          fontSize: 13,
                          color: '#1A1612',
                          background: '#FAF8F5',
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
                        <span>{netbankingError}</span>
                      </div>
                    )}

                    {netbankingRedirecting && (
                      <div
                        style={{
                          padding: '12px 14px',
                          borderRadius: 10,
                          background: '#ECFDF5',
                          border: '1px solid #A7F3D0',
                          marginBottom: 16,
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#065F46', marginBottom: 4 }}>
                          Redirected to {selectedBankName} Portal
                        </div>
                        <div style={{ fontSize: 12, color: '#047857' }}>
                          Please complete authentication on your bank portal. Plan updates automatically upon confirmation.
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      id="unool-submit-netbanking-pay"
                      onClick={handlePayWithNetbanking}
                      disabled={netbankingSubmitting}
                      style={{
                        width: '100%',
                        padding: '13px 18px',
                        borderRadius: 12,
                        background: netbankingSubmitting
                          ? '#C4B5FD'
                          : 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                        color: '#FFFFFF',
                        fontSize: 14,
                        fontWeight: 700,
                        border: 'none',
                        cursor: netbankingSubmitting ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: '0 4px 14px rgba(124,58,237,0.25)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {netbankingSubmitting ? (
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
                          <span>Connecting to Bank...</span>
                        </>
                      ) : (
                        <>
                          <span>Proceed with {selectedBankName} Netbanking</span>
                          <span style={{ fontSize: 16 }}>→</span>
                        </>
                      )}
                    </button>

                    <div
                      style={{
                        marginTop: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        fontSize: 11,
                        color: '#8C8476',
                      }}
                    >
                      <span>🔒</span>
                      <span>Direct 256-bit Encrypted Bank Gateway</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: '12px 20px',
                  background: '#FAF8F5',
                  borderTop: '1px solid #F0ECE6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexShrink: 0,
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
