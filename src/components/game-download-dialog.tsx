
'use client';

import type React from 'react';
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
import { Download, Smartphone, Store, Globe, Gamepad2 } from 'lucide-react';
import type { ApiDownloadResource } from '@/types';
import Image from 'next/image';

interface GameDownloadDialogProps {
  resources: ApiDownloadResource[];
}

// Fallback icons map
const iconMap: { [key: string]: React.ReactNode } = {
  app_store: <Smartphone className="w-5 h-5 mr-3 text-muted-foreground" />,
  google_play: <Store className="w-5 h-5 mr-3 text-muted-foreground" />,
  official_site: <Globe className="w-5 h-5 mr-3 text-muted-foreground" />,
  taptap: <Gamepad2 className="w-5 h-5 mr-3 text-muted-foreground" />,
  third_party: <Gamepad2 className="w-5 h-5 mr-3 text-muted-foreground" />,
};


export default function GameDownloadDialog({ resources }: GameDownloadDialogProps) {
  return (
    <Dialog>
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
            请选择您偏好的下载方式。点击渠道名称即可跳转（模拟操作）。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          {resources && resources.length > 0 ? (
            resources.map(resource => (
              <Button
                key={resource._id}
                variant="outline"
                className="w-full justify-start text-left h-auto py-3 px-4"
                onClick={() => alert(`正在前往 ${resource.channel.name} (模拟)`)}
              >
                {resource.channel.icon ? (
                   <Image src={resource.channel.icon} alt={resource.channel.name} width={20} height={20} className="w-5 h-5 mr-3" />
                ) : (
                  iconMap[resource.channel.code] || <Download className="w-5 h-5 mr-3 text-muted-foreground" />
                )}
                <span className="text-base font-medium">{resource.channel.name}</span>
              </Button>
            ))
          ) : (
            <p className='text-sm text-muted-foreground text-center py-4'>暂无可用下载渠道。</p>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              关闭
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
