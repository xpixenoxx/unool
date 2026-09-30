'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Globe, PenTool, Settings, LogOut, ChevronLeft, FileText, Menu, LayoutDashboard, Send } from 'lucide-react';
import { UserProvider, useUserContext } from '@/lib/hooks/use-user-context';

const navigation = [
  {
    name: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Dashboard home',
    exact: true,
  },
  {
    name: 'Presence',
    href: '/dashboard/presence',
    icon: Globe,
    description: 'Your public profile',
  },
  {
    name: 'Composer',
    href: '/dashboard/composer',
    icon: FileText,
    description: 'Write content',
  },
  {
    name: 'Publish',
    href: '/dashboard/publish',
    icon: Send,
    description: 'Manage & publish',
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
    'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border/60 transition-transform duration-200 ease-out lg:translate-x-0',
    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
  );

  const navContent = (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
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
            className={cn(
              'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <Icon className={cn('h-[18px] w-[18px] flex-shrink-0', isActive ? '' : 'opacity-70 group-hover:opacity-100')} />
            <span className="truncate">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );

  if (loading) {
    return (
      <aside className={sidebarClass}>
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center px-4 border-b border-border/40">
            <Link href="/dashboard" className="flex items-center gap-2">
              <img src="/logo.png" alt="Unool Logo" className="w-[55px] h-[55px] object-contain" />
            </Link>
          </div>
          {navContent}
          <div className="p-4 border-t border-border/40 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-muted" />
              <div className="flex-1">
                <div className="h-3.5 w-20 bg-muted rounded" />
                <div className="h-3 w-28 bg-muted rounded mt-1.5" />
              </div>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className={sidebarClass}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border/40">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/logo.png" alt="Unool Logo" className="w-[55px] h-[55px] object-contain" />
          </Link>
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Navigation */}
        {navContent}

        {/* User footer */}
        <div className="p-3 border-t border-border/40">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-auto py-2.5 px-3 rounded-xl hover:bg-accent"
              >
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarImage src={user?.avatarUrl || undefined} alt={displayName} />
                  <AvatarFallback className="text-xs font-medium">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left flex-1 min-w-0">
                  <p className="font-medium text-sm truncate text-foreground">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {profile?.subdomain
                      ? `@${profile.subdomain}.unool.co`
                      : displayEmail}
                  </p>
                </div>
              </Button>
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
      className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-card text-foreground rounded-xl border border-border/60 shadow-sm hover:shadow-md transition-shadow"
      onClick={() => setSidebarOpen(true)}
      aria-label="Open navigation menu"
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
      <div className="min-h-screen bg-background">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
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
        <main className="lg:pl-64 min-h-screen">
          <div className="p-5 pt-16 lg:p-8 lg:pt-8">
            {children}
          </div>
        </main>
      </div>
    </UserProvider>
  );
}