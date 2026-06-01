import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import AlbumTopicView from '@/components/albums/AlbumTopicView';
import {
  getAlbumDescription,
  getAlbumDetail,
  getAlbumHref,
  getAlbumKeywords,
  getAlbumShareImage,
  getAlbumStyleLabel,
  normalizeAlbumGames,
} from '@/lib/albums';
import { absoluteUrl } from '@/lib/seo';
import { getPublicSiteConfig } from '@/lib/site-config';

export const revalidate = 300;

function normalizeText(value?: string | null): string {
  return String(value || '').trim();
}

function clampText(value: string, maxLength: number): string {
  const chars = Array.from(normalizeText(value));
  if (chars.length <= maxLength) return chars.join('');
  return `${chars.slice(0, maxLength).join('')}...`;
}

function getGameHref(game: { pkg?: string | null; _id?: string | null }): string {
  const target = normalizeText(game?.pkg || game?._id);
  return target ? `/app/${encodeURIComponent(target)}` : '/app';
}

function collectRegions(input: Array<{ metadata?: { region?: string | null } }>): string[] {
  return Array.from(
    new Set(
      input
        .map((item) => normalizeText(item?.metadata?.region))
        .filter(Boolean),
    ),
  );
}

function buildMetadataDescription(input: {
  albumDescription: string;
  gameCount: number;
  regions: string[];
  keywords: string[];
}) {
  const parts = [
    input.albumDescription,
    input.gameCount > 0 ? `当前收录 ${input.gameCount} 款内容。` : '',
    input.regions.length > 0 ? `覆盖 ${input.regions.slice(0, 4).join('、')} 等分区。` : '',
    input.keywords.length > 0 ? `聚合 ${input.keywords.slice(0, 4).join('、')} 等主题方向。` : '',
  ].filter(Boolean);

  return clampText(parts.join(' '), 160);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [config, album] = await Promise.all([getPublicSiteConfig(300), getAlbumDetail(id, revalidate)]);

  if (!album) {
    return {
      title: '专题不存在',
      description: '当前专题页暂时无法访问。',
      robots: { index: false, follow: false },
    };
  }

  const siteName = normalizeText(config?.basic?.site_name) || 'APKScc';
  const siteKeywords = normalizeText(config?.seo?.keywords);
  const siteShareImage = normalizeText(config?.basic?.share_image);
  const games = normalizeAlbumGames(album);
  const regions = collectRegions(games);
  const albumTitle = normalizeText(album.title) || '专题推荐';
  const albumStyleLabel = getAlbumStyleLabel(album.style);
  const canonicalPath = getAlbumHref(album);
  const canonicalUrl = absoluteUrl(canonicalPath);
  const shareImage = getAlbumShareImage(album, siteShareImage);
  const keywords = Array.from(
    new Set(
      [
        ...siteKeywords.split(',').map((item) => item.trim()).filter(Boolean),
        ...getAlbumKeywords(album),
        siteName,
      ].filter(Boolean),
    ),
  ).slice(0, 18);
  const description = buildMetadataDescription({
    albumDescription: getAlbumDescription(album),
    gameCount: games.length,
    regions,
    keywords,
  });
  const title = clampText(`${albumTitle}专题 - ${albumStyleLabel} | ${siteName}`, 72);

  return {
    title: { absolute: title },
    description,
    keywords,
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
      canonical: canonicalPath,
      languages: {
        'zh-CN': canonicalPath,
        'x-default': canonicalPath,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName,
      type: 'website',
      locale: 'zh_CN',
      images: shareImage
        ? [
            {
              url: shareImage,
              alt: albumTitle,
            },
          ]
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

export default async function AlbumTopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [config, album] = await Promise.all([getPublicSiteConfig(300), getAlbumDetail(id, revalidate)]);

  if (!album) {
    notFound();
  }

  const siteName = normalizeText(config?.basic?.site_name) || 'APKScc';
  const siteShareImage = normalizeText(config?.basic?.share_image);
  const games = normalizeAlbumGames(album);
  const albumTitle = normalizeText(album.title) || '专题推荐';
  const description = buildMetadataDescription({
    albumDescription: getAlbumDescription(album),
    gameCount: games.length,
    regions: collectRegions(games),
    keywords: getAlbumKeywords(album),
  });
  const canonicalPath = getAlbumHref(album);
  const canonicalUrl = absoluteUrl(canonicalPath);
  const shareImage = getAlbumShareImage(album, siteShareImage);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: '首页',
        item: absoluteUrl('/'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: '专题推荐',
        item: canonicalUrl,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: albumTitle,
        item: canonicalUrl,
      },
    ],
  };

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${canonicalUrl}#collection`,
    name: albumTitle,
    description,
    url: canonicalUrl,
    image: shareImage || undefined,
    inLanguage: 'zh-CN',
    isPartOf: {
      '@type': 'WebSite',
      name: siteName,
      url: absoluteUrl('/'),
    },
    mainEntity: {
      '@id': `${canonicalUrl}#itemlist`,
    },
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${canonicalUrl}#itemlist`,
    name: `${albumTitle} 专题内容`,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    numberOfItems: games.length,
    itemListElement: games.map((game, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absoluteUrl(getGameHref(game)),
      name: normalizeText(game.name) || '专题内容',
      image: getAlbumShareImage(
        {
          _id: '',
          title: '',
          subtitle: '',
          style: 'Grid',
          games: [game],
        },
        siteShareImage,
      ),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
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
      <AlbumTopicView album={album} siteName={siteName} siteShareImage={siteShareImage} />
    </>
  );
}
