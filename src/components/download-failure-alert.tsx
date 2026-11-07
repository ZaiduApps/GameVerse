'use client';

import { AlertTriangle, RefreshCw, Shuffle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

/**
 * 下载失败提示 + 重试 / 备用渠道（待决策 #119 / #140）。
 *
 * 只负责呈现：失败原因由调用方给出，两个动作的目标也由调用方算好
 * （见 `@/lib/download-retry`）。抽成纯展示组件是为了能在 node:test 里用
 * renderToStaticMarkup 做 DOM 断言。
 *
 * 「重试」与「备用渠道」是两个独立动作：重试原渠道不一定成功，备用渠道也
 * 只是可选项，文案不承诺「换源就能下」（#144）。
 */
export interface DownloadFailureAlertProps {
  message: string;
  /** 原渠道重试；为空时不显示重试按钮。 */
  retryLabel?: string | null;
  onRetry?: () => void;
  /** 备用渠道；没有备选渠道时为空，只显示重试。 */
  backupLabel?: string | null;
  onBackup?: () => void;
  disabled?: boolean;
}

export default function DownloadFailureAlert({
  message,
  retryLabel,
  onRetry,
  backupLabel,
  onBackup,
  disabled = false,
}: DownloadFailureAlertProps) {
  return (
    <Alert variant="destructive" className="mt-2" role="alert">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>下载失败</AlertTitle>
      <AlertDescription>
        <p>{message}</p>
        {retryLabel || backupLabel ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {retryLabel ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onRetry}
                disabled={disabled}
                data-acbox-action="game_download_retry"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {retryLabel}
              </Button>
            ) : null}
            {backupLabel ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onBackup}
                disabled={disabled}
                data-acbox-action="game_download_backup"
              >
                <Shuffle className="mr-2 h-4 w-4" />
                {backupLabel}
              </Button>
            ) : null}
          </div>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
