
"use client"

import Link from 'next/link'
import { Menu, Gamepad2 } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet'
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
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
          <Gamepad2 size={28} />
          <span>游戏宇宙</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="btn-interactive">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">打开菜单</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-6">
                <div className="flex flex-col space-y-6">
                  <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary" onClick={() => setMobileMenuOpen(false)}>
                    <Gamepad2 size={24} />
                    <span>游戏宇宙</span>
                  </Link>
                  <nav className="flex flex-col space-y-4">
                    {navItems.map((item) => (
                      <SheetClose asChild key={item.label}>
                        <Link href={item.href} className="text-lg font-medium text-foreground/80 hover:text-primary transition-colors">
                          {item.label}
                        </Link>
                      </SheetClose>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
