'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, Layers, RotateCcw, Send } from 'lucide-react';
import type { ReactNode } from 'react';

import {
  buildDownloadErrorActions,
  describeDownloadError,
  resolveDownloadErrorState,
  type DownloadErrorActionKey,
} from '@/lib/download-error-state';
import { cn } from '@/lib/utils';
import type { DownloadFailureReason } from '@/lib/game-download-redirect';

const ACTION_ICONS: Record<DownloadErrorActionKey, ReactNode> = {
  retry: <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />,
  report: <Send className="h-3.5 w-3.5" aria-hidden="true" />,
  versions: <Layers className="h-3.5 w-3.5" aria-hidden="true" />,
};

const ACTION_CLASS =
  'inline-flex items-center gap-1.5 rounded-lg border border-tone-amber/40 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#7a4a00] transition-colors [@media(hover:hover)]:hover:bg-tone-amber/10 lg:text-xs dark:bg-card dark:text-tone-amber';

interface DownloadErrorNoticeViewProps {
  reason: DownloadFailureReason;
  gameName?: string;
  pageUrl?: string;
  className?: string;
}

/**
 * 下载失败提示的纯展示组件：文案按「渠道不可用 / 资源失效」分叉，
 * 固定给两条出口（反馈失效、查看其他版本）。测试直接渲染这个导出。
 */
export function DownloadErrorNoticeView({
  reason,
  gameName,
  pageUrl,
  className,
}: DownloadErrorNoticeViewProps) {
  const copy = describeDownloadError(reason);
  const actions = buildDownloadErrorActions({ gameName, pageUrl, reason });

  return (
    <div role="alert" className={cn('rounded-xl border border-tone-amber/40 bg-tone-amber/10 p-3 lg:p-4', className)}>
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-tone-amber" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#7a4a00] dark:text-tone-amber">{copy.title}</p>
          <p className="mt-1 text-xs leading-6 text-[#7a4a00]/85 dark:text-muted-foreground">{copy.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {actions.map((action) =>
              action.target === 'in-page' ? (
                <a key={action.key} href={action.href} className={ACTION_CLASS} data-acbox-action={`download_error_${action.key}`}>
                  {ACTION_ICONS[action.key]}
                  {action.label}
                </a>
              ) : (
                <Link
                  key={action.key}
                  href={action.href}
                  prefetch={false}
                  className={ACTION_CLASS}
                  data-acbox-action={`download_error_${action.key}`}
                >
                  {ACTION_ICONS[action.key]}
                  {action.label}
                </Link>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 详情页顶部横幅：只在 `?download_error=1` 时出现。
 *
 * 详情页是 ISR 静态页，服务端不能读 searchParams，所以这里用客户端
 * useSearchParams（外层已有 Suspense 边界），且不改变页面的缓存与 SEO 行为。
 */
export default function DownloadErrorNotice({
  gameName,
  pageUrl,
}: {
  gameName?: string;
  pageUrl?: string;
}) {
  const searchParams = useSearchParams();
  const state = resolveDownloadErrorState(searchParams);
  if (!state.failed) return null;

  return (
    <div className="relative z-30 border-b border-tone-amber/40 bg-tone-amber/10 px-4 py-3">
      <div className="mx-auto max-w-7xl lg:px-16 2xl:px-20">
        <DownloadErrorNoticeView reason={state.reason} gameName={gameName} pageUrl={pageUrl} />
      </div>
    </div>
  );
}
