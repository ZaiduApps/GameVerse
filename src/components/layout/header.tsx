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
  User as UserIcon,
  Bell,
  Download,
  KeyRound,
  ChevronDown,
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
  { href: '/', label: '首页', icon: Home, priority: 'primary' as const },
  { href: '/app', label: '游戏库', icon: Library, priority: 'primary' as const },
  { href: '/rankings', label: '排行榜', icon: BarChart3, priority: 'primary' as const },
  { href: '/community', label: '社区', icon: CommunityIcon, priority: 'primary' as const },
  { href: '/download/app', label: '盒子', icon: Download, priority: 'secondary' as const },
  { href: '/submit-resource', label: '资源投稿', icon: UploadCloud, priority: 'secondary' as const },
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
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);

  const isNavItemActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

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

  useEffect(() => {
    setLogoLoadFailed(false);
  }, [logoUrl]);

  const secondaryNavActive = navItems
    .filter((i) => i.priority === 'secondary')
    .some((i) => isNavItemActive(i.href));

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-90 transition-opacity">
              {logoUrl && !logoLoadFailed ? (
                <Image
                  src={logoUrl}
                  alt={siteName}
                  width={28}
                  height={28}
                  priority
                  fetchPriority="high"
                  onError={() => setLogoLoadFailed(true)}
                />
              ) : (
                <Gamepad2 size={28} />
              )}
              <span className="text-lg font-bold sm:text-xl tracking-wide">{siteName}</span>
            </Link>
            {/* Tablet nav: primary items + "更多" dropdown */}
            <nav className="hidden md:flex lg:hidden items-center gap-1" aria-label="平板主导航">
              {navItems.filter((i) => i.priority === 'primary').map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`inline-flex items-center justify-start gap-1 rounded-full px-2.5 py-1.5 text-sm font-semibold transition-colors ${
                    isNavItemActive(item.href)
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground/80 hover:bg-muted/60 hover:text-primary'
                  }`}
                >
                  {item.icon && <item.icon size={14} />}
                  {item.label}
                </Link>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`inline-flex items-center gap-0.5 rounded-full px-2.5 py-1.5 text-sm font-semibold h-auto transition-colors ${
                      secondaryNavActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-foreground/80 hover:bg-muted/60 hover:text-primary'
                    }`}
                  >
                    更多
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[140px]">
                  {navItems.filter((i) => i.priority === 'secondary').map((item) => (
                    <DropdownMenuItem key={item.label} asChild>
                      <Link href={item.href} className="flex items-center gap-2">
                        <item.icon size={16} />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Desktop nav: all items */}
            <nav className="hidden lg:flex items-center justify-start" aria-label="桌面主导航">
              <ul className="flex items-center justify-start lg:space-x-1 xl:space-x-3 text-left">
                {navItems.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={`inline-flex items-center justify-start gap-1.5 rounded-full lg:px-2 xl:px-3 py-2 text-sm font-semibold transition-colors ${
                        isNavItemActive(item.href)
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-foreground/80 hover:bg-muted/60 hover:text-primary'
                      }`}
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
            {/* Search: icon at md-lg, short text at lg, full text at xl+ */}
            <div className="relative hidden md:flex lg:hidden">
              <Button
                variant="outline"
                size="icon"
                aria-label="打开搜索"
                className="h-9 w-9 rounded-xl border border-border/20 bg-card/90 shadow-sm transition-colors hover:bg-primary/8 hover:text-foreground hover:border-primary/15"
                onClick={() => setSearchOverlayOpen(true)}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <div className="relative hidden lg:flex xl:hidden">
              <Button
                variant="outline"
                className="h-9 w-28 justify-start rounded-xl border border-border/20 bg-card/90 pl-3 pr-4 py-2 text-sm text-foreground/65 shadow-sm transition-colors hover:bg-primary/8 hover:text-foreground hover:border-primary/15"
                onClick={() => setSearchOverlayOpen(true)}
              >
                <Search className="mr-2 h-4 w-4" />
                搜索
              </Button>
            </div>

            <div className="relative hidden xl:flex">
              <Button
                variant="outline"
                className="h-9 w-56 justify-start rounded-xl border border-border/20 bg-card/90 pl-3 pr-4 py-2 text-sm text-foreground/65 shadow-sm transition-colors hover:bg-primary/8 hover:text-foreground hover:border-primary/15"
                onClick={() => setSearchOverlayOpen(true)}
              >
                <Search className="mr-2 h-4 w-4" />
                搜索...
              </Button>
            </div>

            <div className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="打开搜索" onClick={() => setSearchOverlayOpen(true)}>
                <Search className="h-5 w-5" />
              </Button>
            </div>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0" aria-label="打开用户菜单">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user?.avatar} alt={user?.name || user?.username} />
                      <AvatarFallback>{(user?.name || user?.username || 'U').substring(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {unreadTotal > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] leading-none text-white ring-2 ring-background">
                        {unreadTotal > 99 ? '99+' : unreadTotal}
                      </span>
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
                      {unreadTotal > 0 ? (
                        <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] leading-none text-white">
                          {unreadTotal > 99 ? '99+' : unreadTotal}
                        </span>
                      ) : null}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile/api-keys">
                      <KeyRound className="mr-2 h-4 w-4" />
                      <span>API密钥</span>
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
                className="hidden px-3 text-sm text-foreground/82 transition-colors hover:bg-primary/8 hover:text-primary sm:inline-flex"
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
                    className="flex items-center gap-2 text-lg font-bold text-primary px-6 pb-4 border-b border-border/40"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {logoUrl && !logoLoadFailed ? (
                      <Image
                        src={logoUrl}
                        alt={siteName}
                        width={24}
                        height={24}
                        onError={() => setLogoLoadFailed(true)}
                      />
                    ) : (
                      <Gamepad2 size={24} />
                    )}
                    <span>{siteName}</span>
                  </Link>

                  <nav className="flex-grow mt-4" aria-label="移动主导航">
                    <ul className="flex flex-col space-y-1 px-4">
                      {navItems.map((item) => (
                        <li key={item.label}>
                          <SheetClose asChild>
                            <Link
                              href={item.href}
                              className={`flex w-full items-center justify-start gap-2 rounded-md px-2 py-2.5 text-base font-medium transition-colors ${
                                isNavItemActive(item.href)
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-foreground/80 hover:bg-muted/50 hover:text-primary'
                              }`}
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
                              className="w-full text-base font-medium text-foreground/80 hover:text-primary transition-colors px-2 py-2.5 rounded-md hover:bg-muted/50 flex items-center gap-2 justify-start"
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
                              className="w-full justify-start text-base font-medium text-foreground/80 hover:text-primary transition-colors px-2 py-2.5 rounded-md hover:bg-muted/50 flex items-center gap-2"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <UserIcon size={18} />
                              个人资料
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/messages"
                              className="w-full justify-start text-base font-medium text-foreground/80 hover:text-primary transition-colors px-2 py-2.5 rounded-md hover:bg-muted/50 flex items-center gap-2"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <Bell size={18} />
                              我的消息
                              {unreadTotal > 0 ? (
                                <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] leading-none text-white">
                                  {unreadTotal > 99 ? '99+' : unreadTotal}
                                </span>
                              ) : null}
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/profile/api-keys"
                              className="w-full justify-start text-base font-medium text-foreground/80 hover:text-primary transition-colors px-2 py-2.5 rounded-md hover:bg-muted/50 flex items-center gap-2"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <KeyRound size={18} />
                              API密钥
                            </Link>
                          </li>
                          <li>
                            <Button
                              variant="ghost"
                              className="w-full text-base font-medium text-foreground/80 hover:text-destructive transition-colors px-2 py-2.5 rounded-md hover:bg-destructive/10 flex items-center gap-2 justify-start"
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

