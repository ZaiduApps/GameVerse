'use client';

import { Download } from 'lucide-react';

import { reportDownloadClick } from '@/lib/download-click-tracking';
import type { DownloadChannelLink } from '@/lib/game-download-channel';

/**
 * 详情页服务端直出的下载链接。
 *
 * 用普通客户端组件（默认 SSR）而不是 `dynamic(..., { ssr: false })`：
 * 锚点必须出现在服务端返回的 HTML 里，禁用 JS 与爬虫才能直接点到 302 入口。
 * 增强项只有一个：点击时上报 download_click（surface=detail_ssr），失败静默、不拦跳转。
 */

interface GameDirectDownloadLinksProps {
  links: DownloadChannelLink[];
  appId?: string;
  pkg?: string | null;
}

export default function GameDirectDownloadLinks({ links, appId, pkg }: GameDirectDownloadLinksProps) {
  if (!Array.isArray(links) || links.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="text-xs text-[#757778] dark:text-muted-foreground">直接下载：</span>
      {links.map((link) => (
        <a
          key={link.channelId}
          href={link.href}
          rel="nofollow"
          className="inline-flex items-center gap-1 rounded-lg border border-[#abadae]/25 bg-[#eff1f2]/70 px-2.5 py-1.5 text-xs font-medium text-[#2c2f30] transition-colors [@media(hover:hover)]:hover:bg-[#e6e8ea] dark:border-border/45 dark:bg-muted/50 dark:text-foreground dark:[@media(hover:hover)]:hover:bg-muted"
          onClick={() =>
            reportDownloadClick({
              appId,
              pkg,
              channelId: link.channelId,
              surface: 'detail_ssr',
            })
          }
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{link.channelName} 下载</span>
        </a>
      ))}
    </div>
  );
}
