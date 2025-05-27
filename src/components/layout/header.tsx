
"use client"

import Link from 'next/link'
import { Menu, Gamepad2, Search } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { useState } from 'react';

const navItems = [
  { href: '/', label: '首页' },
  { href: '/games', label: '游戏库' },
  { href: '/rankings', label: '排行榜' },
  { href: '/news', label: '资讯' },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
          <Gamepad2 size={28} />
          <span className="text-xl font-bold sm:text-2xl">游戏宇宙</span>
        </Link>
        
        {/* Desktop Navigation & Search */}
        <div className="hidden md:flex items-center flex-1 justify-end lg:justify-center"> {/* Adjusted for better centering/right align on medium screens */}
          <nav className="hidden lg:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="relative ml-6">
            <Input
              type="search"
              placeholder="搜索..."
              className="pl-10 pr-4 py-2 h-9 text-sm rounded-md w-40 lg:w-56 bg-muted/30 hover:bg-muted/70 focus:bg-background focus:w-48 lg:focus:w-64 transition-all duration-300 ease-in-out"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
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
                <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary px-6 pb-4 border-b border-border/40" onClick={() => setMobileMenuOpen(false)}>
                  <Gamepad2 size={24} />
                  <span>游戏宇宙</span>
                </Link>
                
                <div className="px-4 py-4">
                  <div className="relative">
                    <Input
                      type="search"
                      placeholder="搜索游戏、资讯..."
                      className="pl-10 text-sm w-full h-10"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                
                <nav className="flex flex-col space-y-1 px-4 flex-grow">
                  {navItems.map((item) => (
                    <SheetClose asChild key={item.label}>
                      <Link 
                        href={item.href} 
                        className="text-base font-medium text-foreground/80 hover:text-primary transition-colors px-2 py-3 rounded-md hover:bg-muted/50"
                      >
                        {item.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
                 {/* Optional: Add ThemeToggle to mobile sheet footer */}
                <div className="mt-auto p-4 border-t border-border/40">
                   <p className="text-xs text-center text-muted-foreground">&copy; {new Date().getFullYear()} 游戏宇宙</p>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
