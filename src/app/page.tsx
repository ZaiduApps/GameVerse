
import React from 'react';
import GameCarousel from '@/components/game-carousel';
import GameCard from '@/components/game-card';
import SectionHeader from '@/components/home/SectionHeader';
import NewReleaseGameCard from '@/components/home/NewReleaseGameCard';
import PreregistrationGameCard from '@/components/home/PreregistrationGameCard';
import { Separator } from '@/components/ui/separator';
import { Flame, Zap, Gift, Newspaper, CalendarDays, UserCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import type { Game, NewsArticle, HomeData, ApiGame, ApiBanner, ApiArticle } from '@/types';
import { apiUrl } from '@/lib/api';

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
    const homeRes = await fetch(apiUrl('/home'), { cache: 'no-store' });
    
    const homeJson = homeRes.ok ? await homeRes.json() : null;
    const homeData = homeJson?.data || null;
    const newsData = homeData?.articles || null;

    return { homeData, newsData };

  } catch (error) {
    // We catch the error but don't log to console.error to avoid dev overlay triggers
    return { homeData: null, newsData: null };
  }
}

export default async function HomePage() {
  const { homeData, newsData } = await getHomeAndNewsData();

  if (!homeData) {
    return <div className="text-center py-10">无法加载主页数据，请稍后重试。</div>;
  }

  const newsItems: NewsArticle[] = (newsData || []).map((a: ApiArticle) => ({
      id: a._id || a.gid || '',
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

      {homeData.albums.map((album, albumIndex) => {
        const games: Game[] = album.games.map(transformApiGameToGame);
        if (games.length === 0) return null;

        const animationDelay = 0.3 + albumIndex * 0.3;

        let sectionContent;
        let sectionHeaderProps;

        if (album.style === 'Box') {
            sectionHeaderProps = { title: album.title || "热门推荐", icon: Flame, iconClassName: "text-primary", moreHref: "/app?sort=popular" };
            sectionContent = (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
                    {games.map((game, index) => (
                    <GameCard
                        key={game.id}
                        game={game}
                        className="fade-in"
                        style={{ animationDelay: `${animationDelay + 0.1 + index * 0.05}s` }}
                    />
                    ))}
                </div>
            );
        } else if (album.style === 'Grid') {
            sectionHeaderProps = { title: album.title || "新游戏速递", icon: Zap, iconClassName: "text-accent", moreHref: "/app?sort=new" };
            sectionContent = (
                <div className="flex overflow-x-auto space-x-0.5 py-2 -mx-1 px-1 cursor-grab select-none">
                    {games.map((game, index) => (
                    <NewReleaseGameCard
                        key={game.id}
                        game={game}
                        className="fade-in flex-shrink-0"
                        style={{ animationDelay: `${animationDelay + 0.1 + index * 0.05}s` }}
                    />
                    ))}
                </div>
            );
        } else if (album.style === 'Pre') {
            sectionHeaderProps = { title: album.title || "事前登录", icon: Gift, iconClassName: "text-green-500", moreHref: "/app?status=preregistration" };
            sectionContent = (
                <div className="flex overflow-x-auto space-x-0.5 py-2 -mx-1 px-1 cursor-grab select-none">
                    {games.map((game, index) => (
                    <PreregistrationGameCard
                        key={game.id}
                        game={game}
                        className="fade-in flex-shrink-0"
                        style={{ animationDelay: `${animationDelay + 0.1 + index * 0.05}s` }}
                    />
                    ))}
                </div>
            );
        } else {
            return null;
        }

        return (
            <React.Fragment key={album._id}>
                <Separator className="my-8 bg-border/50" />
                <section className="fade-in" style={{ animationDelay: `${animationDelay}s` }}>
                    <SectionHeader {...sectionHeaderProps} />
                    {sectionContent}
                </section>
            </React.Fragment>
        );
      })}

      {newsItems.length > 0 && (
        <>
          <Separator className="my-8 bg-border/50" />
          <section className="fade-in" style={{ animationDelay: `${0.3 + homeData.albums.length * 0.3}s` }}>
            <SectionHeader title="游戏资讯" icon={Newspaper} iconClassName="text-primary/80" moreHref="/news" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {newsItems.map((article, index) => (
                <div
                  key={article.id}
                  className="bg-card rounded-lg shadow-sm border hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col sm:flex-row h-auto sm:h-48 fade-in"
                  style={{ animationDelay: `${0.4 + homeData.albums.length * 0.3 + index * 0.1}s` }}
                >
                  <div className="relative w-full sm:w-1/3 h-48 sm:h-auto flex-shrink-0">
                    <Image
                      src={article.imageUrl || 'https://placehold.co/600x400.png'}
                      alt={article.title}
                      fill
                      className="object-cover"
                      data-ai-hint={article.dataAiHint || 'news image'}
                    />
                  </div>
                  <div className="p-4 flex-grow flex flex-col justify-between min-w-0">
                    <div>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-2">
                          <span className="flex items-center">
                            <CalendarDays className="w-3 h-3 mr-1" />
                            {article.date}
                          </span>
                          <span className="flex items-center">
                            <UserCircle className="w-3 h-3 mr-1" />
                            {article.author}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold mb-2 text-foreground line-clamp-2 leading-tight hover:text-primary transition-colors">
                          <Link href={`/news/${article.id}`}>{article.title}</Link>
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 sm:line-clamp-3">
                          {article.excerpt}
                        </p>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Button variant="link" asChild className="p-0 h-auto text-xs text-primary font-medium hover:underline">
                        <Link href={`/news/${article.id}`}>
                          阅读更多 &rarr;
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
