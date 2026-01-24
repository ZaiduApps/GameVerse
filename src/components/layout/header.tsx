
'use client';

import Link from 'next/link';
import {
  Menu,
  Gamepad2,
  Search,
  Users as CommunityIcon,
  LogIn,
  UploadCloud,
  Home,
  Library,
  BarChart3,
  Newspaper,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import SearchOverlay from '@/components/layout/SearchOverlay';
import Image from 'next/image';

const navItems = [
  { href: '/', label: '首页', icon: Home },
  { href: '/app', label: '游戏库', icon: Library },
  // { href: '/rankings', label: '排行榜', icon: BarChart3 },
  { href: '/news', label: '资讯', icon: Newspaper },
  // { href: '/community', label: '社区', icon: CommunityIcon },
  // { href: '/submit-resource', label: '资源投稿', icon: UploadCloud },
];

interface HeaderProps {
  siteName?: string;
  logoUrl?: string;
}

export default function Header({ siteName = "APKScc", logoUrl }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity"
            >
              {logoUrl ? (
                <Image src={logoUrl} alt={siteName} width={28} height={28} />
              ) : (
                <Gamepad2 size={28} />
              )}
              <h1 className="text-xl font-bold sm:text-2xl">{siteName}</h1>
            </Link>
            <nav className="hidden lg:flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  {item.icon && <item.icon size={16} />}
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>


          <div className="flex items-center gap-2 sm:gap-3">
             <div className="relative hidden md:block">
              <Button
                variant="outline"
                className="pl-3 pr-4 py-2 h-9 text-sm rounded-md w-40 lg:w-56 bg-muted/30 hover:bg-muted/70 justify-start text-muted-foreground"
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
            
            <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
              {/* <Button
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex btn-interactive text-sm px-3"
                onClick={() => setLoginDialogOpen(true)}
              >
                <LogIn size={16} className="mr-2" />
                登录
              </Button> */}
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-center">
                    欢迎回来
                  </DialogTitle>
                  <DialogDescription className="text-center">
                    登录或注册账号，探索更多精彩内容。
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">邮箱 / 用户名</Label>
                    <Input id="email" placeholder="you@example.com" />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">密码</Label>
                      <Link
                        href="#"
                        className="text-xs text-primary hover:underline"
                      >
                        忘记密码?
                      </Link>
                    </div>
                    <Input id="password" type="password" placeholder="••••••••" />
                  </div>
                </div>
                <DialogFooter className="flex-col space-y-2 sm:flex-col sm:space-y-2 sm:space-x-0">
                  <Button
                    type="submit"
                    className="w-full btn-interactive"
                    onClick={() => {
                      alert('登录操作 (模拟)');
                      setLoginDialogOpen(false);
                    }}
                  >
                    登录
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      alert('注册操作 (模拟)');
                      setLoginDialogOpen(false);
                    }}
                  >
                    还没有账户？立即注册
                  </Button>
                  <div className="relative my-3">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        或使用其他方式登录
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="btn-interactive">
                      {/* Placeholder for a social icon e.g. Google */}
                      <svg
                        className="mr-2 h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        <path d="M1 1h22v22H1z" fill="none" />
                      </svg>
                      Google
                    </Button>
                    <Button variant="outline" className="btn-interactive">
                      {/* Placeholder for another social icon e.g. GitHub */}
                      <svg
                        className="mr-2 h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                      </svg>
                      GitHub
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <ThemeToggle />

            {/* Mobile Menu Button and Sheet */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="btn-interactive">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">打开菜单</span>
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-[280px] p-0 pt-6 flex flex-col"
                >
                  <Link
                    href="/"
                    className="flex items-center gap-2 text-xl font-bold text-primary px-6 pb-4 border-b border-border/40"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {logoUrl ? (
                      <Image src={logoUrl} alt={siteName} width={24} height={24} />
                    ) : (
                      <Gamepad2 size={24} />
                    )}
                    <span>{siteName}</span>
                  </Link>

                  <nav className="flex flex-col space-y-1 px-4 flex-grow mt-4">
                    {navItems.map((item) => (
                      <SheetClose asChild key={item.label}>
                        <Link
                          href={item.href}
                          className="text-base font-medium text-foreground/80 hover:text-primary transition-colors px-2 py-3 rounded-md hover:bg-muted/50 flex items-center gap-2"
                        >
                          {item.icon && <item.icon size={18} />}
                          {item.label}
                        </Link>
                      </SheetClose>
                    ))}
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        className="text-base font-medium text-foreground/80 hover:text-primary transition-colors px-2 py-3 rounded-md hover:bg-muted/50 flex items-center gap-2 justify-start"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setLoginDialogOpen(true);
                        }}
                      >
                        <LogIn size={18} />
                        登录 / 注册
                      </Button>
                    </SheetClose>
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
    </>
  );
}
