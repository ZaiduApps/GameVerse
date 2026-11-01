'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

/**
 * 下载失败提示 + 一键换渠道重试（待决策 #119）。
 *
 * 只负责呈现：失败原因由调用方给出，重试目标也由调用方算好（见
 * `@/lib/download-retry`）。抽成纯展示组件是为了能在 node:test 里用
 * renderToStaticMarkup 做 DOM 断言。
 */
export interface DownloadFailureAlertProps {
  message: string;
  /** 为空时不显示重试按钮（例如参数本身缺失，原样重试只会再失败一次）。 */
  retryLabel?: string | null;
  onRetry?: () => void;
  disabled?: boolean;
}

export default function DownloadFailureAlert({
  message,
  retryLabel,
  onRetry,
  disabled = false,
}: DownloadFailureAlertProps) {
  return (
    <Alert variant="destructive" className="mt-2" role="alert">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>下载失败</AlertTitle>
      <AlertDescription>
        <p>{message}</p>
        {retryLabel ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={onRetry}
            disabled={disabled}
            data-acbox-action="game_download_retry"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {retryLabel}
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
