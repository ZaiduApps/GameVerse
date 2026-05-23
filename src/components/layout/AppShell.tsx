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
        const ok = navigator.sendBeacon('/api/seo/baidu/push', blob);
        if (ok) return;
      }
    } catch {}

    void fetch('/api/seo/baidu/push', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return (
    <>
      <Suspense fallback={null}>
        <PageTransitionLoader />
      </Suspense>

      {isStandaloneDownloadPage ? (
        <main className="min-h-screen">{children}</main>
      ) : isGameDetailPage ? (
        <>
          <div className="hidden lg:block">
            <Header siteName={siteName} logoUrl={logoUrl} />
          </div>
          <main className="min-h-screen flex-grow">{children}</main>
          <div className="hidden lg:block">
            <Footer config={siteConfig} />
          </div>
        </>
      ) : (
        <>
          <Header siteName={siteName} logoUrl={logoUrl} />
          <main className="container mx-auto flex-grow px-4 py-8">{children}</main>
          <Footer config={siteConfig} />
        </>
      )}

      <Toaster />
    </>
  );
}
