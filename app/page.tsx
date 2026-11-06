'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import './homepage.css';
import { BentoVideoPlayer } from '@/components/landing/BentoVideoPlayer';
import { AutomationVideoPlayer } from '@/components/landing/AutomationVideoPlayer';
import type { ProfilePreviewTemplate } from '@/components/landing/profilePreviewTemplates';
import { PROFILE_PREVIEW_TEMPLATES } from '@/components/landing/profilePreviewTemplates';
import { initUaPlayer, renderPhoneMockups, PLATFORMS, useHomepagePricing, HOMEPAGE_PRICE_FALLBACK } from '@/components/landing/landingUtils';

export default function HomePage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const spRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stmRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  const [activeProfileTpl, setActiveProfileTpl] = useState(0);
  const currentTpl = PROFILE_PREVIEW_TEMPLATES[activeProfileTpl] || PROFILE_PREVIEW_TEMPLATES[0];

  const [activeSection, setActiveSection] = useState('overview');

  // DB-backed pricing (falls back to hardcoded if API unavailable)
  const homepagePrices = useHomepagePricing();
  const getPriceById = (id: string) => homepagePrices.find(p => p.id === id);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      if (id === 'overview') {
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      } else {
        const navOffset = 70;
        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = Math.max(0, elementPosition + window.pageYOffset - navOffset);
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
      window.history.pushState(null, '', href);
      setActiveSection(id);
    }
  };

  const [thought] = useState(
    'Meet the Linen Wrap Dress 🌿 Hand-woven terracotta, made for warm days. Sizes XS–XL. First 50 pieces: 20% off this week.'
  );

  // 3-step auto-playing video flow: 0 = Connect accounts, 1 = Write post, 2 = Adapt (Mobile view)
  const [flowStep, setFlowStep] = useState<0 | 1 | 2>(0);
  const [connectedAccounts, setConnectedAccounts] = useState({
    instagram: false,
    linkedin: false,
  });
  const [isInstagramConnecting, setIsInstagramConnecting] = useState(true);
  const [isLinkedInConnecting, setIsLinkedInConnecting] = useState(false);
  const [isAdapted, setIsAdapted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  // Auto-play like a video: transitions through connect -> write -> adapt without waiting for user input
  useEffect(() => {
    if (!isPlaying) return;

    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;
    let timer3: NodeJS.Timeout;
    let timer4: NodeJS.Timeout;

    if (flowStep === 0) {
      // Step 1: Connect accounts sequence
      setConnectedAccounts({ instagram: false, linkedin: false });
      setIsInstagramConnecting(true);
      setIsLinkedInConnecting(false);

      // Instagram finishes connecting
      timer1 = setTimeout(() => {
        setConnectedAccounts((prev) => ({ ...prev, instagram: true }));
        setIsInstagramConnecting(false);
      }, 1200);

      // LinkedIn starts connecting
      timer2 = setTimeout(() => {
        setIsLinkedInConnecting(true);
      }, 1800);

      // LinkedIn finishes connecting
      timer3 = setTimeout(() => {
        setConnectedAccounts((prev) => ({ ...prev, linkedin: true }));
        setIsLinkedInConnecting(false);
      }, 2700);

      // Auto-advance to Step 2 (Write post)
      timer4 = setTimeout(() => {
        setFlowStep(1);
      }, 3700);
    } else if (flowStep === 1) {
      // Step 2: Write post & auto-click Adapt
      setIsAdapted(false);

      // Auto-click Adapt button
      timer1 = setTimeout(() => {
        setIsAdapted(true);
      }, 2000);

      // Auto-advance to Step 3 (Mobile phone deck)
      timer2 = setTimeout(() => {
        setFlowStep(2);
      }, 3100);
    } else if (flowStep === 2) {
      // Step 3: Mobile Phone Deck
      const tabs = rootRef.current?.querySelectorAll<HTMLElement>('#tabs button[data-i]');
      if (tabs && tabs[0]) tabs[0].click();
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [flowStep, isPlaying]);

  const handleConnectInstagram = () => {
    if (connectedAccounts.instagram) {
      setConnectedAccounts((prev) => ({ ...prev, instagram: false }));
      setIsInstagramConnecting(false);
      return;
    }
    setIsInstagramConnecting(true);
    setTimeout(() => {
      setConnectedAccounts((prev) => ({ ...prev, instagram: true }));
      setIsInstagramConnecting(false);
    }, 600);
  };

  const handleConnectLinkedIn = () => {
    if (connectedAccounts.linkedin) {
      setConnectedAccounts((prev) => ({ ...prev, linkedin: false }));
      return;
    }
    setIsLinkedInConnecting(true);
    setTimeout(() => {
      setConnectedAccounts((prev) => ({ ...prev, linkedin: true }));
      setIsLinkedInConnecting(false);
    }, 600);
  };

  const handleAdapt = () => {
    setIsAdapted(true);
    setTimeout(() => {
      setFlowStep(2);
      setIsAdapted(false);
    }, 550);
  };

  useEffect(() => {
    if (!rootRef.current) return;
    renderPhoneMockups(rootRef.current, thought);
  }, [thought, flowStep]);

  useEffect(() => {
    if (!rootRef.current) return;
    const root = rootRef.current;
    const $ = (s: string) => root.querySelector<HTMLElement>(s);
    const $$ = (s: string) => root.querySelectorAll<HTMLElement>(s);

    const P = PLATFORMS;
    const N = P.length;

    function svg(p: [string, string, string, string], s: number) {
      return (
        '<svg viewBox="0 0 24 24" width="' +
        s +
        '" height="' +
        s +
        '" fill="' +
        p[2] +
        '">' +
        p[3] +
        '</svg>'
      );
    }
    function mini(p: [string, string, string, string], s: number, sz: number) {
      return (
        '<span class="mi" style="background:' +
        p[1] +
        ';width:' +
        sz +
        'px;height:' +
        sz +
        'px">' +
        svg(p, s) +
        '</span>'
      );
    }

    // Scroll progress bar & Nav scroll styling
    const nav = $('#nav');
    const bar = $('#bar');
    const sectionIds = ['overview', 'voices', 'features', 'profile', 'analytics', 'pricing'];
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (nav) nav.classList.toggle('s', scrollY > 40);
      if (bar) {
        const totalHeight = document.body.scrollHeight - window.innerHeight;
        bar.style.width = totalHeight > 0 ? (scrollY / totalHeight) * 100 + '%' : '0%';
      }

      const scrollPos = scrollY + 120;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(sectionIds[i]);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll);

    // Marquee Bands
    const nm = P.map(p => '<span>' + p[0] + '</span>').join('');
    const m1 = $('#m1');
    const m2 = $('#m2');
    if (m1) m1.innerHTML = nm + nm;
    if (m2) m2.innerHTML = nm + nm;

    // Chips in bento
    const chips = $('#chips');
    if (chips) {
      chips.innerHTML =
        P.slice(0, 14)
          .map(p => '<span>' + p[0] + '</span>')
          .join('') +
        '<span style="background:var(--terra)">+' +
        (N - 14) +
        ' more</span>';
    }

    // Tab buttons with mini icons (matched by platform name)
    $$('#tabs button[data-i]').forEach(b => {
      const label = b.textContent?.trim().toLowerCase() || '';
      const platform = P.find(p => p[0].toLowerCase() === label);
      if (platform) {
        b.insertAdjacentHTML('afterbegin', mini(platform, 14, 22));
      } else {
        const idx = Number(b.dataset.i);
        if (!isNaN(idx) && P[idx]) {
          b.insertAdjacentHTML('afterbegin', mini(P[idx], 14, 22));
        }
      }
    });

    // Populate Phone Mockups
    renderPhoneMockups(root, thought);

    // Streamgraph Analytics
    const sv = $('#strm');
    const tip = $('#tip');
    let streamRafId = 0;
    if (sv && tip) {
      const K = 14;
      const W = 900;
      const H = 300;
      let hov = 0;
      const A: [string, string, number[]][] = [
        ['X', '#e8a595', [2, 2.6, 3.4, 3, 4.2, 3.8, 5.6, 5, 6.4, 6, 5.2, 6.6, 7.4, 7]],
        ['LinkedIn', '#fdf6ee', [3, 4, 3.6, 5.2, 4.8, 6.4, 6, 8.6, 7.2, 6.6, 8, 9.4, 8.2, 10]],
        ['Instagram', '#ff8a5c', [1.6, 1.8, 2.4, 2, 2.6, 3.2, 2.8, 3.6, 4.2, 3.8, 4.6, 4.2, 5, 5.4]],
        ['Threads', '#c84b31', [1, 1.4, 1.2, 2, 2.4, 2.2, 3, 3.8, 3.4, 4.6, 4.2, 5, 4.6, 5.8]]
      ];
      const tot: number[] = [];
      const ys: number[][] = [];
      let sum = 0;
      const D: string[] = [];

      for (let i = 0; i < K; i++) {
        tot[i] = 0;
        D[i] = 'Oct ' + (6 + i);
        for (let k = 0; k < 4; k++) tot[i] += A[k][2][i];
        sum += tot[i];
      }

      const mx = Math.max.apply(0, tot);
      const sc = (H * 0.74) / mx;
      const pk = tot.indexOf(mx);
      const xs = (i: number) => (i * W) / (K - 1);

      for (let k = 0; k < 4; k++) {
        ys[k] = [];
        for (let i = 0; i < K; i++) {
          let y = H / 2 - (tot[i] * sc) / 2;
          for (let j = 0; j < k; j++) y += A[j][2][i] * sc;
          ys[k][i] = y;
        }
      }

      function cv(p: number[][]) {
        let d = '';
        for (let q = 1; q < p.length; q++) {
          const m = (p[q - 1][0] + p[q][0]) / 2;
          d += 'C' + m + ',' + p[q - 1][1] + ' ' + m + ',' + p[q][1] + ' ' + p[q][0] + ',' + p[q][1];
        }
        return d;
      }

      let h =
        '<svg viewBox="0 0 ' +
        W +
        ' ' +
        (H + 26) +
        '"><defs>' +
        A.map(function(a, k) {
          return (
            '<linearGradient id="sg' +
            k +
            '" x1="0" x2="1"><stop offset="0" stop-color="' +
            a[1] +
            '" stop-opacity=".5"/><stop offset=".6" stop-color="' +
            a[1] +
            '" stop-opacity=".92"/><stop offset="1" stop-color="' +
            a[1] +
            '"/></linearGradient>'
          );
        }).join('') +
        '</defs>';

      A.forEach(function(a, k) {
        const t: number[][] = [];
        const b: number[][] = [];
        for (let q = 0; q < K; q++) {
          t.push([xs(q), ys[k][q]]);
          b.push([xs(q), ys[k][q] + a[2][q] * sc - 2.5]);
        }
        b.reverse();
        h +=
          '<path d="M' +
          t[0] +
          cv(t) +
          'L' +
          b[0] +
          cv(b) +
          'Z" fill="url(#sg' +
          k +
          ')"/><path d="M' +
          t[0] +
          cv(t) +
          '" fill="none" stroke="#fff" stroke-opacity=".35"/>';
      });

      for (let i = 0; i < K; i += 2) {
        h +=
          '<text x="' +
          xs(i) +
          '" y="' +
          (H + 20) +
          '" fill="#fdf6ee" fill-opacity=".5" font-size="14" text-anchor="middle">' +
          D[i] +
          '</text>';
      }

      const px = xs(pk);
      const py = ys[0][pk] - 8;
      h +=
        '<circle class="pk" cx="' +
        px +
        '" cy="' +
        py +
        '" r="5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="' +
        px +
        '" cy="' +
        py +
        '" r="4" fill="#fff"/><line id="sl" y1="0" y2="' +
        H +
        '" stroke="#fff" stroke-dasharray="3 5" stroke-opacity=".6"/>' +
        A.map(function() {
          return '<circle class="dt" r="5.5" stroke="#fff" stroke-width="2"/>';
        }).join('') +
        '</svg>';

      sv.insertAdjacentHTML('afterbegin', h);
      const sl = $('#sl');
      const dots = sv.querySelectorAll<HTMLElement>('.dt');
      A.forEach(function(a, k) {
        if (dots[k]) dots[k].setAttribute('fill', a[1]);
      });

      const rk = $('#rk');
      if (rk) rk.textContent = Math.round(sum) + 'K';
      const lgd = $('#lgd');
      if (lgd) {
        lgd.innerHTML = A.slice()
          .reverse()
          .map(function(a) {
            return '<span><i style="background:' + a[1] + '"></i>' + a[0] + '</span>';
          })
          .join('');
      }

      function go(f: number) {
        f = Math.max(0, Math.min(K - 1, f));
        const i0 = Math.min(K - 2, Math.floor(f));
        let t = f - i0;
        t = t * t * (3 - 2 * t);
        const x = (f * W) / (K - 1);
        if (sl) {
          sl.setAttribute('x1', String(x));
          sl.setAttribute('x2', String(x));
        }
        let s2 = '<small>' + D[Math.round(f)] + '</small>';
        A.forEach(function(a, k) {
          const v = a[2][i0] + (a[2][i0 + 1] - a[2][i0]) * t;
          const y0 = ys[k][i0] + (ys[k][i0 + 1] - ys[k][i0]) * t;
          if (dots[k]) {
            dots[k].setAttribute('cx', String(x));
            dots[k].setAttribute('cy', String(y0 + (v * sc) / 2));
          }
          s2 +=
            '<div style="border-color:' +
            a[1] +
            '"><small>' +
            a[0] +
            '</small><b>' +
            v.toFixed(1) +
            'K</b></div>';
        });
        if (tip && sv) {
          tip.innerHTML = s2;
          const w = sv.clientWidth;
          const hw = tip.offsetWidth / 2;
          tip.style.left = Math.max(hw, Math.min(w - hw, (x / W) * w)) + 'px';
        }
      }

      sv.addEventListener('pointermove', function(e) {
        hov = 1;
        const r = sv.getBoundingClientRect();
        go(((e.clientX - r.left) / r.width) * (K - 1));
      });
      sv.addEventListener('pointerleave', function() {
        hov = 0;
      });

      function loop(t: number) {
        if (!hov) go(((Math.sin(t / 2400 - 1.2) + 1) / 2) * (K - 1));
        streamRafId = requestAnimationFrame(loop);
      }
      streamRafId = requestAnimationFrame(loop);
    }

    // 3D Platform Sphere in Stage
    const sp = $('#sp');
    const st = $('#stage');
    let sphereRafId = 0;
    interface SphereTile extends HTMLDivElement {
      v: [number, number, number];
      a: number;
      b: number;
    }
    const T: SphereTile[] = [];
    let R = 200;
    let ry = 0;
    let rx = -0.25;
    let vy = 0.004;
    let drag = 0;
    let lx = 0;
    let ly = 0;

    if (sp && st) {
      P.forEach(function(p, i) {
        const y = 1 - (2 * (i + 0.5)) / N;
        const r = Math.sqrt(1 - y * y);
        const t = i * 2.39996;
        const x = Math.cos(t) * r;
        const z = Math.sin(t) * r;
        const d = document.createElement('div') as unknown as SphereTile;
        d.className = 'tl';
        d.style.background = p[1];
        d.style.color = p[2];
        d.innerHTML = svg(p, 34) + '<small>' + p[0].replace('Manual / Other', 'Other') + '</small>';
        d.v = [x, y, z];
        d.a = Math.atan2(x, z);
        d.b = Math.asin(y);
        sp.appendChild(d);
        T.push(d);
      });

      function sizeSphere() {
        if (!st) return;
        const availableR = Math.min(st.clientWidth * 0.44, st.clientHeight * 0.46, 275);
        R = Math.max(185, Math.round(availableR));
        T.forEach(function(d) {
          d.style.transform = 'rotateY(' + d.a + 'rad) rotateX(' + d.b + 'rad) translateZ(' + R + 'px)';
        });
      }
      sizeSphere();
      window.addEventListener('resize', sizeSphere);
      const coreEl = sp.querySelector('.core') as HTMLElement | null;

      function fr() {
        if (!sp) return;
        if (!drag) ry += vy;
        sp.style.transform = 'rotateX(' + rx + 'rad) rotateY(' + ry + 'rad)';
        if (coreEl) {
          coreEl.style.transform = 'rotateY(' + -ry + 'rad) rotateX(' + -rx + 'rad)';
        }
        const cy = Math.cos(ry);
        const sy = Math.sin(ry);
        const cx = Math.cos(rx);
        const sx = Math.sin(rx);
        T.forEach(function(d) {
          const v = d.v;
          const z1 = -v[0] * sy + v[2] * cy;
          const z2 = -v[1] * sx + z1 * cx;
          d.style.opacity = String(0.3 + (0.7 * (z2 + 1)) / 2);
        });
        sphereRafId = requestAnimationFrame(fr);
      }
      sphereRafId = requestAnimationFrame(fr);

      const handlePointerDown = (e: PointerEvent) => {
        drag = 1;
        lx = e.clientX;
        ly = e.clientY;
      };
      const handlePointerUp = () => {
        drag = 0;
      };
      const handlePointerMove = (e: MouseEvent) => {
        if (!drag) return;
        ry += (e.clientX - lx) * 0.01;
        rx = Math.max(-1, Math.min(1, rx - (e.clientY - ly) * 0.006));
        lx = e.clientX;
        ly = e.clientY;
      };

      st.addEventListener('pointerdown', handlePointerDown);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointermove', handlePointerMove);
    }

    // Publish everywhere demo click
    let busy = 0;
    const pubBtn = $('#pub');
    const stt = $('#st');
    if (pubBtn && stt) {
      pubBtn.onclick = function() {
        if (busy) return;
        busy = 1;
        let c = 0;
        vy = 0.03;
        stt.innerHTML = 'Publishing <b id="pc">0</b>/' + N + ' …';

        T.forEach(function(d, i) {
          setTimeout(function() {
            d.classList.add('ok');
            const pc = $('#pc');
            if (pc) pc.textContent = String(++c);
            if (c === N) {
              vy = 0.004;
              stt.innerHTML = '✓ Live on <b>' + N + ' platforms</b> · 1 link · 1 click';
            }
          }, i * 90);
        });

        setTimeout(function() {
          T.forEach(function(d) {
            d.classList.remove('ok');
          });
          stt.innerHTML = 'Ready · <b>' + N + ' platforms</b> connected';
          busy = 0;
        }, N * 90 + 3200);
      };
    }

    // Animated platform counter (0 -> 30)
    let n1Count = 0;
    const n1 = $('#n1');
    const c1 = setInterval(function() {
      if (!n1) return;
      n1.textContent = String(++n1Count);
      if (n1Count >= N) clearInterval(c1);
    }, 40);

    // Profile subdomain cycling
    const names = ['yourname', 'pixenox', 'acme', 'studio'];
    let ni = 0;
    const nmEl = $('#nm');
    const nameInterval = setInterval(function() {
      ni = (ni + 1) % 4;
      if (nmEl) nmEl.textContent = names[ni];
    }, 2200);

    // 3D Phone Deck cycling & tilt
    const cds = $$('.cd');
    const tbBtns = $$('#tabs button[data-i]');
    const cps = [
      'Instagram · Visual narrative · 2,200 chars',
      'LinkedIn · Professional authority · 3,000 chars'
    ];
    let act = 0;
    let deckHov = 0;
    const dk = $('#deck');
    const cap = $('#cap');

    function setDeck(a: number) {
      act = a;
      const total = cds.length;
      cds.forEach(function(c, i) {
        if (total === 2) {
          const p = i === a ? 0 : (i === 1 ? 1 : -1);
          c.style.setProperty('--p', String(p));
          c.style.setProperty('--a', String(Math.abs(p)));
          c.style.zIndex = i === a ? '3' : '1';
          c.classList.toggle('cur', i === a);
        } else {
          const d = (i - a + total) % total;
          const p = d === 0 ? 0 : d === 1 ? 1 : -1;
          c.style.setProperty('--p', String(p));
          c.style.setProperty('--a', String(Math.abs(p)));
          c.style.zIndex = d === 0 ? '3' : '1';
          c.classList.toggle('cur', d === 0);
        }
      });
      tbBtns.forEach(function(b, i) {
        b.classList.toggle('on', i === a);
      });
      if (cap && cps[a]) cap.textContent = cps[a];
    }

    cds.forEach(function(c, i) {
      c.onclick = function() {
        setDeck(i);
      };
    });
    tbBtns.forEach(function(b, i) {
      b.onclick = function() {
        setDeck(i);
      };
    });
    setDeck(0);

    if (dk) {
      dk.onmouseenter = function() {
        deckHov = 1;
      };
      dk.onmouseleave = function() {
        deckHov = 0;
        dk.style.setProperty('--tx', '0');
        dk.style.setProperty('--ty', '0');
      };
      dk.addEventListener('mousemove', function(e) {
        const r = dk.getBoundingClientRect();
        dk.style.setProperty('--tx', String(((e.clientX - r.left) / r.width - 0.5) * 18));
        dk.style.setProperty('--ty', String(-((e.clientY - r.top) / r.height - 0.5) * 10));
      });
    }

    const deckInterval = setInterval(function() {
      if (!deckHov && cds.length > 0) setDeck((act + 1) % cds.length);
    }, 5000);

    // Smart Scheduling Calendar dots
    const cal = $('#cal');
    if (cal) {
      let hh = '';
      for (let i = 0; i < 28; i++) {
        hh += '<i class="' + (i % 5 === 2 ? 'f' : '') + (i === 17 ? ' h' : '') + '"></i>';
      }
      cal.innerHTML = hh;
    }

    // Human in the loop Approve toggle
    const ap = $('#ap');
    if (ap) {
      ap.onclick = function() {
        ap.classList.toggle('on');
        ap.textContent = ap.classList.contains('on') ? 'Approved ✓' : 'Approve';
      };
    }

    // Card hover spotlight tracking (tilt/rotation removed)
    function tilt(el: HTMLElement, m: number, w?: HTMLElement) {
      const targetWrap = w || el;
      targetWrap.addEventListener('mousemove', function(e) {
        const r = targetWrap.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        // Tilt/rotation removed: keep only spotlight coordinate tracking
        el.style.setProperty('--mx', (x + 0.5) * r.width + 'px');
        el.style.setProperty('--my', (y + 0.5) * r.height + 'px');
      });
      targetWrap.addEventListener('mouseleave', function() {
        // Transform reset removed
      });
    }

    $$('.bt:not(.ua-bento-card)').forEach(function(e) {
      tilt(e, 8);
    });
    $$('.pc').forEach(function(e) {
      tilt(e, 12);
    });
    const pf = $('#pf');
    const pst = $('#pst');
    if (pf && pst) tilt(pf, 34, pst);

    // Reveal on scroll
    const io = new IntersectionObserver(
      function(es) {
        es.forEach(function(e) {
          if (e.isIntersecting) e.target.classList.add('in');
        });
      },
      { threshold: 0.15 }
    );
    $$('.rv').forEach(function(e) {
      io.observe(e);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(c1);
      clearInterval(nameInterval);
      clearInterval(deckInterval);
      cancelAnimationFrame(sphereRafId);
      cancelAnimationFrame(streamRafId);
      io.disconnect();
    };
  }, []);

  return (
    <div className="unool-home-page" ref={rootRef}>
      <div id="bar"></div>

      {/* Navigation */}
      <nav id="nav">
        <div className="ni">
          <Link
            href="#overview"
            className="lg"
            aria-label="UNOOL Home"
            onClick={(e) => scrollToSection(e, '#overview')}
          >
            <img src="/unool-logo-white.png" alt="UNOOL" className="lg-img" />
          </Link>
          <div className="nl">
            <a
              href="#overview"
              className={activeSection === 'overview' ? 'active' : ''}
              onClick={(e) => scrollToSection(e, '#overview')}
            >
              Overview
            </a>
            <a
              href="#voices"
              className={activeSection === 'voices' ? 'active' : ''}
              onClick={(e) => scrollToSection(e, '#voices')}
            >
              Platforms
            </a>
            <a
              href="#features"
              className={activeSection === 'features' ? 'active' : ''}
              onClick={(e) => scrollToSection(e, '#features')}
            >
              Features
            </a>
            <a
              href="#profile"
              className={activeSection === 'profile' ? 'active' : ''}
              onClick={(e) => scrollToSection(e, '#profile')}
            >
              Profiles
            </a>
            <a
              href="#analytics"
              className={activeSection === 'analytics' ? 'active' : ''}
              onClick={(e) => scrollToSection(e, '#analytics')}
            >
              Analytics
            </a>
            <a
              href="#pricing"
              className={activeSection === 'pricing' ? 'active' : ''}
              onClick={(e) => scrollToSection(e, '#pricing')}
            >
              Pricing
            </a>
          </div>
          <div className="nr">
            <Link href="/signin">Log in</Link>
            <Link className="btn" href="/signup">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <div className="dark">
        {/* Hero Section */}
        <section id="overview">
          <div className="hero-content">
            <div className="hero-pill-badge">
              <span className="hero-pill-sparkle">✦</span>
              <span className="hero-pill-tag">Unified Social Engine</span>
              <span className="hero-pill-sep">·</span>
              <span className="hero-pill-text">30+ Channels Sync Live</span>
              <span className="hero-pill-arrow">→</span>
            </div>
            <h1 className="d">
              <span>
                <s style={{ '--i': 1 } as React.CSSProperties}>One</s>{' '}
                <s style={{ '--i': 2 } as React.CSSProperties}>link.</s>
              </span>
              <span>
                <em>
                  <s style={{ '--i': 3 } as React.CSSProperties}>One</s>{' '}
                  <s style={{ '--i': 4 } as React.CSSProperties}>click.</s>
                </em>
              </span>
              <span>
                <s style={{ '--i': 5 } as React.CSSProperties}>Everywhere.</s>
              </span>
            </h1>
            <p className="sub">
              Unool is your social media command center. Paste a single link and we build your profile,
              write platform-native posts, and publish to LinkedIn, X, Instagram, YouTube, Discord and
              30+ more — in one click.
            </p>
            <div className="go">
              <input
                id="url"
                value="https://yourname.unool.co"
                readOnly
                aria-label="Your link"
                style={{ cursor: 'default' }}
              />
              <button className="btn" id="pub">
                Publish everywhere →
              </button>
            </div>
            <div id="st">
              <span className="st-pulse-dot"></span>
              <span>Ready · <b>30 platforms</b> connected live</span>
            </div>
            <div className="stats">
              <div className="stat-card">
                <div className="stat-val"><span id="n1">0</span>+</div>
                <div className="stat-lbl">Platforms</div>
              </div>
              <div className="stat-card">
                <div className="stat-val">1</div>
                <div className="stat-lbl">Link</div>
              </div>
              <div className="stat-card">
                <div className="stat-val">1</div>
                <div className="stat-lbl">Click</div>
              </div>
              <div className="stat-card">
                <div className="stat-val">30s</div>
                <div className="stat-lbl">Setup</div>
              </div>
            </div>
          </div>

          <div className="stage" id="stage" ref={stageRef}>
            <div className="sp" id="sp" ref={spRef}>
              <div className="core">
                <img src="/unool-icon.png" alt="UNOOL" className="core-img" />
              </div>
            </div>
          </div>
        </section>

        {/* Diagonal Marquee Ticker Bands */}
        <div className="bands">
          <div className="bd a">
            <div id="m1"></div>
          </div>
          <div className="bd b">
            <div id="m2"></div>
          </div>
        </div>

        {/* Platform Voices Section */}
        <section id="voices">
          <h2 className="d rv">
            One thought. <em>Every voice.</em>
          </h2>
          <p className="sub rv" style={{ margin: '24px auto 0' }}>
            Unool adapts your content to each platform’s native format, tone, and limits. Here are just
            three examples out of 30+.
          </p>

          {/* Interactive Flow Step Switcher */}
          <div className="flow-steps-nav rv">
            <div className="flow-step-pills">
              <button
                type="button"
                className={`flow-step-pill ${flowStep === 0 ? 'active' : ''}`}
                onClick={() => { setFlowStep(0); setIsPlaying(false); }}
              >
                <span className="flow-step-num">1</span>
                <span>Connect</span>
              </button>
              <button
                type="button"
                className={`flow-step-pill ${flowStep === 1 ? 'active' : ''}`}
                onClick={() => { setFlowStep(1); setIsPlaying(false); }}
              >
                <span className="flow-step-num">2</span>
                <span>Write</span>
              </button>
              <button
                type="button"
                className={`flow-step-pill ${flowStep === 2 ? 'active' : ''}`}
                onClick={() => { setFlowStep(2); setIsPlaying(false); }}
              >
                <span className="flow-step-num">3</span>
                <span>Adapt</span>
              </button>
            </div>
          </div>

          {/* macOS Browser Mockup Container for Steps 1 & 2 */}
          <div className={`flow-browser-window rv ${flowStep === 2 ? 'flow-hidden' : ''}`}>
            <div className="flow-browser-topbar">
              <div className="flow-window-dots">
                <span className="flow-window-dot red"></span>
                <span className="flow-window-dot yellow"></span>
                <span className="flow-window-dot green"></span>
              </div>
              <div className="flow-url-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>app.unool.co/automation</span>
              </div>
              <div className="flow-browser-subnav">
                <span className={`flow-subnav-tab ${flowStep === 1 ? 'active' : ''}`} onClick={() => setFlowStep(1)}>
                  Compose
                </span>
                <span className="flow-subnav-tab" onClick={() => setFlowStep(0)}>
                  Accounts
                </span>
                <span className="flow-subnav-tab" onClick={() => setFlowStep(2)}>
                  Previews
                </span>
              </div>
              <div className="flow-live-badge">
                <span className="flow-live-dot"></span>
                <span>LIVE DEMO</span>
              </div>
            </div>

            {/* STEP 1: Connect your accounts */}
            {flowStep === 0 && (
              <div className="flow-step-connect">
                <h3 className="flow-step-title">Connect your accounts</h3>
                <p className="flow-step-subtitle">
                  Connect your business and personal channels once. Unool handles native formatting, tone, and character limits automatically.
                </p>

                <div className="flow-account-grid">
                  {/* Instagram Card */}
                  <div className={`flow-account-card ${connectedAccounts.instagram ? 'connected' : ''}`}>
                    <div className="flow-account-header">
                      <div className="flow-account-icon ig-gradient">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff">
                          <path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/>
                        </svg>
                      </div>
                      <div className="flow-account-info">
                        <span className="flow-account-name">Instagram</span>
                        <span className="flow-account-sub">Business or creator account</span>
                      </div>
                    </div>
                    <div className="flow-account-status">
                      {connectedAccounts.instagram ? (
                        <span className="status-connected">✓ Connected as @pixenox</span>
                      ) : (
                        <span className="status-idle">Not connected</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className={`flow-connect-btn ${isInstagramConnecting ? 'connecting' : ''} ${connectedAccounts.instagram ? 'connected' : ''}`}
                      onClick={handleConnectInstagram}
                    >
                      {isInstagramConnecting ? (
                        <>
                          <span className="flow-spinner"></span>
                          <span>Connecting...</span>
                        </>
                      ) : connectedAccounts.instagram ? (
                        <>
                          <span>✓ Connected</span>
                        </>
                      ) : (
                        <span>Connect Instagram</span>
                      )}
                    </button>
                  </div>

                  {/* LinkedIn Card */}
                  <div className={`flow-account-card ${connectedAccounts.linkedin ? 'connected' : ''}`}>
                    <div className="flow-account-header">
                      <div className="flow-account-icon li-blue">
                        <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </div>
                      <div className="flow-account-info">
                        <span className="flow-account-name">LinkedIn</span>
                        <span className="flow-account-sub">Personal profile or Page</span>
                      </div>
                    </div>
                    <div className="flow-account-status">
                      {connectedAccounts.linkedin ? (
                        <span className="status-connected">✓ Connected as Pixenox</span>
                      ) : (
                        <span className="status-idle">Not connected</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className={`flow-connect-btn li-btn ${isLinkedInConnecting ? 'connecting' : ''} ${connectedAccounts.linkedin ? 'connected' : ''}`}
                      onClick={handleConnectLinkedIn}
                    >
                      {isLinkedInConnecting ? (
                        <>
                          <span className="flow-spinner"></span>
                          <span>Connecting...</span>
                        </>
                      ) : connectedAccounts.linkedin ? (
                        <>
                          <span>✓ Connected</span>
                        </>
                      ) : (
                        <span>Connect LinkedIn</span>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flow-step-actions">
                  <button
                    type="button"
                    className="flow-next-btn"
                    onClick={() => setFlowStep(1)}
                  >
                    <span>Next: Write the post</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Writing the post */}
            {flowStep === 1 && (
              <div className="flow-step-write">
                <div className="flow-post-container">
                  <span className="flow-post-label">NEW POST</span>

                  {/* Attached Media */}
                  <div className="flow-media-card">
                    <img
                      src="/linen-wrap-dress.jpg"
                      alt="linen-wrap-dress.jpg"
                      className="flow-media-thumb"
                    />
                    <div className="flow-media-meta">
                      <span className="flow-media-filename">linen-wrap-dress.jpg</span>
                      <span className="flow-media-specs">1080 × 1350 · attached</span>
                    </div>
                    <span className="flow-media-badge">Attached</span>
                  </div>

                  {/* Post Draft Box (Linen Wrap Dress) */}
                  <div className="flow-draft-box">
                    <p className="flow-draft-content">
                      Meet the Linen Wrap Dress 🌿 Hand-woven terracotta, made for warm days. Sizes XS–XL. First 50 pieces: 20% off this week.
                    </p>
                  </div>

                  {/* Platform Indicator */}
                  <div className="flow-destinations-bar">
                    <div className="flow-platform-chips">
                      <span className="chip ig-gradient">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="#fff"><path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839"/></svg>
                      </span>
                      <span className="chip li-blue">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="#fff"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      </span>
                    </div>
                    <span className="flow-destinations-text">Posting to both</span>
                  </div>

                  {/* Adapt Action Button */}
                  <button
                    type="button"
                    className={`flow-adapt-cta ${isAdapted ? 'adapted' : ''}`}
                    onClick={handleAdapt}
                  >
                    {isAdapted ? (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>✓ Adapted for both</span>
                      </>
                    ) : (
                      <>
                        <span>⚡ Adapt for both</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: Phone Deck (Mobile View in Original Respective Platforms) */}
          <div className={`flow-adapt-stage rv ${flowStep !== 2 ? 'flow-hidden' : ''}`}>
            <div className="deck" id="deck">
              <div className="cd ig"></div>
              <div className="cd li"></div>
            </div>

            <div className="tabs" id="tabs">
              <button className="on" data-i="0">
                Instagram
              </button>
              <button data-i="1">LinkedIn</button>
            </div>
            <p id="cap">Instagram · Visual narrative · 2,200 chars</p>
          </div>
        </section>
      </div>

      {/* Features Bento Grid */}
      <section id="features">
        <h2 className="d rv">
          Everything flows. <em>Nothing breaks.</em>
        </h2>
        <div className="bento" id="bento">
          <div className="bt w12 dk rv">
            <div className="ib">✕</div>
            <h3>Multi-Network Composer</h3>
            <p>Write once. Adapted to every platform’s limits, formatting and best practices.</p>
            <div className="chips" id="chips"></div>
          </div>

          <div className="bt rv">
            <div className="ib">✓</div>
            <h3>Human-in-the-Loop</h3>
            <p>AI drafts. You approve. Nothing posts without your click.</p>
            <div className="ab">
              <button className="ap" id="ap">
                Approve
              </button>
              <button>Edit</button>
            </div>
          </div>

          <div className="bt w8 rv ua-bento-card">
            <BentoVideoPlayer />
          </div>

          {/* Video 3: Automate Comments & DMs (Added right after Image 2) */}
          <div className="bt w12 rv ua-bento-card ua-automation-card" style={{ padding: 0 }}>
            <AutomationVideoPlayer />
          </div>

        </div>
      </section>

      {/* Profile Section */}
      <section id="profile">
        <h2 className="d rv">
          Your entire professional story. <em>One beautiful URL.</em>
        </h2>
        <p className="lead rv">
          Paste your LinkedIn, portfolio, or GitHub. Unool builds a stunning profile at{' '}
          <b>yourname.unool.co</b> in under 30 seconds.
        </p>
        <div className="split">
          <div className="pst" id="pst">
            {/* Authentic Unool Phone Frame */}
            <div className="pf" id="pf">
              {/* Dynamic Island Pill */}
              <div className="pf-notch">
                <span className="pf-notch-lens"></span>
                <span className="pf-notch-sensor"></span>
              </div>

              {/* Status bar */}
              <div className="pf-status" style={{ color: currentTpl.appBarColor }}>
                <span>9:41</span>
                <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <svg width="13" height="9" viewBox="0 0 17 11" fill="currentColor">
                    <rect y="7" width="3" height="4" rx=".8" />
                    <rect x="4.6" y="5" width="3" height="6" rx=".8" />
                    <rect x="9.2" y="2.5" width="3" height="8.5" rx=".8" />
                    <rect x="13.8" width="3" height="11" rx=".8" />
                  </svg>
                  <svg width="12" height="9" viewBox="0 0 16 11" fill="currentColor">
                    <path d="M8 10.4l2-2.1a2.9 2.9 0 00-4 0zM3.7 6a6 6 0 018.6 0l1.2-1.3a7.8 7.8 0 00-11 0zM.8 3A10.2 10.2 0 0115.2 3L16 1.8a11.7 11.7 0 00-16 0z" />
                  </svg>
                  <svg width="18" height="9" viewBox="0 0 25 12" fill="currentColor">
                    <rect x=".5" y=".5" width="21" height="11" rx="3.5" fill="none" stroke="currentColor" opacity=".5" />
                    <rect x="2" y="2" width="16" height="8" rx="2" />
                    <path d="M23 4v4c.8-.3 1.5-1 1.5-2s-.7-1.7-1.5-2z" opacity=".6" />
                  </svg>
                </span>
              </div>

              {/* Top App bar */}
              <div className="pf-appbar" style={{ color: currentTpl.appBarColor }}>
                <span style={{ cursor: 'pointer', fontSize: '18px' }}>☰</span>
                <div className="brand">
                  unool<span>.</span>
                </div>
                <span>😎</span>
              </div>

              {/* Scrollable Screen Body */}
              <div
                className="pf-screen"
                style={{
                  background: currentTpl.screenBg,
                  color: currentTpl.textColor,
                }}
              >
                {/* Avatar with verified badge */}
                <div className="pf-avatar-wrap">
                  <div
                    className="pf-avatar"
                    style={{
                      background: currentTpl.avatarBg,
                    }}
                  >
                    {currentTpl.avatarText}
                  </div>
                  <span className="pf-badge-verified" title="Verified Unool Profile">
                    ✓
                  </span>
                </div>

                {/* Profile Name & Subtitle */}
                <h4 className="pf-name">Pixenox</h4>
                <div className="pf-role" style={{ color: currentTpl.subtextColor }}>
                  {currentTpl.role}
                </div>

                {/* Proof Points Grid (Original Unool feature) */}
                <div className="pf-proofs">
                  {currentTpl.proofs.map((pr, pIdx) => (
                    <div
                      key={pIdx}
                      className="pf-proof-item"
                      style={{
                        background: currentTpl.proofBg,
                        border: currentTpl.proofBorder,
                      }}
                    >
                      <span className="pf-proof-val" style={{ color: currentTpl.proofValColor }}>
                        {pr.val}
                      </span>
                      <span className="pf-proof-lbl" style={{ color: currentTpl.proofLblColor }}>
                        {pr.lbl}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bio / Quote Box */}
                {currentTpl.bio && (
                  <div
                    className="pf-bio"
                    style={{
                      background: currentTpl.proofBg,
                      color: currentTpl.subtextColor,
                    }}
                  >
                    {currentTpl.bio}
                  </div>
                )}

                {/* Authentic Link Cards */}
                <div className="pf-links">
                  {currentTpl.links.map((lk, lIdx) => (
                    <div
                      key={lIdx}
                      className="pf-link-card"
                      style={{
                        background: currentTpl.linkBg,
                        border: currentTpl.linkBorder,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = currentTpl.linkHoverBorder;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = currentTpl.linkBorder.replace('1px solid ', '');
                      }}
                    >
                      <i
                        className="pf-link-icon"
                        style={{
                          background: lk.iconBg,
                          color: lk.iconFg,
                        }}
                        dangerouslySetInnerHTML={{
                          __html: `<svg viewBox="0 0 24 24" width="16" height="16" fill="${lk.iconFg}">${lk.iconSvg}</svg>`,
                        }}
                      />
                      <div className="pf-link-info">
                        <span className="pf-link-title" style={{ color: currentTpl.linkTitleColor }}>
                          {lk.title}
                        </span>
                        <span className="pf-link-sub" style={{ color: currentTpl.linkSubColor }}>
                          {lk.subtitle}
                        </span>
                      </div>
                      <span className="pf-link-arrow" style={{ color: currentTpl.color }}>
                        →
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rv">
            <h3 className="d">
              Every link. <em>One home.</em>
            </h3>
            <p className="lead" style={{ margin: 0 }}>
              Automated storytelling across every network you use. Customizable, instantly shareable — pick
              a theme and watch it change live.
            </p>

            {/* Template Swatches matching Image 2 */}
            <div className="sw" id="sw" style={{ marginTop: '24px' }}>
              {PROFILE_PREVIEW_TEMPLATES.map((tpl, i) => (
                <button
                  key={tpl.id}
                  className={activeProfileTpl === i ? 'on' : ''}
                  style={{ background: tpl.color }}
                  data-c={tpl.color}
                  title={`${tpl.name} (${tpl.category})`}
                  aria-label={tpl.name}
                  onClick={() => {
                    setActiveProfileTpl(i);
                    if (rootRef.current) {
                      rootRef.current.style.setProperty('--acc', tpl.color);
                    }
                  }}
                />
              ))}
            </div>

            <Link className="btn" href="/signup">
              Get started →
            </Link>
          </div>
        </div>

        {/* Analytics & Insights — placed after Every link. One home. */}
        <div
          id="analytics"
          className="an-wrap"
          style={{
            maxWidth: '1100px',
            margin: '80px auto 0',
            textAlign: 'left',
            perspective: '1400px',
          }}
        >
          <div className="bt w12 dk an rv">
            <div>
              <div className="ib">↗</div>
              <h3>Analytics &amp; Insights</h3>
              <p>
                Track engagement across all platforms in one dashboard. Understand what resonates. Grow
                intelligently.
              </p>
              <div className="kp">
                <div>
                  <b id="rk">—</b>
                  <small>Reach · 14 days</small>
                </div>
                <div>
                  <b>6.9%</b>
                  <small>Engagement</small>
                </div>
                <div>
                  <b>Tue 9:40</b>
                  <small>Best time</small>
                </div>
              </div>
              <div className="lgd" id="lgd"></div>
            </div>
            <div className="strm" id="strm" ref={stmRef}>
              <div className="tip" id="tip" ref={tipRef}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing">
        <div className="pricing-header-wrap">
          <h2 className="d rv">
            Start free. <em>Scale when you’re ready.</em>
          </h2>
          <div className="pricing-sublink rv">
            <Link href="/pricing">
              Compare all 4 plans &amp; full features (including Studio for agencies) →
            </Link>
          </div>
        </div>
        <div className="pl">
          {/* Spark (Free) */}
          <div className="pc rv">
            <h3>Spark</h3>
            <div className="for">Perfect for solo creators &amp; founders</div>
            <div className="pr">
              {getPriceById('spark')?.monthlyInr ?? '$0'}<small>/mo (Free forever)</small>
            </div>
            <ul>
              <li>1 profile at yourname.unool.co</li>
              <li>15 scheduled posts/month</li>
              <li>2 connected platforms</li>
              <li>5 persona templates</li>
              <li>Follow-to-Unlock gates</li>
              <li>250 automated IG comments/mo</li>
            </ul>
            <Link className="btn" href="/signup">
              Get Started Free
            </Link>
          </div>

          {/* Creator */}
          <div className="pc rv">
            <h3>Creator</h3>
            <div className="for">For growing creators &amp; personal brands</div>
            <div className="pr">
              {getPriceById('creator')?.monthlyInr ?? '₹799'}<small>/mo</small>
            </div>
            <ul>
              <li>Everything in Spark, plus:</li>
              <li>Unlimited posts/month</li>
              <li>4 connected platforms</li>
              <li>All 16 persona templates</li>
              <li>No "Made with Unool" badge</li>
              <li>Basic DM Concierge &amp; 90-day analytics</li>
            </ul>
            <Link className="btn" href="/signup?plan=creator">
              Start 14-day trial
            </Link>
          </div>

          {/* Pro */}
          <div className="pc pro rv">
            <div className="pc-badge">Most Popular</div>
            <h3>Pro</h3>
            <div className="for">The full engine for serious creators &amp; teams</div>
            <div className="pr">
              {getPriceById('pro')?.monthlyInr ?? '₹1,999'}<small>/mo</small>
            </div>
            <ul>
              <li>Everything in Creator, plus:</li>
              <li>8 connected platforms</li>
              <li>Custom domain (yourdomain.com)</li>
              <li>Full DM Concierge + Knowledge Base</li>
              <li>FlightPlan AI &amp; Lead Scoring</li>
              <li>3 team seats &amp; priority support</li>
            </ul>
            <Link className="btn" href="/signup?plan=pro">
              Get Pro →
            </Link>
          </div>

          {/* Studio (Agency) */}
          <div className="pc studio rv">
            <div className="pc-badge" style={{ background: '#8b5cf6', boxShadow: '0 4px 12px rgba(139, 92, 246, .35)' }}>
              Agency
            </div>
            <h3>Studio</h3>
            <div className="for">For agencies &amp; teams</div>
            <div className="pr">
              {getPriceById('studio')?.monthlyInr ?? '₹4,166'}<small>/mo</small>
            </div>
            <ul>
              <li>Everything in Pro, plus:</li>
              <li>3 workspaces (3 brands/clients)</li>
              <li>Full white-label (zero branding)</li>
              <li>Unlimited channels &amp; AI credits</li>
              <li>10 team seats + granular roles</li>
              <li>Webhook API + Zapier triggers</li>
              <li>Priority support + onboarding call</li>
            </ul>
            <Link className="btn" href="/signup?plan=studio" style={{ background: '#8b5cf6' }}>
              Start 14-day trial →
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section id="cta">
        <h2 className="d rv">
          Ready to own your
          <br />
          <em>professional presence?</em>
        </h2>
        <Link className="btn" href="/signup" style={{ padding: '20px 40px', fontSize: '18px' }}>
          Get Started Free
        </Link>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-inner">
          <div className="footer-brand">
            <Link
              href="#overview"
              className="lg"
              aria-label="UNOOL Home"
              onClick={(e) => scrollToSection(e, '#overview')}
            >
              <img src="/unool-logo.png" alt="UNOOL" className="lg-img" />
            </Link>
            <p className="footer-legal-text">
              Unool is a personal branding and publishing platform owned and operated by{' '}
              <a href="https://www.pixenox.com" target="_blank" rel="noopener noreferrer">
                Pixenox Solutions
              </a>
              . Built to help founders, creators, and teams own their professional narrative.
            </p>
            <p className="footer-legal-text" style={{ fontSize: '12px', marginTop: '6px', opacity: 0.8 }}>
              Corporate Portal:{' '}
              <a href="https://www.pixenox.com" target="_blank" rel="noopener noreferrer">
                www.pixenox.com
              </a>{' '}
              · Prathipadu, Kakinada District, Andhra Pradesh, India
            </p>
          </div>

          <div className="footer-links-group">
            <span className="footer-heading">Legal &amp; Policies</span>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/refund">Refund &amp; Cancellation</Link>
            <Link href="/shipping">Shipping &amp; Delivery</Link>
          </div>

          <div className="footer-links-group">
            <span className="footer-heading">Support &amp; Contact</span>
            <Link href="/contact">Contact Us</Link>
            <a href="mailto:connect@pixenox.com">connect@pixenox.com</a>
            <a href="mailto:support@unool.co">support@unool.co</a>
            <span style={{ fontSize: '12px', color: 'var(--mut)', marginTop: '4px' }}>
              Support Hours: Mon-Fri 9AM-6PM IST
            </span>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} Pixenox Solutions. All rights reserved.</span>
          <span>Unool &trade; is a registered trademark of Pixenox Solutions.</span>
        </div>
      </footer>
    </div>
  );
}
