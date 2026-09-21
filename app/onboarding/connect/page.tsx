'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, MoreVertical, Loader2 } from 'lucide-react';

interface Connection {
  platformId: string;
  username: string;
  platformName: string;
  profileLogo?: string;
  platformLogo?: string;
}

export default function OnboardingConnectPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConnections() {
      try {
        const res = await fetch('/api/platform/connections');
        if (res.ok) {
          const data = await res.json();
          if (data.connections) {
            const mappedConnections: Connection[] = [];
            // Result is a map of platforms
            Object.entries(data.connections).forEach(([platformId, conn]: [string, any]) => {
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
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadConnections();
  }, []);

  const handleNext = () => {
    // Assuming next redirects to dashboard after finishing onboarding
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
              <div key={index} className="w-fit min-w-[320px] bg-white border border-zinc-200 rounded-lg p-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-[#7052c4] text-white flex items-center justify-center font-semibold text-lg overflow-hidden">
                      {connection.profileLogo ? (
                        <img src={connection.profileLogo} alt={connection.username} className="w-full h-full object-cover" />
                      ) : (
                        connection.username?.[0]?.toUpperCase() || 'A'
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-[18px] h-[18px] bg-[#0a66c2] rounded flex items-center justify-center border border-white overflow-hidden">
                      {connection.platformLogo ? (
                        <img src={connection.platformLogo} alt={connection.platformName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-[9px] font-bold">
                          {connection.platformId === 'linkedin' ? 'in' : connection.platformId.substring(0, 2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-semibold text-[#1f2937]">{connection.platformName}</span>
                    <span className="text-[13px] text-zinc-500">{connection.username}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 ml-6 mr-1">
                  <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                  <button className="text-zinc-400 hover:text-zinc-600 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
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
