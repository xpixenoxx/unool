'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, MoreVertical, Loader2, CheckCircle2, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { PlatformBrandLogo, getPlatformConfig } from '@/components/dashboard/PlatformLogos';
import type { StudioProfile } from '@/lib/config/studioOnboarding';

interface Connection {
  id?: string;
  platformId: string;
  username: string;
  platformName: string;
  status?: 'connected' | 'expired' | 'revoked' | 'error';
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
  pinterest: '#E60023',
};

function ConnectPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [cloningVoice, setCloningVoice] = useState(false);
  const [clonedProfile, setClonedProfile] = useState<StudioProfile | null>(null);
  const [showSampleEnrich, setShowSampleEnrich] = useState(false);
  const [sampleText, setSampleText] = useState('');
  const hasTriggeredCloneRef = useRef(false);

  const getAuthHeaders = useCallback(async (json = false): Promise<HeadersInit> => {
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
    const headers: Record<string, string> = { 'Cache-Control': 'no-cache' };
    if (json) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }, []);

  const triggerVoiceClone = useCallback(
    async (opts?: {
      platform?: string;
      connectionId?: string;
      samplePosts?: string[];
      forceOverwrite?: boolean;
    }) => {
      setCloningVoice(true);
      try {
        const headers = await getAuthHeaders(true);
        const res = await fetch('/api/studio/voice-clone', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            platform: opts?.platform,
            connectionId: opts?.connectionId,
            samplePosts: opts?.samplePosts,
            forceOverwrite: opts?.forceOverwrite ?? false,
          }),
        });
        const data = (await res.json().catch(() => null)) as Record<string, any> | null;
        if (res.ok && data?.profile) {
          setClonedProfile(data.profile);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('studio-profile-updated', { detail: data.profile }));
          }
          if (opts?.samplePosts?.length) {
            setShowSampleEnrich(false);
            setSampleText('');
            setToast({ type: 'success', message: 'Voice Fingerprint sharpened from your sample posts!' });
          }
        }
      } catch {
        // Non-blocking: user can still proceed seamlessly
      } finally {
        setCloningVoice(false);
      }
    },
    [getAuthHeaders]
  );

  // Hydrate existing Voice Fingerprint if already calibrated
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const headers = await getAuthHeaders(false);
        const res = await fetch('/api/studio/voice-clone', {
          headers,
          credentials: 'include',
        });
        if (!res.ok || !active) return;
        const data = (await res.json().catch(() => null)) as Record<string, any> | null;
        if (active && data?.profile?.voiceFingerprint) {
          setClonedProfile(data.profile);
        }
      } catch {
        // Silent
      }
    })();
    return () => {
      active = false;
    };
  }, [getAuthHeaders]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = () => setOpenDropdown(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const loadConnections = useCallback(async (opts?: { fresh?: boolean }) => {
    const clientDebug: string[] = [];
    try {
      // Get access token from multiple sources
      let token: string | null = null;

      // Source 1: sessionStorage (set during OTP verification)
      try {
        const stored = sessionStorage.getItem('unool_session');
        if (stored) {
          token = JSON.parse(stored).access_token || null;
          clientDebug.push(token ? 'session_token_found' : 'session_no_token');
        } else {
          clientDebug.push('no_session_storage');
        }
      } catch { clientDebug.push('session_error'); }

      // Source 2: Supabase browser client
      if (!token) {
        try {
          const { getAccessToken } = await import('@/lib/supabase/browser');
          token = await getAccessToken();
          clientDebug.push(token ? 'browser_token_found' : 'browser_no_token');
        } catch { clientDebug.push('browser_error'); }
      }

      // Build request with both credentials and Bearer token
      const headers: HeadersInit = { 'Cache-Control': 'no-cache' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      clientDebug.push(`fetching:hasToken=${!!token}`);

      const res = await fetch(
        `/api/platform/connections?${opts?.fresh ? 'fresh=1&' : ''}_t=${Date.now()}`,
        {
          headers,
          credentials: 'include', // Send cookies too
        }
      );

      clientDebug.push(`response:${res.status}`);

      if (res.ok) {
        const data = await res.json();
        clientDebug.push(`data:totalFound=${data.totalFound || 0}`);

        // Capture server debug info
        if (data.debug) {
          clientDebug.push(...data.debug.map((d: string) => `srv:${d}`));
        }

        if (Array.isArray(data.accounts) && data.accounts.length > 0) {
          const mappedConnections: Connection[] = data.accounts
            .filter(
              (acct: any) =>
                acct.status === 'connected' ||
                acct.status === 'expired' ||
                acct.status === 'revoked' ||
                acct.status === 'error'
            )
            .map((acct: any) => {
              const platformName = acct.platform === 'x'
                ? 'X (Twitter)'
                : acct.platform.charAt(0).toUpperCase() + acct.platform.slice(1);
              const isExpired =
                acct.status === 'expired' || acct.status === 'revoked' || acct.status === 'error';
              return {
                id: acct.id,
                platformId: acct.platform,
                username: acct.username || acct.displayName || acct.platform || 'User',
                platformName: isExpired ? `${platformName} (Expired)` : platformName,
                status: acct.status,
                profileLogo: acct.avatarUrl || undefined,
              };
            });
          clientDebug.push(`mappedAccounts:${mappedConnections.length}`);
          setConnections(mappedConnections);
        } else if (data.connections) {
          const mappedConnections: Connection[] = [];
          Object.entries(data.connections).forEach(([, conn]: [string, any]) => {
            if (
              conn.status === 'connected' ||
              conn.status === 'expired' ||
              conn.status === 'revoked' ||
              conn.status === 'error'
            ) {
              const platformName = conn.platform === 'x' ? 'X (Twitter)' 
                : conn.platform.charAt(0).toUpperCase() + conn.platform.slice(1);
              const isExpired =
                conn.status === 'expired' || conn.status === 'revoked' || conn.status === 'error';
              mappedConnections.push({
                platformId: conn.platform,
                username: conn.username || conn.platform || 'User',
                platformName: isExpired ? `${platformName} (Expired)` : platformName,
                status: conn.status,
              });
            }
          });
          clientDebug.push(`mapped:${mappedConnections.length}`);
          setConnections(mappedConnections);
        }
      } else {
        const text = await res.text();
        clientDebug.push(`error_body:${text.slice(0, 200)}`);
        console.error('Failed to fetch connections:', res.status, text);
      }
    } catch (e) {
      clientDebug.push(`fetch_error:${e instanceof Error ? e.message : String(e)}`);
      console.error('Error loading connections:', e);
    } finally {
      setDebugInfo(clientDebug);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Clean up the #_ or #_=_ fragment that Meta/Threads appends to URLs after OAuth
    if (typeof window !== 'undefined' && (window.location.hash === '#_' || window.location.hash === '#_=_')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    // Check for success/error params from OAuth callback
    const connectedPlatform = searchParams.get('connected');
    const voiceCloneParam = searchParams.get('voiceClone');
    const connectionIdParam = searchParams.get('connectionId');
    const error = searchParams.get('error');
    const errorDetail = searchParams.get('detail');
    const platformParam = searchParams.get('platform');
    const limitParam = searchParams.get('limit');
    const planParam = searchParams.get('plan');

    if (connectedPlatform) {
      const platformName = connectedPlatform === 'x'
        ? 'X (Twitter)'
        : connectedPlatform.charAt(0).toUpperCase() + connectedPlatform.slice(1);
      setToast({ type: 'success', message: `${platformName} account connected successfully!` });
      // Clean up the URL params without re-navigation
      const url = new URL(window.location.href);
      url.searchParams.delete('connected');
      url.searchParams.delete('voiceClone');
      url.searchParams.delete('connectionId');
      window.history.replaceState(null, '', url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : ''));

      const isVoicePlatform = ['linkedin', 'x', 'instagram', 'threads', 'bluesky'].includes(
        connectedPlatform.toLowerCase()
      );
      if ((voiceCloneParam === 'auto' || isVoicePlatform) && !hasTriggeredCloneRef.current) {
        hasTriggeredCloneRef.current = true;
        triggerVoiceClone({
          platform: connectedPlatform.toLowerCase(),
          connectionId: connectionIdParam || undefined,
        });
      }
    } else if (error) {
      const pName = platformParam
        ? platformParam === 'x'
          ? 'X (Twitter)'
          : platformParam.charAt(0).toUpperCase() + platformParam.slice(1)
        : 'Channel';
      const description = searchParams.get('description') || errorDetail;
      let friendly = description || `Connection failed (${error.replace(/_/g, ' ')})`;
      if (error === 'oauth_denied') {
        friendly = `${pName} connection was cancelled.`;
      } else if (error === 'invalid_state') {
        friendly = `Connection session expired. Please try connecting ${pName} again.`;
      } else if (error === 'oauth_config_missing') {
        friendly = `${pName} OAuth is not configured on this environment yet.`;
      } else if (
        error === 'quota_exceeded' ||
        error === 'platform_limit' ||
        error === 'channel_limit' ||
        error === 'channel_limit_exceeded'
      ) {
        friendly = `Channel limit reached${limitParam ? ` (${limitParam})` : ''}${planParam ? ` on the ${planParam} plan` : ''}. Remove a channel or upgrade to add ${pName}.`;
      } else if (error === 'access_denied' || error === 'permission_denied') {
        friendly = `Missing required permissions for ${pName}. Please approve all requested scopes.`;
      } else if (error === 'unsupported_platform') {
        friendly = `Unsupported platform${platformParam ? `: ${platformParam}` : ''}.`;
      }
      setToast({ type: 'error', message: friendly });
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      url.searchParams.delete('description');
      url.searchParams.delete('detail');
      url.searchParams.delete('platform');
      url.searchParams.delete('limit');
      url.searchParams.delete('plan');
      window.history.replaceState(null, '', url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : ''));
    }

    // Auto-dismiss toast after 6 seconds
    if (connectedPlatform || error) {
      setTimeout(() => setToast(null), 6000);
    }

    loadConnections({ fresh: Boolean(connectedPlatform) });
  }, [searchParams, loadConnections, triggerVoiceClone]);

  const handleNext = () => {
    router.push('/dashboard');
  };

  const handleBack = () => {
    router.push('/onboarding/start');
  };

  const handleRemoveConnection = async (platformId: string, connectionId?: string) => {
    setOpenDropdown(null);
    try {
      const url = connectionId
        ? `/api/platform/connections/${encodeURIComponent(platformId)}?connectionId=${encodeURIComponent(connectionId)}`
        : `/api/platform/connections/${encodeURIComponent(platformId)}`;
      const res = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to remove account');
      }
      setConnections((prev) =>
        connectionId
          ? prev.filter((c) => c.id !== connectionId)
          : prev.filter((c) => c.platformId !== platformId)
      );
      setToast({ type: 'success', message: 'Account disconnected.' });
    } catch (err) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to disconnect account',
      });
    }
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
              <div key={index} className="w-full bg-white border border-zinc-200 rounded-lg p-3 flex items-center justify-between shadow-sm relative">
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
                      style={{ backgroundColor: getPlatformConfig(connection.platformId).color || '#6b7280' }}
                    >
                      {connection.platformLogo ? (
                        <img src={connection.platformLogo} alt={connection.platformName} className="w-full h-full object-cover" />
                      ) : (
                        <PlatformBrandLogo platform={connection.platformId} size={12} className="text-white" />
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
                  <div
                    className={`w-[6px] h-[6px] rounded-full ${
                      connection.status && connection.status !== 'connected'
                        ? 'bg-[#f59e0b]'
                        : 'bg-[#10b981]'
                    }`}
                    title={
                      connection.status && connection.status !== 'connected'
                        ? 'Needs reconnect'
                        : 'Connected'
                    }
                  />
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
                      {connection.status && connection.status !== 'connected' && (
                        <button
                          onClick={() => {
                            setOpenDropdown(null);
                            const reconnectUrl = `/api/auth/platform/connect?platform=${encodeURIComponent(
                              connection.platformId
                            )}&returnUrl=${encodeURIComponent('/onboarding/connect')}${
                              connection.id
                                ? `&reconnectConnectionId=${encodeURIComponent(connection.id)}`
                                : ''
                            }`;
                            window.location.href = reconnectUrl;
                          }}
                          className="text-[13px] text-amber-600 hover:bg-zinc-50 w-full px-3 py-2 flex items-center justify-center gap-2 transition-colors"
                        >
                          Reconnect
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveConnection(connection.platformId, connection.id)}
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

          {/* Zero-Form Voice Clone Live Card */}
          {(cloningVoice || clonedProfile?.voiceFingerprint) && (
            <div className="w-full mt-4 rounded-xl border border-[#E5D7BF] bg-[#FFFDF9] p-4 shadow-sm animate-in fade-in duration-300">
              {cloningVoice ? (
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#F5EFE2] border border-[#E5D7BF] flex items-center justify-center shrink-0 mt-0.5">
                    <Loader2 className="w-4 h-4 text-[#A46728] animate-spin" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[#231C16]">
                      Cloning your writing voice in the background…
                    </p>
                    <p className="text-[12.5px] text-[#6E5A48] mt-0.5 leading-relaxed">
                      Ingesting up to your top 20 historical posts to map your hook style, sentence cadence, and vocabulary — zero forms required.
                    </p>
                  </div>
                </div>
              ) : clonedProfile?.voiceFingerprint ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EEF7F1] text-[#236B42] border border-[#B8DEC6]">
                        <Sparkles className="w-3 h-3" />
                        Voice Fingerprint Ready
                      </span>
                      <span className="text-[11.5px] text-zinc-500">
                        {clonedProfile.voiceFingerprint.postsAnalyzed > 0
                          ? `${clonedProfile.voiceFingerprint.postsAnalyzed} historical post${clonedProfile.voiceFingerprint.postsAnalyzed === 1 ? '' : 's'} analyzed`
                          : 'Calibrated from connected profile'}
                      </span>
                    </div>
                  </div>

                  <p className="text-[13px] text-[#3D2B1F] leading-relaxed">
                    {clonedProfile.voiceFingerprint.voiceSummary}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-md text-[11.5px] font-medium bg-[#F5EFE2] text-[#5C4315] border border-[#E5D7BF]">
                      {clonedProfile.role}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[11.5px] font-medium bg-[#FAF7F2] text-[#3D2B1F] border border-[#E5D7BF]">
                      Tone: {clonedProfile.tone}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[11.5px] font-medium bg-[#FAF7F2] text-[#3D2B1F] border border-[#E5D7BF]">
                      Style: {clonedProfile.style}
                    </span>
                  </div>

                  {clonedProfile.voiceFingerprint.postsAnalyzed < 3 && (
                    <div className="pt-1">
                      {!showSampleEnrich ? (
                        <button
                          type="button"
                          onClick={() => setShowSampleEnrich(true)}
                          className="text-[12px] font-medium text-[#8A6726] hover:text-[#5C4315] underline underline-offset-2"
                        >
                          Want sharper precision? Paste 2–3 past posts (optional)
                        </button>
                      ) : (
                        <div className="space-y-2 pt-1">
                          <textarea
                            value={sampleText}
                            onChange={(e) => setSampleText(e.target.value)}
                            rows={4}
                            placeholder="Paste 2–3 of your favorite past LinkedIn/X/Instagram posts (separate posts with --- or a blank line)..."
                            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[12.5px] text-zinc-800 focus:outline-none focus:border-[#C4A265]"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const samples = sampleText
                                  .split(/\n\s*---+\s*\n|\n{3,}/)
                                  .map((s) => s.trim())
                                  .filter((s) => s.length >= 18);
                                if (samples.length > 0) {
                                  triggerVoiceClone({ samplePosts: samples, forceOverwrite: true });
                                }
                              }}
                              disabled={sampleText.trim().length < 18}
                              className="px-3 py-1.5 rounded-md bg-[#231C16] text-white text-[12px] font-semibold hover:bg-black disabled:opacity-50"
                            >
                              Sharpen Voice DNA
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowSampleEnrich(false)}
                              className="px-2.5 py-1.5 text-[12px] text-zinc-500 hover:text-zinc-700"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-1 flex items-center justify-between gap-2 border-t border-[#F0E8DA]">
                    <span className="text-[11.5px] text-zinc-500">
                      Your first Studio AI draft is pre-calibrated to your voice.
                    </span>
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard/studio')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#231C16] hover:bg-black text-white text-[12.5px] font-semibold transition-colors"
                    >
                      <span>Write First Draft</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-zinc-200 z-40">
        <div className="h-[80px] w-full max-w-[1152px] flex items-center justify-between mx-auto px-[24px]">
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
