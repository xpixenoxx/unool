'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import './pricing.css';

// ── Types & Helpers ──────────────────────────────────────────────────────────

const inr = (n: number) => '₹' + n.toLocaleString('en-IN');

interface BillItem {
  name: string;
  desc: string;
  price: number;
}

const BILLS: [string, string, number][] = [
  ['Zorcha Pro', 'Instagram DMs only', 1199],
  ['Buffer', '4 channels', 2000],
  ['Linktree Pro', 'Profile page', 1250],
  ['Taplio', 'LinkedIn growth', 3250],
];

const PLAN_LABELS = [
  'Workspaces',
  'Templates',
  'Publishing channels',
  'Scheduled posts',
  'AI credits',
  'Instagram comments',
  'LinkedIn comments',
  'DM Concierge',
  'Lead scoring',
  'Brand voices',
  'Analytics',
  'Seats',
  'Domain',
];

interface PlanData {
  n: string;
  t: string;
  m: [number, number]; // [monthly, annual] in INR
  u: [number, number]; // [monthly, annual] in USD
  r: string[];
}

const PLANS: PlanData[] = [
  {
    n: 'Spark',
    t: 'Free forever',
    m: [0, 0],
    u: [0, 0],
    r: [
      '1 · name.unool.co',
      '5 premium',
      '2',
      '15 queued',
      '25 / mo',
      '250',
      '50',
      'None',
      'None',
      'None',
      '30 days',
      '1',
      'unool.co address',
    ],
  },
  {
    n: 'Creator',
    t: 'For serious creators',
    m: [799, 666],
    u: [10, 8],
    r: [
      '1 · name.unool.co',
      'All 16',
      '4',
      'Unlimited',
      '150 / mo',
      '500',
      '250',
      'Basic',
      'None',
      'None',
      '90 days',
      '1',
      'unool.co address',
    ],
  },
  {
    n: 'Pro',
    t: 'Most popular. The full engine',
    m: [1999, 1666],
    u: [24, 20],
    r: [
      '1',
      'All 16',
      '8',
      'Unlimited + FlightPlan AI',
      '500 / mo',
      '3,000',
      '1,500',
      'Full + knowledge base',
      '0–3 triage',
      '5',
      '1 year',
      '3',
      'Custom domain',
    ],
  },
  {
    n: 'Studio',
    t: 'For agencies and teams',
    m: [4999, 4166],
    u: [60, 50],
    r: [
      '3 brands or clients',
      'All 16 + white-label',
      'Unlimited',
      'Unlimited',
      'Unlimited (fair use)',
      'Unlimited',
      'Unlimited',
      'Full + multi-routing',
      '0–3 triage',
      'Unlimited',
      'Lifetime + export',
      '10 + roles',
      'White-label',
    ],
  },
];

const COMPETITOR_NAMES = ['Unool', 'Zorcha', 'Linktree', 'Buffer', 'Taplio'];
const COMPETITOR_PRICES = ['₹799', '₹1,199', '₹1,250', '₹2,000+', '₹3,250+'];

const COMPARISONS: [string, string, string][] = [
  ['Premium profile page', '16 studio-grade templates vs Zorcha’s 3 basic themes', 'yppnn'],
  ['IG comment automation', 'AI semantic intent vs rigid keyword triggers', 'yynnn'],
  ['Comment-to-DM flows', '', 'yynnn'],
  ['LinkedIn automation', 'Taplio schedules only, no auto-reply', 'ynnnp'],
  ['Multi-platform publishing', 'IG, LinkedIn, X, Threads, Bluesky', 'ynnyp'],
  ['AI content composer', '', 'ynnpy'],
  ['Follow-to-unlock gates', '', 'yynnn'],
  ['DM Concierge (AI responder)', 'Zorcha: rigid FAQ slots. Unool: full knowledge base', 'ypnnn'],
  ['Custom domain', 'Pro and above on Unool', 'ynynn'],
  ['UPI / INR billing', 'Buffer and Taplio are USD only', 'yynnn'],
];

