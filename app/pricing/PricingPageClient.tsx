'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, X, Zap, Crown, Building2, Sparkles, ChevronRight, Star } from 'lucide-react';
import './pricing.css';

// ── Plan definitions ───────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'spark',
    name: 'Spark',
    icon: <Sparkles className="h-5 w-5" />,
    tagline: 'Free forever',
    monthly_inr: 0,
    annual_inr: 0,
    monthly_usd: 0,
    annual_usd: 0,
    cta: 'Start for free',
    ctaHref: '/signup',
    highlight: false,
    badge: null,
    color: '#6366f1',
    features: [
      '1 workspace · name.unool.co',
      '5 premium profile templates',
      '2 publishing channels',
      '15 scheduled posts queued',
      '25 AI credits / month',
      '250 IG comments automated',
      '50 LinkedIn comments automated',
      'Follow-to-Unlock gates',
      '30-day analytics',
      '1 user',
    ],
    missing: [
      'DM Concierge (AI responder)',
      'Custom domain',
      'Lead scoring',
      'Team seats',
    ],
  },
  {
    id: 'creator',
    name: 'Creator',
    icon: <Zap className="h-5 w-5" />,
    tagline: 'For serious creators',
    monthly_inr: 799,
    annual_inr: 666,
    monthly_usd: 9,
    annual_usd: 7.5,
    cta: 'Start 14-day trial',
    ctaHref: '/signup?plan=creator',
    highlight: false,
    badge: null,
    color: '#f59e0b',
    features: [
      '1 workspace · name.unool.co',
      'All 16 persona templates',
      'No "Made with Unool" badge',
      '4 publishing channels',
      'Unlimited scheduled posts',
      '150 AI credits / month',
      '500 IG comments automated',
      '250 LinkedIn comments automated',
      'Basic DM Concierge',
      '90-day analytics',
      '1 user',
    ],
    missing: [
      'Custom domain',
      'Lead scoring & triage',
      'Team seats',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: <Crown className="h-5 w-5" />,
    tagline: 'The full engine',
    monthly_inr: 1999,
    annual_inr: 1666,
    monthly_usd: 24,
    annual_usd: 20,
    cta: 'Start 14-day trial',
    ctaHref: '/signup?plan=pro',
    highlight: true,
    badge: 'Most popular',
    color: '#6366f1',
    features: [
      '1 workspace + custom domain',
      'All 16 persona templates',
      '8 publishing channels',
      'Unlimited posts + FlightPlan AI',
      '500 AI credits / month',
      '3,000 IG comments automated',
      '1,500 LinkedIn comments automated',
      'Full DM Concierge + knowledge base',
      'Lead scoring 0–3 triage',
      '1-year analytics',
      '3 team seats',
      '5 brand voice personas',
    ],
    missing: [],
  },
  {
    id: 'studio',
    name: 'Studio',
    icon: <Building2 className="h-5 w-5" />,
    tagline: 'For agencies & teams',
    monthly_inr: 4999,
    annual_inr: 4166,
    monthly_usd: 59,
    annual_usd: 49,
    cta: 'Start 14-day trial',
    ctaHref: '/signup?plan=studio',
    highlight: false,
    badge: 'Agency',
    color: '#8b5cf6',
    features: [
      '3 workspaces (3 brands/clients)',
      'Full white-label (zero Unool branding)',
      'Unlimited publishing channels',
      'Unlimited AI credits (fair use)',
      'Unlimited IG + LinkedIn automation',
      'Full DM Concierge + multi-routing',
      'Lifetime analytics + data export',
      '10 team seats + granular roles',
      'Unlimited brand voice personas',
      'Webhook API + Zapier triggers',
      'Priority support + onboarding call',
    ],
    missing: [],
  },
];

// ── Competitor comparison ──────────────────────────────────────────────────────

