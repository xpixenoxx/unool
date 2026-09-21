'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Instagram, 
  Twitter, 
  Youtube, 
  Facebook, 
  Linkedin, 
  MessageCircle, // for Threads
  Loader2
} from 'lucide-react';
import { getAccessToken } from '@/lib/supabase/browser';

const accounts = [
  { id: 'instagram', name: 'Instagram', icon: Instagram },
  { id: 'twitter', name: 'Twitter/X', icon: Twitter },
  { id: 'youtube', name: 'YouTube', icon: Youtube },
  { id: 'facebook', name: 'Facebook', icon: Facebook },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin },
  { id: 'threads', name: 'Threads', icon: MessageCircle },
];

export default function AddAccountsPage() {
  const router = useRouter();

  const handleNext = () => {
    // Assuming next redirects to dashboard after finishing onboarding
    router.push('/dashboard');
  };

  const handleBack = () => {
    router.push('/onboarding/connect');
  };

  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  const handleConnectDirectly = async (acc: typeof accounts[0]) => {
    setIsConnecting(acc.id);
    
    try {
      // Strategy 1: Read session from sessionStorage (set during OTP verification)
      let accessToken: string | null = null;
      let storedUserId: string | null = null;
      
      try {
        const stored = sessionStorage.getItem('unool_session');
        if (stored) {
          const parsed = JSON.parse(stored);
          accessToken = parsed.access_token || null;
          storedUserId = parsed.userId || null;
        }
      } catch { /* ignore */ }
      
      // Strategy 2: Try browser Supabase client
      if (!accessToken) {
        try {
          accessToken = await getAccessToken();
        } catch { /* ignore */ }
      }
      
      // Strategy 3: Try /api/auth/me with Bearer token if we have one
      let workspaceId: string | null = null;
      
      if (accessToken) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${accessToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            workspaceId = data?.user?.workspaceId || null;
          }
        } catch { /* ignore */ }
      }
      
      // Strategy 4: Try /api/auth/me without Bearer (cookies)
      if (!workspaceId) {
        try {
          const res = await fetch('/api/auth/me');
          if (res.ok) {
            const data = await res.json();
            workspaceId = data?.user?.workspaceId || null;
          }
        } catch { /* ignore */ }
      }
      
      // Strategy 5: Use stored userId directly as workspaceId fallback
      if (!workspaceId && storedUserId) {
        workspaceId = storedUserId;
      }
      
      if (workspaceId) {
        const url = `/api/auth/platform/connect?platform=${acc.id}&returnUrl=/onboarding/connect&workspaceId=${workspaceId}`;
        window.location.href = url;
      } else {
        alert('Your session has expired or is invalid. Please sign in again.');
        window.location.href = '/signin';
      }
    } catch (e) {
      console.error('Failed to initiate platform connection', e);
      alert('Network error while preparing the connection. Please try again.');
      setIsConnecting(null);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center animate-in fade-in slide-in-from-right duration-500 min-w-[max(100%,700px)] -ml-[50px] px-[50px]">
        
        <h1 className="text-[28px] font-bold text-[#1f2937] mb-2 mt-4 text-center">Add all your accounts</h1>
        <p className="text-[15px] text-zinc-500 mb-10 text-center max-w-[500px]">
          Connect your social media accounts to post bridge and post to all of them at once.
        </p>

        {/* Grid of accounts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
          {accounts.map((acc) => {
            const Icon = acc.icon;
            const isLoading = isConnecting === acc.id;
            return (
              <div key={acc.id} className="bg-white rounded-lg border border-zinc-200 p-4 flex flex-col gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-zinc-700" />
                  <span className="text-[15px] font-medium text-zinc-800">{acc.name}</span>
                </div>
                <button 
                  onClick={() => handleConnectDirectly(acc)}
                  disabled={isLoading || isConnecting !== null}
                  className="w-full bg-[#68d391] hover:bg-[#5bb87d] text-white py-2 rounded font-medium text-[14px] transition-colors disabled:opacity-75 flex items-center justify-center h-[38px]"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                </button>
              </div>
            );
          })}
        </div>

      </div>

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-0 left-0 w-full h-[80px] bg-white border-t border-zinc-200 flex items-center justify-between px-6 lg:px-12 z-40">
        <button
          onClick={handleBack}
          className="text-zinc-500 hover:text-zinc-800 font-medium text-[14px] px-4 py-2 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="bg-[#68d391] hover:bg-[#5bb87d] text-white px-8 py-2.5 rounded font-semibold text-[15px] transition-colors shadow-sm"
        >
          Next
        </button>
      </div>
    </>
  );
}
