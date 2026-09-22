'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, MoreVertical, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface Connection {
  platformId: string;
  username: string;
  platformName: string;
  profileLogo?: string;
  platformLogo?: string;
}

// Platform brand colors for the badge
const PLATFORM_BADGE_COLORS: Record<string, string> = {
  linkedin: '#0a66c2',
  threads: '#000000',
  x: '#000000',
  twitter: '#000000',
  facebook: '#1877F2',
  instagram: '#E4405F',
  youtube: '#FF0000',
  whatsapp: '#25D366',
};

function ConnectPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = () => setOpenDropdown(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const loadConnections = useCallback(async () => {
    try {
      let token: string | null = null;
      try {
        const stored = sessionStorage.getItem('unool_session');
        if (stored) token = JSON.parse(stored).access_token || null;
      } catch { /* ignore */ }

      if (!token) {
        try {
          const { getAccessToken } = await import('@/lib/supabase/browser');
          token = await getAccessToken();
        } catch { /* ignore */ }
      }

      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/platform/connections', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.connections) {
          const mappedConnections: Connection[] = [];
          Object.entries(data.connections).forEach(([, conn]: [string, any]) => {
            if (conn.status === 'connected') {
              mappedConnections.push({
                platformId: conn.platform,
                username: conn.username || 'User',
                platformName: conn.platform.charAt(0).toUpperCase() + conn.platform.slice(1),
              });
            }
          });
          setConnections(mappedConnections);
        }
      } else {
        console.error('Failed to fetch connections:', res.status, await res.text());
      }
    } catch (e) {
      console.error('Error loading connections:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Clean up the #_ fragment that Meta/Threads appends to URLs after OAuth
    if (typeof window !== 'undefined' && window.location.hash === '#_') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    // Check for success/error params from OAuth callback
    const connectedPlatform = searchParams.get('connected');
    const error = searchParams.get('error');
    const errorDetail = searchParams.get('detail');

    if (connectedPlatform) {
      const platformName = connectedPlatform.charAt(0).toUpperCase() + connectedPlatform.slice(1);
      setToast({ type: 'success', message: `${platformName} account connected successfully!` });
      // Clean up the URL params without re-navigation
      const url = new URL(window.location.href);
      url.searchParams.delete('connected');
      window.history.replaceState(null, '', url.pathname);
    } else if (error) {
      const description = searchParams.get('description') || errorDetail || error;
      setToast({ type: 'error', message: `Connection failed: ${description}` });
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      url.searchParams.delete('description');
      url.searchParams.delete('detail');
      url.searchParams.delete('platform');
      window.history.replaceState(null, '', url.pathname);
    }

    // Auto-dismiss toast after 6 seconds
    if (connectedPlatform || error) {
      setTimeout(() => setToast(null), 6000);
    }

    loadConnections();
  }, [searchParams, loadConnections]);

  const handleNext = () => {
    router.push('/dashboard');
  };

  const handleBack = () => {
    router.push('/onboarding/start');
  };

  return (
    <>
      <div className="flex flex-col items-center animate-in fade-in slide-in-from-right duration-500">
        
        <h1 className="text-[28px] font-bold text-[#1f2937] mb-2 mt-4">Connect your accounts</h1>
        <p className="text-[15px] text-zinc-500 mb-10 text-center max-w-[400px]">
          Connect and then manage all your social media accounts from one place
        </p>

        {/* Toast notification */}
        {toast && (
          <div className={`w-full max-w-[500px] mb-6 px-4 py-3 rounded-lg flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
            toast.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <span className="text-[14px] font-medium">{toast.message}</span>
            <button 
              onClick={() => setToast(null)} 
              className="ml-auto text-sm opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        <div className="w-full space-y-4">
          
          {/* Add Connection Button */}
          <button 
            onClick={() => router.push('/onboarding/connect/add')}
            className="w-full h-16 border-2 border-dashed border-zinc-200 rounded-lg flex items-center justify-center gap-2 text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 hover:bg-white transition-colors bg-white/50">
            <Plus className="w-4 h-4" />
            <span className="text-[14px] font-semibold">Add connection</span>
          </button>

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          ) : (
            connections.map((connection, index) => (
              <div key={index} className="w-fit min-w-[340px] bg-white border border-zinc-200 rounded-lg p-3 flex items-center justify-between shadow-sm relative">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-[#7052c4] text-white flex items-center justify-center font-semibold text-[18px] overflow-hidden">
                      {connection.profileLogo ? (
                        <img src={connection.profileLogo} alt={connection.username} className="w-full h-full object-cover" />
                      ) : (
                        connection.username?.[0]?.toUpperCase() || 'A'
                      )}
                    </div>
                    <div 
                      className="absolute -bottom-1 -right-1 w-[20px] h-[20px] rounded flex items-center justify-center border-2 border-white overflow-hidden"
                      style={{ backgroundColor: PLATFORM_BADGE_COLORS[connection.platformId] || '#6b7280' }}
                    >
                      {connection.platformLogo ? (
                        <img src={connection.platformLogo} alt={connection.platformName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-[10px] font-bold">
                          {connection.platformId === 'linkedin' ? 'in' : connection.platformId === 'threads' ? '@' : connection.platformId.substring(0, 1).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col ml-1">
                    <span className="text-[14px] font-medium text-[#1f2937] leading-tight">{connection.platformName}</span>
                    <span className="text-[13px] text-zinc-400 mt-0.5">
                      {connection.username.startsWith('@') ? connection.username : `@${connection.username}`}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 ml-8 relative">
                  <div className="w-[6px] h-[6px] rounded-full bg-[#10b981]"></div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdown(openDropdown === index ? null : index);
                    }}
                    className="w-[28px] h-[28px] flex items-center justify-center bg-[#e5e7eb] text-zinc-500 rounded-md hover:bg-zinc-300 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  
                  {openDropdown === index && (
                    <div className="absolute top-10 right-0 w-[160px] bg-white border border-zinc-100 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.08)] py-1.5 z-10 flex flex-col">
                      <button 
                        onClick={() => {
                          // Handle removal logic here when ready
                          setOpenDropdown(null);
                        }}
                        className="text-[13px] text-red-500 hover:bg-zinc-50 w-full px-3 py-2 flex items-center justify-center gap-2 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"></path></svg>
                        Remove account
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

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

export default function OnboardingConnectPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center animate-in fade-in duration-500">
        <h1 className="text-[28px] font-bold text-[#1f2937] mb-2 mt-4">Connect your accounts</h1>
        <p className="text-[15px] text-zinc-500 mb-10 text-center max-w-[400px]">
          Connect and then manage all your social media accounts from one place
        </p>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
        </div>
      </div>
    }>
      <ConnectPageContent />
    </Suspense>
  );
}