const COMPARISON_ROWS = [
  {
    feature: 'Premium profile page',
    unool: 'true',
    zorcha: 'partial',
    linktree: 'partial',
    buffer: 'false',
    taplio: 'false',
    note: '16 studio-grade templates vs Zorcha\'s 3 basic themes',
  },
  {
    feature: 'IG Comment automation',
    unool: 'true',
    zorcha: 'true',
    linktree: 'false',
    buffer: 'false',
    taplio: 'false',
    note: 'AI semantic intent vs rigid keyword triggers',
  },
  {
    feature: 'Comment-to-DM flows',
    unool: 'true',
    zorcha: 'true',
    linktree: 'false',
    buffer: 'false',
    taplio: 'false',
    note: '',
  },
  {
    feature: 'LinkedIn automation',
    unool: 'true',
    zorcha: 'false',
    linktree: 'false',
    buffer: 'false',
    taplio: 'partial',
    note: 'Taplio schedules only — no auto-reply',
  },
  {
    feature: 'Multi-platform publishing',
    unool: 'true',
    zorcha: 'false',
    linktree: 'false',
    buffer: 'true',
    taplio: 'partial',
    note: 'IG, LinkedIn, X, Threads, Bluesky',
  },
  {
    feature: 'AI content composer',
    unool: 'true',
    zorcha: 'false',
    linktree: 'false',
    buffer: 'partial',
    taplio: 'true',
    note: '',
  },
  {
    feature: 'Follow-to-unlock gates',
    unool: 'true',
    zorcha: 'true',
    linktree: 'false',
    buffer: 'false',
    taplio: 'false',
    note: '',
  },
  {
    feature: 'DM Concierge (AI responder)',
    unool: 'true',
    zorcha: 'partial',
    linktree: 'false',
    buffer: 'false',
    taplio: 'false',
    note: 'Zorcha: rigid FAQ slots. Unool: full knowledge base',
  },
  {
    feature: 'Custom domain',
    unool: 'true',
    zorcha: 'false',
    linktree: 'true',
    buffer: 'false',
    taplio: 'false',
    note: 'Pro+ only on Unool',
  },
  {
    feature: 'UPI / INR billing',
    unool: 'true',
    zorcha: 'true',
    linktree: 'false',
    buffer: 'false',
    taplio: 'false',
    note: 'Buffer/Taplio are USD only — ₹83+ FX markup',
  },
  {
    feature: 'Monthly India price',
    unool: '₹799',
    zorcha: '₹1,199',
    linktree: '₹1,250',
    buffer: '₹2,000+',
    taplio: '₹3,250+',
    note: 'Unool is the cheapest and does the most',
    isPrice: true,
  },
];

// ── Component ──────────────────────────────────────────────────────────────────

