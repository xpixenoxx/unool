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

/* ─── Rail & Luxury Dark Palette (Images 2, 3, 4) ───────────────────────── */
const railTheme = {
  sidebarBg: '#15100d',
  sidebarBorder: '#231a15',
  cardBg: '#1a130f',
  cardBorder: '#2d221b',
  cardHover: '#221813',
  accentGold: '#caa068',
  accentAmber: '#e2a458',
  accentAmberDark: '#c98335',
  activePillBg: '#f3ece1',
  activePillFg: '#17120e',
  activePillDotHalo: '#ebd7bf',
  iconBg: '#15100d',
  iconBorder: '#362921',
  iconHoverBorder: '#caa068',
  iconFg: '#b89f8d',
  iconHoverFg: '#f8f3eb',
  labelFg: '#c2afa0',
  labelHoverFg: '#fbf8f4',
  trackSolid: '#caa068',
  trackDashed: '#544133',
  serifLabel: '#caa068',
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
  const { user, profile, pendingPostsCount, loading } = useUserContext();
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

  // Real-time synchronization for pending posts count across window focus and publishing events
  useEffect(() => {
    const fetchLatestPending = async () => {
      try {
        const res = await fetch('/api/posts/pending-count', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.count === 'number') {
            setDynamicPendingCount(data.count);
          }
        }
      } catch {
        // Ignore network drops
      }
    };

    // Initial fetch on mount for instantaneous fresh count
    fetchLatestPending();

    const handlePublishEvent = () => {
      fetchLatestPending();
    };

    const handlePendingDirectUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ count?: number }>;
      if (typeof customEvent.detail?.count === 'number') {
        setDynamicPendingCount(customEvent.detail.count);
      } else {
        fetchLatestPending();
      }
    };

    window.addEventListener('signal-strip-publish', handlePublishEvent);
    window.addEventListener('signal-posts-updated', handlePublishEvent);
    window.addEventListener('signal-pending-count-updated', handlePendingDirectUpdate);
    window.addEventListener('focus', fetchLatestPending);

    // Light background poll every 15 seconds
    const interval = setInterval(fetchLatestPending, 15000);

    return () => {
      window.removeEventListener('signal-strip-publish', handlePublishEvent);
      window.removeEventListener('signal-posts-updated', handlePublishEvent);
      window.removeEventListener('signal-pending-count-updated', handlePendingDirectUpdate);
      window.removeEventListener('focus', fetchLatestPending);
      clearInterval(interval);
    };
  }, []);

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
    <nav className="flex-1 px-3 py-3 overflow-y-auto overflow-x-hidden select-none">
      {navSections.map((section, sIndex) => {
        // Determine whether the through line for the section header should be solid
        // The section's first item index in flatNavItems
        const firstItemInSec = section.items[0];
        const firstItemIdx = flatNavItems.findIndex((i) => i.id === firstItemInSec.id);
        const isThroughSolid = activeIndex > 0 && activeIndex >= firstItemIdx;

        return (
          <div key={section.title || `sec-${sIndex}`} className="flex flex-col">
            {/* Section Heading (Images 2 & 3: Cormorant Garamond italic serif in warm amber) */}
            {section.title && (
              <div className="relative flex items-center w-full h-[32px] mt-1 mb-0.5">
                {/* Vertical rail connecting line passing through the section header */}
                <div className="w-[40px] flex items-center justify-center flex-shrink-0 relative h-full">
                  <div
                    className={cn(
                      'absolute top-0 bottom-0 left-1/2 -translate-x-1/2',
                      isThroughSolid
                        ? 'w-[2px] bg-[#caa068]'
                        : 'w-0 border-l-[1.5px] border-dashed border-[#544133]'
                    )}
                  />
                </div>
                <span
                  className="text-[15px] italic font-normal tracking-wide pl-2 select-none"
                  style={{
                    color: railTheme.serifLabel,
                    fontFamily: 'var(--font-cormorant), Georgia, serif',
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

              // Line logic:
              // - Top line: present for all except the very first item (Overview)
              // - Bottom line: present for all except the very last item (Settings)
              // - Line is SOLID GOLD (#caa068) if it is at or before the active item destination!
              const showTopLine = flatIndex > 0;
              const showBottomLine = flatIndex < flatNavItems.length - 1;
              const isTopSolid = activeIndex > 0 && flatIndex <= activeIndex;
              const isBottomSolid = activeIndex > 0 && flatIndex < activeIndex;

              return (
                <div key={item.id} className="relative flex items-center w-full min-h-[44px]">
                  {/* Left Rail Column for vertical timeline connecting lines */}
                  <div className="w-[40px] flex items-center justify-center flex-shrink-0 relative h-full self-stretch pointer-events-none">
                    {/* Incoming top line segment */}
                    {showTopLine && (
                      <div
                        className={cn(
                          'absolute top-0 bottom-1/2 left-1/2 -translate-x-1/2',
                          isTopSolid
                            ? 'w-[2px] bg-[#caa068]'
                            : 'w-0 border-l-[1.5px] border-dashed border-[#544133]'
                        )}
                      />
                    )}

                    {/* Outgoing bottom line segment */}
                    {showBottomLine && (
                      <div
                        className={cn(
                          'absolute top-1/2 bottom-0 left-1/2 -translate-x-1/2',
                          isBottomSolid
                            ? 'w-[2px] bg-[#caa068]'
                            : 'w-0 border-l-[1.5px] border-dashed border-[#544133]'
                        )}
                      />
                    )}
                  </div>

                  {/* Interactive Item Link */}
                  <Link
                    href={item.href}
                    prefetch={true}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'group absolute inset-y-0.5 inset-x-0 flex items-center w-full px-1.5 rounded-2xl transition-all duration-200 outline-none',
                      isActive
                        ? 'bg-[#f3ece1] shadow-lg shadow-black/25 z-10'
                        : 'hover:bg-white/[0.04] z-10 focus-visible:ring-1 focus-visible:ring-[#caa068]'
                    )}
                    onMouseEnter={() => {
                      try {
                        router.prefetch(item.href);
                      } catch {}
                    }}
                  >
                    {/* Icon Container */}
                    <div className="w-[38px] flex items-center justify-center flex-shrink-0">
                      <div
                        className={cn(
                          'flex items-center justify-center rounded-full transition-all duration-200',
                          isActive
                            ? 'w-[32px] h-[32px] bg-[#e2a458] text-[#17120e] shadow-sm ml-0.5'
                            : 'w-[34px] h-[34px] bg-[#15100d] border border-[#382b22] text-[#b89f8d] group-hover:border-[#caa068] group-hover:text-[#f8f3eb] group-hover:bg-[#201712] group-hover:shadow-[0_0_12px_rgba(202,160,104,0.25)] group-hover:scale-105'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Label */}
                    <span
                      className={cn(
                        'ml-2.5 truncate text-[14.5px] transition-all duration-150',
                        isActive
                          ? 'font-semibold text-[#17120e] tracking-tight'
                          : 'font-medium text-[#c2afa0] group-hover:text-[#fbf8f4] group-hover:translate-x-0.5'
                      )}
                    >
                      {item.name}
                    </span>

                    {/* Active Beacon Glowing Dot (Image 2) */}
                    {isActive && (
                      <div className="ml-auto mr-1 relative flex items-center justify-center w-4 h-4 flex-shrink-0">
                        <span className="absolute w-3.5 h-3.5 rounded-full bg-[#caa068]/30 animate-ping pointer-events-none" />
                        <span className="w-3.5 h-3.5 rounded-full bg-[#ebd7bf] flex items-center justify-center">
                          <span className="w-2 h-2 rounded-full bg-[#c98335]" />
                        </span>
                      </div>
                    )}

                    {/* Interactive Notification Badge (shows pending posts count when > 0) */}
                    {!isActive && item.badge !== undefined && (
                      <div
                        className="ml-auto mr-1 w-5 h-5 rounded-full bg-[#e2a458] text-[#17120e] text-[11px] font-bold flex items-center justify-center shadow-sm flex-shrink-0 transition-transform group-hover:scale-110"
                        title={`${item.badge} pending ${item.badge === 1 ? 'post' : 'posts'}`}
                      >
                        {item.badge}
                      </div>
                    )}
                  </Link>
                </div>
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
              <span className="text-lg font-bold tracking-tight text-[#f5efe4]">unool</span>
            </Link>
          </div>
          <div className="flex-1 px-3 py-4 space-y-4 animate-pulse">
            <div className="h-9 rounded-xl bg-white/[0.05]" />
            <div className="h-6 w-16 rounded bg-white/[0.03] ml-10" />
            <div className="h-9 rounded-xl bg-white/[0.05]" />
            <div className="h-9 rounded-xl bg-white/[0.05]" />
            <div className="h-9 rounded-xl bg-white/[0.05]" />
          </div>
          <div
            className="p-3 animate-pulse"
            style={{ borderTop: `1px solid ${railTheme.sidebarBorder}` }}
          >
            <div className="flex items-center gap-3 p-2 rounded-2xl bg-white/[0.04] border border-[#2d221b]">
              <div className="h-10 w-10 rounded-full bg-[#e2a458]/40" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-16 rounded bg-white/[0.08]" />
                <div className="h-3 w-24 rounded bg-white/[0.04]" />
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
            <span className="text-lg font-bold tracking-tight text-[#f5efe4] group-hover:text-[#caa068] transition-colors">
              unool
            </span>
          </Link>
          <button
            className="lg:hidden p-1.5 rounded-lg text-[#9e8372] hover:text-[#f5efe4] hover:bg-[#251c16] transition-colors"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Content with Timeline Track */}
        {navContent}

        {/* User Footer Card (Image 4: Golden V avatar, usha, usha.unool.co, copy & dropdown menu) */}
        <div
          className="p-3 flex-shrink-0"
          style={{ borderTop: `1px solid ${railTheme.sidebarBorder}` }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-full group flex items-center gap-3 p-2 rounded-2xl transition-all duration-200 text-left border border-[#2d221b] bg-[#1a130f] hover:border-[#423328] hover:bg-[#201813] shadow-md shadow-black/20 focus-visible:ring-1 focus-visible:ring-[#caa068]"
              >
                {/* Avatar: Honey-gold circle with stylish serif initial (V) matching Image 4 */}
                <div className="w-10 h-10 rounded-full bg-[#e2a458] flex items-center justify-center text-[#17120e] font-serif text-lg font-bold flex-shrink-0 shadow-sm overflow-hidden">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    avatarLetter
                  )}
                </div>

                {/* Name & URL */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-white truncate leading-tight group-hover:text-[#f8f3eb] transition-colors">
                    {displayName.toLowerCase() === 'user' ? 'usha' : displayName}
                  </p>
                  <p className="text-xs text-[#a88d79] truncate group-hover:text-[#caa068] transition-colors mt-0.5">
                    {displayUrl}
                  </p>
                </div>

                {/* Interactive Copy Button on hover */}
                <div
                  onClick={handleCopyUrl}
                  className="p-1.5 rounded-lg text-[#8c7463] hover:text-[#caa068] hover:bg-[#281e18] transition-all flex-shrink-0"
                  title="Copy profile URL"
                  aria-label="Copy profile link"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-60 bg-[#18120e] border border-[#382b22] text-[#f2ece4] shadow-2xl p-1.5 rounded-xl z-50"
              align="start"
              side="top"
              sideOffset={8}
            >
              <DropdownMenuLabel className="font-normal px-2.5 py-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold text-white">{displayName}</p>
                  <p className="text-xs text-[#a88d79] truncate">{displayEmail || 'usha@unool.co'}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#2d221b]" />
              <DropdownMenuItem
                onClick={handleCopyUrl}
                className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-[#c2afa0] hover:text-white hover:bg-[#251d18] rounded-lg cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#caa068]" />}
                <span>Copy profile URL</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const sub = profile?.subdomain || 'usha';
                  window.open(`https://${sub}.unool.co`, '_blank');
                }}
                className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-[#c2afa0] hover:text-white hover:bg-[#251d18] rounded-lg cursor-pointer transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#caa068]" />
                <span>View live page</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/dashboard/settings')}
                className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-[#c2afa0] hover:text-white hover:bg-[#251d18] rounded-lg cursor-pointer transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-[#caa068]" />
                <span>Account settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#2d221b]" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg cursor-pointer transition-colors"
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
      className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 bg-[#18120e] text-[#caa068] border border-[#382b22] hover:border-[#caa068] hover:text-[#f8f3eb]"
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
        <main className="lg:pl-[240px] min-h-screen max-w-full overflow-x-hidden">
          <div className="p-4 pt-16 lg:p-6 lg:pt-6 max-w-full overflow-x-hidden min-w-0">
            {children}
          </div>
        </main>
        <SignalStrip />
        {/* Onboarding: subdomain claim popup (30s after first dashboard visit) */}
        <DashboardOnboarding />
      </div>
    </UserProvider>
  );
}