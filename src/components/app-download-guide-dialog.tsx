'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ExternalLink, QrCode, Smartphone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AppDownloadGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  mobileDescription?: string;
  desktopDescription?: string;
  appUrl?: string;
}

const DEFAULT_APP_URL = 'https://app.apks.cc';
const DEFAULT_TITLE = '请在 App 中打开';
const DEFAULT_MOBILE_DESCRIPTION =
  '当前资源使用 AC 盒子可一键下载最新版本游戏资源并帮您安装，一步到位。是否先前往下载盒子？';
const DEFAULT_DESKTOP_DESCRIPTION =
  '当前资源建议使用 AC 盒子扫码打开，在 App 内可一键下载并完成安装。';

export default function AppDownloadGuideDialog({
  open,
  onOpenChange,
  title = DEFAULT_TITLE,
  mobileDescription = DEFAULT_MOBILE_DESCRIPTION,
  desktopDescription = DEFAULT_DESKTOP_DESCRIPTION,
  appUrl = DEFAULT_APP_URL,
}: AppDownloadGuideDialogProps) {
  const [isNarrowScreen, setIsNarrowScreen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsNarrowScreen(mediaQuery.matches);
    sync();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', sync);
      return () => mediaQuery.removeEventListener('change', sync);
    }

    mediaQuery.addListener(sync);
    return () => mediaQuery.removeListener(sync);
  }, []);

  const handleOpenAppSite = () => {
    window.open(appUrl, '_blank', 'noopener,noreferrer');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            {isNarrowScreen ? <Smartphone className="h-5 w-5 text-primary" /> : <QrCode className="h-5 w-5 text-primary" />}
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-muted-foreground">
            {isNarrowScreen ? mobileDescription : desktopDescription}
          </DialogDescription>
        </DialogHeader>

        {isNarrowScreen ? (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground/85">
            AC 盒子支持资源直装、版本更新提醒与安装辅助，移动端体验更完整。
          </div>
        ) : (
          <div className="space-y-3">
            <div className="mx-auto relative h-52 w-52 overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm">
              <Image
                src="https://cdn.apks.cc/blinko/ACBOX_QR.png"
                alt="ACBOX 下载二维码"
                fill
                className="object-cover"
              />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              使用手机扫码后，在 AC 盒子中继续下载与安装。
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            稍后再说
          </Button>
          <Button type="button" className="btn-interactive" onClick={handleOpenAppSite}>
            前往下载盒子
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
