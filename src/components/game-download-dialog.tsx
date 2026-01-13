
'use client';

import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Download, Smartphone, Store, Globe, Gamepad2, Loader2, AlertTriangle } from 'lucide-react';
import type { ApiDownloadResource, CardConfigItem } from '@/types';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface GameDownloadDialogProps {
  resources: ApiDownloadResource[];
  pkg: string;
  downloadNotices?: CardConfigItem[];
}

// Fallback icons map
const iconMap: { [key: string]: React.ReactNode } = {
  app_store: <Smartphone className="w-5 h-5 mr-3 text-muted-foreground" />,
  google_play: <Store className="w-5 h-5 mr-3 text-muted-foreground" />,
  official_site: <Globe className="w-5 h-5 mr-3 text-muted-foreground" />,
  taptap: <Gamepad2 className="w-5 h-5 mr-3 text-muted-foreground" />,
  third_party: <Gamepad2 className="w-5 h-5 mr-3 text-muted-foreground" />,
};

export default function GameDownloadDialog({ resources, pkg, downloadNotices }: GameDownloadDialogProps) {
  const [loadingChannelId, setLoadingChannelId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadClick = async (channelId: string) => {
    setLoadingChannelId(channelId);
    setError(null);
    try {
      const response = await fetch('/api/game/getAppDownload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pkg: pkg,
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
      console.error('Download error:', e);
      setError(e.message || '发生未知错误');
    } finally {
      setLoadingChannelId(null);
    }
  };

  return (
    <Dialog onOpenChange={() => setError(null)}>
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
            请选择您偏好的下载方式。点击渠道即可开始下载。
          </DialogDescription>
        </DialogHeader>

        {downloadNotices && downloadNotices.length > 0 && (
          <div className="space-y-2">
            {downloadNotices.map(notice => (
              <Alert key={notice._id} variant="default" className="bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800/40 dark:text-yellow-300">
                <AlertTriangle className="h-4 w-4 !text-yellow-500 dark:!text-yellow-400" />
                <AlertTitle className="font-semibold">{notice.content.title}</AlertTitle>
                <AlertDescription className="text-xs">
                    {notice.content.text}
                    {notice.content.html && <div dangerouslySetInnerHTML={{ __html: notice.content.html }} />}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}


        <div className="grid gap-3 py-4">
          {resources && resources.length > 0 ? (
            resources.map(resource => (
              <Button
                key={resource._id}
                variant="outline"
                className="w-full justify-start text-left h-auto py-3 px-4 relative"
                disabled={loadingChannelId !== null}
                onClick={() => handleDownloadClick(resource.channel._id)}
              >
                {loadingChannelId === resource.channel._id ? (
                  <Loader2 className="w-5 h-5 mr-3 text-muted-foreground animate-spin" />
                ) : resource.channel.icon ? (
                   <Image src={resource.channel.icon} alt={resource.channel.name} width={24} height={24} className="w-6 h-6 mr-3" />
                ) : (
                  iconMap[resource.channel.code] || <Download className="w-5 h-5 mr-3 text-muted-foreground" />
                )}
                <div className="flex flex-col">
                    <span className="text-base font-medium">{resource.channel.name}</span>
                    {resource.channel.description && (
                        <span className="text-xs text-muted-foreground">{resource.channel.description}</span>
                    )}
                </div>
              </Button>
            ))
          ) : (
            <p className='text-sm text-muted-foreground text-center py-4'>暂无可用下载渠道。</p>
          )}
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={loadingChannelId !== null}>
              关闭
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
