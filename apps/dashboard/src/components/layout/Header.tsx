'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Search, Bell, Sun, Moon, Menu, LogOut, User, Shield, Command } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useSession } from '@/hooks/useSession';

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { theme, setTheme } = useTheme();
  const { session } = useSession();
  const [searchOpen, setSearchOpen] = useState(false);
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-bg-primary/80 backdrop-blur-sm border-b border-border-default">
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Left: Menu + Search */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Search */}
          <div className={cn('relative hidden sm:block', searchOpen && 'w-64')}>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </Button>
            
            {searchOpen && (
              <div className="absolute left-0 top-full mt-1 w-64 animate-slide-down">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <input
                    type="search"
                    placeholder="Search alerts, users, products... (⌘K)"
                    className="w-full h-9 pl-10 pr-4 rounded-lg border border-border-default bg-bg-primary text-sm text-text-primary placeholder:text-text-muted focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    onBlur={() => setTimeout(() => setSearchOpen(false), 100)}
                    autoFocus
                  />
                  <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded">
                    ⌘K
                  </kbd>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Theme + Notifications + User */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={session?.user?.user_metadata?.avatar_url} alt={session?.user?.email} />
                  <AvatarFallback className="text-xs">
                    {session?.user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {session?.user?.user_metadata?.full_name || 'Developer'}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    {session?.user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
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
      </div>
    </header>
  );
}