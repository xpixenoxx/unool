'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isConnectStep = pathname?.includes('/onboarding/connect');

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col font-sans relative pb-20">
      {/* Top Header */}
      <header className="fixed top-0 w-full bg-white border-b border-zinc-200 z-10">
        <div className="h-[80px] w-full max-w-[1152px] flex items-center justify-between mx-auto px-[24px]">
          
          {/* Logo left */}
          <div className="flex items-center">
            <img src="/logo.png" alt="Unool Logo" className="w-[65px] h-[65px] object-contain" />
          </div>

          {/* Progress indicator center */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full ${isConnectStep ? 'bg-[#68d391]' : 'bg-[#68d391]'} text-white flex items-center justify-center text-[13px] font-semibold`}>1</div>
              <div className={`w-16 h-[2px] ${isConnectStep ? 'bg-[#68d391]' : 'bg-zinc-200'}`}></div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full ${isConnectStep ? 'bg-[#68d391] text-white' : 'bg-zinc-200 text-zinc-500'} flex items-center justify-center text-[13px] font-semibold`}>2</div>
              <div className="w-16 h-[2px] bg-zinc-200"></div>
            </div>
            <div className="w-7 h-7 rounded-full bg-zinc-200 text-zinc-500 flex items-center justify-center text-[13px] font-semibold">3</div>
          </div>

          {/* User avatar right */}
          <div className="w-8 h-8 rounded-full bg-[#e6f7ec] text-[#34a853] flex items-center justify-center text-[13px] font-bold">
            U
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[600px] mx-auto mt-[80px] pt-12 px-4 pb-24">
        {children}
      </main>

      {/* Chat Bubble placeholder */}
      <div className="fixed bottom-6 right-6 w-[52px] h-[52px] bg-white rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.1)] border border-zinc-100 flex items-center justify-center cursor-pointer hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] transition-shadow z-50">
        <svg className="w-6 h-6 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"></path>
        </svg>
      </div>
    </div>
  );
}
