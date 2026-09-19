'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import OtpVerifyForm from '@/components/auth/OtpVerifyForm';

type Stage = 'form' | 'otp' | 'done';

interface FormErrors {
  name?:     string;
  email?:    string;
  password?: string;
}

function validateForm(name: string, email: string, password: string): FormErrors {
  const errors: FormErrors = {};
  if (!name.trim())          errors.name     = 'Name is required.';
  if (!email.includes('@'))  errors.email    = 'Enter a valid email address.';
  if (password.length < 8)  errors.password = 'Password must be at least 8 characters.';
  if (password.length > 128) errors.password = 'Password must be at most 128 characters.';
  return errors;
}

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors]     = useState<FormErrors>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading]   = useState(false);
  const [stage, setStage]       = useState<Stage>('form');
  const [nextResendAt, setNextResendAt] = useState<string>();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    const errs = validateForm(name, email, password);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const res  = await fetch('/api/auth/signup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApiError(data.message || 'Something went wrong.');
      } else {
        setNextResendAt(new Date(Date.now() + 60_000).toISOString());
        setStage('otp');
      }
    } catch {
      setApiError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSuccess = () => {
    setStage('done');
    setTimeout(() => router.push('/signin'), 2000);
  };

  return (
    <div className="min-h-screen bg-white relative flex flex-col items-center pt-16 font-sans">
      {/* Home link */}
      <div className="absolute top-6 left-6 lg:top-8 lg:left-8">
        <Link href="/" className="flex items-center gap-2 text-[15px] text-zinc-700 hover:text-black transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>
      </div>

      <div className="w-full max-w-[440px] px-4">
        {/* Toggle */}
        <div className="mx-auto flex w-fit p-1 bg-zinc-100 rounded-md mb-8">
          <Link href="/signin" className="px-5 py-1.5 text-[15px] font-medium rounded text-zinc-500 hover:text-zinc-700 transition-colors">
            Sign In
          </Link>
          <Link href="/signup" className="px-5 py-1.5 text-[15px] font-medium rounded bg-[#68d391] text-white shadow-sm ring-1 ring-black/5">
            Sign Up
          </Link>
        </div>

        {/* ── FORM STAGE ──────────────────────────────────────────────────── */}
        {stage === 'form' && (
          <>
            <h1 className="text-[32px] font-bold text-center text-[#2d3748] tracking-tight mb-8">
              Create Your Free Account
            </h1>

            <form onSubmit={handleSignup} noValidate className="space-y-4">
              {/* Name */}
              <div>
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrors(p => ({ ...p, name: undefined })); }}
                  disabled={loading}
                  className={`w-full px-4 py-3 rounded border text-[15px] placeholder:text-zinc-300 bg-white
                    focus:outline-none focus:ring-1 transition-colors disabled:opacity-60
                    ${errors.name ? 'border-red-400 focus:border-red-400 focus:ring-red-300' : 'border-zinc-200 focus:border-[#68d391] focus:ring-[#68d391]'}`}
                />
                {errors.name && <p className="text-red-500 text-[12px] mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <input
                  type="email"
                  placeholder="tom@cruise.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })); }}
                  disabled={loading}
                  className={`w-full px-4 py-3 rounded border text-[15px] placeholder:text-zinc-300 bg-white
                    focus:outline-none focus:ring-1 transition-colors disabled:opacity-60
                    ${errors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-300' : 'border-zinc-200 focus:border-[#68d391] focus:ring-[#68d391]'}`}
                />
                {errors.email && <p className="text-red-500 text-[12px] mt-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <input
                  type="password"
                  placeholder="Password (min. 8 characters)"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })); }}
                  disabled={loading}
                  className={`w-full px-4 py-3 rounded border text-[15px] placeholder:text-zinc-300 bg-white
                    focus:outline-none focus:ring-1 transition-colors disabled:opacity-60
                    ${errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-300' : 'border-zinc-200 focus:border-[#68d391] focus:ring-[#68d391]'}`}
                />
                {errors.password && <p className="text-red-500 text-[12px] mt-1">{errors.password}</p>}
              </div>

              {/* Captcha placeholder (invisible, keeps layout) */}
              <div className="invisible flex items-center justify-between border border-zinc-200 rounded p-2
                              mx-auto w-[300px] bg-[#f9fafb] shadow-sm" aria-hidden="true">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-zinc-300 rounded bg-white shadow-inner ml-1" />
                  <span className="text-[14px] text-zinc-700">Verify you are human</span>
                </div>
              </div>

              {/* API error */}
              {apiError && (
                <div className="flex items-start gap-2 text-red-600 text-[13px] bg-red-50 border border-red-100
                                rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {apiError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#68d391] hover:bg-[#5bb87d] disabled:opacity-70 disabled:cursor-not-allowed
                           text-white py-3 rounded font-semibold text-[15px] transition-colors shadow-sm
                           flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending code…</> : 'Create Account'}
              </button>
            </form>
          </>
        )}

        {/* ── OTP STAGE ───────────────────────────────────────────────────── */}
        {stage === 'otp' && (
          <OtpVerifyForm
            email={email}
            purpose="signup"
            verifyUrl="/api/auth/signup/verify-otp"
            onSuccess={handleOtpSuccess}
            onBack={() => { setStage('form'); setApiError(''); }}
            nextResendAt={nextResendAt}
          />
        )}

        {/* ── DONE ────────────────────────────────────────────────────────── */}
        {stage === 'done' && (
          <div className="text-center py-8 space-y-3">
            <CheckCircle2 className="w-14 h-14 text-[#68d391] mx-auto" />
            <h2 className="text-[22px] font-bold text-[#2d3748]">Account Created!</h2>
            <p className="text-[14px] text-zinc-500">Redirecting you to sign in…</p>
          </div>
        )}
      </div>

      {/* Footer links */}
      {stage === 'form' && (
        <div className="mt-16 text-center flex flex-col gap-1 text-[14px]">
          <span className="text-zinc-500">
            Already have an account?{' '}
            <Link href="/signin" className="text-zinc-700 hover:text-black font-medium">Sign In</Link>
          </span>
          <Link href="/forgot-password" className="text-zinc-500 hover:text-zinc-700 transition-colors">
            Forgot your password?
          </Link>
        </div>
      )}

      {/* Chat Widget */}
      <div className="fixed bottom-6 right-6 w-[52px] h-[52px] bg-white rounded-full
                      shadow-[0_4px_14px_rgba(0,0,0,0.1)] border border-zinc-100 flex items-center
                      justify-center cursor-pointer hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] transition-shadow">
        <MessageSquare className="w-[22px] h-[22px] text-zinc-600 fill-zinc-600" />
      </div>
    </div>
  );
}
