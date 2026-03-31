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
import AppDownloadGuideDialog from '@/components/app-download-guide-dialog';

interface GameDownloadDialogProps {
  resources: ApiDownloadResource[];
  appId?: string;
  pkg?: string;
  downloadNotices?: CardConfigItem[];
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
}: GameDownloadDialogProps) {
  const [loadingChannelId, setLoadingChannelId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const shouldGuideToApp = (resource?: ApiDownloadResource) => {
    if (!resource) return false;

    const metadataCandidates = [
      resource.channel?.code,
      resource.channel?.name,
      resource.channel?.description,
      resource.platform_range,
      resource.platform_ranges,
      resource.channel?.platform_range,
      resource.channel?.platform_ranges,
    ]
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter(Boolean)
      .map((value) => String(value).trim().toLowerCase());

    const combinedMetadata = metadataCandidates.join(' | ');
    const isApkPureChannel = combinedMetadata.includes('apkpure');
    const isAndroidScoped =
      combinedMetadata.includes('android') ||
      combinedMetadata.includes('安卓') ||
      combinedMetadata.includes('apk');

    // Web 侧对 APKPure / Android 定向渠道统一先做本地拦截，引导使用 AC 盒子，
    // 避免先发起 getAppDownload 请求后再发现该渠道并不适合当前 Web 端直下。
    return isApkPureChannel || isAndroidScoped;
  };

  const handleDownloadClick = async (resource: ApiDownloadResource) => {
    const channelId = resource.channel?._id || resource.channel_id || '';
    if ((!appId && !pkg) || !channelId) {
      setError('下载参数缺失，请刷新页面后重试');
      return;
    }

    if (shouldGuideToApp(resource)) {
      setError(null);
      setIsGuideOpen(true);
      return;
    }

    setLoadingChannelId(channelId);
    setError(null);

    try {
      const response = await trackedApiFetch('/game/getAppDownload', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          app_id: appId,
          pkg,
          channel_id: channelId,
        }),
      });

      if (!response.ok) {
        throw new Error('网络请求失败');
      }

      const result = await response.json();
      if (result.code === 0 && result.data?.url) {
        window.open(result.data.url, '_blank');
      } else {
        throw new Error(result.message || '无法获取下载链接');
      }
    } catch (e: any) {
      setError(e.message || '发生未知错误');
    } finally {
      setLoadingChannelId(null);
    }
  };

  return (
    <>
      <Dialog
        onOpenChange={(open) => {
          if (!open) setError(null);
        }}
      >
        <DialogTrigger asChild>
          <Button size="lg" className="w-full md:w-auto btn-interactive">
            <Download className="mr-2 h-5 w-5" />
            获取游戏
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>选择下载渠道</DialogTitle>
            <DialogDescription>
              请选择您偏好的下载方式，点击渠道即可开始下载。
            </DialogDescription>
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
                const channelId = resource.channel?._id || resource.channel_id || '';
                const loading = loadingChannelId === channelId;

                return (
                  <Button
                    key={resource._id}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3 px-4 relative group"
                    disabled={loadingChannelId !== null}
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
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                暂无可用下载渠道。
              </p>
            )}

            {error && (
              <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>出错了</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="secondary"
                disabled={loadingChannelId !== null}
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