const STATUS_MAP: Record<string, [string, number]> = {
  y: ['Full', 100],
  p: ['Partial', 50],
  n: ['Not offered', 0],
};

const calcPoints = (toolIdx: number) =>
  COMPARISONS.reduce((acc, row) => acc + (row[2][toolIdx] === 'y' ? 1 : row[2][toolIdx] === 'p' ? 0.5 : 0), 0);

const FAQS: [string, string][] = [
  [
    'Do I need a credit card to start?',
    'No. Every signup gets a 14-day Pro trial with no card. After that you can stay on Spark for free or pick a paid plan.',
  ],
  [
    'What payment methods do you accept?',
    'UPI and cards, billed in INR with no FX markup. USD billing is available too.',
  ],
  [
    'Can I switch plans anytime?',
    'Yes. Move up or down whenever you like. The change applies from your next billing cycle.',
  ],
  [
    'What happens to my data if I downgrade?',
    'Your content stays. Features beyond the new plan’s limits pause until you upgrade again, and analytics older than the new window are hidden, not deleted.',
  ],
  [
    'Is there GST on top of the prices shown?',
    'Prices shown are before GST. Applicable GST is added at checkout.',
  ],
  [
    'Can I connect my custom domain on Spark?',
    'Custom domains start on Pro. Spark and Creator use your name.unool.co address.',
  ],
];

// ── Main Component ─────────────────────────────────────────────────────────────

