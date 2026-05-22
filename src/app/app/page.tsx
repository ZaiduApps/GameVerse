import type { Metadata } from 'next';

import AppLibraryView from './AppLibraryView';
import { trackedApiFetch } from '@/lib/api';
import { absoluteUrl } from '@/lib/seo';
import { getPublicSiteConfig } from '@/lib/site-config';
import type { ApiGame } from '@/types';

const GAME_JSONLD_PAGE_SIZE = 12;

type GameQueryPayload = {
  code?: number;
  data?: {
    list?: ApiGame[];
  };
};

type HomeFallbackPayload = {
  code?: number;
  data?: {
    albums?: Array<{
      games?: ApiGame[];
    }>;
  };
};

function getGameHref(game: ApiGame): string {
  const target = String(game.pkg || game._id || '').trim();
  return target ? `/app/${encodeURIComponent(target)}` : '/app';
}

async function getTopGamesForSeo(): Promise<ApiGame[]> {
  try {
    const params = new URLSearchParams({
      q: 'com',
      page: '1',
      pageSize: String(GAME_JSONLD_PAGE_SIZE),
    });
    const res = await trackedApiFetch(`/game/q?${params.toString()}`, {
      cache: 'force-cache',
      next: { revalidate: 900 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as GameQueryPayload;
    if (Number(json?.code ?? -1) !== 0) return [];
    const list = json?.data?.list;
    if (Array.isArray(list) && list.length > 0) return list;
  } catch {
    // fall through to home fallback
  }

  try {
    const res = await trackedApiFetch('/home', {
      cache: 'force-cache',
      next: { revalidate: 900 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as HomeFallbackPayload;
    if (Number(json?.code ?? -1) !== 0) return [];

    const albums = Array.isArray(json?.data?.albums) ? json.data.albums : [];
    const deduped = new Map<string, ApiGame>();
    for (const album of albums) {
      const games = Array.isArray(album?.games) ? album.games : [];
      for (const game of games) {
        const key = String(game?.pkg || game?._id || '').trim();
        if (!key) continue;
        if (!deduped.has(key)) {
          deduped.set(key, game);
        }
        if (deduped.size >= GAME_JSONLD_PAGE_SIZE) {
          return Array.from(deduped.values());
        }
      }
    }
    return Array.from(deduped.values());
  } catch {
    return [];
  }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const config = await getPublicSiteConfig(300);
  const params = await searchParams;
  const siteName = String(config?.basic?.site_name || 'APKScc').trim();
  const title = `${siteName} 游戏库 - 热门安卓游戏与应用下载`;
  const description =
    '浏览 APKScc 游戏库，发现热门国际服与精品安卓应用。支持按分类、评分和关键词快速查找，一键直达下载页。';
  const shareImage = String(config?.basic?.share_image || '').trim();
  const hasQuery = Boolean(String(params?.q || '').trim());

  return {
    title: { absolute: title },
    description,
    robots: {
      index: !hasQuery,
      follow: !hasQuery,
      googleBot: {
        index: !hasQuery,
        follow: !hasQuery,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    alternates: {
      canonical: '/app',
      languages: {
        'zh-CN': '/app',
        'x-default': '/app',
      },
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl('/app'),
      siteName,
      type: 'website',
      locale: 'zh_CN',
      images: shareImage ? [shareImage] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: shareImage ? [shareImage] : [],
    },
  };
}

const APP_TOPIC_CLUSTERS = [
  {
    title: '国际服手游推荐',
    description: '适合关注海外服、国际区版本和跨区体验的玩家，快速发现近期讨论度较高的热门作品。',
    href: '/app?q=国际服',
  },
  {
    title: '二次元手游合集',
    description: '围绕角色养成、剧情冒险和视觉风格整理，适合偏好二次元题材的用户继续深入筛选。',
    href: '/app?q=二次元',
  },
  {
    title: 'MMO 与多人联机',
    description: '聚焦大型多人在线、组队开荒和长期养成玩法，适合作为高黏性题材的搜索入口。',
    href: '/app?q=MMO',
  },
];

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [config, games] = await Promise.all([getPublicSiteConfig(300), getTopGamesForSeo()]);
  const params = await searchParams;
  const siteName = String(config?.basic?.site_name || 'APKScc').trim();
  const initialKeyword = String(params?.q || '').trim();

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${siteName} 游戏库`,
    description: '热门安卓游戏与应用下载列表',
    inLanguage: 'zh-CN',
    url: absoluteUrl('/app'),
    isPartOf: {
      '@type': 'WebSite',
      name: siteName,
      url: absoluteUrl('/'),
    },
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${siteName} 热门游戏列表`,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    numberOfItems: games.length,
    itemListElement: games.map((game, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absoluteUrl(getGameHref(game)),
      name: String(game.name || '').trim() || '热门游戏',
      image: String(game.header_image || game.icon || '').trim() || undefined,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      {games.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      ) : null}
      <section className="mb-8 rounded-2xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-black text-foreground">{siteName} 游戏库</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          这里汇总热门安卓游戏、国际服作品和高热度应用入口。你可以把它当作站内的主题导航页，先看题材方向，再进入详情页核对版本、截图、安装说明与社区讨论。
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {APP_TOPIC_CLUSTERS.map((item) => (
            <a key={item.title} href={item.href} className="rounded-xl border bg-background/60 p-4 transition-colors hover:border-primary/40 hover:bg-primary/5">
              <p className="font-semibold text-foreground">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
            </a>
          ))}
        </div>
      </section>
      <AppLibraryView initialKeyword={initialKeyword} />
    </>
  );
}
