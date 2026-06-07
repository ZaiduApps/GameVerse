'use client';

import { useEffect } from 'react';

import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CommunityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const message = String(error?.message || '');
    const name = String(error?.name || '');
    console.error('[community-route] render error', {
      message: message || 'unknown error',
      digest: error?.digest || null,
    });

    if (
      typeof window !== 'undefined' &&
      /ChunkLoadError|Loading chunk|failed to fetch dynamically imported module/i.test(`${name} ${message}`)
    ) {
      const storageKey = `community-chunk-reload:${window.location.pathname}`;
      const fallbackMarker = `community-chunk-reload:${window.location.pathname}`;
      try {
        if (window.sessionStorage.getItem(storageKey) !== '1') {
          window.sessionStorage.setItem(storageKey, '1');
          window.location.reload();
        }
      } catch {
        if (!window.name.includes(fallbackMarker)) {
          window.name = `${window.name || ''} ${fallbackMarker}`.trim();
          window.location.reload();
        }
      }
    }
  }, [error]);

  return (
    <div className="container mx-auto px-2 py-6 sm:px-4 lg:py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            社区加载出现波动
          </CardTitle>
          <CardDescription>数据服务响应较慢或暂时不可用，请稍后重试。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button type="button" onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            重新加载
          </Button>
          <Button asChild variant="outline">
            <Link href="/">返回首页</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
