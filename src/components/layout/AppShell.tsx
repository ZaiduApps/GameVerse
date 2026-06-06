'use client';

import { Suspense, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import PageTransitionLoader from '@/components/layout/PageTransitionLoader';
import { Toaster } from '@/components/ui/toaster';
import type { SiteConfig } from '@/types';

const DEFAULT_SITE_URL = 'https://apks.cc';

interface AppShellProps {
  children: React.ReactNode;
  siteName?: string;
  logoUrl?: string;
  siteConfig: SiteConfig | null;
}

function getClientSiteUrl() {
  const raw = String(process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).trim();
  return raw.replace(/\/+$/, '') || DEFAULT_SITE_URL;
}

function toJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export default function AppShell({ children, siteName, logoUrl, siteConfig }: AppShellProps) {
  const pathname = usePathname();
  const lastReportedRef = useRef<string>('');
  const isStandaloneDownloadPage = pathname === '/download/app' || pathname.startsWith('/download/app/');
  const isGameDetailPage = pathname.startsWith('/app/');
  const shellHiddenHeading = pathname === '/community' ? `${siteName || 'APKScc'} 玩家互动社区` : '';
  const communityBreadcrumbJsonLd = shellHiddenHeading
    ? toJsonLd({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: siteName || 'APKScc',
            item: `${getClientSiteUrl()}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: shellHiddenHeading,
            item: `${getClientSiteUrl()}/community`,
          },
        ],
      })
    : '';

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
          <main id="main-content" className="container mx-auto flex-grow px-4 py-8">
            {communityBreadcrumbJsonLd ? (
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: communityBreadcrumbJsonLd }}
              />
            ) : null}
            {shellHiddenHeading ? <h1 className="sr-only">{shellHiddenHeading}</h1> : null}
            {shellHiddenHeading ? (
              <section className="sr-only" aria-label={`${siteName || 'APKScc'} 社区简介`}>
                <h2>安卓游戏讨论与资源反馈</h2>
                <p>
                  APKScc 社区聚合玩家发布的安卓游戏讨论、攻略心得、资源反馈、版本体验和热门话题。
                  用户可以浏览最新帖子、参与回复互动、关注游戏话题，并通过公开主页展示个性签名、社区动态和互动记录。
                </p>
              </section>
            ) : null}
            {children}
          </main>
          <Footer config={siteConfig} />
        </>
      )}

      <Toaster />
    </>
  );
}
