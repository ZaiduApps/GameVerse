'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { reportClientError } from '@/lib/client-errors';

/**
 * 路由级错误边界：页面渲染抛错时不再白屏，给一次重试与回首页的出口，
 * 同时走统一上报入口（20% 采样、按 message 去重、脱敏）。
 */
export default function AppErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void reportClientError(error, { boundary: 'app-error' });
  }, [error]);

  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-5 px-4 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-foreground">页面加载出错了</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          可以先重试一次；如果问题持续出现，请稍后再访问。
          {error.digest ? `错误编号：${error.digest}` : ''}
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={reset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          重试
        </Button>
        <Button asChild variant="outline">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            返回首页
          </Link>
        </Button>
      </div>
    </div>
  );
}
