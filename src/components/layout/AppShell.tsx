'use client';

import { Suspense, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import PageTransitionLoader from '@/components/layout/PageTransitionLoader';
import { Toaster } from '@/components/ui/toaster';
import type { SiteConfig } from '@/types';

interface AppShellProps {
  children: React.ReactNode;
  siteName?: string;
  logoUrl?: string;
  siteConfig: SiteConfig | null;
}

export default function AppShell({ children, siteName, logoUrl, siteConfig }: AppShellProps) {
  const pathname = usePathname();
  const lastReportedRef = useRef<string>('');
  const isStandaloneDownloadPage = pathname === '/download/app' || pathname.startsWith('/download/app/');
  const isGameDetailPage = pathname.startsWith('/app/');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!pathname) return;

    const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
    const canonicalUrl = `${window.location.origin}${normalizedPath}`;
    if (lastReportedRef.current === canonicalUrl) return;
    lastReportedRef.current = canonicalUrl;

    const payload = JSON.stringify({ url: canonicalUrl });

    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        const ok = navigator.sendBeacon('/api/seo/push', blob);
        if (ok) return;
      }
    } catch {}

    void fetch('/api/seo/push', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[10001] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-lg focus:ring-2 focus:ring-primary"
      >
        跳到主要内容
      </a>
      <Suspense fallback={null}>
        <PageTransitionLoader />
      </Suspense>

      {isStandaloneDownloadPage ? (
        <main id="main-content" className="min-h-screen">{children}</main>
      ) : isGameDetailPage ? (
        <>
          <div className="hidden lg:block">
            <Header siteName={siteName} logoUrl={logoUrl} />
          </div>
          <main id="main-content" className="min-h-screen flex-grow">{children}</main>
          <div className="hidden lg:block">
            <Footer config={siteConfig} />
          </div>
        </>
      ) : (
        <>
          <Header siteName={siteName} logoUrl={logoUrl} />
          <main id="main-content" className="container mx-auto flex-grow px-4 py-8">{children}</main>
          <Footer config={siteConfig} />
        </>
      )}

      <Toaster />
    </>
  );
}
