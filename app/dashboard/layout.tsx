'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Globe, PenTool, Settings, LogOut, ChevronLeft, Menu, LayoutDashboard, Radio, Network, BarChart3, Bell } from 'lucide-react';
import { UserProvider, useUserContext } from '@/lib/hooks/use-user-context';

/* ─── Biscuit color palette ───────────────────────────────── */
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

const navigation = [
  {
    name: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Dashboard home',
    exact: true,
  },
  {
    name: 'Studio',
    href: '/dashboard/composer',
    icon: PenTool,
    description: 'Create content',
  },
  {
    name: 'Broadcast',
    href: '/dashboard/publish',
    icon: Radio,
    description: 'Publish & schedule',
  },
  {
    name: 'Profile',
    href: '/dashboard/presence',
    icon: Globe,
    description: 'Your public page',
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'Account settings',
  },
];

function DashboardSidebar({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}) {
  const { user, profile, loading } = useUserContext();
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const res = await fetch('/api/auth/signout', { method: 'POST' });
    if (res.ok) router.push('/signup');
  };

  const displayName = profile?.name || user?.fullName || 'User';
  const displayEmail = user?.email || '';

  const sidebarClass = cn(
    'fixed inset-y-0 left-0 z-50 w-[240px] transition-transform duration-200 ease-out lg:translate-x-0',
    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
  );

  const navContent = (
    <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
      <p
        className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: biscuit.textLight }}
      >
        Navigation
      </p>
      {navigation.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + '/');
        const Icon = item.icon;

        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
            style={{
              backgroundColor: isActive ? biscuit.activeBg : 'transparent',
              color: isActive ? biscuit.activeFg : biscuit.text,
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = biscuit.hoverBg;
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <Icon
              className="h-[18px] w-[18px] flex-shrink-0"
              style={{ opacity: isActive ? 1 : 0.65 }}
            />
            <span className="truncate">{item.name}</span>
            {isActive && (
              <span
                className="ml-auto h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: biscuit.accent }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );

  if (loading) {
    return (
      <aside className={sidebarClass} style={{ backgroundColor: biscuit.sidebar, borderRight: `1px solid ${biscuit.sidebarBorder}` }}>
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center px-4" style={{ borderBottom: `1px solid ${biscuit.sidebarBorder}` }}>
            <Link href="/dashboard" className="flex items-center gap-2">
              <img src="/logo.png" alt="Unool Logo" className="w-[48px] h-[48px] object-contain" />
            </Link>
          </div>
          {navContent}
          <div className="p-4 animate-pulse" style={{ borderTop: `1px solid ${biscuit.sidebarBorder}` }}>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full" style={{ backgroundColor: biscuit.border }} />
              <div className="flex-1">
                <div className="h-3.5 w-20 rounded" style={{ backgroundColor: biscuit.border }} />
                <div className="h-3 w-28 rounded mt-1.5" style={{ backgroundColor: biscuit.border }} />
              </div>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className={sidebarClass} style={{ backgroundColor: biscuit.sidebar, borderRight: `1px solid ${biscuit.sidebarBorder}` }}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div
          className="flex h-16 items-center justify-between px-4"
          style={{ borderBottom: `1px solid ${biscuit.sidebarBorder}` }}
        >
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Unool Logo" className="w-[48px] h-[48px] object-contain" />
            <span
              className="text-lg font-bold tracking-tight"
              style={{ color: biscuit.text }}
            >
              unool
            </span>
          </Link>
          <button
            className="lg:hidden p-2 rounded-lg transition-colors"
            onClick={() => setSidebarOpen(false)}
            style={{ color: biscuit.textMuted }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        {navContent}

        {/* User footer */}
        <div className="p-3" style={{ borderTop: `1px solid ${biscuit.sidebarBorder}` }}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl transition-colors text-left"
                style={{ color: biscuit.text }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = biscuit.hoverBg; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarImage src={user?.avatarUrl || undefined} alt={displayName} />
                  <AvatarFallback
                    className="text-xs font-medium"
                    style={{ backgroundColor: biscuit.accentBg, color: biscuit.accent }}
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{displayName}</p>
                  <p className="text-xs truncate" style={{ color: biscuit.textMuted }}>
                    {profile?.subdomain
                      ? `${profile.subdomain}.unool.co`
                      : displayEmail}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" side="top">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
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
      className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl shadow-sm transition-shadow hover:shadow-md"
      onClick={() => setSidebarOpen(true)}
      aria-label="Open navigation menu"
      style={{
        backgroundColor: biscuit.card,
        color: biscuit.text,
        border: `1px solid ${biscuit.border}`,
      }}
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <UserProvider>
      <div className="min-h-screen" style={{ backgroundColor: biscuit.bg }}>
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 lg:hidden transition-opacity"
            style={{ backgroundColor: 'rgba(61, 43, 31, 0.3)', backdropFilter: 'blur(4px)' }}
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
        <main className="lg:pl-[240px] min-h-screen">
          <div className="p-5 pt-16 lg:p-8 lg:pt-8">
            {children}
          </div>
        </main>
      </div>
    </UserProvider>
  );
}