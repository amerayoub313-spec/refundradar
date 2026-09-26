'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAVIGATION_ITEMS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { LogOut, LayoutDashboard, AlertTriangle, BarChart3, Settings, Smartphone, Menu, X, User, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useSession } from '@/hooks/useSession';

const navigation = NAVIGATION_ITEMS;

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { session } = useSession();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-bg-primary border-r border-border-default transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center justify-between h-16 px-4 border-b border-border-default', collapsed && 'justify-center')}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary-500" />
          {!collapsed && <span className="font-bold text-lg text-text-primary">RefundRadar</span>}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', collapsed && 'hidden')}
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
        {navigation.map((item) => {
          const Icon = item.icon ? eval(item.icon) : LayoutDashboard;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                isActive
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <Separator className="mx-3" />

      {/* User Menu */}
      <div className={cn('px-3 py-2', collapsed && 'hidden')}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 h-10 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session?.user?.user_metadata?.avatar_url} alt={session?.user?.email} />
                <AvatarFallback>
                  {session?.user?.email?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {session?.user?.user_metadata?.full_name || session?.user?.email}
                </p>
                <p className="text-xs text-text-muted truncate">
                  {session?.user?.email}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-risk-red-500 focus:text-risk-red-500">
              <LogOut className="h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Collapsed user indicator */}
      {collapsed && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {session?.user?.email?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
    </aside>
  );
}