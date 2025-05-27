
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

const MOCK_DOWNLOAD_CHANNELS: { id: string; name: string; icon: React.ReactNode }[] = [
  { id: 'appstore', name: 'App Store', icon: <Smartphone className="w-5 h-5 mr-3 text-muted-foreground" /> },
  { id: 'googleplay', name: 'Google Play', icon: <Store className="w-5 h-5 mr-3 text-muted-foreground" /> },
  { id: 'official', name: '官方网站', icon: <Globe className="w-5 h-5 mr-3 text-muted-foreground" /> },
  { id: 'taptap', name: 'TapTap', icon: <Gamepad2 className="w-5 h-5 mr-3 text-muted-foreground" /> },
];

export default function GameDownloadDialog() {
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
          {MOCK_DOWNLOAD_CHANNELS.map(channel => (
            <Button
              key={channel.id}
              variant="outline"
              className="w-full justify-start text-left h-auto py-3 px-4"
              onClick={() => alert(`正在前往 ${channel.name} (模拟)`)}
            >
              {channel.icon}
              <span className="text-base font-medium">{channel.name}</span>
            </Button>
          ))}
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
