
import GameCarousel from '@/components/game-carousel';
import GameCard from '@/components/game-card';
import SectionHeader from '@/components/home/SectionHeader';
import NewReleaseGameCard from '@/components/home/NewReleaseGameCard';
import PreregistrationGameCard from '@/components/home/PreregistrationGameCard';
import { Separator } from '@/components/ui/separator';
import { Flame, Zap, Gift, Newspaper } from 'lucide-react';
import Link from 'next/link';
import type { Game, NewsArticle, HomeData, ApiGame, ApiBanner, ApiArticle } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Helper function to transform API game data to our Game type
function transformApiGameToGame(apiGame: ApiGame): Game {
  return {
    id: apiGame._id,
    pkg: apiGame.pkg,
    title: apiGame.name,
    description: apiGame.summary,
    shortDescription: apiGame.summary,
    imageUrl: apiGame.icon,
    bannerUrl: apiGame.header_image,
    category: apiGame.tags?.[0] || '未知',
    rating: apiGame.star,
    tags: apiGame.tags,
    status: 'released', // This might need to be derived differently
    dataAiHint: `game icon ${apiGame.name}`
  };
}

interface CombinedHomeData {
    homeData: HomeData | null;
    newsData: ApiArticle[] | null;
}

async function getHomeAndNewsData(): Promise<CombinedHomeData> {
  try {
    const [homeRes, newsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/home`, { cache: 'no-store' }),
      fetch(`${API_BASE_URL}/news/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: 1, pageSize: 3 }),
        cache: 'no-store'
      })
    ]);
    
    if (!homeRes.ok) {
      console.error('Failed to fetch home data');
    }
    const homeJson = homeRes.ok ? await homeRes.json() : null;
    const homeData = homeJson?.data || null;

    if (!newsRes.ok) {
        console.error('Failed to fetch news data');
    }
    const newsJson = newsRes.ok ? await newsRes.json() : null;
    const newsData = newsJson?.data?.list || null;

    return { homeData, newsData };

  } catch (error) {
    console.error("Error fetching data:", error);
    return { homeData: null, newsData: null };
  }
}

export default async function HomePage() {
  const { homeData, newsData } = await getHomeAndNewsData();

  if (!homeData) {
    return <div className="text-center py-10">无法加载主页数据，请稍后重试。</div>;
  }

  const popularAlbum = homeData.albums.find(a => a.style === 'Box');
  const newReleaseAlbum = homeData.albums.find(a => a.style === 'Grid');
  const preregistrationAlbum = homeData.albums.find(a => a.style === 'Pre');

  const popularGames: Game[] = popularAlbum?.games.map(transformApiGameToGame) || [];
  const newReleaseGames: Game[] = newReleaseAlbum?.games.map(transformApiGameToGame) || [];
  const preregistrationGames: Game[] = preregistrationAlbum?.games.map(transformApiGameToGame) || [];
  
  const newsItems: NewsArticle[] = (newsData || []).map((a: ApiArticle) => ({
      id: a.gid || a._id, // Use gid for linking, fallback to _id
      title: a.name,
      content: a.content || '',
      excerpt: a.summary,
      imageUrl: a.image_cover,
      category: a.tags?.[0] || '资讯',
      date: new Date(a.release_at).toLocaleDateString('zh-CN'),
      author: a.author || '匿名',
      tags: a.tags || [],
      dataAiHint: `news ${a.name}`
  }));

  return (
    <div className="space-y-12">
      <section className="fade-in" style={{ animationDelay: '0.1s' }}>
        <GameCarousel bannerItems={homeData.banner} />
      </section>

      {popularGames.length > 0 && (
        <section className="fade-in" style={{ animationDelay: '0.3s' }}>
          <SectionHeader title={popularAlbum?.title || "热门推荐"} icon={Flame} iconClassName="text-primary" moreHref="/app?sort=popular" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
            {popularGames.map((game, index) => (
              <GameCard
                key={game.id}
                game={game}
                className="fade-in"
                style={{ animationDelay: `${0.4 + index * 0.05}s` }}
              />
            ))}
          </div>
        </section>
      )}

      <Separator className="my-8 bg-border/50" />

      {newReleaseGames.length > 0 && (
         <section className="fade-in" style={{ animationDelay: '0.6s' }}>
          <SectionHeader title={newReleaseAlbum?.title || "新游戏速递"} icon={Zap} iconClassName="text-accent" moreHref="/app?sort=new" />
          <div
            className="flex overflow-x-auto space-x-3 sm:space-x-4 py-2 -mx-1 px-1 cursor-grab select-none"
          >
            {newReleaseGames.map((game, index) => (
              <NewReleaseGameCard
                key={game.id}
                game={game}
                className="fade-in flex-shrink-0"
                style={{ animationDelay: `${0.7 + index * 0.05}s` }}
              />
            ))}
          </div>
        </section>
      )}


      <Separator className="my-8 bg-border/50" />

      {preregistrationGames.length > 0 && (
        <section className="fade-in" style={{ animationDelay: '0.9s' }}>
          <SectionHeader title={preregistrationAlbum?.title || "事前登录"} icon={Gift} iconClassName="text-green-500" moreHref="/app?status=preregistration" />
          <div
            className="flex overflow-x-auto space-x-3 sm:space-x-4 py-2 -mx-1 px-1 cursor-grab select-none"
          >
            {preregistrationGames.map((game, index) => (
              <PreregistrationGameCard
                key={game.id}
                game={game}
                className="fade-in flex-shrink-0"
                style={{ animationDelay: `${1.0 + index * 0.05}s` }}
              />
            ))}
          </div>
        </section>
      )}


      <Separator className="my-8 bg-border/50" />

      {newsItems.length > 0 && (
        <section className="fade-in" style={{ animationDelay: '1.2s' }}>
           <SectionHeader title="游戏资讯" icon={Newspaper} iconClassName="text-primary/80" moreHref="/news" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsItems.map((article, index) => (
              <div
                key={article.id}
                className="bg-card p-4 sm:p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 fade-in"
                style={{ animationDelay: `${1.3 + index * 0.1}s` }}
              >
                <h3 className="text-base sm:text-lg font-semibold mb-2 text-card-foreground">{article.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2">
                  {article.excerpt}
                </p>
                <Link href={`/news/${article.id}`} className="text-xs text-primary hover:underline">
                  阅读更多 &rarr;
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
