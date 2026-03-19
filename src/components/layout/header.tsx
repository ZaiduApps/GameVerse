'use client';

import Link from 'next/link';
import {
  Menu,
  Gamepad2,
  Search,
  Users as CommunityIcon,
  LogIn,
  LogOut,
  UploadCloud,
  Home,
  Library,
  BarChart3,
  Newspaper,
  User as UserIcon,
  Bell,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SearchOverlay from '@/components/layout/SearchOverlay';
import AuthModal from '@/components/auth/auth-modal';
import { useAuth } from '@/context/auth-context';
import { apiUrl, trackedApiFetch } from '@/lib/api';

const navItems = [
  { href: '/', label: '首页', icon: Home },
  { href: '/app', label: '游戏库', icon: Library },
  { href: '/rankings', label: '排行榜', icon: BarChart3 },
  { href: '/news', label: '资讯', icon: Newspaper },
  { href: '/community', label: '社区', icon: CommunityIcon },
  { href: '/submit-resource', label: '资源投稿', icon: UploadCloud },
];

interface HeaderProps {
  siteName?: string;
  logoUrl?: string;
}

export default function Header({ siteName = 'APKScc', logoUrl }: HeaderProps) {
  const { user, token, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadUnreadSummary() {
      if (!isAuthenticated || !token) {
        setUnreadTotal(0);
        return;
      }
      try {
      const res = await trackedApiFetch('/notifications/summary', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || json?.code !== 0) {
          setUnreadTotal(0);
          return;
        }
        setUnreadTotal(Number(json?.data?.total_unread || 0));
      } catch {
        if (!cancelled) setUnreadTotal(0);
      }
    }

    loadUnreadSummary();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, token, pathname]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b-2 border-foreground bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-90 transition-opacity">
              {logoUrl ? <Image src={logoUrl} alt={siteName} width={28} height={28} /> : <Gamepad2 size={28} />}
              <h1 className="text-xl font-bold sm:text-2xl tracking-wide">{siteName}</h1>
            </Link>
            <nav className="hidden lg:flex items-center">
              <ul className="flex items-center space-x-6">
                {navItems.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm font-semibold text-foreground/80 hover:text-primary transition-colors flex items-center gap-1.5"
                    >
                      {item.icon && <item.icon size={16} />}
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative hidden md:block">
              <Button
                variant="outline"
                className="pl-3 pr-4 py-2 h-9 text-sm rounded-sm border-2 border-foreground/80 w-40 lg:w-56 bg-background hover:bg-secondary/35 justify-start text-muted-foreground"
                onClick={() => setSearchOverlayOpen(true)}
              >
                <Search className="mr-2 h-4 w-4" />
                搜索...
              </Button>
            </div>

            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setSearchOverlayOpen(true)}>
                <Search className="h-5 w-5" />
              </Button>
            </div>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user?.avatar} alt={user?.name || user?.username} />
                      <AvatarFallback>{(user?.name || user?.username || 'U').substring(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {unreadTotal > 0 && (
                      <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name || user?.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <UserIcon className="mr-2 h-4 w-4" />
                      <span>个人资料</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/messages">
                      <Bell className="mr-2 h-4 w-4" />
                      <span>我的消息</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>退出登录</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex btn-interactive text-sm px-3"
                onClick={() => setAuthModalOpen(true)}
              >
                <LogIn size={16} className="mr-2" />
                登录
              </Button>
            )}

            <ThemeToggle />

            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="btn-interactive">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">打开菜单</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] p-0 pt-6 flex flex-col">
                  <Link
                    href="/"
                    className="flex items-center gap-2 text-xl font-bold text-primary px-6 pb-4 border-b border-border/40"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {logoUrl ? <Image src={logoUrl} alt={siteName} width={24} height={24} /> : <Gamepad2 size={24} />}
                    <span>{siteName}</span>
                  </Link>

                  <nav className="flex-grow mt-4">
                    <ul className="flex flex-col space-y-1 px-4">
                      {navItems.map((item) => (
                        <li key={item.label}>
                          <SheetClose asChild>
                            <Link
                              href={item.href}
                              className="w-full justify-start text-base font-medium text-foreground/80 hover:text-primary transition-colors px-2 py-3 rounded-md hover:bg-muted/50 flex items-center gap-2"
                            >
                              {item.icon && <item.icon size={18} />}
                              {item.label}
                            </Link>
                          </SheetClose>
                        </li>
                      ))}

                      {!isAuthenticated && (
                        <li>
                          <SheetClose asChild>
                            <Button
                              variant="ghost"
                              className="w-full text-base font-medium text-foreground/80 hover:text-primary transition-colors px-2 py-3 rounded-md hover:bg-muted/50 flex items-center gap-2 justify-start"
                              onClick={() => {
                                setMobileMenuOpen(false);
                                setAuthModalOpen(true);
                              }}
                            >
                              <LogIn size={18} />
                              登录 / 注册
                            </Button>
                          </SheetClose>
                        </li>
                      )}

                      {isAuthenticated && (
                        <>
                          <li>
                            <Link
                              href="/profile"
                              className="w-full justify-start text-base font-medium text-foreground/80 hover:text-primary transition-colors px-2 py-3 rounded-md hover:bg-muted/50 flex items-center gap-2"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <UserIcon size={18} />
                              个人资料
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/messages"
                              className="w-full justify-start text-base font-medium text-foreground/80 hover:text-primary transition-colors px-2 py-3 rounded-md hover:bg-muted/50 flex items-center gap-2"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <Bell size={18} />
                              我的消息
                            </Link>
                          </li>
                          <li>
                            <Button
                              variant="ghost"
                              className="w-full text-base font-medium text-foreground/80 hover:text-destructive transition-colors px-2 py-3 rounded-md hover:bg-destructive/10 flex items-center gap-2 justify-start"
                              onClick={() => {
                                logout();
                                setMobileMenuOpen(false);
                              }}
                            >
                              <LogOut size={18} />
                              退出登录
                            </Button>
                          </li>
                        </>
                      )}
                    </ul>
                  </nav>

                  <div className="mt-auto p-4 border-t border-border/40">
                    <p className="text-xs text-center text-muted-foreground">
                      &copy; {new Date().getFullYear()} {siteName}
                    </p>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <SearchOverlay isOpen={searchOverlayOpen} setIsOpen={setSearchOverlayOpen} />
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  );
}

