import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import GameDetailView from './GameDetailView';
import { trackedApiFetch } from '@/lib/api';
import { absoluteUrl } from '@/lib/seo';
import { getPublicSiteConfig } from '@/lib/site-config';
import type { GameDetailData, SiteConfig } from '@/types';

const DETAIL_REVALIDATE_SECONDS = 900;
const TEMPLATE_TOKEN_PATTERN = /\{([a-z0-9_]+)\}/gi;
const MAX_TITLE_LENGTH = 72;
const MAX_DESCRIPTION_LENGTH = 160;
export const dynamic = 'force-static';
export const revalidate = 900;

function normalizeText(input?: string | null): string {
  return String(input || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clampText(input: string, maxLength: number): string {
  const text = normalizeText(input);
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(1, maxLength - 3)).trim()}...`;
}

function toIsoDate(input?: string | null): string | undefined {
  if (!input) return undefined;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function toSeoDateLabel(input?: string | null): string {
  const date = new Date(input || '');
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function renderTemplate(template: string, variables: Record<string, string>): string {
  return template
    .replace(TEMPLATE_TOKEN_PATTERN, (_, rawKey: string) => {
      const key = rawKey.toLowerCase();
      return variables[key] ?? '';
    })
    .replace(/\s+/g, ' ')
    .trim();
}

function formatFileSize(bytes?: number | null): string | undefined {
  if (!bytes || bytes <= 0) return undefined;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function buildKeywords(gameData: GameDetailData['app'], seoKeywordsRaw?: string): string[] {
  const candidates = [
    gameData.name,
    gameData.pkg,
    ...(gameData.tags || []),
    ...String(seoKeywordsRaw || '')
      .split(',')
      .map((item) => item.trim()),
  ];

  const deduped = new Set<string>();
  for (const item of candidates) {
    const keyword = normalizeText(item);
    if (!keyword) continue;
    deduped.add(keyword);
    if (deduped.size >= 24) break;
  }
  return Array.from(deduped);
}

async function getSiteConfig(): Promise<SiteConfig | null> {
  return getPublicSiteConfig(300);
}

async function getGameDetails(id: string): Promise<GameDetailData | null> {
  try {
    const platform = process.env.NEXT_PUBLIC_CLIENT_PLATFORM || process.env.CLIENT_PLATFORM || 'android';
    const region = process.env.NEXT_PUBLIC_CLIENT_REGION || process.env.CLIENT_REGION || '';
    const clientVersion = process.env.NEXT_PUBLIC_CLIENT_VERSION || process.env.CLIENT_VERSION || '';

    const query = new URLSearchParams();
    query.set('param', id);
    if (platform) query.set('platform', platform);
    if (region) query.set('region', region);
    if (clientVersion) query.set('client_version', clientVersion);

    const res = await trackedApiFetch(`/game/details?${query.toString()}`, {
      cache: 'force-cache',
      next: { revalidate: DETAIL_REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.code !== 0) {
      console.error('API error for game details:', json.message);
      return null;
    }
    return json.data;
  } catch (error) {
    console.error('Failed to fetch game details:', error);
    return null;
  }
}

function buildInitialGameDataForHydration(gameData: GameDetailData): GameDetailData {
  return {
    app: {
      ...gameData.app,
      detail_images: Array.isArray(gameData.app.detail_images)
        ? gameData.app.detail_images.slice(0, 5)
        : [],
      description: String(gameData.app.description || '').slice(0, 1200),
    },
    resources: Array.isArray(gameData.resources) ? gameData.resources : [],
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [siteConfig, gameData] = await Promise.all([getSiteConfig(), getGameDetails(id)]);

  if (!gameData) {
    return {
      title: 'Game Not Found',
      description: 'The requested game could not be found.',
      robots: { index: false, follow: false },
    };
  }

  const game = gameData.app;
  const canonicalPath = `/app/${encodeURIComponent(game.pkg || id)}`;
  const canonicalUrl = absoluteUrl(canonicalPath);

  const appSeo = siteConfig?.app_seo || {
    app_title_template: '{name} v{version}',
    app_description_template: '{summary}',
  };
  const basic = siteConfig?.basic || {
    site_name: 'APKScc',
    site_slogan: 'APKScc',
    logo_url: '',
    favicon_url: '',
    share_image: '',
  };
  const seo = siteConfig?.seo || {
    title_suffix: '',
    keywords: '',
    description: '',
  };

  const normalizedSummary = normalizeText(game.summary || game.description);
  const normalizedDescription = normalizeText(game.description || game.summary);
  const dateLabel = toSeoDateLabel(game.latest_at);
  const templateVars: Record<string, string> = {
    name: normalizeText(game.name),
    version: normalizeText(game.version),
    summary: normalizedSummary,
    description: normalizedDescription,
    site_name: normalizeText(basic.site_name),
    site_slogan: normalizeText(basic.site_slogan),
    title_suffix: normalizeText(seo.title_suffix),
    date: dateLabel,
    pkg: normalizeText(game.pkg),
  };

  let title = renderTemplate(appSeo.app_title_template || '{name} v{version}', templateVars);
  if (!title) {
    title = `${templateVars.name} v${templateVars.version}`.trim();
  }
  if (templateVars.title_suffix && !title.includes(templateVars.title_suffix)) {
    title = `${title}${templateVars.title_suffix}`;
  }
  title = clampText(title, MAX_TITLE_LENGTH);

  let description = renderTemplate(appSeo.app_description_template || '{summary}', templateVars);
  if (!description) {
    description = normalizedSummary || normalizedDescription || normalizeText(seo.description);
  }
  description = clampText(description, MAX_DESCRIPTION_LENGTH);

  const heroImage = game.header_image || game.icon || basic.share_image;
  const keywords = buildKeywords(game, seo.keywords);

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
      images: heroImage
        ? [
            {
              url: heroImage,
              width: 1200,
              height: 630,
              alt: game.name,
            },
          ]
        : [],
      siteName: basic.site_name,
      type: 'website',
      locale: 'zh_CN',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: heroImage ? [heroImage] : [],
    },
  };
}

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const initialGameData = await getGameDetails(id);
  if (!initialGameData) {
    notFound();
  }

  const game = initialGameData.app;
  const canonicalPath = `/app/${encodeURIComponent(game.pkg || id)}`;
  const canonicalUrl = absoluteUrl(canonicalPath);
  const ratingCount = Math.max(1, Number(String(game.download_count_show || '').replace(/\D/g, '')) || 1);
  const heroImage = game.header_image || game.icon || '';
  const description = normalizeText(game.summary || game.description);

  const detailJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: game.name,
    applicationCategory: normalizeText(game.type) || 'GameApplication',
    operatingSystem: 'Android',
    inLanguage: 'zh-CN',
    image: heroImage || undefined,
    description: description || undefined,
    url: canonicalUrl,
    softwareVersion: normalizeText(game.version) || undefined,
    fileSize: formatFileSize(game.file_size),
    datePublished: toIsoDate(game.release_at),
    dateModified: toIsoDate(game.latest_at),
    publisher: game.developer
      ? {
          '@type': 'Organization',
          name: normalizeText(game.developer),
        }
      : undefined,
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      price: '0',
      priceCurrency: 'CNY',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: game.star
      ? {
          '@type': 'AggregateRating',
          ratingValue: Number(game.star),
          ratingCount,
        }
      : undefined,
  };

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
        name: '游戏库',
        item: absoluteUrl('/app'),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: game.name,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(detailJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <GameDetailView
        id={id}
        initialGameData={buildInitialGameDataForHydration(initialGameData)}
        initialDataMode="partial"
      />
    </>
  );
}
