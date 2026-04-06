'use client';

import { Suspense } from 'react';
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
  const isStandaloneDownloadPage = pathname === '/download/app' || pathname.startsWith('/download/app/');
  const isGameDetailPage = pathname.startsWith('/app/');

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
