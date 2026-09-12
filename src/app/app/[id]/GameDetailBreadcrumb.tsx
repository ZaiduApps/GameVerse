// 详情页面包屑：首页 › 游戏库 › 游戏分类 › 游戏名。
// 视觉稿 PC 版顶部有该结构，同时输出 BreadcrumbList 结构化数据以对齐社区页既有做法。

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

const DEFAULT_SITE_URL = 'https://apks.cc';

interface GameDetailBreadcrumbProps {
  /** 路由标识：与 page.tsx 的 canonicalPath 同口径（pkg 优先，其次 _id）。 */
  gameId: string;
  gameName: string;
  category: string;
  categoryHref: string;
}

function getSiteUrl() {
  const raw = String(process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).trim();
  return raw.replace(/\/+$/, '') || DEFAULT_SITE_URL;
}

function toJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export default function GameDetailBreadcrumb({ gameId, gameName, category, categoryHref }: GameDetailBreadcrumbProps) {
  const siteUrl = getSiteUrl();
  const currentPath = '/app/' + encodeURIComponent(gameId);
  const jsonLd = toJsonLd({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '首页', item: siteUrl + '/' },
      { '@type': 'ListItem', position: 2, name: '游戏库', item: siteUrl + '/app' },
      { '@type': 'ListItem', position: 3, name: category, item: siteUrl + categoryHref },
      { '@type': 'ListItem', position: 4, name: gameName, item: siteUrl + currentPath },
    ],
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <nav aria-label="面包屑" className="flex items-center gap-2 text-xs font-medium text-[#595c5d] dark:text-muted-foreground">
        <Link href="/" className="inline-flex items-center gap-1 transition-colors [@media(hover:hover)]:hover:text-primary">
          <Home className="h-3.5 w-3.5" aria-hidden="true" />
          <span>首页</span>
        </Link>
        <ChevronRight className="h-3 w-3 text-[#abadae]" aria-hidden="true" />
        <Link href="/app" className="transition-colors [@media(hover:hover)]:hover:text-primary">游戏库</Link>
        <ChevronRight className="h-3 w-3 text-[#abadae]" aria-hidden="true" />
        <Link href={categoryHref} className="transition-colors [@media(hover:hover)]:hover:text-primary">{category}</Link>
        <ChevronRight className="h-3 w-3 text-[#abadae]" aria-hidden="true" />
        <span className="max-w-[14rem] truncate font-semibold text-[#2c2f30] dark:text-foreground sm:max-w-md">{gameName}</span>
      </nav>
    </>
  );
}
