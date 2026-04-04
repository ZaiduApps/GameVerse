'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

import MagicLoader from '@/components/layout/MagicLoader';

export default function PageTransitionLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearOverlayTimer = () => {
    if (overlayTimerRef.current) {
      clearTimeout(overlayTimerRef.current);
      overlayTimerRef.current = null;
    }
  };

  useEffect(() => {
    NProgress.configure({ showSpinner: false });
    return () => {
      clearOverlayTimer();
    };
  }, []);

  useEffect(() => {
    clearOverlayTimer();
    NProgress.done();
    setIsNavigating(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      const href = anchor.getAttribute('href') || '';
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

      const nextUrl = new URL(anchor.href, window.location.href);
      const currentUrl = new URL(window.location.href);
      if (nextUrl.origin !== currentUrl.origin) return;
      if (nextUrl.pathname === currentUrl.pathname && nextUrl.search === currentUrl.search) return;

      NProgress.start();
      clearOverlayTimer();
      if (!nextUrl.pathname.startsWith('/app/')) {
        overlayTimerRef.current = setTimeout(() => {
          setIsNavigating(true);
        }, 140);
      }
    };

    window.addEventListener('click', handlePointerDown, true);
    return () => {
      window.removeEventListener('click', handlePointerDown, true);
      clearOverlayTimer();
      NProgress.done();
    };
  }, []);

  return isNavigating ? <MagicLoader /> : null;
}
