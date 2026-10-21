// 全站面包屑数据：可见导航与 BreadcrumbList 结构化数据共用同一份 items，避免两处各写一遍导致数量/层级不一致。

export interface BreadcrumbItem {
  name: string;
  href?: string;
}

const DEFAULT_SITE_URL = 'https://apks.cc';

/** 站点根，供 pages 复用。 */
export const BREADCRUMB_ROOT: BreadcrumbItem = { name: '首页', href: '/' };

/** 和 src/lib/seo.ts 的 absoluteUrl 同源；优先 NEXT_PUBLIC_SITE_URL，默认 https://apks.cc。 */
export function getBreadcrumbSiteUrl(): string {
  const raw = String(
    process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || DEFAULT_SITE_URL,
  ).trim();
  const normalized = raw.replace(/\/+$/, '');
  return normalized || DEFAULT_SITE_URL;
}

function toAbsoluteItemUrl(href: string, siteUrl: string): string {
  if (/^https?:\/\//i.test(href)) return href;
  if (href.startsWith('/')) return `${siteUrl}${href}`;
  return `${siteUrl}/${href}`;
}

/**
 * 生成 BreadcrumbList JSON-LD（position 从 1 递增，item 用绝对 URL；最后一项也带 item）。
 * 缺省 href 的项沿用上一项的绝对 URL（首项回落到站点根），保证每条 ListItem 都有合法 item。
 */
export function buildBreadcrumbJsonLd(
  items: BreadcrumbItem[],
  options?: { siteUrl?: string },
): {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }>;
} {
  const siteUrl = String(options?.siteUrl || getBreadcrumbSiteUrl())
    .trim()
    .replace(/\/+$/, '') || DEFAULT_SITE_URL;
  let previousItemUrl = `${siteUrl}/`;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => {
      const itemUrl = item.href
        ? toAbsoluteItemUrl(item.href, siteUrl)
        : previousItemUrl;
      previousItemUrl = itemUrl;
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: itemUrl,
      };
    }),
  };
}

/** 供 dangerouslySetInnerHTML 用，转义 `<`（对齐 AppShell/GameDetailBreadcrumb 现有做法）。 */
export function toBreadcrumbJsonLdScript(jsonLd: unknown): string {
  return JSON.stringify(jsonLd).replace(/</g, '\\u003c');
}
