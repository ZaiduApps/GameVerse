/**
 * 近 7 天更新榜（`/updates`）的取数与展示口径（派发单 #181 T181-2）。
 *
 * 页面只消费 `GET /game/updated?days=7&limit=30`；这里集中三件事，路由只做取数/渲染：
 * 1. 把接口载荷归一成可渲染的卡片（脏行丢弃，缺项留空由渲染层隐藏）；
 * 2. metadata：有数据才 index，空数据 `noindex, follow`，canonical 恒为 `/updates`；
 * 3. JSON-LD：`CollectionPage` 恒定输出，`ItemList` 仅在有条目时输出。
 *
 * 版本 / 包大小 / 更新日期 / 来源一律复用 #180 的 `buildGameTrustItems`，不另写一套口径。
 */

import { buildGameTrustItems, type GameTrustItem } from '@/lib/game-trust-strip';
import { resolveGameName } from '@/lib/game-display-name';
import { absoluteUrl } from '@/lib/seo';

export const UPDATES_PATH = '/updates';
export const UPDATES_WINDOW_DAYS = 7;
export const UPDATES_LIMIT = 30;
export const UPDATES_REVALIDATE_SECONDS = 900;

/** `/game/updated` 单条记录（字段以 interface `UpdatedGameRow` 为准，全部做防御式读取）。 */
export interface ApiUpdatedGame {
  _id?: string;
  pkg?: string;
  name?: string;
  summary?: string;
  icon?: string;
  version?: string;
  file_size?: number | null;
  latest_at?: string | null;
  source_type?: string | null;
  tags?: string[];
  metadata?: {
    en?: string;
    chs?: string;
    cht?: string;
    region?: string;
  };
  resource_count?: number;
  primary_channel_id?: string;
  /** `latest_content` 首个非空行，已由接口剥 HTML、截 120 字；缺失时整字段省略。 */
  update_note?: string;
}

export interface UpdateCardView {
  id: string;
  pkg: string;
  name: string;
  icon: string;
  href: string;
  /** 与详情页同源的版本 / 包大小 / 更新日期 / 来源；缺项不生成。 */
  trustItems: GameTrustItem[];
  /** 只有接口返回非空 `update_note` 时才展示。 */
  updateNote: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * 归一化接口载荷。兼容 `{ code, data: { list } }` 与直接的 `{ list }`，
 * 并丢弃既没有 pkg 也没有 _id 的行——没有目标的卡片无法生成详情链接。
 */
export function normalizeUpdatedGamesPayload(payload: unknown): ApiUpdatedGame[] {
  if (!isRecord(payload)) return [];
  const data = isRecord(payload.data) ? payload.data : payload;
  const list = Array.isArray(data.list) ? data.list : [];

  return list.filter(isRecord).map((row) => ({
    _id: readText(row._id),
    pkg: readText(row.pkg),
    name: readText(row.name),
    summary: readText(row.summary),
    icon: readText(row.icon),
    version: readText(row.version),
    file_size: typeof row.file_size === 'number' ? row.file_size : null,
    latest_at: readText(row.latest_at) || null,
    source_type: readText(row.source_type) || null,
    tags: Array.isArray(row.tags) ? row.tags.map(readText).filter(Boolean) : [],
    metadata: isRecord(row.metadata)
      ? {
          en: readText(row.metadata.en),
          chs: readText(row.metadata.chs),
          cht: readText(row.metadata.cht),
          region: readText(row.metadata.region),
        }
      : undefined,
    resource_count: typeof row.resource_count === 'number' ? row.resource_count : undefined,
    primary_channel_id: readText(row.primary_channel_id) || undefined,
    update_note: readText(row.update_note) || undefined,
  })).filter((row) => Boolean(row.pkg || row._id));
}

export function buildUpdateCard(item: ApiUpdatedGame | null | undefined): UpdateCardView | null {
  if (!item) return null;
  const pkg = readText(item.pkg);
  const id = readText(item._id);
  const target = pkg || id;
  if (!target) return null;

  const trustItems = buildGameTrustItems({
    version: item.version,
    fileSize: item.file_size,
    updatedAt: item.latest_at,
    sourceType: item.source_type,
  });

  return {
    id,
    pkg,
    name: resolveGameName({
      name: item.name,
      pkg: item.pkg,
      metadata: item.metadata,
    }) || target,
    icon: readText(item.icon),
    href: `/app/${encodeURIComponent(target)}`,
    trustItems,
    updateNote: readText(item.update_note),
  };
}

export interface UpdatesMetadataInput {
  hasItems: boolean;
  siteName?: string | null;
  shareImage?: string | null;
}

/**
 * 页面 metadata。空数据页（含接口失败降级）必须 `noindex, follow`：
 * 200 空页不是可收录内容，但页面里的详情链接仍值得跟进。
 */
export function buildUpdatesMetadata(input: UpdatesMetadataInput) {
  const siteName = readText(input.siteName) || 'APKScc';
  const shareImage = readText(input.shareImage);
  const title = `近 7 天更新的安卓游戏 - ${siteName} 更新榜`;
  const description =
    '汇总近 7 天有新版本的安卓游戏，查看版本号、包大小、更新时间与下载来源，快速发现值得回坑的作品。';

  return {
    title: { absolute: title },
    description,
    robots: input.hasItems
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large' as const,
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        }
      : { index: false, follow: true },
    alternates: {
      canonical: UPDATES_PATH,
      languages: {
        'zh-CN': UPDATES_PATH,
        'x-default': UPDATES_PATH,
      },
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(UPDATES_PATH),
      siteName,
      type: 'website',
      locale: 'zh_CN',
      images: shareImage
        ? [{ url: shareImage, width: 1200, height: 630, alt: `${siteName} 近 7 天更新榜` }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: shareImage ? [shareImage] : [],
    },
  };
}

export interface UpdatesJsonLd {
  collectionPage: Record<string, unknown>;
  /** 空数据不输出 ItemList，避免把「没有条目」的结构化数据交给搜索引擎。 */
  itemList?: Record<string, unknown>;
}

export function buildUpdatesJsonLd(input: {
  cards: UpdateCardView[];
  siteName?: string | null;
}): UpdatesJsonLd {
  const cards = Array.isArray(input.cards) ? input.cards.filter(Boolean) : [];
  const siteName = readText(input.siteName) || 'APKScc';
  const name = `${siteName} 近 7 天更新榜`;

  const collectionPage: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description: '近 7 天有新版本的安卓游戏汇总，含版本号、包大小、更新时间与下载来源。',
    inLanguage: 'zh-CN',
    url: absoluteUrl(UPDATES_PATH),
    isPartOf: {
      '@type': 'WebSite',
      name: siteName,
      url: absoluteUrl('/'),
    },
  };

  if (cards.length === 0) return { collectionPage };

  return {
    collectionPage,
    itemList: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name,
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      numberOfItems: cards.length,
      itemListElement: cards.map((card, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(card.href),
        name: card.name,
        ...(card.icon ? { image: card.icon } : {}),
      })),
    },
  };
}
