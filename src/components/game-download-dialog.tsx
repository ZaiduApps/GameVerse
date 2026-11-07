'use client';

import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import DownloadFailureAlert from '@/components/download-failure-alert';
import {
  reportDownloadClick,
  reportDownloadFailure,
} from '@/lib/download-click-tracking';
import { resolveDownloadChannelId, shouldGuideToApp } from '@/lib/game-download-channel';
import {
  requestDownloadUrl,
  type DownloadFailureReasonKind,
} from '@/lib/download-request';
import {
  pickDownloadBackupTarget,
  pickDownloadRetryTarget,
} from '@/lib/download-retry';
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
  const emptyChannelsReported = useRef(false);

  /**
   * 打开弹窗却没有任何可点渠道（待决策 #140/#144）：这不是「点了没反应」，
   * 而是一个明确的失败态。每个打开周期最多上报一次，避免重复渲染刷事件。
   */
  const reportEmptyChannels = useCallback(() => {
    if (emptyChannelsReported.current) return;
    emptyChannelsReported.current = true;
    reportDownloadFailure({
      appId,
      pkg,
      pump: 'web_detail_dialog',
      stage: 'select_channel',
      reason: '当前没有可用的下载渠道',
      reasonKind: 'no_channel',
    });
  }, [appId, pkg]);

  useEffect(() => {
    if (open === true && (!resources || resources.length === 0)) {
      reportEmptyChannels();
    }
  }, [open, resources, reportEmptyChannels]);

  const handleDownloadClick = async (resource: ApiDownloadResource) => {
    const channelId = resolveDownloadChannelId(resource);
    const channelName = String(resource.channel?.name || '').trim();

    // 本次点击的 dedupe_key：点击、服务端签发、失败回执共用，三条事件才能对齐（#131）。
    // 参数缺失时还没产生点击，保持 null，失败回执不带键。
    let intentKey: string | null = null;

    // 失败一律：可见提示 + 记下失败渠道 + fail_reason 归因，不阻断换渠道重试。
    const fail = (
      message: string,
      reasonCode?: string | number | null,
      reasonKind?: DownloadFailureReasonKind,
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
        reasonCode,
        reasonKind,
        dedupeKey: intentKey,
      });
    };

    if ((!appId && !pkg) || !channelId) {
      fail('下载参数缺失，请刷新页面后重试', 'missing_params', 'no_channel');
      return;
    }

    if (shouldGuideToApp(resource)) {
      setError(null);
      setIsGuideOpen(true);
      return;
    }

    // 用户真实点击了某个可直下渠道 → 客户端声明一次点击意图（服务端按 event_id 去重）。
    // 不阻塞跳转：上报失败静默，下载可用性优先。来源维度（#145）显式传 detail，
    // 不按当前 URL 猜，免得分不清列表卡与详情页。
    intentKey = reportDownloadClick({
      appId,
      pkg,
      channelId,
      surface: 'detail_dialog',
      source: 'detail',
    });

    setLoadingChannelId(channelId);
    setError(null);
    setFailedChannelId(null);

    try {
      const result = await requestDownloadUrl({
        appId,
        pkg,
        channelId,
        channelName,
        dedupeKey: intentKey,
        source: 'detail',
      });
      if (result.ok) {
        window.open(result.url, '_blank');
        return;
      }
      fail(result.message, result.reasonCode, result.reasonKind);
    } finally {
      setLoadingChannelId(null);
    }
  };

  const retryTarget = pickDownloadRetryTarget(resources, failedChannelId);
  const backupTarget = pickDownloadBackupTarget(resources, failedChannelId);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setError(null);
            setFailedChannelId(null);
            emptyChannelsReported.current = false;
          } else if (!resources || resources.length === 0) {
            reportEmptyChannels();
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
                backupLabel={backupTarget?.label}
                onBackup={
                  backupTarget
                    ? () => handleDownloadClick(backupTarget.resource)
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
