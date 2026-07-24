'use client';

import * as React from 'react';
import { LayoutDashboard, Users, Building2, CreditCard, BarChart3, ClipboardList, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Box, Flex, Text, Avatar, AvatarImage, AvatarFallback, Button } from '@/components/ui';
import { MotionBox } from '@/components/ui/motion';

const navigation = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Workspaces', href: '/admin/workspaces', icon: Building2 },
  { name: 'Plans', href: '/admin/plans', icon: CreditCard },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Audit Log', href: '/admin/audit', icon: ClipboardList },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar({ collapsed = false, onToggle }: { collapsed?: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = React.useState(collapsed);

  React.useEffect(() => {
    setIsCollapsed(collapsed);
  }, [collapsed]);

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
    onToggle();
  };

  return (
    <MotionBox
      variant="slide-left"
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <Flex column className="h-full" style={{ gap: isCollapsed ? 0 : 24 }}>
        {/* Logo & Brand */}
        <Flex
          className="flex-shrink-0 px-4 py-4 border-b items-center justify-between"
          style={{ gap: 12, minHeight: 56 }}
        >
          <Box className="flex items-center gap-3 shrink-0">
            <Box className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <LayoutDashboard className="h-5 w-5" />
            </Box>
            {!isCollapsed && (
              <Text weight="bold" size="lg" color="foreground">
                unool Admin
              </Text>
            )}
          </Box>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggle}
            className={cn('shrink-0', isCollapsed && 'mx-auto')}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </Flex>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-4" role="navigation" aria-label="Admin navigation">
          <Flex column style={{ gap: 4 }}>
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <MotionBox
                  key={item.name}
                  variant="fade"
                  delay={navigation.indexOf(item) * 0.03}
                  whileHover={!isCollapsed ? { x: 4 } : undefined}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                      isCollapsed && 'justify-center'
                    )}
                    title={isCollapsed ? item.name : undefined}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                </MotionBox>
              );
            })}
          </Flex>
        </nav>

        {/* User Info & Logout */}
        {!isCollapsed && (
          <Box className="flex-shrink-0 border-t p-4">
            <Flex between className="items-center gap-4">
              <Box className="flex-1 min-w-0">
                <Text size="sm" weight="medium" color="foreground" className="truncate">
                  Admin User
                </Text>
                <Text size="xs" color="muted" className="truncate">
                  super_admin
                </Text>
              </Box>
              <Button variant="ghost" size="sm" asChild>
                <a href="/api/auth/signout">Log Out <LogOut className="ml-1 h-3 w-3" /></a>
              </Button>
            </Flex>
          </Box>
        )}
      </Flex>
    </MotionBox>
  );
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  return (
    <Box className="min-h-screen bg-background">
      <AdminSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <Box
        className={cn(
          'transition-all duration-300 ease-in-out min-h-screen',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <Box className="flex h-16 items-center justify-between px-6">
            <Text size="xl" weight="bold" color="foreground">
              Admin Dashboard
            </Text>
            <Flex gap={3} className="items-center">
              <Button variant="ghost" size="icon" asChild>
                <a href="/dashboard" target="_blank" rel="noopener noreferrer">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="/api/auth/signout">Sign Out</a>
              </Button>
            </Flex>
          </Box>
        </header>
        <main className="p-6">{children}</main>
      </Box>
    </Box>
  );
}