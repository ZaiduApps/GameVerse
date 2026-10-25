'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { reportScreenView } from '@/lib/screen-view-tracking';

// 模块级去重：StrictMode 下 effect 会双跑，同一路径只报一次。
let lastReportedPath: string | null = null;

const IGNORED_PREFIXES = ['/internal', '/api', '/_next'];

function shouldSkip(pathname: string | null): boolean {
  if (!pathname) return true;
  return IGNORED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function scheduleReport(pathname: string) {
  const run = () => reportScreenView(pathname);
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(run, { timeout: 2000 });
    return;
  }
  setTimeout(run, 0);
}

export default function ScreenViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (shouldSkip(pathname) || pathname === lastReportedPath) return;
    lastReportedPath = pathname;
    scheduleReport(pathname);
  }, [pathname]);

  return null;
}
