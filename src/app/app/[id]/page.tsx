
import type { GameDetailData, ApiRecommendedGame, SiteConfig } from '@/types';
import GameDetailView from './GameDetailView';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { apiUrl, trackedApiFetch } from '@/lib/api';
import { getPublicSiteConfig } from '@/lib/site-config';
import { absoluteUrl } from '@/lib/seo';

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

    const res = await trackedApiFetch(`/game/details?${query.toString()}`, { cache: 'no-store' });
        if (!res.ok) return null;
        const json = await res.json();
        if (json.code !== 0) {
            console.error("API error for game details:", json.message);
            return null;
        }
        return json.data;
    } catch (error) {
        console.error("Failed to fetch game details:", error);
        return null;
    }
}

async function getRecommendedGames(pkg: string): Promise<ApiRecommendedGame[] | null> {
    if (!pkg) return null;
    try {
    const res = await trackedApiFetch(`/game/recommendedApp?param=${pkg}`, { cache: 'no-store' });
        if (!res.ok) return null;
        const json = await res.json();
        return json.code === 0 ? json.data : null;
    } catch (error) {
        console.error("Failed to fetch recommended games:", error);
        return null;
    }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [siteConfig, gameData] = await Promise.all([
    getSiteConfig(),
    getGameDetails(id),
  ]);

  if (!gameData) {
    return {
      title: 'Game Not Found',
      description: 'The requested game could not be found.',
      robots: { index: false, follow: false },
    };
  }

  const game = gameData.app;
  if (!siteConfig) {
    return {
      title: game.name,
      description: game.summary || game.description || '',
      openGraph: {
        title: game.name,
        description: game.summary || game.description || '',
        images: [game.header_image || game.icon].filter(Boolean),
      },
    };
  }

  const appSeo = siteConfig.app_seo || {
    app_title_template: '{name} v{version}',
    app_description_template: '{summary}',
  };
  const basic = siteConfig.basic || {
    site_name: 'APKScc',
    site_slogan: 'APKScc',
    logo_url: '',
    favicon_url: '',
    share_image: '',
  };
  const seo = siteConfig.seo || {
    title_suffix: '',
    keywords: '',
    description: '',
  };
  const canonicalPath = `/app/${game.pkg || id}`;

  let title = appSeo.app_title_template || '{name} v{version}';
  title = title
    .replace('{name}', game.name)
    .replace('{version}', game.version)
    .replace('{title_suffix}', seo.title_suffix);

  let description = appSeo.app_description_template || '{summary}';
  description = description
    .replace('{name}', game.name)
    .replace('{version}', game.version)
    .replace('{summary}', game.summary)
    .replace('{site_name}', basic.site_name)
    .replace('{date}', new Date(game.latest_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));

  return {
    title: { absolute: title },
    description,
    keywords: [game.name, ...(game.tags || []), ...((seo.keywords || '').split(',').map((k) => k.trim()).filter(Boolean))],
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: title,
      description: description,
      url: absoluteUrl(canonicalPath),
      images: [
        {
          url: game.header_image || game.icon,
          width: 1200,
          height: 630,
          alt: game.name,
        },
      ],
      siteName: basic.site_name,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [game.header_image || game.icon],
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

  const initialRecommendedGames = await getRecommendedGames(initialGameData.app.pkg);
  const game = initialGameData.app;
  const detailJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: game.name,
    applicationCategory: game.type || 'GameApplication',
    operatingSystem: 'Android',
    image: game.icon || game.header_image,
    description: game.summary || game.description,
    url: absoluteUrl(`/app/${game.pkg || id}`),
    aggregateRating: game.star
      ? {
          '@type': 'AggregateRating',
          ratingValue: game.star,
          ratingCount: Math.max(1, Number(game.download_count_show?.replace(/\D/g, '')) || 1),
        }
      : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(detailJsonLd) }}
      />
      <GameDetailView 
        id={id} 
        initialGameData={initialGameData}
        initialRecommendedGames={initialRecommendedGames}
      />
    </>
  );
}

