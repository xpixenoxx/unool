'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquare } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire up reset code logic
  };

  return (
    <div className="min-h-screen bg-white relative flex flex-col items-center pt-16 font-sans">
      {/* Home link */}
      <div className="absolute top-6 left-6 lg:top-8 lg:left-8">
        <Link href="/" className="flex items-center gap-2 text-[15px] text-zinc-700 hover:text-black transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[440px] px-4">
        {/* Toggle */}
        <div className="mx-auto flex w-fit p-1 bg-zinc-100 rounded-md mb-8">
          <Link
            href="/signin"
            className="px-5 py-1.5 text-[15px] font-medium rounded bg-[#68d391] text-white shadow-sm ring-1 ring-black/5"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-5 py-1.5 text-[15px] font-medium rounded text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            Sign Up
          </Link>
        </div>

        {/* Heading */}
        <h1 className="text-[32px] font-bold text-center text-[#2d3748] tracking-tight mb-3">
          Forgot Your Password?
        </h1>

        {/* Description */}
        <p className="text-center text-[14px] text-zinc-500 mb-8 leading-relaxed">
          Enter your email address and we'll send you a 6-digit code to reset your password.
        </p>

        {/* Email Input */}
        <form onSubmit={handleSubmit} className="space-y-0">
          <input
            type="email"
            placeholder="tom@cruise.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded border border-zinc-200 focus:outline-none focus:border-[#68d391] focus:ring-1 focus:ring-[#68d391] text-[15px] placeholder:text-zinc-400 bg-white"
          />

          {/* Captcha space — invisible placeholder to preserve layout */}
          <div
            className="flex items-center justify-between border border-zinc-200 rounded p-2 mx-auto w-[300px] bg-[#f9fafb] mt-5 mb-6 shadow-sm invisible"
            aria-hidden="true"
          >
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-zinc-300 rounded bg-white shadow-inner ml-1"></div>
              <span className="text-[14px] text-zinc-700 font-sans">Verify you are human</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="flex -space-x-1 mb-0.5">
                <svg className="w-6 h-4" viewBox="0 0 24 24">
                  <path fill="#F6821F" d="M16 8.5c-.24 0-.48.04-.71.1-.38-2.31-2.4-4.1-4.79-4.1-1.74 0-3.23.95-4.04 2.38-.28-.05-.57-.08-.87-.08-2.61 0-4.73 2.12-4.73 4.73 0 2.61 2.12 4.73 4.73 4.73h10.4c2.61 0 4.73-2.12 4.73-4.73 0-2.61-2.12-4.73-4.73-4.73z" />
                </svg>
              </div>
              <span className="text-[7.5px] font-black text-[#56595F] tracking-wide leading-none">CLOUDFLARE</span>
              <span className="text-[6.5px] text-zinc-500 mt-0.5">Privacy • Terms</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-[#68d391] hover:bg-[#5bb87d] text-white py-3 rounded font-medium text-[15px] transition-colors shadow-sm"
          >
            Send Reset Code
          </button>
        </form>

        {/* Back to Sign In */}
        <p className="mt-6 text-center text-[14px] text-zinc-500">
          Remember your password?{' '}
          <Link href="/signin" className="text-[#4299e1] hover:underline font-medium">
            Sign In
          </Link>
        </p>
      </div>

      {/* Chat Widget */}
      <div className="fixed bottom-6 right-6 w-[52px] h-[52px] bg-white rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.1)] border border-zinc-100 flex items-center justify-center cursor-pointer hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] transition-shadow">
        <MessageSquare className="w-[22px] h-[22px] text-zinc-600 fill-zinc-600" />
      </div>
    </div>
  );
}
