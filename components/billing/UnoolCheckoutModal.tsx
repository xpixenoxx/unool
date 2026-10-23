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
  onPaymentSuccess: () => void;
  onPaymentFailed: (message: string) => void;
}

let cachedCashfree: CashfreeInstance | null = null;

async function getCashfreeInstance(): Promise<CashfreeInstance | null> {
  if (cachedCashfree) return cachedCashfree;
  try {
    const { load } = await import('@cashfreepayments/cashfree-js');
    const mode = (process.env.NEXT_PUBLIC_CASHFREE_MODE as 'sandbox' | 'production') || 'sandbox';
    cachedCashfree = await load({ mode });
    return cachedCashfree;
  } catch (err) {
    console.error('[UnoolCheckout] Failed to load Cashfree SDK:', err);
    return null;
  }
}

export function UnoolCheckoutModal({
  isOpen,
  onClose,
  plan,
  billingCycle,
  paymentSessionId,
  cfOrderId,
  onPaymentSuccess,
  onPaymentFailed,
}: UnoolCheckoutModalProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loadingGateway, setLoadingGateway] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Mount Cashfree Checkout inside our custom dialog container
  useEffect(() => {
    if (!isOpen || !paymentSessionId || !plan) return;

    let isMounted = true;
    setLoadingGateway(true);
    setInitError(null);

    async function mountCheckout() {
      try {
        const cashfree = await getCashfreeInstance();
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

        // Clean container before mounting
        container.innerHTML = '';

        // Call Cashfree checkout targeting our bespoke container element
        cashfree
          .checkout({
            paymentSessionId: sessionId,
            redirectTarget: container,
          })
          .then((result: any) => {
            if (!isMounted) return;

            if (result?.error) {
              console.warn('[UnoolCheckout] Gateway error or user cancellation:', result.error);
              onPaymentFailed(result.error.message || 'Payment was cancelled.');
            } else {
              // Completed or modal finished
              onPaymentSuccess();
            }
          })
          .catch((err: any) => {
            console.error('[UnoolCheckout] Checkout invocation error:', err);
            if (isMounted) {
              setInitError(err?.message || 'Failed to open payment gateway.');
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
  }, [isOpen, paymentSessionId, plan, onPaymentSuccess, onPaymentFailed]);

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
        if (e.target === e.currentTarget) onClose();
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
              onClick={onClose}
              className="unool-close-btn"
              title="Close (Esc)"
              aria-label="Close checkout"
            >
              ×
            </button>
          </div>

          {/* Embedded Cashfree Container */}
          <div className="unool-cashfree-mount" ref={mountRef}>
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
                <button
                  onClick={onClose}
                  className="unool-verify-btn"
                  style={{ marginTop: 8 }}
                >
                  Close & Try Again
                </button>
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="unool-right-footer">
            <span>Powered by Cashfree Payments</span>
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
  );
}
