
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

export default function PageTransitionLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.configure({ showSpinner: false });

    const handleStart = () => {
      NProgress.start();
    };

    const handleStop = () => {
      NProgress.done();
    };

    // We bind the start and stop to the pathname and searchParams
    // to trigger the loader on any route change.
    handleStop(); // Ensure loader is stopped on initial load

    return () => {
      handleStop(); // Cleanup on unmount
    };
  }, [pathname, searchParams]);

  // The actual NProgress bar is injected into the DOM by the library itself.
  // This component just controls its state.
  return null;
}
