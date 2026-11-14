'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Globe, PenTool, Settings, LogOut, ChevronLeft, Menu, LayoutDashboard, LayoutGrid, Radio, Network, BarChart3, Bell, CalendarDays, Zap, CreditCard, Lock, Gift, Copy, Check, ExternalLink, UserPlus, Loader2, X } from 'lucide-react';
import { UserProvider, useUserContext } from '@/lib/hooks/use-user-context';
import { FeatureFlagsProvider, useFeatureFlags } from '@/lib/hooks/use-feature-flags';
import { SignalStrip } from './signal/SignalStrip';
import { SubdomainClaimPopup } from '@/components/onboarding/SubdomainClaimPopup';
import { toast } from 'sonner';
import { DashboardTimeTracker } from '@/components/analytics/DashboardTimeTracker';
import { clearAllClientCaches } from '@/lib/utils/clientCache';

/* ─── Biscuit color palette (used by main page background) ── */
const biscuit = {
  bg: '#F7F3ED',
  sidebar: '#F0EBE3',
  sidebarBorder: '#E5DFD5',
  card: '#FFFDF9',
  cardHover: '#FAF7F2',
  accent: '#C4A265',
  accentLight: '#D4B87A',
  accentBg: '#F5EFE2',
  text: '#3D2B1F',
  textMuted: '#8B7355',
  textLight: '#A69279',
  activeBg: '#3D2B1F',
  activeFg: '#FAF7F2',
  border: '#E8E0D4',
  hoverBg: '#EDE7DD',
};

/* ─── Biscuit & Editorial Palette (Images 2 & 3) ───────────────────────── */
const railTheme = {
  sidebarBg: '#FAF7F2',
  sidebarBorder: '#E8E0D4',
  cardBg: '#FAF7F2',
  cardBorder: '#E8DFD5',
  cardHover: '#F3EAD9',
  accentTerracotta: '#C8613D',
  activePillBg: '#FFFFFF',
  activePillBorder: '#E8DFD5',
  activePillDotHalo: '#F0D8CA',
  iconBg: '#EDE5D8',
  iconHoverBg: '#E5DCCF',
  iconFg: '#4A3B32',
  textDark: '#231C16',
  textMuted: '#7A6B60',
  trackSolid: '#C8613D',
  trackDotted: '#C8B7A6',
  serifLabel: '#C8613D',
};

interface NavItem {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  exact?: boolean;
  badge?: number | string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

interface SavedUnoolAccount {
  userId: string;
  email: string;
  displayName: string;
  subdomain?: string | null;
  avatarUrl?: string | null;
  switchToken: string;
  lastActiveAt: number;
}

const SAVED_ACCOUNTS_STORAGE_KEY = 'unool_saved_accounts_v1';

function readSavedAccountsFromStorage(): SavedUnoolAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SAVED_ACCOUNTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is SavedUnoolAccount =>
        Boolean(item && typeof item.userId === 'string' && typeof item.email === 'string' && typeof item.switchToken === 'string')
    );
  } catch {
    return [];
  }
}

function writeSavedAccountsToStorage(accounts: SavedUnoolAccount[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SAVED_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // Ignore storage quota errors
  }
}

