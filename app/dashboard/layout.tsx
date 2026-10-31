'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Globe, PenTool, Settings, LogOut, ChevronLeft, Menu, LayoutDashboard, LayoutGrid, Radio, Network, BarChart3, Bell, CalendarDays, Zap, CreditCard, Lock, Gift, Copy, Check, ExternalLink } from 'lucide-react';
import { UserProvider, useUserContext } from '@/lib/hooks/use-user-context';
import { SignalStrip } from './signal/SignalStrip';
import { SubdomainClaimPopup } from '@/components/onboarding/SubdomainClaimPopup';
import { toast } from 'sonner';
import { DashboardTimeTracker } from '@/components/analytics/DashboardTimeTracker';

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

function DashboardSidebar({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}) {
  const { user, profile, workspace, pendingPostsCount, loading } = useUserContext();
  const pathname = usePathname();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [dynamicPendingCount, setDynamicPendingCount] = useState<number>(pendingPostsCount || 0);

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

    // Initial fetch on mount for instantaneous fresh count
    fetchLatestDrafts();

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
          description: 'Create content',
        },
        {
          id: 'flightplan',
          name: 'Flight plan',
          href: '/dashboard/flightplan',
          icon: CalendarDays,
          description: 'Plan & schedule content',
        },
        {
          id: 'signal',
          name: 'Signal',
          href: '/dashboard/signal',
          icon: Radio,
          description: 'Publish & schedule',
          badge: dynamicPendingCount > 0 ? dynamicPendingCount : undefined,
        },
        {
          id: 'automation',
          name: 'Automation',
          href: '/dashboard/automation',
          icon: Zap,
          description: 'Instagram comment automation',
        },
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
  ], [dynamicPendingCount]);

  const flatNavItems = useMemo(() => navSections.flatMap((s) => s.items), [navSections]);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch {
      // Ignore
    }
    window.location.replace('/signin');
  };

  const rawName = profile?.name || user?.fullName || 'usha';
  const displayName = (rawName.toLowerCase() === 'user' || rawName.toLowerCase() === 'new user' || !rawName) ? 'usha' : rawName;
  const avatarLetter = (displayName.toLowerCase().includes('usha') || displayName === 'usha') ? 'V' : (displayName.charAt(0).toUpperCase() || 'V');
  const displayEmail = user?.email || 'usha@unool.co';
  const currentSubdomain = profile?.subdomain || (displayName.toLowerCase() === 'usha' ? 'usha' : '');
  const displayUrl = currentSubdomain ? `${currentSubdomain}.unool.co` : (displayEmail || 'usha.unool.co');

  const handleCopyUrl = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const urlToCopy = currentSubdomain ? `https://${currentSubdomain}.unool.co` : 'https://usha.unool.co';
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
              className="w-60 bg-[#FFFDF9] border border-[#E8DFD5] text-[#231C16] shadow-xl p-1.5 rounded-xl z-50"
              align="start"
              side="top"
              sideOffset={8}
            >
              <DropdownMenuLabel className="font-normal px-2.5 py-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold text-[#231C16]">{displayName}</p>
                  <p className="text-xs text-[#7A6B60] truncate">{displayEmail || 'usha@unool.co'}</p>
                </div>
              </DropdownMenuLabel>
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
              <DropdownMenuItem
                onClick={() => router.push('/dashboard/settings')}
                className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-[#231C16] hover:bg-[#F3EAD9] rounded-lg cursor-pointer transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-[#C8613D]" />
                <span>Account settings</span>
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
  );
}