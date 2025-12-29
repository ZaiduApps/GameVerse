
import GameCarousel from '@/components/game-carousel';
import GameCard from '@/components/game-card';
import SectionHeader from '@/components/home/SectionHeader';
import NewReleaseGameCard from '@/components/home/NewReleaseGameCard';
import PreregistrationGameCard from '@/components/home/PreregistrationGameCard';
import { Separator } from '@/components/ui/separator';
import { Flame, Zap, Gift, Newspaper } from 'lucide-react';
import Link from 'next/link';
import type { Game, NewsArticle, HomeData, ApiGame } from '@/types';

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

async function getHomeData(): Promise<HomeData | null> {
  try {
    const res = await fetch('https://api.us.apks.cc/home', { next: { revalidate: 3600 } }); // Revalidate every hour
    if (!res.ok) {
      throw new Error('Failed to fetch home data');
    }
    const jsonResponse = await res.json();
    return jsonResponse.data;
  } catch (error) {
    console.error("Error fetching home data:", error);
    return null;
  }
}

export default async function HomePage() {
  const homeData = await getHomeData();

  if (!homeData) {
    return <div className="text-center py-10">无法加载主页数据，请稍后重试。</div>;
  }

  const bannerGames = homeData.banner.map(b => ({
    id: b.app_id,
    title: b.name,
    description: b.description,
    imageUrl: b.url_image,
    category: b.goto_type,
    dataAiHint: `banner ${b.name}`
  }));

  const popularAlbum = homeData.albums.find(a => a.style === 'Box');
  const newReleaseAlbum = homeData.albums.find(a => a.style === 'Grid');
  const preregistrationAlbum = homeData.albums.find(a => a.style === 'Pre');

  const popularGames: Game[] = popularAlbum?.games.map(transformApiGameToGame) || [];
  const newReleaseGames: Game[] = newReleaseAlbum?.games.map(transformApiGameToGame) || [];
  const preregistrationGames: Game[] = preregistrationAlbum?.games.map(transformApiGameToGame) || [];

  const newsItems: NewsArticle[] = homeData.articles.map(a => ({
      id: a._id,
      title: a.name,
      content: a.content,
      excerpt: a.summary,
      imageUrl: a.image_cover,
      category: a.tags?.[0] || '资讯',
      date: new Date(a.release_at).toLocaleDateString('zh-CN'),
      author: a.author,
      tags: a.tags,
      dataAiHint: `news ${a.name}`
  }));

  return (
    <div className="space-y-12">
      <section className="fade-in" style={{ animationDelay: '0.1s' }}>
        <GameCarousel games={bannerGames as Game[]} />
      </section>

      {popularGames.length > 0 && (
        <section className="fade-in" style={{ animationDelay: '0.3s' }}>
          <SectionHeader title={popularAlbum?.title || "热门推荐"} icon={Flame} iconClassName="text-primary" moreHref="/games?sort=popular" />
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
          <SectionHeader title={newReleaseAlbum?.title || "新游戏速递"} icon={Zap} iconClassName="text-accent" moreHref="/games?sort=new" />
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
          <SectionHeader title={preregistrationAlbum?.title || "事前登录"} icon={Gift} iconClassName="text-green-500" moreHref="/games?status=preregistration" />
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

      <section className="fade-in" style={{ animationDelay: '1.2s' }}>
         <SectionHeader title="游戏资讯" icon={Newspaper} iconClassName="text-primary/80" moreHref="/news" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsItems.slice(0, 3).map((article, index) => (
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
    </div>
  );
}
