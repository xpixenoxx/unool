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
  const [selectedAccount, setSelectedAccount] = useState<typeof accounts[0] | null>(null);

  const handleNext = () => {
    // Assuming next redirects to dashboard after finishing onboarding
    router.push('/dashboard');
  };

  const handleBack = () => {
    router.push('/onboarding/connect');
  };

  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!selectedAccount) return;
    setIsConnecting(true);
    
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      
      let url = `/api/auth/platform/connect?platform=${selectedAccount.id}&returnUrl=/onboarding/connect`;
      if (data?.user?.workspaceId) {
        url += `&workspaceId=${data.user.workspaceId}`;
        window.location.href = url;
      } else {
        alert('Your session has expired or is invalid. Please sign in again.');
        window.location.href = '/signin';
      }
    } catch (e) {
      console.error('Failed to pre-fetch workspace ID', e);
      alert('Network error while preparing the connection. Please try again.');
      setIsConnecting(false);
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
            return (
              <div key={acc.id} className="bg-white rounded-lg border border-zinc-200 p-4 flex flex-col gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-zinc-700" />
                  <span className="text-[15px] font-medium text-zinc-800">{acc.name}</span>
                </div>
                <button 
                  onClick={() => setSelectedAccount(acc)}
                  className="w-full bg-[#68d391] hover:bg-[#5bb87d] text-white py-2 rounded font-medium text-[14px] transition-colors"
                >
                  Add
                </button>
              </div>
            );
          })}
        </div>

        {/* Modal Overlay */}
        {selectedAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 mb-4">
                <selectedAccount.icon className="w-5 h-5 text-zinc-800" />
                <h2 className="text-[18px] font-bold text-zinc-900">Connect {selectedAccount.name}</h2>
              </div>
              
              <div className="flex gap-3 mb-8">
                <div className="w-2 h-2 rounded-full bg-[#68d391] mt-1.5 shrink-0"></div>
                <p className="text-[14px] text-zinc-500 leading-relaxed">
                  Make sure you are signed in to the {selectedAccount.name} Profile account you wish to connect. You may need to sign out and sign in to the correct account before proceeding.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 font-medium text-[14px]">
                <button 
                  onClick={() => setSelectedAccount(null)}
                  className="px-4 py-2.5 text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="px-5 py-2.5 bg-[#68d391] hover:bg-[#5bb87d] text-white rounded transition-colors shadow-sm disabled:opacity-75 flex items-center justify-center min-w-[140px]"
                >
                  {isConnecting ? (
                    <span className="flex items-center gap-2">
                       <Loader2 className="w-4 h-4 animate-spin" /> Connecting
                    </span>
                  ) : (
                    `Connect ${selectedAccount.name}`
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

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