export function PricingPageClient() {
  // ── Receipt Cancelled Bills State ──
  const [cancelled, setCancelled] = useState<Set<number>>(new Set());
  const [displayedTotal, setDisplayedTotal] = useState<number>(7699);
  const targetTotalRef = useRef<number>(7699);
  const totalAnimFrameRef = useRef<number | null>(null);

  // ── Plans Configuration State ──
  const [cur, setCur] = useState<'INR' | 'USD'>('INR');
  const [per, setPer] = useState<'m' | 'a'>('a');
  const [onPlan, setOnPlan] = useState<number>(2); // Pro active by default
  const [planPrices, setPlanPrices] = useState<number[]>([0, 666, 1666, 4166]);
  const planAnimFramesRef = useRef<(number | null)[]>([null, null, null, null]);

  // ── Competitor Comparison State ──
  const [who, setWho] = useState<number>(1); // 1 = Zorcha
  const [barsFilled, setBarsFilled] = useState<boolean>(false);
  const sbRef = useRef<HTMLDivElement | null>(null);

  // ── FAQ Accordion State ──
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());

  // ── Synchronize Body Background ──
  useEffect(() => {
    const origBg = document.body.style.backgroundColor;
    const origColor = document.body.style.color;
    document.body.style.backgroundColor = '#0a0a0a';
    document.body.style.color = '#f5f7fa';
    return () => {
      document.body.style.backgroundColor = origBg;
      document.body.style.color = origColor;
    };
  }, []);

  // ── Tweening Total ──
  const tweenTotalTo = (toVal: number) => {
    const fromVal = targetTotalRef.current;
    targetTotalRef.current = toVal;
    if (fromVal === toVal) return;

    if (totalAnimFrameRef.current) cancelAnimationFrame(totalAnimFrameRef.current);

    const t0 = performance.now();
    const duration = 700;

    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / duration);
      const ease = 1 - Math.pow(1 - k, 3);
      const current = Math.round(fromVal + (toVal - fromVal) * ease);
      setDisplayedTotal(current);
      if (k < 1) {
        totalAnimFrameRef.current = requestAnimationFrame(step);
      }
    };
    totalAnimFrameRef.current = requestAnimationFrame(step);
  };

  // ── Flip Receipt Bills ──
  const flip = (index: number, forceState?: boolean) => {
    setCancelled((prev) => {
      const next = new Set(prev);
      if (forceState !== undefined) {
        if (forceState) next.add(index);
        else next.delete(index);
      } else {
        if (next.has(index)) next.delete(index);
        else next.add(index);
      }

      // Compute total
      let newTotal = next.size ? 1999 : 0;
      BILLS.forEach((b, i) => {
        if (!next.has(i)) newTotal += b[2];
      });
      tweenTotalTo(newTotal);

      return next;
    });
  };

  // ── Mount: Sequential Auto-Cancellation ──
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      [0, 1, 2, 3].forEach((i) => flip(i, true));
    } else {
      const timers = [0, 1, 2, 3].map((i) =>
        setTimeout(() => {
          flip(i, true);
        }, 1100 + i * 550)
      );

      return () => {
        timers.forEach((t) => clearTimeout(t));
        if (totalAnimFrameRef.current) cancelAnimationFrame(totalAnimFrameRef.current);
      };
    }
  }, []);

  // ── Compute Header Message ──
  const diff = 7699 - displayedTotal;
  let msgContent: React.ReactNode = null;
  if (!cancelled.size) {
    msgContent = 'You pay four companies every month.';
  } else if (diff > 0) {
    msgContent = (
      <>
        You keep <em>{inr(diff)}</em> a month. That’s {Math.round((diff / 7699) * 100)}% less.
      </>
    );
  } else {
    msgContent = 'Unool Pro is ₹1,999. Cancel the rest to start saving.';
  }

  // ── Tween Plan Prices on Cur / Per Change ──
  useEffect(() => {
    PLANS.forEach((p, i) => {
      const targetVal =
        cur === 'INR' ? p.m[per === 'a' ? 1 : 0] : p.u[per === 'a' ? 1 : 0];
      const fromVal = planPrices[i] ?? targetVal;
      if (fromVal === targetVal) return;

      if (planAnimFramesRef.current[i]) {
        cancelAnimationFrame(planAnimFramesRef.current[i]!);
      }

      const t0 = performance.now();
      const duration = 600;

      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / duration);
        const ease = 1 - Math.pow(1 - k, 3);
        const curr = Math.round(fromVal + (targetVal - fromVal) * ease);
        setPlanPrices((prev) => {
          const next = [...prev];
          next[i] = curr;
          return next;
        });
        if (k < 1) {
          planAnimFramesRef.current[i] = requestAnimationFrame(step);
        }
      };
      planAnimFramesRef.current[i] = requestAnimationFrame(step);
    });

    return () => {
      planAnimFramesRef.current.forEach((frame) => {
        if (frame) cancelAnimationFrame(frame);
      });
    };
  }, [cur, per]);

  const fmtCurrency = (val: number) => (cur === 'INR' ? inr(val) : '$' + val);

  // ── Intersection Observer for Comparison Bars ──
  useEffect(() => {
    if (!sbRef.current) return;
    if (!('IntersectionObserver' in window)) {
      setBarsFilled(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setBarsFilled(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(sbRef.current);
    return () => observer.disconnect();
  }, []);

  // ── Toggle FAQ ──
  const toggleFaq = (index: number) => {
    setOpenFaqs((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // ── Competitor Head-to-Head Calculations ──
  const winsCount = COMPARISONS.filter((r) => r[2][who] !== 'y').length;
  const tiesCount = 10 - winsCount;

  return (
    <div className="pricing-page">
      {/* ── HEADER / HERO ── */}
      <header className="hero">
        <div className="w">
          <nav>
            <Link className="logo c" href="/">
              unool
            </Link>
            <span>
              <a href="#plans">Plans</a>
              <Link href="/templates">Templates</Link>
              <Link className="btn" href="#start">
                Start free
              </Link>
            </span>
          </nav>

          <h1 className="c">
            <span className="l1">One</span> <span className="l2">bill.</span>
          </h1>

          <div className="hg">
            <p>
              Unool replaces Zorcha, Buffer, Linktree and Taplio. Profile page, publishing,
              Instagram automation and LinkedIn growth, for one flat price.
            </p>
            <p>14-day Pro trial on every signup. No credit card.</p>
          </div>

          <div className="rcs" id="rcs">
            {BILLS.map((b, i) => {
              const isCancelled = cancelled.has(i);
              return (
                <button
                  key={b[0]}
                  className={`rc${isCancelled ? ' x' : ''}`}
                  aria-pressed={isCancelled}
                  onClick={() => flip(i)}
                  type="button"
                >
                  <b>{b[0]}</b>
                  <span>{b[1]}</span>
                  <br />
                  <span className="pr c">
                    {inr(b[2])}
                    <small>/mo</small>
                  </span>
                  <i className="stamp" style={{ fontStyle: 'normal' }}>
                    Cancelled
                  </i>
                </button>
              );
            })}
          </div>

          <div className="tot">
            <div>
              <p className="lb">Your monthly total</p>
              <div className="big c" id="tot">
                {inr(displayedTotal)}
              </div>
            </div>
            <div>
              <p className="msg" id="msg">
                {msgContent}
              </p>
              <a className="btn" href="#plans">
                See the plans
              </a>
            </div>
          </div>

          <p className="hint">Tap a bill to cancel it. Tap again to bring it back.</p>
          <div style={{ height: 'clamp(40px,7vw,90px)' }}></div>
        </div>
      </header>

      {/* ── PLANS SECTION ── */}
      <section className="s paper" id="plans">
        <div className="w">
          <div className="ph">
            <h2 className="d">Pick a size.</h2>
            <div className="tg">
              <div id="perSeg">
                <button
                  aria-pressed={per === 'm'}
                  data-v="m"
                  onClick={() => setPer('m')}
                  type="button"
                >
                  Monthly
                </button>
                <button
                  aria-pressed={per === 'a'}
                  data-v="a"
                  onClick={() => setPer('a')}
                  type="button"
                >
                  Annual<i>2 months free</i>
                </button>
              </div>
              <div id="curSeg">
                <button
                  aria-pressed={cur === 'INR'}
                  data-v="INR"
                  onClick={() => setCur('INR')}
                  type="button"
                >
                  ₹ INR
                </button>
                <button
                  aria-pressed={cur === 'USD'}
                  data-v="USD"
                  onClick={() => setCur('USD')}
                  type="button"
                >
                  $ USD
                </button>
              </div>
            </div>
          </div>

          <div className="cols" id="cols">
            {PLANS.map((p, i) => {
              const isSelected = i === onPlan;
              const isFree = !p.m[0];
              const saving =
                (cur === 'INR' ? p.m[0] - p.m[1] : p.u[0] - p.u[1]) * 12;
              const savingText =
                isFree || per === 'm'
                  ? ''
                  : `Saves ${fmtCurrency(saving)} a year on annual`;

              return (
                <article
                  key={p.n}
                  className={`col${isSelected ? ' on' : ''}`}
                  onClick={() => setOnPlan(i)}
                >
                  <h3>{p.n}</h3>
                  <p className="tag">{p.t}</p>
                  <div className="px c">
                    <span className="pv">
                      {isFree ? 'Free' : fmtCurrency(planPrices[i] ?? 0)}
                    </span>
                    {!isFree && <small>/ month</small>}
                  </div>
                  <p className="sv">{savingText}</p>
                  <div className="det">
                    <dl>
                      {PLAN_LABELS.map((l, k) => (
                        <div key={l}>
                          <dt>{l}</dt>
                          <dd>{p.r[k]}</dd>
                        </div>
                      ))}
                    </dl>
                    <Link
                      className="btn"
                      href={i === 0 ? '/signup' : `/signup?plan=${p.n.toLowerCase()}`}
                    >
                      {i ? 'Start 14-day trial' : 'Start for free'}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── COMPARE SECTION ── */}
      <section className="s">
        <div className="w">
          <h2 className="d">Side by side.</h2>
          <p className="lede">
            Ten jobs creators hire tools for. This is how many each tool actually does.
          </p>

          <div className="sb" id="sb" ref={sbRef}>
            {COMPETITOR_NAMES.map((name, j) => {
              const score = calcPoints(j);
              const isMe = j === 0;
              return (
                <div key={name} className={`sr${isMe ? ' me' : ''}`}>
                  <b>{name}</b>
                  <div className="tr">
                    <i
                      style={{ width: barsFilled ? `${score * 10}%` : '0%' }}
                      data-w={score * 10}
                    />
                  </div>
                  <div className="sc c">{score}</div>
                </div>
              );
            })}
          </div>

          <div className="vh">
            <h3 className="c">Now, feature by feature.</h3>
            <div className="pick" id="pick" role="tablist">
              {COMPETITOR_NAMES.slice(1).map((name, idx) => {
                const compIndex = idx + 1;
                return (
                  <button
                    key={name}
                    role="tab"
                    aria-selected={who === compIndex}
                    onClick={() => setWho(compIndex)}
                    type="button"
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>

          <div id="vs">
            <p className="score c">
              <span>{winsCount}</span> wins, {tiesCount} ties.
            </p>
            <div className="hd">
              <div>Unool vs {COMPETITOR_NAMES[who]}</div>
              <div>Unool</div>
              <div>{COMPETITOR_NAMES[who]}</div>
            </div>

            {COMPARISONS.map((row, rIdx) => {
              const isWin = row[2][who] !== 'y';
              const unoolStatus = row[2][0];
              const compStatus = row[2][who];

              return (
                <div key={rIdx} className={`lr${isWin ? ' win' : ''}`}>
                  <div>
                    {row[0]}
                    {row[1] && <small>{row[1]}</small>}
                  </div>
                  <div className="a1">
                    <span className="st">{STATUS_MAP[unoolStatus][0]}</span>
                    <div className="mt">
                      <i style={{ width: `${STATUS_MAP[unoolStatus][1]}%` }} />
                    </div>
                  </div>
                  <div className={compStatus === 'n' ? 'no' : ''}>
                    <span className="st">{STATUS_MAP[compStatus][0]}</span>
                    <div className="mt">
                      <i style={{ width: `${STATUS_MAP[compStatus][1]}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="lr">
              <div>
                Monthly price in India
                <small>Unool is the cheapest and does the most</small>
              </div>
              <div className="a1">
                <span className="pt c">{COMPETITOR_PRICES[0]}</span>
              </div>
              <div>
                <span className="pt c">{COMPETITOR_PRICES[who]}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <section className="s paper">
        <div className="w">
          <h2 className="d" style={{ marginBottom: '46px' }}>
            Questions.
          </h2>
          <div id="faq">
            {FAQS.map(([q, a], idx) => {
              const isOpen = openFaqs.has(idx);
              return (
                <div
                  key={q}
                  className="q"
                  data-open={isOpen ? 'true' : undefined}
                  {...({ open: isOpen ? '' : undefined } as Record<string, unknown>)}
                >
                  <button
                    aria-expanded={isOpen}
                    onClick={() => toggleFaq(idx)}
                    type="button"
                  >
                    {q}
                  </button>
                  <div className="a">
                    <p>{a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── END / CTA SECTION ── */}
      <section className="s end" id="start">
        <div className="w">
          <h2 className="d">Start free.</h2>
          <div className="row">
            <p>No credit card. Every signup gets 14 days of full Pro.</p>
            <span>
              <Link className="btn" href="/signup">
                Get started free
              </Link>{' '}
              <Link
                className="btn"
                href="/templates"
                style={{
                  background: 'transparent',
                  color: 'var(--n)',
                  boxShadow: 'inset 0 0 0 2px var(--n)',
                }}
              >
                See all templates
              </Link>
            </span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <div className="w">
        <footer>
          <span>© 2026 Pixenox Solutions · Prathipadu, Kakinada, AP</span>
          <nav>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/refund">Refund Policy</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </footer>
      </div>
    </div>
  );
}
