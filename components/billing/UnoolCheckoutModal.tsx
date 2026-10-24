'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Lock, Check, Zap, Sparkles, AlertCircle } from 'lucide-react';
import type { CashfreeInstance } from '@cashfreepayments/cashfree-js';
import './checkout.css';

export interface PlanPricing {
  currency: string;
  monthly: number;
  annual: number;
  annualMonthly: number;
  monthlyDisplay: string;
  annualDisplay: string;
  annualMonthlyDisplay: string;
}

export interface PlanData {
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

interface UnoolCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlanData | null;
  billingCycle: 'monthly' | 'annual';
  paymentSessionId: string | null;
  cfOrderId: string | null;
  mode?: 'sandbox' | 'production';
  onPaymentSuccess: () => void;
  onPaymentFailed: (message: string) => void;
}

let cachedCashfree: CashfreeInstance | null = null;
let cachedCashfreeMode: string | null = null;

async function getCashfreeInstance(mode: 'sandbox' | 'production' = 'sandbox'): Promise<CashfreeInstance | null> {
  if (cachedCashfree && cachedCashfreeMode === mode) return cachedCashfree;
  try {
    const { load } = await import('@cashfreepayments/cashfree-js');
    cachedCashfree = await load({ mode });
    cachedCashfreeMode = mode;
    return cachedCashfree;
  } catch (err) {
    console.error('[UnoolCheckout] Failed to load Cashfree SDK:', err);
    return null;
  }
}

function cleanupCashfreeArtifacts() {
  if (typeof document === 'undefined') return;
  try {
    // Only clean standalone Cashfree modal overlays injected directly into body, NEVER touch React's tree
    const modals = document.querySelectorAll(
      'body > [id*="cashfree"], body > [class*="cf-modal"], body > .cf-backdrop, body > .cf-overlay'
    );
    modals.forEach(el => el.remove());
  } catch {
    // Ignore
  }
}

