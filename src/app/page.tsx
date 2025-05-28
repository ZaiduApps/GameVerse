
import GameCarousel from '@/components/game-carousel';
import GameCard from '@/components/game-card';
import SectionHeader from '@/components/home/SectionHeader';
import NewReleaseGameCard from '@/components/home/NewReleaseGameCard';
import PreregistrationGameCard from '@/components/home/PreregistrationGameCard';
import { MOCK_GAMES, MOCK_NEWS_ARTICLES } from '@/lib/constants';
import type { Game } from '@/types';
import { Separator } from '@/components/ui/separator';
import { Flame, Zap, Gift, Newspaper } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const featuredGames = MOCK_GAMES.slice(0, 5); 
  const popularGames = MOCK_GAMES.filter(g => g.status === 'released').sort((a,b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5);
  const newReleaseGames = MOCK_GAMES.filter(g => g.status === 'released').sort((a, b) => new Date(b.releaseDate || 0).getTime() - new Date(a.releaseDate || 0).getTime()).slice(0, 7);
  const preregistrationGames = MOCK_GAMES.filter(g => g.status === 'pre-registration').slice(0, 7);

  const newsItemsForHomepage = MOCK_GAMES.slice(0, 3).map(game => {
    const firstArticleForGame = MOCK_NEWS_ARTICLES.find(article => article.gameId === game.id);
    return {
      game: game,
      article: firstArticleForGame
    };
  });

  return (
    <div className="space-y-12">
      <section className="fade-in" style={{ animationDelay: '0.1s' }}>
        <GameCarousel games={featuredGames} />
      </section>

      <section className="fade-in" style={{ animationDelay: '0.3s' }}>
        <SectionHeader title="热门推荐" icon={Flame} iconClassName="text-primary" moreHref="/games?sort=popular" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
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
      
      <Separator className="my-8 bg-border/50" />

      <section className="fade-in" style={{ animationDelay: '0.6s' }}>
        <SectionHeader title="新游戏速递" icon={Zap} iconClassName="text-accent" moreHref="/games?sort=new" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-x-4 gap-y-6 md:gap-x-5 md:gap-y-8">
          {newReleaseGames.map((game, index) => (
            <NewReleaseGameCard 
              key={game.id} 
              game={game} 
              className="fade-in" 
              style={{ animationDelay: `${0.7 + index * 0.05}s` }}
            />
          ))}
        </div>
      </section>

      <Separator className="my-8 bg-border/50" />

      <section className="fade-in" style={{ animationDelay: '0.9s' }}>
        <SectionHeader title="事前登录" icon={Gift} iconClassName="text-green-500" moreHref="/games?status=preregistration" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-x-4 gap-y-6 md:gap-x-5 md:gap-y-8">
          {preregistrationGames.map((game, index) => (
            <PreregistrationGameCard 
              key={game.id} 
              game={game} 
              className="fade-in" 
              style={{ animationDelay: `${1.0 + index * 0.05}s` }}
            />
          ))}
          {preregistrationGames.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-4">暂无事前登录游戏。</p>
          )}
        </div>
      </section>

      <Separator className="my-8 bg-border/50" />

      <section className="fade-in" style={{ animationDelay: '1.2s' }}>
         <SectionHeader title="游戏资讯" icon={Newspaper} iconClassName="text-primary/80" moreHref="/news" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsItemsForHomepage.map(({ game, article }, index) => (
            <div 
              key={game.id} 
              className="bg-card p-4 sm:p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 fade-in"
              style={{ animationDelay: `${1.3 + index * 0.1}s` }}
            >
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-card-foreground">{game.title} 最新资讯</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2">
                {article ? (article.excerpt || game.shortDescription) : game.shortDescription}
              </p>
              {article ? (
                <Link href={`/news/${article.id}`} className="text-xs text-primary hover:underline">
                  阅读更多 &rarr;
                </Link>
              ) : (
                <span className="text-xs text-muted-foreground">暂无相关资讯</span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
