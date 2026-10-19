'use client';

import React, { useState, useRef, useEffect, useCallback, Suspense, KeyboardEvent, ClipboardEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import './signin.css';

const UNOOL_LOGO_BASE64 = 'data:image/png;base64,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';

const NAMES = ['LinkedIn', 'Instagram', 'Bluesky', 'Facebook', 'YouTube', 'Slack'];
const PM: Record<string, string[]> = {
  LinkedIn: ['Like', 'Comment', 'Repost', 'Send'],
  Instagram: ['♡', 'Comment', 'Share', 'Save'],
  Bluesky: ['Reply', 'Repost', 'Like'],
  Facebook: ['Like', 'Comment', 'Share'],
  YouTube: ['Like', 'Share', 'Subscribe'],
  Slack: ['🔥 3', '✅ 2', 'Reply']
};
const LIM: Record<string, number> = {
  LinkedIn: 3000,
  Instagram: 2200,
  Bluesky: 300,
  Facebook: 5000,
  YouTube: 100,
  Slack: 4000
};
const IDEAS = [
  'coffee shop opens saturday, free cold brew for first 50',
  'just hit 10k subscribers!! thank you all',
  'hiring a designer, remote ok, apply by friday',
  'new blog post: how i saved 5 hours a week',
  'webinar tuesday 6pm, free spots, bring questions'
];

function clean(x: string) {
  const s = x.replace(/\s+/g, ' ').replace(/([!?.])\1+/g, '$1').trim() || 'something new is coming';
  return (s[0].toUpperCase() + s.slice(1)).replace(/[.!?]+$/, '');
}

function tags(x: string, n: number) {
  const w = x.toLowerCase().match(/[a-z]{5,}/g) || ['update'];
  return w.filter((a, i) => w.indexOf(a) === i).slice(0, n).map(a => '#' + a).join(' ');
}

function build(x: string): Record<string, string> {
  const c = clean(x);
  return {
    LinkedIn: 'Excited to share: ' + c + '.\n\nHere’s what it means for you, and why it matters now.\n\n' + tags(x, 2),
    Instagram: c + ' ✨\n\nSave this for later.\n\n' + tags(x, 3),
    Bluesky: (c.length > 180 ? c.slice(0, 177) + '…' : c) + '.',
    Facebook: 'Big news! ' + c + '. Tell us what you think below 👇',
    YouTube: c.replace(/\b\w/g, m => m.toUpperCase()) + ' | Full breakdown',
    Slack: '*Heads up:* ' + c + '. Thread below for details.'
  };
}

function fmt(t: string) {
  return t
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/\*(.+?)\*/g, '<b>$1</b>')
    .replace(/(#\w+)/g, '<span class="ht">$1</span>');
}

function SignInComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Auth States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [stage, setStage] = useState<'form' | 'otp'>('form');
  const [busy, setBusy] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState(
    searchParams.get('error') ? decodeURIComponent(searchParams.get('error')!) : ''
  );

  // OTP States
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(0);
  const [nextResendAt, setNextResendAt] = useState<string>();
  const [resendLoading, setResendLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Interactive Scene States
  const [rawText, setRawText] = useState('new app drops friday!! 3 features, make it hype');
  const [curPlatformIndex, setCurPlatformIndex] = useState(0);
  const [ideaIndex, setIdeaIndex] = useState(0);

  // DOM Refs
  const rootRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const thRef = useRef<SVGSVGElement>(null);
  const mgRef = useRef<HTMLDivElement>(null);
  const cookRef = useRef<HTMLDivElement>(null);
  const fcRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLParagraphElement>(null);
  const msRef = useRef<HTMLSpanElement>(null);
  const stampRef = useRef<HTMLSpanElement>(null);
  const tagRef = useRef<HTMLSpanElement>(null);
  const stRef = useRef<HTMLParagraphElement>(null);
  const goBtnRef = useRef<HTMLButtonElement>(null);

  const pathsRef = useRef<SVGPathElement[]>([]);
  const sparksRef = useRef<SVGPathElement[]>([]);
  const tilesRef = useRef<HTMLDivElement[]>([]);
  const animTimersRef = useRef<NodeJS.Timeout[]>([]);
  const scrambleRafRef = useRef<number>(0);
  const loopRafRef = useRef<number>(0);

  // Current calculated versions
  const versionsRef = useRef<Record<string, string>>(build(rawText));

  // Cooldown timer for OTP
  useEffect(() => {
    if (!nextResendAt) return;
    const diff = Math.ceil((new Date(nextResendAt).getTime() - Date.now()) / 1000);
    if (diff > 0) setCooldown(Math.min(diff, 60));
  }, [nextResendAt]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const wide = useCallback(() => typeof window !== 'undefined' && window.innerWidth > 960, []);

  const R = useCallback((el: HTMLElement) => {
    if (!wrapRef.current) return { x: 0, y: 0, w: 0, h: 0 };
    const r = el.getBoundingClientRect();
    const w = wrapRef.current.getBoundingClientRect();
    return { x: r.left - w.left, y: r.top - w.top, w: r.width, h: r.height };
  }, []);

  const C_curve = (a: number, b: number, c: number, d: number) => {
    const k = Math.abs(c - a) * 0.5;
    return 'M' + a + ' ' + b + 'C' + (a + k) + ' ' + b + ' ' + (c - k) + ' ' + d + ' ' + c + ' ' + d;
  };

  const draw = useCallback(() => {
    if (!wide() || !cookRef.current || !fcRef.current || pathsRef.current.length < 8) return;
    const L = R(cookRef.current);
    const F = R(fcRef.current);
    const ly = L.y + L.h / 2;
    const fy = F.y + F.h / 2;
    if (pathsRef.current[0]) {
      pathsRef.current[0].setAttribute('d', C_curve(L.x + L.w, ly, F.x, fy));
    }
    tilesRef.current.forEach((t, i) => {
      if (!t || !pathsRef.current[i + 1]) return;
      const T = R(t);
      pathsRef.current[i + 1].setAttribute('d', C_curve(F.x + F.w, fy, T.x, T.y + T.h / 2));
    });
  }, [R, wide]);

  const spark = useCallback(() => {
    if (!wide() || pathsRef.current.length < 8) return;
    const t = performance.now() / 1000;
    sparksRef.current.forEach((e, i) => {
      const q = pathsRef.current[i];
      if (!q) return;
      const n = q.getTotalLength ? q.getTotalLength() : 0;
      if (!n) return;
      const isLit = q.classList.contains('lit');
      const k = (t * (isLit ? 0.5 : 0.2) + i * 0.37) % 1;
      const pt = q.getPointAtLength(k * n);
      e.setAttribute('transform', 'translate(' + pt.x + ' ' + pt.y + ') rotate(' + k * 360 + ')');
    });
  }, [wide]);

  const hitStamp = useCallback(() => {
    if (!stampRef.current) return;
    stampRef.current.classList.remove('hit');
    void stampRef.current.offsetWidth;
    stampRef.current.classList.add('hit');
  }, []);

  const scr = useCallback((t: string) => {
    if (!cvRef.current) return;
    cancelAnimationFrame(scrambleRafRef.current);
    const rm = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (rm) {
      cvRef.current.innerHTML = fmt(t);
      return;
    }
    let n = 0;
    const G = 'abcdefghijklmnopqrstuvwxyz#@*+';
    const f = () => {
      let o = '';
      for (let i = 0; i < t.length; i++) {
        o += (t[i] === ' ' || t[i] === '\n' || i < n) ? t[i] : G[(Math.random() * G.length) | 0];
      }
      if (cvRef.current) cvRef.current.textContent = o;
      n += Math.ceil(t.length / 24);
      if (n <= t.length) {
        scrambleRafRef.current = requestAnimationFrame(f);
      } else if (cvRef.current) {
        cvRef.current.innerHTML = fmt(t);
      }
    };
    f();
  }, []);

  const updateTilesPreview = useCallback(() => {
    const V = versionsRef.current;
    tilesRef.current.forEach((t, i) => {
      if (i < 6 && t && !t.classList.contains('live')) {
        const em = t.querySelector('em');
        if (em && V[NAMES[i]]) {
          em.textContent = V[NAMES[i]].replace(/\s+/g, ' ').slice(0, 28);
        }
      }
    });
  }, []);

  const show = useCallback((animateScramble?: boolean | string) => {
    const curName = NAMES[curPlatformIndex];
    const text = versionsRef.current[curName] || '';
    if (animateScramble) {
      scr(text);
    } else if (cvRef.current) {
      cvRef.current.innerHTML = fmt(text);
    }
    if (animateScramble === true) {
      hitStamp();
    }
    updateTilesPreview();
  }, [curPlatformIndex, scr, hitStamp, updateTilesPreview]);

  const feed = useCallback((text: string) => {
    const rm = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (rm || !mgRef.current) return;
    const words = text.trim().split(/\s+/).filter(Boolean).slice(0, 10);
    words.forEach((w, i) => {
      setTimeout(() => {
        if (!mgRef.current) return;
        const d = document.createElement('span');
        d.className = 'wd';
        d.textContent = w.slice(0, 12);
        mgRef.current.appendChild(d);
        const anim = d.animate([
          { transform: 'translate(' + ((Math.random() - 0.5) * 150) + 'px,-70px) rotate(' + (Math.random() * 24 - 12) + 'deg)', opacity: 1 },
          { transform: 'translate(-50%,0) scale(.2)', opacity: 0 }
        ], { duration: 650, easing: 'ease-in' });
        anim.onfinish = () => d.remove();
      }, i * 110);
    });
  }, []);

  const spew = useCallback(() => {
    const rm = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (rm || !mgRef.current) return;
    for (let k = 0; k < 6; k++) {
      ((idx) => {
        const d = document.createElement('span');
        d.className = 'sk';
        mgRef.current?.appendChild(d);
        const anim = d.animate([
          { transform: 'translate(0,0) rotate(45deg)', opacity: 1 },
          { transform: 'translate(' + ((idx - 2.5) * 22) + 'px,110px) rotate(225deg) scale(.4)', opacity: 0 }
        ], { duration: 600, delay: idx * 50, easing: 'ease-out', fill: 'backwards' });
        anim.onfinish = () => d.remove();
      })(k);
    }
  }, []);

  const cook = useCallback((anim: boolean, textValue?: string) => {
    const val = textValue !== undefined ? textValue : rawText;
    animTimersRef.current.forEach(clearTimeout);
    animTimersRef.current = [];
    versionsRef.current = build(val);

    const st = [
      'Unool is reading your vibe…',
      'Unool is tailoring it for each platform…',
      'Unool is polishing every line…',
      'Unool cooked. No notes.'
    ];

    const rm = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!anim || rm) {
      coreRef.current?.classList.add('done');
      if (msRef.current) msRef.current.textContent = st[3];
      show();
      return;
    }

    mgRef.current?.classList.add('cooking');
    cookRef.current?.classList.add('cooking');
    coreRef.current?.classList.remove('done');
    feed(val);

    st.forEach((msg, i) => {
      const tm = setTimeout(() => {
        if (msRef.current) msRef.current.textContent = msg;
        if (i === 3) {
          mgRef.current?.classList.remove('cooking');
          cookRef.current?.classList.remove('cooking');
          show(true);
          coreRef.current?.classList.add('done');
          spew();
        }
      }, i * 380);
      animTimersRef.current.push(tm);
    });
  }, [rawText, feed, spew, show]);

  // Initial SVG setup, parallax, and animation loop
  useEffect(() => {
    if (!thRef.current) return;
    const th = thRef.current;
    const NS = 'http://www.w3.org/2000/svg';

    while (th.firstChild) th.removeChild(th.firstChild);

    const newPaths: SVGPathElement[] = [];
    for (let i = 0; i < 8; i++) {
      const p = document.createElementNS(NS, 'path') as SVGPathElement;
      p.setAttribute('class', 't');
      th.appendChild(p);
      newPaths.push(p);
    }
    pathsRef.current = newPaths;

    const newSparks: SVGPathElement[] = [];
    for (let i = 0; i < 8; i++) {
      const sp = document.createElementNS(NS, 'path') as SVGPathElement;
      sp.setAttribute('d', 'M0-6L4 0 0 6-4 0Z');
      sp.setAttribute('class', 'sp');
      th.appendChild(sp);
      newSparks.push(sp);
    }
    sparksRef.current = newSparks;

    // Cache platform tiles
    if (rootRef.current) {
      tilesRef.current = Array.from(rootRef.current.querySelectorAll<HTMLDivElement>('.tl'));
    }

    // Initial cook without delay
    cook(false);

    let tx = 0, ty = 0, cx = 0, cy = 0;
    const onMouseMove = (e: MouseEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove);

    const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const loop = () => {
      cx += (tx - cx) * 0.07;
      cy += (ty - cy) * 0.07;
      if (sceneRef.current && wide() && !rm) {
        sceneRef.current.style.transform = 'rotateY(' + (cx * 7) + 'deg) rotateX(' + (-cy * 4) + 'deg)';
      }
      draw();
      spark();
      loopRafRef.current = requestAnimationFrame(loop);
    };
    loopRafRef.current = requestAnimationFrame(loop);

    // Tiles mousemove tilt
    const cleanups: (() => void)[] = [];
    tilesRef.current.forEach((t) => {
      const handleMove = (e: MouseEvent) => {
        const r = t.getBoundingClientRect();
        t.style.setProperty('--gx', (e.clientX - r.left) + 'px');
        t.style.setProperty('--gy', (e.clientY - r.top) + 'px');
        t.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 18) + 'deg');
        t.style.setProperty('--rx', (-((e.clientY - r.top) / r.height - 0.5) * 14) + 'deg');
      };
      const handleLeave = () => {
        t.style.setProperty('--rx', '0deg');
        t.style.setProperty('--ry', '0deg');
      };
      t.addEventListener('mousemove', handleMove);
      t.addEventListener('mouseleave', handleLeave);
      cleanups.push(() => {
        t.removeEventListener('mousemove', handleMove);
        t.removeEventListener('mouseleave', handleLeave);
      });
    });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(loopRafRef.current);
      cancelAnimationFrame(scrambleRafRef.current);
      cleanups.forEach(c => c());
      animTimersRef.current.forEach(clearTimeout);
    };
  }, [draw, spark, cook, wide]);

  // Handle Surprise Me click
  const handleSurpriseMe = () => {
    const nextIdea = IDEAS[ideaIndex % IDEAS.length];
    setIdeaIndex(prev => prev + 1);
    setRawText(nextIdea);
    cook(true, nextIdea);
  };

  // Launch / Blast Animation on completion
  const burst = (i: number) => {
    const rm = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (rm || !wide() || !wrapRef.current) return;
    const tile = tilesRef.current[i];
    if (!tile) return;
    const q = R(tile);
    const x = q.x + q.w / 2;
    const y = q.y + q.h / 2;
    for (let k = 0; k < 8; k++) {
      ((a, m) => {
        if (!wrapRef.current) return;
        const d = document.createElement('div');
        d.className = 'cf';
        wrapRef.current.appendChild(d);
        const anim = d.animate([
          { transform: 'translate(' + x + 'px,' + y + 'px) rotate(45deg)', opacity: 1 },
          { transform: 'translate(' + (x + Math.cos(a) * m) + 'px,' + (y + Math.sin(a) * m) + 'px) rotate(225deg) scale(0)', opacity: 0 }
        ], { duration: 750, easing: 'ease-out' });
        anim.onfinish = () => d.remove();
      })(k / 8 * 6.283, 50 + Math.random() * 40);
    }
  };

  const live = (i: number) => {
    burst(i);
    const tile = tilesRef.current[i];
    if (tile) {
      tile.classList.add('live');
      const em = tile.querySelector('em');
      if (em) {
        em.textContent = tile.classList.contains('more') ? 'More every month' : 'Live';
      }
    }
    if (wide() && pathsRef.current[i + 1]) {
      pathsRef.current[i + 1].classList.add('lit');
    }
  };

  const finishCelebration = (onFinished?: () => void) => {
    if (goBtnRef.current) goBtnRef.current.textContent = '✓ You’re in';
    if (stampRef.current) {
      stampRef.current.textContent = 'posted ✓';
      hitStamp();
    }
    if (tagRef.current) tagRef.current.textContent = 'Posted everywhere';
    if (stRef.current) {
      stRef.current.textContent = 'Signed in. Your post is live on every platform. Opening your workspace.';
    }
    if (onFinished) {
      setTimeout(onFinished, 600);
    }
  };

  const blast = (onComplete?: () => void) => {
    const rm = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!wide() || rm || !wrapRef.current || !cookRef.current || !fcRef.current) {
      tilesRef.current.forEach((t, i) => {
        setTimeout(() => live(i), rm ? 0 : i * 140);
      });
      setTimeout(() => finishCelebration(onComplete), rm ? 100 : 900);
      return;
    }

    if (pathsRef.current[0]) pathsRef.current[0].classList.add('lit');
    const L = R(cookRef.current);
    const F = R(fcRef.current);
    const a = { x: L.x + L.w / 2, y: L.y + L.h / 2 };
    const b = { x: F.x + F.w, y: F.y + F.h / 2 };

    const c = document.createElement('div');
    c.className = 'fly';
    c.innerHTML = '<i></i><i></i>';
    wrapRef.current.appendChild(c);

    const T = (p: { x: number; y: number }, s?: number, r?: number) => {
      return 'translate(' + p.x + 'px,' + p.y + 'px) scale(' + (s || 1) + ') rotate(' + (r || 0) + 'deg)';
    };

    const anim = c.animate([
      { transform: T(a, 1, -8) },
      { transform: T({ x: (a.x + F.x) / 2, y: a.y - 60 }, 1.5, 6), offset: 0.45 },
      { transform: T({ x: F.x + F.w / 2, y: F.y + F.h / 2 - 40 }, 2, 0), offset: 0.75 },
      { transform: T(b, 1.3, 0) }
    ], { duration: 900, easing: 'ease-in-out', fill: 'forwards' });

    anim.finished.then(() => {
      c.remove();
      let n = 0;
      tilesRef.current.forEach((t, i) => {
        const q = R(t);
        const e = { x: q.x + q.w / 2, y: q.y + q.h / 2 };
        const d = document.createElement('div');
        d.className = 'fly';
        d.innerHTML = '<i></i><i></i>';
        wrapRef.current?.appendChild(d);

        d.animate([
          { transform: T(b, 1.3, 0) },
          { transform: T({ x: (b.x + e.x) / 2, y: (b.y + e.y) / 2 - 50 }, 1.1, 12), offset: 0.5 },
          { transform: T(e, 0.7, 0) }
        ], { duration: 700, delay: i * 90, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'both' }).finished.then(() => {
          d.remove();
          live(i);
          if (++n === tilesRef.current.length) {
            setTimeout(() => finishCelebration(onComplete), 250);
          }
        });
      });
    });
  };

  // Google OAuth
  const handleGoogleSignIn = async () => {
    try {
      setBusy(true);
      setEmailError('');
      setPasswordError('');
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=/dashboard`
        }
      });
    } catch {
      setPasswordError('Failed to initiate Google sign in.');
      setBusy(false);
    }
  };

  // Submit password authentication
  const submitAuth = async () => {
    if (busy) return;
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let hasErr = false;

    if (!emailRe.test(email.trim())) {
      setEmailError('Enter a valid email, like name@company.com');
      hasErr = true;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('Enter your password');
      hasErr = true;
    } else {
      setPasswordError('');
    }

    if (hasErr) return;

    setBusy(true);
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setPasswordError(data.message || 'Invalid credentials.');
        setBusy(false);
      } else if (data.session?.access_token) {
        const uid = data.userId || data.session?.user?.id;
        if (uid) {
          try {
            sessionStorage.setItem('unool_session', JSON.stringify({
              access_token: data.session?.access_token || null,
              refresh_token: data.session?.refresh_token || null,
              userId: uid,
              email: data.session?.user?.email || email,
              ts: Date.now(),
            }));
          } catch { }
        }
        try {
          const supabase = getSupabaseBrowserClient();
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
        } catch { }

        // Trigger the celebratory blast animation then navigate
        blast(() => {
          router.push(data.redirectTo || '/dashboard');
        });
      } else {
        // OTP required by backend
        setNextResendAt(data.nextResendAt);
        setStage('otp');
        setBusy(false);
        setTimeout(() => otpRefs.current[0]?.focus(), 300);
      }
    } catch {
      setPasswordError('Network error. Please try again.');
      setBusy(false);
    }
  };

  // OTP handlers
  const handleOtpChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    setOtpError('');
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...otp];
    pasted.split('').forEach((ch, idx) => { next[idx] = ch; });
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const verifyOtp = async () => {
    const token = otp.join('');
    if (token.length < 6) return;
    setBusy(true);
    setOtpError('');

    try {
      const res = await fetch('/api/auth/signin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: token }),
      });
      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.message || 'Invalid code.');
        setOtp(['', '', '', '', '', '']);
        setBusy(false);
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
      } else {
        const uid = data.userId || data.session?.user?.id;
        if (uid) {
          try {
            sessionStorage.setItem('unool_session', JSON.stringify({
              access_token: data.session?.access_token || null,
              refresh_token: data.session?.refresh_token || null,
              userId: uid,
              email: data.session?.user?.email || email,
              ts: Date.now(),
            }));
          } catch { }
        }
        if (data.session?.access_token) {
          try {
            const supabase = getSupabaseBrowserClient();
            await supabase.auth.setSession({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            });
          } catch { }
        }
        blast(() => {
          router.push(data.redirectTo || '/dashboard');
        });
      }
    } catch {
      setOtpError('Network error.');
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resendLoading) return;
    setResendLoading(true);
    try {
      await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), purpose: 'signin' }),
      });
      setOtp(['', '', '', '', '', '']);
      setCooldown(60);
      otpRefs.current[0]?.focus();
    } finally {
      setResendLoading(false);
    }
  };

  // User display name & avatar initial calculated from email
  const userHandle = email.split('@')[0].replace(/[^a-zA-Z0-9]+/g, ' ').trim();
  const userName = userHandle
    ? userHandle.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
    : 'Your Name';
  const userInitial = userName[0] || 'U';

  const curPlatformName = NAMES[curPlatformIndex];
  const curText = versionsRef.current[curPlatformName] || '';
  const curLimit = LIM[curPlatformName] || 3000;
  const curActions = PM[curPlatformName] || [];

  // Keyword for media previews
  const mediaWordMatch = (rawText.match(/[A-Za-z]{4,}/g) || ['New']).sort((a, b) => b.length - a.length)[0];
  const mediaWord = mediaWordMatch ? mediaWordMatch[0].toUpperCase() + mediaWordMatch.slice(1) : 'New';

  return (
    <div className="unool-signin-page" ref={rootRef}>
      <div className="frame">
        <header>
          <div className="mark">
            <img className="lg" src={UNOOL_LOGO_BASE64} alt="Unool" />
            Unool
          </div>
          <p>
            New to Unool? <Link href="/signup">Create an account</Link>
          </p>
        </header>

        <div className="wrap" id="wrap" ref={wrapRef}>
          <svg id="th" ref={thRef} aria-hidden="true"></svg>

          <div className="scene" id="scene" ref={sceneRef}>
            {/* Left Column (Raw -> Cooked) */}
            <aside className="sl">
              <div className="raw">
                <span className="lab">Raw</span>
                <button className="sh" type="button" id="sh" onClick={handleSurpriseMe}>
                  ✦ surprise me
                </button>
                <textarea
                  id="rw"
                  maxLength={240}
                  aria-label="Your raw idea, as messy as you like"
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value);
                    cook(true, e.target.value);
                  }}
                />
              </div>

              <div className="magic" id="mg" ref={mgRef}>
                <div className="orb" aria-hidden="true">
                  <div className="o3">
                    <div className="core done" id="core" ref={coreRef}>
                      <img src={UNOOL_LOGO_BASE64} alt="Unool Core" />
                    </div>
                    <div className="ring">
                      <i style={{ '--k': 0 } as React.CSSProperties}>in</i>
                      <i style={{ '--k': 1 } as React.CSSProperties}>Ig</i>
                      <i style={{ '--k': 2 } as React.CSSProperties}>Bs</i>
                      <i style={{ '--k': 3 } as React.CSSProperties}>f</i>
                      <i style={{ '--k': 4 } as React.CSSProperties}>▶</i>
                      <i style={{ '--k': 5 } as React.CSSProperties}>#</i>
                    </div>
                  </div>
                </div>
                <span id="ms" ref={msRef} aria-live="polite">
                  Unool cooked. No notes.
                </span>
              </div>

              <div className="cooked" id="cook" ref={cookRef}>
                <span className="lab">Cooked by Unool</span>
                <div className="tabs" id="tabs" role="group" aria-label="Preview by platform">
                  {NAMES.map((n, i) => (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={curPlatformIndex === i}
                      onClick={() => {
                        setCurPlatformIndex(i);
                        show('s');
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>

                <article className="post">
                  <span className="stamp" id="stamp" ref={stampRef}>
                    no notes ✓
                  </span>
                  <div className="ph">
                    <div className="pa" id="pa">
                      {userInitial}
                    </div>
                    <div className="pn">
                      <b id="pnm">{userName}</b>
                      <small>Just now</small>
                    </div>
                    <span className="pb" id="pbd">
                      {curPlatformName}
                    </span>
                  </div>

                  <p className="cv" id="cv" ref={cvRef}>
                    {curText}
                  </p>

                  <div id="media">
                    {curPlatformName === 'YouTube' ? (
                      <div className="md yt">
                        <u>▶</u>
                        <span>{mediaWord}</span>
                        <em>0:42</em>
                      </div>
                    ) : curPlatformName === 'Instagram' ? (
                      <div className="md">
                        <span>{mediaWord}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="act" id="act">
                    {curActions.map((action, idx) => (
                      <b key={idx}>{action}</b>
                    ))}
                  </div>
                </article>

                <div className="mt" id="mt">
                  {curText.length} / {curLimit} characters, fits ✓
                  <i>
                    <b style={{ width: Math.min(100, (curText.length / curLimit) * 100) + '%' }}></b>
                  </i>
                </div>
              </div>
            </aside>

            {/* Center Column (Form Card) */}
            <main className="sc">
              <div className="fc" id="fc" ref={fcRef}>
                {stage === 'form' ? (
                  <>
                    <span className="tag" id="tag" ref={tagRef}>
                      Welcome back
                    </span>
                    <h1>
                      <span>One link.</span>
                      <br />
                      One click<em>.</em>
                    </h1>
                    <p className="sub">Raw idea in, posts out. Everywhere, one click.</p>

                    <button className="g" type="button" onClick={handleGoogleSignIn} disabled={busy}>
                      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                        <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
                        <path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z" />
                        <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
                      </svg>
                      Continue with Google
                    </button>

                    <div className="or">
                      <i></i>or<i></i>
                    </div>

                    <label htmlFor="em">Email address</label>
                    <input
                      id="em"
                      type="email"
                      inputMode="email"
                      autoComplete="username"
                      placeholder="name@company.com"
                      value={email}
                      disabled={busy}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          submitAuth();
                        }
                      }}
                    />
                    <p className="err" id="emerr" role="alert">
                      {emailError}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '12px 0 5px' }}>
                      <label htmlFor="pw" style={{ margin: 0 }}>
                        Password
                      </label>
                      <Link href="/forgot-password" className="lnk">
                        Forgot password?
                      </Link>
                    </div>

                    <div className="f">
                      <input
                        id="pw"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        style={{ paddingRight: '64px' }}
                        value={password}
                        disabled={busy}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setPasswordError('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            submitAuth();
                          }
                        }}
                      />
                      <button
                        className="eye"
                        type="button"
                        id="eye"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword(p => !p)}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <p className="err" id="pwerr" role="alert">
                      {passwordError}
                    </p>

                    <label className="ck">
                      <input type="checkbox" defaultChecked />
                      Keep me signed in on this device
                    </label>

                    <button
                      className="btn"
                      type="button"
                      id="go"
                      ref={goBtnRef}
                      disabled={busy}
                      onClick={submitAuth}
                    >
                      {busy ? (
                        <>
                          <span className="spin"></span>Posting everywhere…
                        </>
                      ) : (
                        'Open my workspace →'
                      )}
                    </button>
                    <p className="sr-only" role="status" id="st" ref={stRef}></p>
                  </>
                ) : (
                  <div className="otp-container">
                    <span className="tag">Security check</span>
                    <h1>
                      <span>Confirm code<em>.</em></span>
                    </h1>
                    <p className="sub">
                      We just sent a 6-digit verification code to <b>{email}</b>. Enter it below to access your workspace.
                    </p>

                    <div className="otp-grid">
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => { otpRefs.current[i] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => {
                            handleOtpKeyDown(i, e);
                            if (e.key === 'Enter') verifyOtp();
                          }}
                          onPaste={i === 0 ? handleOtpPaste : undefined}
                          disabled={busy}
                          className="otp-box"
                        />
                      ))}
                    </div>

                    <p className="err" role="alert">
                      {otpError}
                    </p>

                    <button
                      className="btn"
                      type="button"
                      disabled={busy || otp.join('').length < 6}
                      onClick={verifyOtp}
                    >
                      {busy ? (
                        <>
                          <span className="spin"></span>Verifying…
                        </>
                      ) : (
                        'Confirm & enter workspace →'
                      )}
                    </button>

                    <div className="otp-meta">
                      {cooldown > 0 ? (
                        <span style={{ fontSize: '13px', color: 'var(--mute)' }}>
                          Resend in {cooldown}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="lnk"
                          onClick={handleResend}
                          disabled={resendLoading}
                        >
                          {resendLoading ? 'Sending...' : 'Resend code'}
                        </button>
                      )}

                      <button
                        type="button"
                        className="lnk"
                        onClick={() => {
                          setStage('form');
                          setOtp(['', '', '', '', '', '']);
                          setOtpError('');
                        }}
                      >
                        ← Back
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </main>

            {/* Right Column (Platform Tiles) */}
            <aside className="sr" id="sr" aria-hidden="true">
              <div className="tl">
                <span className="ic">in</span>
                <div>
                  <b>LinkedIn</b>
                  <em>Ready</em>
                </div>
                <span className="ok">✓</span>
              </div>
              <div className="tl">
                <span className="ic">Ig</span>
                <div>
                  <b>Instagram</b>
                  <em>Ready</em>
                </div>
                <span className="ok">✓</span>
              </div>
              <div className="tl">
                <span className="ic">Bs</span>
                <div>
                  <b>Bluesky</b>
                  <em>Ready</em>
                </div>
                <span className="ok">✓</span>
              </div>
              <div className="tl">
                <span className="ic">f</span>
                <div>
                  <b>Facebook</b>
                  <em>Ready</em>
                </div>
                <span className="ok">✓</span>
              </div>
              <div className="tl">
                <span className="ic">▶</span>
                <div>
                  <b>YouTube</b>
                  <em>Ready</em>
                </div>
                <span className="ok">✓</span>
              </div>
              <div className="tl">
                <span className="ic">#</span>
                <div>
                  <b>Slack</b>
                  <em>Ready</em>
                </div>
                <span className="ok">✓</span>
              </div>
              <div className="tl more">
                <span className="ic">…</span>
                <div>
                  <b>So on</b>
                  <em>and more</em>
                </div>
                <span className="ok">✓</span>
              </div>
            </aside>
          </div>
        </div>

        <footer>
          <span>Every post, every network, one calm queue.</span>
          <span>Terms · Privacy</span>
        </footer>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#FBF8F3',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              border: '2px solid #D2C5B8',
              borderTopColor: '#5A1020',
              borderRadius: '50%',
              animation: 'sp 0.7s linear infinite',
            }}
          />
        </div>
      }
    >
      <SignInComponent />
    </Suspense>
  );
}