export function UnoolCheckoutModal({
  isOpen,
  onClose,
  plan,
  billingCycle,
  paymentSessionId,
  cfOrderId,
  mode,
  onPaymentSuccess,
  onPaymentFailed,
}: UnoolCheckoutModalProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loadingGateway, setLoadingGateway] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const handleClose = () => {
    cleanupCashfreeArtifacts();
    onClose();
  };

  const handleOpenFallbackModal = async () => {
    if (!paymentSessionId) return;
    try {
      const cashfreeMode = mode || (process.env.NEXT_PUBLIC_CASHFREE_MODE as 'sandbox' | 'production') || 'sandbox';
      const cashfree = await getCashfreeInstance(cashfreeMode);
      if (!cashfree) return;
      handleClose();
      cashfree
        .checkout({
          paymentSessionId,
          redirectTarget: '_modal',
        })
        .then((result: any) => {
          if (result?.error) {
            onPaymentFailed(result.error.message || 'Payment was cancelled.');
          } else {
            onPaymentSuccess();
          }
        })
        .catch((err: any) => {
          console.error('[UnoolCheckout] Popup checkout error:', err);
        });
    } catch (err) {
      console.error('[UnoolCheckout] Fallback checkout error:', err);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Clean standalone Cashfree overlays on beforeunload
  useEffect(() => {
    if (!isOpen) return;
    const handleBeforeUnload = () => {
      cleanupCashfreeArtifacts();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanupCashfreeArtifacts();
    };
  }, [isOpen]);

  // Mount Cashfree Checkout inside our dedicated DOM container
  useEffect(() => {
    if (!isOpen || !paymentSessionId || !plan) return;

    let isMounted = true;
    setLoadingGateway(true);
    setInitError(null);

    async function mountCheckout() {
      try {
        const cashfreeMode = mode || (process.env.NEXT_PUBLIC_CASHFREE_MODE as 'sandbox' | 'production') || 'sandbox';
        const cashfree = await getCashfreeInstance(cashfreeMode);
        if (!cashfree) {
          if (isMounted) {
            setInitError('Could not initialize payment gateway. Please check your internet connection and refresh.');
            setLoadingGateway(false);
          }
          return;
        }

        const container = mountRef.current;
        const sessionId = paymentSessionId;
        if (!container || !sessionId) return;

        // Clear previous children inside our isolated DOM node (safe because React has no children in this div)
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }

        // Call Cashfree checkout targeting our bespoke container element
        cashfree
          .checkout({
            paymentSessionId: sessionId,
            redirectTarget: container,
            appearance: {
              width: '100%',
              height: '560px',
            },
          })
          .then((result: any) => {
            if (!isMounted) return;

            if (result?.error) {
              console.warn('[UnoolCheckout] Gateway error or user cancellation:', result.error);
              onPaymentFailed(result.error.message || 'Payment was cancelled.');
            } else if (result?.redirect) {
              console.log('[UnoolCheckout] Payment redirect in progress');
            } else {
              // Completed or modal finished
              onPaymentSuccess();
            }
          })
          .catch((err: any) => {
            console.error('[UnoolCheckout] Checkout invocation error:', err);
            if (isMounted) {
              setInitError(err?.message || 'Failed to open payment gateway.');
              setLoadingGateway(false);
            }
          });

        // Hide skeleton after initial DOM injection
        setTimeout(() => {
          if (isMounted) setLoadingGateway(false);
        }, 1200);
      } catch (err) {
        console.error('[UnoolCheckout] Mounting error:', err);
        if (isMounted) {
          setInitError('An unexpected error occurred while loading payment methods.');
          setLoadingGateway(false);
        }
      }
    }

    // Run mount after modal transition completes
    const timer = setTimeout(mountCheckout, 100);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, paymentSessionId, plan, mode, onPaymentSuccess, onPaymentFailed]);

  if (!isOpen || !plan) return null;

  const priceDisplay =
    billingCycle === 'monthly'
      ? plan.pricing.monthlyDisplay
      : plan.pricing.annualDisplay;

  const monthlyEquivalent =
    billingCycle === 'annual' ? plan.pricing.annualMonthlyDisplay : null;

  return (
    <div
      className="unool-checkout-backdrop"
      onClick={e => {
        if (e.target === e.currentTarget) handleClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="unool-plan-title"
    >
      <div className="unool-checkout-dialog">
        {/* ── Left Value Showcase Panel ───────────────────────── */}
        <div className="unool-checkout-left">
          <div>
            {/* Brand Header */}
            <div className="unool-brand-header">
              <div className="unool-brand-title">
                <span className="unool-brand-dot" />
                <span>UNOOL</span>
              </div>
              <span className="unool-plan-badge">
                {billingCycle === 'annual' ? 'Annual Plan' : 'Monthly Plan'}
              </span>
            </div>

            {/* Plan Info */}
            <h2 id="unool-plan-title" className="unool-plan-name">
              {plan.name} Tier
            </h2>
            <p className="unool-plan-tagline">{plan.tagline}</p>

            {/* Price Box */}
            <div className="unool-price-box">
              <div className="unool-price-row">
                <span className="unool-price-amount">{priceDisplay}</span>
                <span className="unool-price-period">
                  /{billingCycle === 'annual' ? 'year' : 'month'}
                </span>
              </div>

              {billingCycle === 'annual' && monthlyEquivalent && (
                <div className="unool-savings-tag">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Effective {monthlyEquivalent}/mo (Save ~17%)</span>
                </div>
              )}
            </div>

            {/* Feature Highlights */}
            <ul className="unool-features-list">
              <li className="unool-feature-item">
                <span className="unool-feature-check">
                  <Check className="w-3 h-3" />
                </span>
                <span>
                  {plan.limits.posts_per_month === -1
                    ? 'Unlimited posts & scheduling'
                    : `${plan.limits.posts_per_month} scheduled posts/mo`}
                </span>
              </li>
              <li className="unool-feature-item">
                <span className="unool-feature-check">
                  <Check className="w-3 h-3" />
                </span>
                <span>
                  {plan.limits.ai_credits_per_month === -1
                    ? 'Unlimited AI credits (fair use)'
                    : `${plan.limits.ai_credits_per_month} AI credits/mo`}
                </span>
              </li>
              <li className="unool-feature-item">
                <span className="unool-feature-check">
                  <Check className="w-3 h-3" />
                </span>
                <span>All {plan.templateCount} Persona creator templates</span>
              </li>
              {plan.features.custom_domain && (
                <li className="unool-feature-item">
                  <span className="unool-feature-check">
                    <Check className="w-3 h-3" />
                  </span>
                  <span>Custom domain support (yourbrand.com)</span>
                </li>
              )}
              {plan.features.dm_concierge_full && (
                <li className="unool-feature-item">
                  <span className="unool-feature-check">
                    <Check className="w-3 h-3" />
                  </span>
                  <span>Full AI DM Concierge & Lead Scoring</span>
                </li>
              )}
            </ul>
          </div>

          {/* Trust Guarantees */}
          <div className="unool-trust-footer">
            <div className="unool-trust-item">
              <ShieldCheck className="w-4 h-4" />
              <span>7-day money-back guarantee · 1-click cancel</span>
            </div>
            <div className="unool-trust-item">
              <Lock className="w-4 h-4" />
              <span>Instant plan activation · 256-bit encrypted</span>
            </div>
          </div>
        </div>

        {/* ── Right Payment Gateway Container ─────────────────── */}
        <div className="unool-checkout-right">
          {/* Header */}
          <div className="unool-right-header">
            <div className="unool-right-header-text">
              <span>Select Payment Method</span>
              <span className="unool-ssl-badge">
                <Lock className="w-3 h-3" /> RBI Compliant
              </span>
            </div>
            <button
              onClick={handleClose}
              className="unool-close-btn"
              title="Close (Esc)"
              aria-label="Close checkout"
            >
              ×
            </button>
          </div>

          {/* Embedded Cashfree Container */}
          <div className="unool-cashfree-mount">
            {loadingGateway && (
              <div className="unool-mount-skeleton">
                <div className="unool-spinner" />
                <span>Preparing secure checkout...</span>
              </div>
            )}

            {initError && (
              <div
                style={{
                  padding: 24,
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 60,
                }}
              >
                <AlertCircle className="w-8 h-8 text-red-500" />
                <div style={{ fontWeight: 600, color: '#991B1B' }}>
                  {initError}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button
                    onClick={handleOpenFallbackModal}
                    className="unool-verify-btn"
                  >
                    Open in Popup
                  </button>
                  <button
                    onClick={handleClose}
                    className="unool-verify-btn"
                    style={{ background: '#F4EFEA', color: '#1A1612', border: '1px solid #E5DED5' }}
                  >
                    Close &amp; Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Dedicated Cashfree Embed Target — React leaves this pure DOM container alone */}
            <div
              ref={mountRef}
              className="unool-cf-embed-target"
              style={{
                width: '100%',
                minHeight: '520px',
                display: initError ? 'none' : 'block',
              }}
            />
          </div>

          {/* Footer Note */}
          <div className="unool-right-footer">
            <span>Powered by Cashfree Payments</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="unool-verify-btn"
                style={{ background: 'transparent', color: '#7A7265', border: '1px solid #E5DED5' }}
                onClick={handleOpenFallbackModal}
                title="If payment options don't display properly, open in overlay popup"
              >
                Open in Popup
              </button>
              <button
                type="button"
                className="unool-verify-btn"
                onClick={onPaymentSuccess}
              >
                Check Status
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