function DashboardSidebar({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}) {
  const { user, profile, workspace, pendingPostsCount, loading, refetch } = useUserContext();
  const { flags: featureFlags } = useFeatureFlags();
  const pathname = usePathname();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [dynamicPendingCount, setDynamicPendingCount] = useState<number>(pendingPostsCount || 0);
  const [savedAccounts, setSavedAccounts] = useState<SavedUnoolAccount[]>([]);
  const [switchingAccountId, setSwitchingAccountId] = useState<string | null>(null);

  // Sync current logged-in Unool user into the Instagram-style multi-account switcher vault
  useEffect(() => {
    setSavedAccounts(readSavedAccountsFromStorage());
  }, []);

  useEffect(() => {
    if (!user?.id || !user?.email) return;
    let isMounted = true;

    (async () => {
      try {
        const res = await fetch('/api/auth/switch-account', { credentials: 'include' });
        if (!res.ok || !isMounted) return;
        const data = await res.json();
        const acct = data?.account;
        if (!acct?.userId || !acct?.switchToken) return;

        const existing = readSavedAccountsFromStorage();
        const nextEntry: SavedUnoolAccount = {
          userId: acct.userId,
          email: acct.email,
          displayName: acct.displayName || profile?.name || acct.email.split('@')[0],
          subdomain: acct.subdomain ?? profile?.subdomain ?? null,
          avatarUrl: acct.avatarUrl ?? user?.avatarUrl ?? null,
          switchToken: acct.switchToken,
          lastActiveAt: Date.now(),
        };

        const filtered = existing.filter((a) => a.userId !== nextEntry.userId && a.email.toLowerCase() !== nextEntry.email.toLowerCase());
        const updated = [nextEntry, ...filtered].slice(0, 8);
        writeSavedAccountsToStorage(updated);
        if (isMounted) {
          setSavedAccounts(updated);
        }
      } catch {
        // Ignore transient sync errors
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.email, user?.avatarUrl, profile?.name, profile?.subdomain]);

  const handleSwitchUnoolAccount = async (targetAccount: SavedUnoolAccount) => {
    if (!targetAccount || targetAccount.userId === user?.id || switchingAccountId) return;
    setSwitchingAccountId(targetAccount.userId);
    try {
      const res = await fetch('/api/auth/switch-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ switchToken: targetAccount.switchToken }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.success) {
        // Remove invalid/expired saved token and redirect to sign-in with email prefilled
        const remaining = readSavedAccountsFromStorage().filter((a) => a.userId !== targetAccount.userId);
        writeSavedAccountsToStorage(remaining);
        setSavedAccounts(remaining);
        toast.error(data?.message || 'Session expired for that account. Please sign in again.');
        window.location.href = `/signin?addAccount=true&email=${encodeURIComponent(targetAccount.email)}`;
        return;
      }

      if (data.switchToken) {
        const current = readSavedAccountsFromStorage();
        const updated = current.map((a) =>
          a.userId === targetAccount.userId ? { ...a, switchToken: data.switchToken, lastActiveAt: Date.now() } : a
        );
        writeSavedAccountsToStorage(updated);
        setSavedAccounts(updated);
      }

      if (data.session?.access_token && data.session?.refresh_token) {
        try {
          const { getSupabaseBrowserClient } = await import('@/lib/supabase/browser');
          const supabase = getSupabaseBrowserClient();
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
        } catch {
          // Non-fatal
        }
      }

      clearAllClientCaches();
      toast.success(`Switched to ${targetAccount.displayName}`);
      await refetch();
      window.location.reload();
    } catch {
      toast.error('Failed to switch account');
    } finally {
      setSwitchingAccountId(null);
    }
  };

  const handleRemoveSavedAccount = (targetUserId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = readSavedAccountsFromStorage().filter((a) => a.userId !== targetUserId);
    writeSavedAccountsToStorage(updated);
    setSavedAccounts(updated);
    toast.success('Removed saved account from switcher');
  };

  // Sync with context updates
  useEffect(() => {
    if (typeof pendingPostsCount === 'number') {
      setDynamicPendingCount(pendingPostsCount);
    }
  }, [pendingPostsCount]);

  // Real-time synchronization for 24h drafts count across window focus, custom events, and periodic time decay
  useEffect(() => {
    const fetchLatestDrafts = async () => {
      try {
        const res = await fetch('/api/posts/pending-count', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const count = typeof data.drafts === 'number' ? data.drafts : (typeof data.count === 'number' ? data.count : 0);
          setDynamicPendingCount(count);
        }
      } catch {
        // Ignore network drops
      }
    };

    // Initial pendingPostsCount is already hydrated via /api/user/context in useUserContext()
    // Only re-fetch on publish events, window focus, or periodic decay interval.

    const handlePublishEvent = () => {
      fetchLatestDrafts();
    };

    const handlePendingDirectUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ count?: number }>;
      if (typeof customEvent.detail?.count === 'number') {
        setDynamicPendingCount(customEvent.detail.count);
      } else {
        fetchLatestDrafts();
      }
    };

    window.addEventListener('signal-strip-publish', handlePublishEvent);
    window.addEventListener('signal-posts-updated', handlePublishEvent);
    window.addEventListener('signal-pending-count-updated', handlePendingDirectUpdate);
    window.addEventListener('focus', fetchLatestDrafts);

    // Periodic poll every 30 seconds so time-decay automatically drops drafts past 24h
    const interval = setInterval(fetchLatestDrafts, 30000);

    return () => {
      window.removeEventListener('signal-strip-publish', handlePublishEvent);
      window.removeEventListener('signal-posts-updated', handlePublishEvent);
      window.removeEventListener('signal-pending-count-updated', handlePendingDirectUpdate);
      window.removeEventListener('focus', fetchLatestDrafts);
      clearInterval(interval);
    };
  }, []);

  // Supabase Realtime live updates for drafts specific to this user/workspace
  useEffect(() => {
    const workspaceId = workspace?.id;
    if (!workspaceId) return;

    let channel: any = null;
    let isMounted = true;

    (async () => {
      try {
        const { getSupabaseBrowserClient } = await import('@/lib/supabase/browser');
        const supabase = getSupabaseBrowserClient();

        channel = supabase.channel(`sidebar-drafts-live-${workspaceId}`)
          .on(
            'postgres_changes' as any,
            { event: '*', schema: 'public', table: 'posts', filter: `workspace_id=eq.${workspaceId}` },
            async () => {
              if (!isMounted) return;
              try {
                const res = await fetch('/api/posts/pending-count', { credentials: 'include' });
                if (res.ok) {
                  const data = await res.json();
                  const count = typeof data.drafts === 'number' ? data.drafts : (typeof data.count === 'number' ? data.count : 0);
                  if (isMounted) setDynamicPendingCount(count);
                }
              } catch {
                // Ignore network drops
              }
            }
          )
          .subscribe();
      } catch (err) {
        console.warn('[DashboardSidebar] Realtime subscription notice', err);
      }
    })();

    return () => {
      isMounted = false;
      if (channel) {
        import('@/lib/supabase/browser').then(({ getSupabaseBrowserClient }) => {
          getSupabaseBrowserClient().removeChannel(channel);
        }).catch(() => {});
      }
    };
  }, [workspace?.id]);

  const navSections: NavSection[] = useMemo(() => [
    {
      items: [
        {
          id: 'overview',
          name: 'Overview',
          href: '/dashboard',
          icon: LayoutGrid,
          description: 'Dashboard home',
          exact: true,
        },
      ],
    },
    {
      title: 'Create',
      items: [
        {
          id: 'studio',
          name: 'Studio',
          href: '/dashboard/studio',
          icon: PenTool,
          description: 'Bio-link profile & persona templates',
        },
        {
          id: 'flightplan',
          name: 'Flight plan',
          href: '/dashboard/flightplan',
          icon: CalendarDays,
          description: '7-day AI content calendar',
        },
        {
          id: 'signal',
          name: 'Signal',
          href: '/dashboard/signal',
          icon: Radio,
          description: 'Cross-platform post composer',
          badge: dynamicPendingCount > 0 ? dynamicPendingCount : undefined,
        },
        ...(featureFlags.automationEnabled
          ? [{
              id: 'automation',
              name: 'Automation',
              href: '/dashboard/automation',
              icon: Zap,
              description: 'Instagram Comment & DM auto-reply',
            }]
          : []),
      ],
    },
    {
      title: 'Grow',
      items: [
        {
          id: 'unlock-gates',
          name: 'Unlock gates',
          href: '/dashboard/unlock-gates',
          icon: Lock,
          description: 'Follow-to-unlock content gates',
        },
        {
          id: 'referrals',
          name: 'Referrals',
          href: '/dashboard/referrals',
          icon: Gift,
          description: 'Earn rewards for referrals',
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          name: 'Profile',
          href: '/dashboard/profile',
          icon: Globe,
          description: 'Your public page',
        },
        {
          id: 'billing',
          name: 'Billing',
          href: '/dashboard/billing',
          icon: CreditCard,
          description: 'Plans & subscription',
        },
        {
          id: 'settings',
          name: 'Settings',
          href: '/dashboard/settings',
          icon: Settings,
          description: 'Account settings',
        },
      ],
    },
  ], [dynamicPendingCount, featureFlags.automationEnabled]);

  const flatNavItems = useMemo(() => navSections.flatMap((s) => s.items), [navSections]);

  const handleSignOut = async () => {
    clearAllClientCaches();
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch {
      // Ignore
    }
    window.location.replace('/signin');
  };

  const rawName = profile?.name || user?.fullName || '';
  const displayName = (rawName.toLowerCase() === 'user' || rawName.toLowerCase() === 'new user' || !rawName) ? (user?.email ? user.email.split('@')[0] : 'Creator') : rawName;
  const avatarLetter = displayName.charAt(0).toUpperCase() || 'U';
  const displayEmail = user?.email || '';
  const currentSubdomain = profile?.subdomain || '';
  const displayUrl = currentSubdomain ? `${currentSubdomain}.unool.co` : (displayEmail || 'unool.co');

  const handleCopyUrl = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!currentSubdomain) {
      toast.error('Set up your subdomain in Presence first');
      return;
    }
    const urlToCopy = `https://${currentSubdomain}.unool.co`;
    try {
      navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      toast.success(`Copied ${displayUrl} to clipboard!`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  const activeIndex = flatNavItems.findIndex((item) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(item.href + '/')
  );

  const sidebarClass = cn(
    'fixed inset-y-0 left-0 z-50 w-[240px] transition-transform duration-200 ease-out lg:translate-x-0',
    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
  );

  const navContent = (
    <nav className="flex-1 px-3 py-2 overflow-y-auto overflow-x-hidden select-none space-y-1">
      {navSections.map((section, sIndex) => {
        // Section header line is solid terracotta if current active item is in or past this section
        const firstItemInSec = section.items[0];
        const firstItemIdx = flatNavItems.findIndex((i) => i.id === firstItemInSec.id);
        const isThroughSolid = activeIndex >= firstItemIdx;

        return (
          <div key={section.title || `sec-${sIndex}`} className="flex flex-col space-y-1">
            {/* Section Heading (Images 2 & 3: Cormorant Garamond italic serif in warm terracotta with connecting line) */}
            {section.title && (
              <div className="flex items-center w-full h-[32px] my-0.5">
                {/* Vertical connecting line centered with circular icons (52px / 2 = 26px = 8px padding + 18px half-icon) */}
                <div className="w-[52px] flex items-center justify-center flex-shrink-0">
                  {isThroughSolid ? (
                    <div className="w-[2.5px] h-[24px] bg-[#C8613D] rounded-full" />
                  ) : (
                    <div className="w-0 h-[24px] border-l-[2px] border-dotted border-[#C8B7A6]" />
                  )}
                </div>
                <span
                  className="text-[15px] italic font-normal tracking-wide pl-1 select-none text-[#C8613D]"
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                  }}
                >
                  {section.title}
                </span>
              </div>
            )}

            {/* Section Items */}
            {section.items.map((item) => {
              const flatIndex = flatNavItems.findIndex((i) => i.id === item.id);
              const isActive = flatIndex === activeIndex;
              const Icon = item.icon;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  prefetch={true}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'group relative flex items-center w-full px-2 py-1.5 rounded-2xl transition-all duration-150 outline-none',
                    isActive
                      ? 'bg-white border border-[#E8DFD5] shadow-xs'
                      : 'hover:bg-[#F0EBE1] focus-visible:ring-1 focus-visible:ring-[#C8613D]'
                  )}
                  onMouseEnter={() => {
                    try {
                      router.prefetch(item.href);
                    } catch {}
                  }}
                >
                  {/* Icon Container (Images 2 & 3: Circular cream background or terracotta when active) */}
                  <div
                    className={cn(
                      'w-[36px] h-[36px] rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-150',
                      isActive
                        ? 'bg-[#C8613D] text-white shadow-xs'
                        : 'bg-[#EDE5D8] text-[#4A3B32] group-hover:bg-[#E5DCCF]'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Label */}
                  <span
                    className={cn(
                      'ml-3 truncate text-[14.5px] transition-colors duration-150',
                      isActive
                        ? 'font-semibold text-[#231C16]'
                        : 'font-medium text-[#231C16] group-hover:text-[#17120E]'
                    )}
                  >
                    {item.name}
                  </span>

                  {/* Active Beacon Glowing Dot (Image 2) */}
                  {isActive && (
                    <div className="ml-auto mr-1.5 relative flex items-center justify-center w-4 h-4 flex-shrink-0">
                      <span className="w-4 h-4 rounded-full bg-[#F0D8CA] flex items-center justify-center">
                        <span className="w-2 h-2 rounded-full bg-[#C8613D]" />
                      </span>
                    </div>
                  )}

                  {/* Notification Badge (Image 2 on Signal: terracotta pill with white count) */}
                  {!isActive && item.badge !== undefined && (
                    <div
                      className="ml-auto mr-1.5 px-2 min-w-[22px] h-[20px] rounded-full bg-[#C8613D] text-white text-[11px] font-bold flex items-center justify-center shadow-2xs flex-shrink-0"
                      title={`${item.badge} pending ${item.badge === 1 ? 'draft' : 'drafts'} (past 24h)`}
                    >
                      {item.badge}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );

  if (loading) {
    return (
      <aside
        className={sidebarClass}
        style={{
          backgroundColor: railTheme.sidebarBg,
          borderRight: `1px solid ${railTheme.sidebarBorder}`,
        }}
      >
        <div className="flex h-full flex-col">
          <div
            className="flex h-16 items-center px-4"
            style={{ borderBottom: `1px solid ${railTheme.sidebarBorder}` }}
          >
            <Link href="/dashboard" className="flex items-center gap-2">
              <img src="/unool-icon.png" alt="Unool Logo" className="w-[32px] h-[32px] object-contain opacity-80" />
              <span className="text-lg font-bold tracking-tight text-[#231C16]">unool</span>
            </Link>
          </div>
          <div className="flex-1 px-3 py-4 space-y-3 animate-pulse">
            <div className="h-10 rounded-2xl bg-[#EDE5D8]/60" />
            <div className="h-4 w-16 rounded bg-[#EDE5D8]/40 ml-10" />
            <div className="h-10 rounded-2xl bg-[#EDE5D8]/60" />
            <div className="h-10 rounded-2xl bg-[#EDE5D8]/60" />
            <div className="h-10 rounded-2xl bg-[#EDE5D8]/60" />
          </div>
          <div
            className="p-3 animate-pulse"
            style={{ borderTop: `1px solid ${railTheme.sidebarBorder}` }}
          >
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#EDE5D8]/40 border border-[#E8DFD5]">
              <div className="h-10 w-10 rounded-full bg-[#C8613D]/40" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-16 rounded bg-[#EDE5D8]" />
                <div className="h-3 w-24 rounded bg-[#EDE5D8]/60" />
              </div>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={sidebarClass}
      style={{
        backgroundColor: railTheme.sidebarBg,
        borderRight: `1px solid ${railTheme.sidebarBorder}`,
      }}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div
          className="flex h-16 items-center justify-between px-4 flex-shrink-0"
          style={{ borderBottom: `1px solid ${railTheme.sidebarBorder}` }}
        >
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <img
              src="/unool-icon.png"
              alt="Unool Logo"
              className="w-[32px] h-[32px] object-contain transition-transform duration-200 group-hover:scale-105"
            />
            <span className="text-lg font-bold tracking-tight text-[#231C16] group-hover:text-[#C8613D] transition-colors">
              unool
            </span>
          </Link>
          <button
            className="lg:hidden p-1.5 rounded-lg text-[#7A6B60] hover:text-[#231C16] hover:bg-[#EDE5D8] transition-colors"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Content (Image 2) */}
        {navContent}

        {/* Divider above user footer (Image 3) */}
        <div className="px-3 pt-1">
          <div className="border-t border-[#E8DFD5]" />
        </div>

        {/* User Footer Card (Image 3: Terracotta V avatar, usha, usha.unool.co, copy & dropdown menu) */}
        <div
          className="p-3 pt-2 flex-shrink-0"
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-full group flex items-center gap-3 p-2.5 rounded-2xl transition-all duration-200 text-left border border-[#E8DFD5] bg-[#FAF7F2] hover:bg-[#F3EAD9] shadow-xs focus-visible:ring-1 focus-visible:ring-[#C8613D] cursor-pointer"
              >
                {/* Avatar: Terracotta circle with white letter (V) matching Image 3 */}
                <div className="w-10 h-10 rounded-full bg-[#C8613D] text-white flex items-center justify-center font-serif text-lg font-bold flex-shrink-0 shadow-2xs overflow-hidden">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    avatarLetter
                  )}
                </div>

                {/* Name & URL */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#231C16] truncate leading-tight">
                    {displayName.toLowerCase() === 'user' ? 'usha' : displayName}
                  </p>
                  <p className="text-xs text-[#7A6B60] truncate mt-0.5 leading-tight">
                    {displayUrl}
                  </p>
                </div>

                {/* Interactive Copy Button */}
                <div
                  onClick={handleCopyUrl}
                  className="p-1 rounded-lg text-[#7A6B60] hover:text-[#C8613D] transition-colors flex-shrink-0"
                  title="Copy profile URL"
                  aria-label="Copy profile link"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-68 bg-[#FFFDF9] border border-[#E8DFD5] text-[#231C16] shadow-xl p-1.5 rounded-xl z-50"
              align="start"
              side="top"
              sideOffset={8}
            >
              <DropdownMenuLabel className="font-normal px-2.5 py-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A6B60]">
                    Switch Accounts
                  </span>
                  {savedAccounts.length > 1 && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#F3EAD9] text-[#C8613D]">
                      {savedAccounts.length} saved
                    </span>
                  )}
                </div>
              </DropdownMenuLabel>

              <div className="max-h-48 overflow-y-auto space-y-1 px-1 py-0.5">
                {(savedAccounts.length > 0
                  ? savedAccounts
                  : [
                      {
                        userId: user?.id || 'current',
                        email: displayEmail || 'usha@unool.co',
                        displayName,
                        subdomain: currentSubdomain || null,
                        avatarUrl: user?.avatarUrl || null,
                        switchToken: '',
                        lastActiveAt: Date.now(),
                      },
                    ]
                ).map((acct) => {
                  const isCurrent = Boolean(user?.id && acct.userId === user.id);
                  const isSwitching = switchingAccountId === acct.userId;
                  const acctLetter = (acct.displayName || acct.email || 'U').charAt(0).toUpperCase();
                  const acctSubLabel = acct.subdomain ? `${acct.subdomain}.unool.co` : acct.email;

                  return (
                    <div
                      key={acct.userId}
                      onClick={() => {
                        if (!isCurrent && acct.switchToken) {
                          handleSwitchUnoolAccount(acct);
                        }
                      }}
                      className={cn(
                        'flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-colors',
                        isCurrent
                          ? 'bg-[#F3EAD9]/75 border border-[#E8DFD5] cursor-default'
                          : 'hover:bg-[#F3EAD9] cursor-pointer'
                      )}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#C8613D] text-white flex items-center justify-center font-serif text-sm font-bold flex-shrink-0 overflow-hidden">
                        {acct.avatarUrl ? (
                          <img src={acct.avatarUrl} alt={acct.displayName} className="w-full h-full object-cover" />
                        ) : (
                          acctLetter
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#231C16] truncate leading-tight">
                          {acct.displayName}
                        </p>
                        <p className="text-[11px] text-[#7A6B60] truncate leading-tight">
                          {acctSubLabel}
                        </p>
                      </div>
                      {isSwitching ? (
                        <Loader2 className="w-3.5 h-3.5 text-[#C8613D] animate-spin flex-shrink-0" />
                      ) : isCurrent ? (
                        <span className="w-5 h-5 rounded-full bg-[#C8613D] text-white flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3" />
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleRemoveSavedAccount(acct.userId, e)}
                          title="Remove from saved accounts"
                          className="p-1 rounded-md text-[#7A6B60] hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <DropdownMenuItem
                onClick={() => {
                  window.location.href = '/signin?addAccount=true';
                }}
                className="flex items-center gap-2.5 px-2.5 py-2 mt-0.5 text-xs font-semibold text-[#C8613D] hover:bg-[#F3EAD9] rounded-lg cursor-pointer transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#C8613D]" />
                <span>Add Unool account</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-[#E8DFD5]" />
              <DropdownMenuItem
                onClick={handleCopyUrl}
                className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-[#231C16] hover:bg-[#F3EAD9] rounded-lg cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#C8613D]" />}
                <span>Copy profile URL</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const sub = profile?.subdomain || 'usha';
                  window.open(`https://${sub}.unool.co`, '_blank');
                }}
                className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-[#231C16] hover:bg-[#F3EAD9] rounded-lg cursor-pointer transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#C8613D]" />
                <span>View live page</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#E8DFD5]" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </aside>
  );
}

function DashboardMobileMenuButton({
  setSidebarOpen,
}: {
  setSidebarOpen: (v: boolean) => void;
}) {
  return (
    <button
      className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl shadow-md transition-all duration-200 hover:scale-105 active:scale-95 bg-[#FAF7F2] text-[#231C16] border border-[#E8DFD5] hover:border-[#C8613D] hover:text-[#C8613D]"
      onClick={() => setSidebarOpen(true)}
      aria-label="Open navigation menu"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}

/**
 * DashboardOnboarding
 * Reads user context and renders the SubdomainClaimPopup after 30s
 * if the user has no subdomain yet and hasn't dismissed it before.
 */
function DashboardOnboarding() {
  const { profile, loading } = useUserContext();
  const [refreshSubdomain, setRefreshSubdomain] = useState<string | undefined | null>(undefined);

  // After a successful claim, refresh the displayed subdomain
  const handleClaimed = useCallback((sub: string) => {
    setRefreshSubdomain(sub);
  }, []);

  // Don't render until user context is loaded
  if (loading) return null;

  // Effective subdomain: either freshly claimed or from profile
  const effectiveSubdomain = refreshSubdomain ?? profile?.subdomain;

  return (
    <SubdomainClaimPopup
      currentSubdomain={effectiveSubdomain}
      onClaimed={handleClaimed}
    />
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Bust browser bfcache (Back/Forward Cache) on post-logout browser back button
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  return (
    <FeatureFlagsProvider>
      <UserProvider>
        <div className="min-h-screen" style={{ backgroundColor: biscuit.bg }}>
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 lg:hidden transition-opacity"
            style={{ backgroundColor: 'rgba(15, 10, 7, 0.75)', backdropFilter: 'blur(8px)' }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <DashboardSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Mobile menu button */}
        {!sidebarOpen && (
          <DashboardMobileMenuButton setSidebarOpen={setSidebarOpen} />
        )}

        {/* Main content */}
        <main className="lg:pl-[240px] min-h-screen max-w-full overflow-x-clip">
          <div className="p-4 pt-16 lg:p-6 lg:pt-6 max-w-full overflow-x-clip min-w-0">
            {children}
          </div>
        </main>
        <SignalStrip />
        {/* Onboarding: subdomain claim popup (30s after first dashboard visit) */}
        <DashboardOnboarding />
        <DashboardTimeTracker />
        </div>
      </UserProvider>
    </FeatureFlagsProvider>
  );
}