export function PricingPageClient() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual');
  const [currency, setCurrency] = useState<'inr' | 'usd'>('inr');

  const getPrice = (plan: typeof PLANS[0]) => {
    if (plan.monthly_inr === 0) return 'Free';
    const price = billing === 'annual'
      ? (currency === 'inr' ? plan.annual_inr : plan.annual_usd)
      : (currency === 'inr' ? plan.monthly_inr : plan.monthly_usd);
    return currency === 'inr' ? `₹${price.toLocaleString('en-IN')}` : `$${price}`;
  };

  const getAnnualSaving = (plan: typeof PLANS[0]) => {
    if (plan.monthly_inr === 0) return null;
    const saving = currency === 'inr'
      ? (plan.monthly_inr - plan.annual_inr) * 12
      : (plan.monthly_usd - plan.annual_usd) * 12;
    return currency === 'inr' ? `Save ₹${saving.toLocaleString('en-IN')}/yr` : `Save $${saving}/yr`;
  };

  return (
    <div className="pricing-root">
      {/* Nav back to home */}
      <nav className="pricing-nav">
        <Link href="/" className="pricing-logo">unool</Link>
        <div className="pricing-nav-links">
          <Link href="/templates">Templates</Link>
          <Link href="/signup" className="pricing-nav-cta">Get started free →</Link>
        </div>
      </nav>

      {/* Top Screen: Hero + 4 Side-by-Side Plans fitting in one screen */}
      <div className="pricing-top-screen">
        {/* Hero */}
        <section className="pricing-hero">
          <div className="pricing-hero-badge">
            <Star className="h-3.5 w-3.5" />
            14-day Pro trial · No credit card
          </div>
          <h1 className="pricing-hero-title">
            One platform.<br />
            <span className="pricing-hero-gradient">Not four subscriptions.</span>
          </h1>
          <p className="pricing-hero-subtitle">
            Unool replaces Zorcha + Buffer + Linktree + Taplio with one flat-price platform.
            Profile · Publishing · IG Automation · LinkedIn — all in one.
          </p>

          {/* Billing toggle */}
          <div className="pricing-toggles">
            <div className="pricing-billing-toggle">
              <button
                className={billing === 'monthly' ? 'active' : ''}
                onClick={() => setBilling('monthly')}
                id="billing-monthly-btn"
              >Monthly</button>
              <button
                className={billing === 'annual' ? 'active' : ''}
                onClick={() => setBilling('annual')}
                id="billing-annual-btn"
              >
                Annual
                <span className="pricing-badge-save">2 months free</span>
              </button>
            </div>
            <div className="pricing-currency-toggle">
              <button
                className={currency === 'inr' ? 'active' : ''}
                onClick={() => setCurrency('inr')}
                id="currency-inr-btn"
              >₹ INR</button>
              <button
                className={currency === 'usd' ? 'active' : ''}
                onClick={() => setCurrency('usd')}
                id="currency-usd-btn"
              >$ USD</button>
            </div>
          </div>
        </section>

        {/* Plan cards: All 4 plans side by side */}
        <section className="pricing-cards">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`pricing-card ${plan.highlight ? 'pricing-card--highlight' : ''} ${plan.id === 'studio' ? 'pricing-card--studio' : ''}`}
              id={`pricing-card-${plan.id}`}
            >
              {plan.badge && (
                <div
                  className="pricing-card-badge"
                  style={{ background: plan.color }}
                >
                  {plan.badge}
                </div>
              )}
              <div
                className="pricing-card-icon"
                style={{
                  color: plan.color,
                  background: plan.id === 'studio' ? 'rgba(139, 92, 246, 0.16)' : undefined,
                  borderColor: plan.id === 'studio' ? 'rgba(139, 92, 246, 0.3)' : undefined
                }}
              >
                {plan.icon}
              </div>
              <h2 className="pricing-card-name">{plan.name}</h2>
              <p className="pricing-card-tagline">{plan.tagline}</p>

              <div className="pricing-card-price">
                <span className="pricing-card-amount">{getPrice(plan)}</span>
                {plan.monthly_inr > 0 && (
                  <span className="pricing-card-period">/ month</span>
                )}
              </div>

              {billing === 'annual' && plan.monthly_inr > 0 && (
                <div className="pricing-card-saving">{getAnnualSaving(plan)}</div>
              )}

              <Link
                href={plan.ctaHref}
                className={`pricing-card-cta ${
                  plan.highlight
                    ? 'pricing-card-cta--primary'
                    : plan.id === 'studio'
                    ? 'pricing-card-cta--studio'
                    : 'pricing-card-cta--secondary'
                }`}
                id={`pricing-cta-${plan.id}`}
              >
                {plan.cta} <ChevronRight className="h-4 w-4" />
              </Link>

              <ul className="pricing-feature-list">
                {plan.features.map((f) => (
                  <li key={f} className="pricing-feature-item pricing-feature-item--yes">
                    <Check className="h-3.5 w-3.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li key={f} className="pricing-feature-item pricing-feature-item--no">
                    <X className="h-3.5 w-3.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </div>

      {/* Competitor comparison */}
      <section className="pricing-compare-section">
        <h2 className="pricing-compare-title">How Unool compares</h2>
        <p className="pricing-compare-subtitle">
          Every tool in the market, side by side. Honest comparison.
        </p>

        <div className="pricing-compare-wrap">
          <table className="pricing-compare-table">
            <thead>
              <tr>
                <th className="pricing-compare-th pricing-compare-th--feature">Feature</th>
                <th className="pricing-compare-th pricing-compare-th--unool">Unool</th>
                <th className="pricing-compare-th">Zorcha</th>
                <th className="pricing-compare-th">Linktree</th>
                <th className="pricing-compare-th">Buffer</th>
                <th className="pricing-compare-th">Taplio</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.feature} className="pricing-compare-row">
                  <td className="pricing-compare-td pricing-compare-td--feature">
                    {row.feature}
                    {row.note && <span className="pricing-compare-note"> — {row.note}</span>}
                  </td>
                  {['unool', 'zorcha', 'linktree', 'buffer', 'taplio'].map((tool) => {
                    const val = row[tool as keyof typeof row] as string;
                    const isUnool = tool === 'unool';
                    return (
                      <td
                        key={tool}
                        className={`pricing-compare-td ${isUnool ? 'pricing-compare-td--unool' : ''}`}
                      >
                        {row.isPrice ? (
                          <span className={isUnool ? 'pricing-compare-price--winner' : 'pricing-compare-price'}>{val}</span>
                        ) : val === 'true' ? (
                          <Check className={`h-5 w-5 ${isUnool ? 'text-emerald-500' : 'text-emerald-500/70'}`} />
                        ) : val === 'partial' ? (
                          <span className="pricing-compare-partial">Partial</span>
                        ) : (
                          <X className="h-5 w-5 text-red-400/60" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Value proof */}
      <section className="pricing-math-section">
        <h2 className="pricing-math-title">The math that makes the decision obvious</h2>
        <div className="pricing-math-grid">
          <div className="pricing-math-col pricing-math-col--them">
            <h3>What creators currently pay separately</h3>
            <div className="pricing-math-row">
              <span>Zorcha Pro (IG DMs only)</span><span>₹1,199</span>
            </div>
            <div className="pricing-math-row">
              <span>Buffer (4 channels)</span><span>₹2,000</span>
            </div>
            <div className="pricing-math-row">
              <span>Linktree Pro</span><span>₹1,250</span>
            </div>
            <div className="pricing-math-row">
              <span>Taplio (LinkedIn growth)</span><span>₹3,250</span>
            </div>
            <div className="pricing-math-total">
              <span>Total per month</span><span>₹7,699</span>
            </div>
          </div>
          <div className="pricing-math-vs">vs</div>
          <div className="pricing-math-col pricing-math-col--us">
            <h3>Unool Pro — everything above</h3>
            <div className="pricing-math-highlight">₹1,999<span>/mo</span></div>
            <div className="pricing-math-saving">You save ₹5,700/mo · 74% cheaper</div>
            <Link href="/signup?plan=pro" className="pricing-math-cta" id="pricing-math-cta">
              Start 14-day trial →
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pricing-faq-section">
        <h2 className="pricing-faq-title">Common questions</h2>
        <div className="pricing-faq-list">
          {[
            {
              q: 'Do I need a credit card to start?',
              a: 'No. The 14-day Pro trial is completely free with no credit card required. You get full Pro access and automatically downgrade to Spark (free) if you don\'t subscribe.',
            },
            {
              q: 'What payment methods do you accept?',
              a: 'UPI (GPay, PhonePe, Paytm, BHIM), UPI Autopay for subscriptions, Credit/Debit cards (Visa, Mastercard, RuPay), Netbanking (65+ banks), EMI for annual plans. All powered by Cashfree.',
            },
            {
              q: 'Can I switch plans anytime?',
              a: 'Yes — upgrade or downgrade anytime. Upgrades take effect immediately. Downgrades take effect at the end of your billing period.',
            },
            {
              q: 'What happens to my data if I downgrade?',
              a: 'Your data is always safe. If you exceed limits after downgrading, new actions are paused but existing data is preserved.',
            },
            {
              q: 'Is there GST on top of the prices shown?',
              a: 'Prices shown are all-inclusive for individual creators. GST invoices are available on request for business buyers who need Input Tax Credit.',
            },
            {
              q: 'Can I connect my custom domain on Spark?',
              a: 'Custom domains (like yourname.com) require the Pro plan (₹1,999/mo). Free users get a name.unool.co subdomain.',
            },
          ].map(({ q, a }) => (
            <details key={q} className="pricing-faq-item">
              <summary className="pricing-faq-q">{q}</summary>
              <p className="pricing-faq-a">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="pricing-bottom-cta">
        <h2 className="pricing-bottom-title">Start free. No credit card.</h2>
        <p className="pricing-bottom-sub">
          Join creators replacing 4 tools with one. 14-day full Pro trial on every signup.
        </p>
        <div className="pricing-bottom-actions">
          <Link href="/signup" className="pricing-bottom-primary" id="pricing-bottom-signup">
            Get started free
          </Link>
          <Link href="/templates" className="pricing-bottom-secondary">
            See all templates →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="pricing-footer">
        <p>© 2026 Pixenox Solutions · Prathipadu, Kakinada, AP</p>
        <div className="pricing-footer-links">
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/refund">Refund Policy</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
