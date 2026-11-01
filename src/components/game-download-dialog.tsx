'use client';

import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  Download,
  Gamepad2,
  Globe,
  Loader2,
  Smartphone,
  Store,
} from 'lucide-react';
import type { ApiDownloadResource, CardConfigItem } from '@/types';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { trackedApiFetch } from '@/lib/api';
import DownloadFailureAlert from '@/components/download-failure-alert';
import { reportDownloadClick, reportDownloadFailure } from '@/lib/download-click-tracking';
import { resolveDownloadChannelId, shouldGuideToApp } from '@/lib/game-download-channel';
import { pickDownloadRetryTarget } from '@/lib/download-retry';
import type { GameSourceInfo } from '@/lib/game-source-link';
import AppDownloadGuideDialog from '@/components/app-download-guide-dialog';
import ContentReportDialog from '@/components/content-report-dialog';

interface GameDownloadDialogProps {
  resources: ApiDownloadResource[];
  appId?: string;
  pkg?: string | null;
  downloadNotices?: CardConfigItem[];
  sourceInfo?: GameSourceInfo | null;
  triggerClassName?: string;
  triggerLabel?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

const iconMap: { [key: string]: React.ReactNode } = {
  app_store: <Smartphone className="w-5 h-5 mr-3 text-muted-foreground" />,
  google_play: <Store className="w-5 h-5 mr-3 text-muted-foreground" />,
  official_site: <Globe className="w-5 h-5 mr-3 text-muted-foreground" />,
  taptap: <Gamepad2 className="w-5 h-5 mr-3 text-muted-foreground" />,
  third_party: <Gamepad2 className="w-5 h-5 mr-3 text-muted-foreground" />,
};

export default function GameDownloadDialog({
  resources,
  appId,
  pkg,
  downloadNotices,
  sourceInfo,
  triggerClassName,
  triggerLabel,
  open,
  onOpenChange,
  hideTrigger = false,
}: GameDownloadDialogProps) {
  const [loadingChannelId, setLoadingChannelId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failedChannelId, setFailedChannelId] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const handleDownloadClick = async (resource: ApiDownloadResource) => {
    const channelId = resolveDownloadChannelId(resource);
    const channelName = String(resource.channel?.name || '').trim();

    // 失败一律：可见提示 + 记下失败渠道 + fail_reason 归因，不阻断换渠道重试。
    const fail = (
      message: string,
      meta: { reasonCode?: string | number | null } = {},
    ) => {
      setError(message);
      setFailedChannelId(channelId || null);
      reportDownloadFailure({
        appId,
        pkg,
        channelId,
        channelCode: resource.channel?.code,
        channelName,
        pump: 'web_detail_dialog',
        stage: 'request_download_url',
        reason: message,
        reasonCode: meta.reasonCode ?? null,
      });
    };

    if ((!appId && !pkg) || !channelId) {
      fail('下载参数缺失，请刷新页面后重试');
      return;
    }

    if (shouldGuideToApp(resource)) {
      setError(null);
      setIsGuideOpen(true);
      return;
    }

    // 用户真实点击了某个可直下渠道 → 客户端声明一次点击意图（服务端按 event_id 去重）。
    // 不阻塞跳转：上报失败静默，下载可用性优先。
    reportDownloadClick({ appId, pkg, channelId, surface: 'detail_dialog' });

    setLoadingChannelId(channelId);
    setError(null);
    setFailedChannelId(null);

    try {
      const response = await trackedApiFetch('/game/getAppDownload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 来源位：让 interface 能把「弹窗直下」与「服务端直出 302」分开统计。
          'x-ac-surface': 'detail_dialog',
        },
        body: JSON.stringify({
          app_id: appId,
          pkg,
          channel_id: channelId,
        }),
      });

      if (!response.ok) {
        fail(`「${channelName || '当前渠道'}」请求失败（HTTP ${response.status}），请换一个渠道重试`, {
          reasonCode: `http_${response.status}`,
        });
        return;
      }

      const result = await response.json();
      if (result.code === 0 && result.data?.url) {
        window.open(result.data.url, '_blank');
        return;
      }

      fail(`「${channelName || '当前渠道'}」暂时不可用：${result.message || '无法获取下载链接'}`, {
        reasonCode: result.code ?? 'no_url',
      });
    } catch (e: any) {
      fail(`「${channelName || '当前渠道'}」下载失败：${e?.message || '发生未知错误'}`, {
        reasonCode: 'exception',
      });
    } finally {
      setLoadingChannelId(null);
    }
  };

  const retryTarget = pickDownloadRetryTarget(resources, failedChannelId);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setError(null);
            setFailedChannelId(null);
          }
          onOpenChange?.(nextOpen);
        }}
      >
        {!hideTrigger ? (
          <DialogTrigger asChild>
            <Button
              size="lg"
              className={`w-full md:w-auto btn-interactive ${triggerClassName || ''}`}
              data-acbox-action="game_download_open"
              data-acbox-label={triggerLabel || '获取游戏'}
            >
              <Download className="mr-2 h-5 w-5" />
              {triggerLabel || '获取游戏'}
            </Button>
          </DialogTrigger>
        ) : null}
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>选择下载渠道</DialogTitle>
            <DialogDescription>
              请选择您偏好的下载方式，点击渠道即可开始下载。
            </DialogDescription>
            {sourceInfo ? (
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span>来源：{sourceInfo.label}</span>
                {sourceInfo.repoUrl ? (
                  <a
                    className="underline decoration-dotted underline-offset-2 hover:text-foreground"
                    href={sourceInfo.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub 仓库
                  </a>
                ) : null}
                <span>遵循 {sourceInfo.license} 许可</span>
              </p>
            ) : null}
          </DialogHeader>

          {downloadNotices && downloadNotices.length > 0 && (
            <div className="space-y-2">
              {downloadNotices.map((notice) => (
                <Alert
                  key={notice._id}
                  variant="default"
                  className="bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800/40 dark:text-yellow-300"
                >
                  <AlertTriangle className="h-4 w-4 !text-yellow-500 dark:!text-yellow-400" />
                  <AlertTitle className="font-semibold">
                    {notice.content.title}
                  </AlertTitle>
                  <AlertDescription className="text-xs">
                    {notice.content.text}
                    {notice.content.html && (
                      <div
                        dangerouslySetInnerHTML={{ __html: notice.content.html }}
                      />
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          <div className="grid gap-3 py-4">
            {resources && resources.length > 0 ? (
              resources.map((resource) => {
                const channelId = resolveDownloadChannelId(resource);
                const loading = loadingChannelId === channelId;

                return (
                  <div key={resource._id} className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="w-full flex-1 justify-start text-left h-auto py-3 px-4 relative group"
                      disabled={loadingChannelId !== null}
                      data-acbox-action="game_download_channel_click"
                      data-acbox-label={resource.channel?.name || '未知渠道'}
                      onClick={() => handleDownloadClick(resource)}
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 mr-3 text-muted-foreground animate-spin" />
                      ) : resource.channel?.icon ? (
                        <div className="relative w-6 h-6 mr-3">
                          <Image
                            src={resource.channel.icon}
                            alt={resource.channel.name || 'channel'}
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        iconMap[resource.channel?.code || ''] || (
                          <Download className="w-5 h-5 mr-3 text-muted-foreground" />
                        )
                      )}
                      <div className="flex flex-col">
                        <span className="text-base font-medium group-hover:text-primary transition-colors">
                          {resource.channel?.name || '未知渠道'}
                        </span>
                        {resource.channel?.description && (
                          <span className="text-xs text-muted-foreground">
                            {resource.channel.description}
                          </span>
                        )}
                      </div>
                    </Button>
                    {/* 资源卡片举报：与渠道点击分开，避免嵌套按钮。 */}
                    <ContentReportDialog targetType="resource" targetId={resource._id} iconOnly />
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                暂无可用下载渠道。
              </p>
            )}

            {error && (
              <DownloadFailureAlert
                message={error}
                retryLabel={retryTarget?.label}
                onRetry={
                  retryTarget
                    ? () => handleDownloadClick(retryTarget.resource)
                    : undefined
                }
                disabled={loadingChannelId !== null}
              />
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="secondary"
                disabled={loadingChannelId !== null}
                data-acbox-action="game_download_close"
                data-acbox-label="关闭下载渠道弹窗"
              >
                关闭
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AppDownloadGuideDialog
        open={isGuideOpen}
        onOpenChange={setIsGuideOpen}
        title="推荐使用 AC 盒子下载"
      />
    </>
  );
}
