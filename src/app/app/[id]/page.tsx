
import type { GameDetailData, ApiRecommendedGame, SiteConfig } from '@/types';
import GameDetailView from './GameDetailView';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { apiUrl } from '@/lib/api';

const CONFIG_API_URL =
  process.env.NEXT_PUBLIC_ENABLE_SITE_CONFIG === 'true'
    ? apiUrl('/config/info?key=main')
    : null;

async function getSiteConfig(): Promise<SiteConfig | null> {
  if (!CONFIG_API_URL) return null;
  try {
    const res = await fetch(CONFIG_API_URL, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });
    if (!res.ok) {
      console.error('Failed to fetch site config:', res.status, res.statusText);
      return null;
    }
    const json = await res.json();
    if (json.code !== 0) {
      console.error('API error for site config:', json.message);
      return null;
    }
    return json.data;
  } catch (error) {
    console.error('Error fetching site config:', error);
    return null;
  }
}


async function getGameDetails(id: string): Promise<GameDetailData | null> {
    try {
        const res = await fetch(apiUrl(`/game/details?param=${id}`), { cache: 'no-store' });
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
        const res = await fetch(apiUrl(`/game/recommendedApp?param=${pkg}`), { cache: 'no-store' });
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

  const { app_seo, basic, seo } = siteConfig;

  let title = app_seo.app_title_template || '{name} v{version}';
  title = title
    .replace('{name}', game.name)
    .replace('{version}', game.version)
    .replace('{title_suffix}', seo.title_suffix);

  let description = app_seo.app_description_template || '{summary}';
  description = description
    .replace('{name}', game.name)
    .replace('{version}', game.version)
    .replace('{summary}', game.summary)
    .replace('{site_name}', basic.site_name)
    .replace('{date}', new Date(game.latest_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));

  return {
    title,
    description,
    openGraph: {
      title: title,
      description: description,
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

  return (
    <GameDetailView 
      id={id} 
      initialGameData={initialGameData}
      initialRecommendedGames={initialRecommendedGames}
    />
  );
}
