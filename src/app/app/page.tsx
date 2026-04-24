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

export async function generateMetadata(): Promise<Metadata> {
  const config = await getPublicSiteConfig(300);
  const siteName = String(config?.basic?.site_name || 'APKScc').trim();
  const title = `${siteName} 游戏库 - 热门安卓游戏与应用下载`;
  const description =
    '浏览 APKScc 游戏库，发现热门国际服与精品安卓应用。支持按分类、评分和关键词快速查找，一键直达下载页。';
  const shareImage = String(config?.basic?.share_image || '').trim();

  return {
    title: { absolute: title },
    description,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
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

export default async function GamesPage() {
  const [config, games] = await Promise.all([getPublicSiteConfig(300), getTopGamesForSeo()]);
  const siteName = String(config?.basic?.site_name || 'APKScc').trim();

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
      <AppLibraryView />
    </>
  );
}
