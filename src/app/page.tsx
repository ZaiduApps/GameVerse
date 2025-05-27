
import GameCarousel from '@/components/game-carousel';
import GameCard from '@/components/game-card';
import { MOCK_GAMES } from '@/lib/constants';
import { Separator } from '@/components/ui/separator';
import { Flame, Sparkles, Newspaper } from 'lucide-react';

export default function HomePage() {
  const featuredGames = MOCK_GAMES.slice(0, 4); 
  const popularGames = MOCK_GAMES.slice(0, 10); // Show more popular games
  const newGames = MOCK_GAMES.slice(3, 13).reverse(); // Show more new games

  return (
    <div className="space-y-12">
      <section className="fade-in" style={{ animationDelay: '0.1s' }}>
        <GameCarousel games={featuredGames} />
      </section>

      <section className="fade-in" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center mb-6">
          <Flame className="w-7 h-7 text-primary mr-3" />
          <h2 className="text-2xl font-bold">热门推荐</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5"> {/* Adjusted gap and columns */}
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
        <div className="flex items-center mb-6">
          <Sparkles className="w-7 h-7 text-accent mr-3" />
          <h2 className="text-2xl font-bold">最新上架</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5"> {/* Adjusted gap and columns */}
          {newGames.map((game, index) => (
            <GameCard 
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
         <div className="flex items-center mb-6">
          <Newspaper className="w-7 h-7 text-primary/80 mr-3" />
          <h2 className="text-2xl font-bold">游戏资讯</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_GAMES.slice(0,3).map((item, index) => ( // Use some mock games for news items consistency
            <div 
              key={item.id} 
              className="bg-card p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 fade-in"
              style={{ animationDelay: `${1.0 + index * 0.1}s` }}
            >
              <h3 className="text-lg font-semibold mb-2 text-card-foreground">{item.title} 最新资讯</h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.shortDescription}</p>
              <a href={`/news/news-${item.id}`} className="text-xs text-primary hover:underline">阅读更多 &rarr;</a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
