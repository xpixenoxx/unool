'use client';

import React, { useState, useRef, useEffect, useCallback, Suspense, KeyboardEvent, ClipboardEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import './signup.css';

// Calendar static events
const STATIC_EVENTS: Record<number, [string, string]> = {
  0: ['Update', 'rose'],
  1: ['Best time', 'dash'],
  5: ['Publishing', 'peach live'],
  6: ['Report', 'tan'],
  8: ['Clip', 'dark'],
  12: ['Recap', 'peach'],
  14: ['Launch', 'peach'],
  20: ['Reel', 'dark'],
  22: ['Case study', 'tan']
};

const DYNAMIC_SLOTS: Record<number, number> = {
  1: 7,
  2: 13,
  3: 21,
  4: 27
};

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function SignUpComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [refCode, setRefCode] = useState('');

  useEffect(() => {
    const urlRef = searchParams?.get('ref');
    if (urlRef) {
      setRefCode(urlRef);
      try {
        sessionStorage.setItem('unool_ref', urlRef);
        document.cookie = `unool_ref=${encodeURIComponent(urlRef)}; path=/; max-age=2592000; SameSite=Lax`;
      } catch {}
    } else {
      try {
        const stored = sessionStorage.getItem('unool_ref');
        if (stored) setRefCode(stored);
      } catch {}
    }
  }, [searchParams]);

  // Form Fields
  const [name, setName] = useState('');
  const [who, setWho] = useState<'solo' | 'team' | ''>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Errors & States
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [busy, setBusy] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [stage, setStage] = useState<'form' | 'otp' | 'completed'>('form');

  // OTP Verification States
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otpError, setOtpError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [nextResendAt, setNextResendAt] = useState<string>();
  const [resendLoading, setResendLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // DOM Refs
  const msRef = useRef<HTMLSpanElement>(null);
  const nmRef = useRef<HTMLInputElement>(null);
  const emRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const capRef = useRef<HTMLParagraphElement>(null);
  const tagRef = useRef<HTMLSpanElement>(null);
  const stRef = useRef<HTMLParagraphElement>(null);

  // Validation Checks
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const okName = name.trim().length > 0;
  const okWho = who !== '';
  const okEmail = emailRe.test(email.trim());
  const okPw = password.length >= 8;
  const filledCount = [okName, okWho, okEmail, okPw].filter(Boolean).length;

  // Measure text and fit input width
  const fit = useCallback((input: HTMLInputElement | null) => {
    if (!input || !msRef.current) return;
    msRef.current.textContent = input.value || input.getAttribute('placeholder') || '';
    input.style.width = (msRef.current.offsetWidth + 16) + 'px';
  }, []);

  useEffect(() => {
    fit(nmRef.current);
    fit(emRef.current);
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        fit(nmRef.current);
        fit(emRef.current);
      });
    }
  }, [fit]);

  // Today's weekday index (Mon=0, Sun=6)
  const todayWeekdayIndex = (new Date().getDay() + 6) % 7;

  // Dynamic slot events text & class
  const getSlotEvent = (slotNum: number): { text: string; cls: string } | null => {
    if (isDone) {
      if (slotNum === 1) return { text: 'Hi, ' + name.trim().split(' ')[0], cls: 'dark' };
      if (slotNum === 2) return { text: who === 'team' ? 'Team calendar' : 'Solo calendar', cls: 'dark' };
      if (slotNum === 3) return { text: 'Inbox confirmed', cls: 'dark' };
      if (slotNum === 4) return { text: 'Password set', cls: 'dark' };
    }
    if (slotNum === 1 && okName) return { text: 'Hi, ' + name.trim().split(' ')[0], cls: 'rose' };
    if (slotNum === 2 && okWho) return { text: who === 'team' ? 'Team calendar' : 'Solo calendar', cls: 'peach' };
    if (slotNum === 3 && okEmail) return { text: 'Inbox confirmed', cls: 'tan' };
    if (slotNum === 4 && okPw) return { text: 'Password set', cls: 'dark' };
    return null;
  };

  // Timeline bar position
  const nowTop = isDone ? '96%' : `${6 + filledCount * 21}%`;

  // Password hint text
  const pwHintText = password
    ? okPw
      ? 'Looks good.'
      : 'Keep going, 8 or more characters.'
    : 'At least 8 characters.';

  // Caption text
  const captionText = isDone
    ? 'Opening your workspace…'
    : filledCount === 4
    ? 'All set. Your first week is ready.'
    : filledCount > 0
    ? `${filledCount} of 4 slots filled on your calendar.`
    : 'Every answer lands on your calendar. Watch the week fill up.';

  // Cooldown countdown for OTP
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

  // Google OAuth Signup
  const handleGoogleSignIn = async () => {
    try {
      setBusy(true);
      setNameError('');
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

  // Form Submit
  const handleSubmit = async () => {
    if (busy) return;
    setNameError('');
    setEmailError('');
    setPasswordError('');

    let hasErr = false;
    if (!name.trim()) {
      setNameError('Enter your name');
      hasErr = true;
    }
    if (!emailRe.test(email.trim())) {
      setEmailError('Enter a valid email, like name@company.com');
      hasErr = true;
    }
    if (password.length < 8) {
      setPasswordError('Use at least 8 characters');
      hasErr = true;
    }

    if (hasErr) return;

    setBusy(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          ref: refCode || undefined,
        })
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.alreadyRegistered) {
          setEmailError('This email is already registered. Please sign in instead.');
          if (btnRef.current) btnRef.current.textContent = 'Go to Sign In';
        } else {
          setPasswordError(data.message || 'Something went wrong. Please try again.');
        }
        setBusy(false);
        return;
      }

      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }

      // Trigger completion animation on calendar
      setIsDone(true);
      if (btnRef.current) btnRef.current.textContent = '✓ You’re in';
      if (tagRef.current) tagRef.current.textContent = 'Welcome to Unool';
      if (stRef.current) stRef.current.textContent = 'Account created. Opening your workspace.';

      // Transition to OTP verification if required by backend
      setTimeout(() => {
        setNextResendAt(new Date(Date.now() + 60_000).toISOString());
        setStage('otp');
        setBusy(false);
        setTimeout(() => otpRefs.current[0]?.focus(), 300);
      }, 900);
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
      const res = await fetch('/api/auth/signup/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: token })
      });
      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.message || 'Invalid code.');
        setOtp(['', '', '', '', '', '']);
        setBusy(false);
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
      } else {
        setStage('completed');
        setTimeout(() => {
          router.push(data.redirectTo || '/signin');
        }, 1500);
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
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), purpose: 'signup' })
      });
      const data = await res.json().catch(() => ({}));
      if (data?.devOtp) {
        setDevOtp(data.devOtp);
      }
      setOtp(['', '', '', '', '', '']);
      setCooldown(60);
      otpRefs.current[0]?.focus();
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="unool-signup-page">
      <div className="frame">
        <header>
          <Link href="/" className="mark">
            <img className="lg" src="/unool-icon.png" alt="Unool" />
            Unool
          </Link>
          <p>
            Already have an account? <Link href="/signin">Sign in</Link>
          </p>
        </header>

        {/* 7 Weekday Headers */}
        <div className="days" id="days" aria-hidden="true">
          {DAYS.map((day, idx) => (
            <span key={day} className={idx === todayWeekdayIndex ? 'on' : ''}>
              {day}
            </span>
          ))}
        </div>

        {/* Calendar Stage */}
        <div className="stage">
          {/* 4x7 = 28 Cells */}
          <div className="grid" id="grid" aria-hidden="true">
            {Array.from({ length: 28 }, (_, i) => {
              // Static events
              if (STATIC_EVENTS[i]) {
                const [title, cls] = STATIC_EVENTS[i];
                return (
                  <div key={i} className="cell" id={`c${i}`}>
                    <div className={`ev ${cls}`}>{title}</div>
                  </div>
                );
              }
              // Dynamic slot cells: 7, 13, 21, 27
              const slotIdx = Object.keys(DYNAMIC_SLOTS).find(
                key => DYNAMIC_SLOTS[Number(key)] === i
              );
              if (slotIdx) {
                const event = getSlotEvent(Number(slotIdx));
                return (
                  <div key={i} className="cell" id={`c${i}`}>
                    {event ? (
                      <div className={`ev new ${event.cls}`}>
                        {event.text}
                      </div>
                    ) : null}
                  </div>
                );
              }
              // Blank cell
              return <div key={i} className="cell" id={`c${i}`} />;
            })}
          </div>

          {/* Red Timeline Bar */}
          <div className="now" id="now" aria-hidden="true" style={{ top: nowTop }} />

          {/* Form Card */}
          <main className="card">
            {stage === 'form' ? (
              <>
                <span className="tag" id="tag" ref={tagRef}>
                  Create your account
                </span>

                <div className="sent">
                  <span className="ms" id="ms" ref={msRef} aria-hidden="true"></span>

                  {/* Line 1: Name */}
                  <div className="ln">
                    <span className={`tk ${okName ? 'done' : ''}`} id="t1" aria-hidden="true">
                      ✓
                    </span>
                    <div className="tx">
                      <label htmlFor="nm" style={{ display: 'inline' }}>
                        Hi, I’m{' '}
                      </label>
                      <input
                        ref={nmRef}
                        className="il"
                        id="nm"
                        type="text"
                        autoComplete="name"
                        placeholder="your name"
                        maxLength={60}
                        value={name}
                        disabled={busy}
                        onChange={(e) => {
                          setName(e.target.value);
                          setNameError('');
                          fit(nmRef.current);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            emRef.current?.focus();
                          }
                        }}
                      />
                      .
                      <p className="err" id="e1" role="alert">
                        {nameError}
                      </p>
                    </div>
                  </div>

                  {/* Line 2: Posting As (Radio) */}
                  <div className="ln">
                    <span className={`tk ${okWho ? 'done' : ''}`} id="t2" aria-hidden="true">
                      ✓
                    </span>
                    <div className="tx">
                      I post as{' '}
                      <span className="rg sans" role="radiogroup" aria-label="Posting as">
                        <label className="pl">
                          <input
                            type="radio"
                            name="who"
                            value="solo"
                            checked={who === 'solo'}
                            disabled={busy}
                            onChange={() => setWho('solo')}
                          />
                          <span>Just me</span>
                        </label>
                        <label className="pl">
                          <input
                            type="radio"
                            name="who"
                            value="team"
                            checked={who === 'team'}
                            disabled={busy}
                            onChange={() => setWho('team')}
                          />
                          <span>A team</span>
                        </label>
                      </span>
                      .
                    </div>
                  </div>

                  {/* Line 3: Email */}
                  <div className="ln">
                    <span className={`tk ${okEmail ? 'done' : ''}`} id="t3" aria-hidden="true">
                      ✓
                    </span>
                    <div className="tx">
                      <label htmlFor="em" style={{ display: 'inline' }}>
                        You can reach me at{' '}
                      </label>
                      <input
                        ref={emRef}
                        className="il"
                        id="em"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="name@company.com"
                        value={email}
                        disabled={busy}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setEmailError('');
                          fit(emRef.current);
                        }}
                        onBlur={() => {
                          const v = email.trim();
                          if (v && !emailRe.test(v)) {
                            setEmailError('Enter a valid email, like name@company.com');
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            pwRef.current?.focus();
                          }
                        }}
                      />
                      .
                      <p className="err" id="e3" role="alert">
                        {emailError}
                      </p>
                    </div>
                  </div>

                  {/* Line 4: Password */}
                  <div className="ln">
                    <span className={`tk ${okPw ? 'done' : ''}`} id="t4" aria-hidden="true">
                      ✓
                    </span>
                    <div className="tx">
                      <label htmlFor="pw" style={{ display: 'inline' }}>
                        I’ll protect it with{' '}
                      </label>
                      <input
                        ref={pwRef}
                        className="il"
                        id="pw"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="password"
                        style={{ width: '190px' }}
                        value={password}
                        disabled={busy}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setPasswordError('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSubmit();
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
                      .
                      <p className="hint" id="pwhint" aria-live="polite">
                        {pwHintText}
                      </p>
                      <p className="err" id="e4" role="alert">
                        {passwordError}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  className="btn"
                  type="button"
                  id="go"
                  ref={btnRef}
                  disabled={busy}
                  onClick={handleSubmit}
                >
                  {busy ? (
                    <>
                      <span className="spin"></span>Creating your account…
                    </>
                  ) : (
                    'Create my account →'
                  )}
                </button>

                <p className="cap" id="cap" ref={capRef}>
                  {captionText}
                </p>

                <button
                  className="g"
                  type="button"
                  disabled={busy}
                  onClick={handleGoogleSignIn}
                >
                  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
                    />
                  </svg>
                  Or sign up with Google
                </button>

                <p className="terms">
                  By creating an account, you agree to the Terms of Service and Privacy Policy.
                </p>
                <p className="sr" role="status" id="st" ref={stRef}></p>
              </>
            ) : stage === 'otp' ? (
              <div className="otp-wrap">
                <span className="tag">Confirm your email</span>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '26px', fontWeight: 600, color: 'var(--bur)', margin: '14px 0 6px' }}>
                  Check your inbox.
                </h2>
                <p className="hint" style={{ fontSize: '14px' }}>
                  We just sent a 6-digit confirmation code to <b>{email}</b>. Enter it below to activate your calendar.
                </p>

                {devOtp && (
                  <div
                    style={{
                      background: 'rgba(217, 119, 6, 0.08)',
                      border: '1px solid rgba(217, 119, 6, 0.25)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      margin: '12px 0 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div style={{ fontSize: '13px', color: '#92400E' }}>
                      <span
                        style={{
                          background: '#FDE68A',
                          color: '#78350F',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          marginRight: '8px',
                          textTransform: 'uppercase',
                        }}
                      >
                        Testing Mode
                      </span>
                      OTP Code: <strong style={{ fontFamily: 'monospace', fontSize: '16px', letterSpacing: '2px' }}>{devOtp}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const digits = devOtp.split('').slice(0, 6);
                        setOtp(digits);
                        setOtpError('');
                        setTimeout(() => otpRefs.current[5]?.focus(), 50);
                      }}
                      style={{
                        padding: '5px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: '#92400E',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'opacity 0.2s',
                      }}
                    >
                      Autofill
                    </button>
                  </div>
                )}

                <div className="otp-boxes">
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

                {otpError && (
                  <p className="err" role="alert" style={{ textAlign: 'center', marginBottom: '8px' }}>
                    {otpError}
                  </p>
                )}

                <button
                  className="btn"
                  type="button"
                  disabled={busy || otp.join('').length < 6}
                  onClick={verifyOtp}
                >
                  {busy ? (
                    <>
                      <span className="spin"></span>Confirming…
                    </>
                  ) : (
                    'Confirm & open workspace →'
                  )}
                </button>

                <div className="otp-actions">
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
                      setIsDone(false);
                      setOtp(['', '', '', '', '', '']);
                      setOtpError('');
                    }}
                  >
                    ← Back to form
                  </button>
                </div>

                <p style={{ fontSize: '12px', color: '#8C827A', textAlign: 'center', marginTop: '16px', lineHeight: 1.5 }}>
                  Didn’t receive the email? In local development without configured email domains, the code is also printed in your server terminal.
                </p>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <span className="tag">Account verified</span>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '28px', color: 'var(--bur)', margin: '16px 0 8px' }}>
                  Welcome to Unool! 🎉
                </h2>
                <p className="hint">
                  Your workspace is ready. Redirecting you to sign in...
                </p>
              </div>
            )}
          </main>
        </div>

        <footer>
          <span>&copy; {new Date().getFullYear()} Pixenox Solutions · Unool</span>
          <span>
            <Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link> · <Link href="/refund">Refunds</Link> · <Link href="/contact">Contact</Link>
          </span>
        </footer>
      </div>
    </div>
  );
}

export default function SignUpPage() {
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
      <SignUpComponent />
    </Suspense>
  );
}
