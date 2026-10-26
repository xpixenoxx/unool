'use client';

import React, { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ShieldCheck, Lock, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';
import './forgot-password.css';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [stage, setStage] = useState<'request' | 'otp' | 'success'>('request');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // OTP State
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus the first OTP input upon entering OTP stage
  useEffect(() => {
    if (stage === 'otp') {
      const timer = setTimeout(() => otpRefs.current[0]?.focus(), 400);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Stage 1: Request password reset OTP
  const handleRequest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const emailTrimmed = email.trim().toLowerCase();
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(emailTrimmed)) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailTrimmed }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok && res.status !== 429) {
        setError(data.message || 'Failed to request reset code.');
      } else if (res.status === 429) {
        setError(data.message || 'Too many attempts. Please wait.');
        setLoading(false);
        return;
      }

      // Advance to OTP stage (concealing account existence as per security guidelines)
      setStage('otp');
      setCooldown(60);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // OTP Input handlers
  const handleOtpChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    setError('');

    if (digit && i < 5) {
      otpRefs.current[i + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...otp];
    pasted.split('').forEach((ch, idx) => {
      if (idx < 6) next[idx] = ch;
    });
    setOtp(next);
    setError('');
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // Stage 2: Verify OTP and update password
  const verifyAndUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = otp.join('');
    if (token.length < 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password/verify-and-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: token,
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || 'Invalid or expired verification code.');
      } else {
        setStage('success');
        setTimeout(() => {
          router.push('/signin');
        }, 3000);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset back to request stage
  const handleTryAnotherEmail = () => {
    setStage('request');
    setOtp(['', '', '', '', '', '']);
    setPassword('');
    setError('');
  };

  // Live OTP preview digits string for the right-side visual chip
  const livePreviewDigits =
    stage === 'request'
      ? '0 2 4 · 6 7 5'
      : otp.map((d) => d || '·').join(' ');

  return (
    <div className="unool-forgot-page">
      <div className="frame">
        {/* Top Header */}
        <header>
          <Link href="/" className="mark" aria-label="Unool Home">
            <img className="lg" src="/unool-icon.png" alt="Unool" />
            Unool
          </Link>
          <p>
            Remember your password? <Link href="/signin">Sign in</Link>
          </p>
        </header>

        {/* Scene Container: Form (Left) + Security Card (Right) */}
        <div className="wrap">
          <div className="scene">
            {/* Left Column: Form Card */}
            <main className="sc">
              <div className="fc">
                {stage === 'request' && (
                  <>
                    <span className="tag">Secure Recovery</span>
                    <h1>
                      <span>Regain access</span> to your studio.
                    </h1>
                    <p className="sub">
                      Enter your verified email. We will send a single-use authentication code to safely reset your password.
                    </p>

                    <form onSubmit={handleRequest}>
                      <label htmlFor="recovery-email">Email Address</label>
                      <div className="f">
                        <input
                          id="recovery-email"
                          type="email"
                          placeholder="name@company.com"
                          value={email}
                          disabled={loading}
                          autoComplete="email"
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setError('');
                          }}
                        />
                      </div>

                      <p className="err" role="alert">
                        {error}
                      </p>

                      <button
                        className="btn"
                        type="submit"
                        disabled={loading || !email.trim()}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending Code...
                          </>
                        ) : (
                          <>
                            Send Verification Code
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      <div className="sub-actions">
                        <Link href="/signin" className="back-link">
                          ← Back to Sign In
                        </Link>
                      </div>
                    </form>
                  </>
                )}

                {stage === 'otp' && (
                  <>
                    <span className="tag">Verification Code</span>
                    <h1>
                      <span>Verify your</span> identity.
                    </h1>
                    <p className="sub">
                      We sent a 6-digit verification code to <strong>{email}</strong>. Enter it below along with your fresh password.
                    </p>

                    <form onSubmit={verifyAndUpdate}>
                      <label>6-Digit Verification Code</label>
                      <div className="otp-row">
                        {otp.map((digit, i) => (
                          <input
                            key={i}
                            ref={(el) => {
                              otpRefs.current[i] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            disabled={loading}
                            onChange={(e) => handleOtpChange(i, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                            onPaste={i === 0 ? handleOtpPaste : undefined}
                            className={`otp-box ${digit ? 'filled' : ''}`}
                            aria-label={`Digit ${i + 1}`}
                          />
                        ))}
                      </div>

                      <div style={{ marginTop: '12px' }}>
                        <label htmlFor="new-password">New Password</label>
                        <div className="f">
                          <input
                            id="new-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="At least 8 characters"
                            value={password}
                            disabled={loading}
                            style={{ paddingRight: '72px' }}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              setError('');
                            }}
                          />
                          <button
                            type="button"
                            className="eye"
                            onClick={() => setShowPassword((p) => !p)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? (
                              <>
                                <EyeOff className="w-3.5 h-3.5" /> Hide
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" /> Show
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <p className="err" role="alert">
                        {error}
                      </p>

                      <button
                        className="btn"
                        type="submit"
                        disabled={loading || otp.join('').length < 6 || password.length < 8}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Updating Password...
                          </>
                        ) : (
                          'Confirm & Reset Password'
                        )}
                      </button>

                      <div className="sub-actions">
                        <button
                          type="button"
                          className="back-link"
                          onClick={handleTryAnotherEmail}
                          disabled={loading}
                        >
                          ← Try another email
                        </button>

                        <button
                          type="button"
                          className="resend-link"
                          disabled={cooldown > 0 || loading}
                          onClick={() => handleRequest()}
                        >
                          {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
                        </button>
                      </div>
                    </form>
                  </>
                )}

                {stage === 'success' && (
                  <div className="success-card">
                    <div className="success-icon">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <span className="tag" style={{ background: '#dcfce7', color: '#15803d', marginBottom: 0 }}>
                      Access Restored
                    </span>
                    <h1>Password Updated</h1>
                    <p className="sub" style={{ marginBottom: 8 }}>
                      Your credentials have been securely updated. Redirecting you to Sign In...
                    </p>
                    <div className="progress-bar">
                      <div className="progress-fill" />
                    </div>
                  </div>
                )}
              </div>
            </main>

            {/* Right Column: Security Card */}
            <aside className="security-card" aria-label="Security Status">
              <div className="otp-preview-chip">
                <p>{stage === 'request' ? 'OTP Code Preview' : 'Entered Code'}</p>
                <div className="otp-preview-digits">{livePreviewDigits}</div>
              </div>

              <div className={`shield-emblem ${stage === 'success' ? 'verified' : ''}`}>
                {stage === 'success' ? (
                  <ShieldCheck className="w-10 h-10" />
                ) : (
                  <Lock className="w-9 h-9" />
                )}
              </div>

              <div className="trust-badge">
                <Lock className="w-3.5 h-3.5" />
                <span>Zero-Knowledge Encryption</span>
              </div>

              <div className="trust-badge">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Single-Use 5-Minute Expiry</span>
              </div>

              {stage === 'success' && (
                <div className="trust-badge status">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  <span>Credentials Verified</span>
                </div>
              )}
            </aside>
          </div>
        </div>

        {/* Footer */}
        <footer>
          <p>© {new Date().getFullYear()} Unool Inc. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/contact">Support</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
