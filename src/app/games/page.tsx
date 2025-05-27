
import GameCard from '@/components/game-card';
import { MOCK_GAMES } from '@/lib/constants';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter } from 'lucide-react';

export default function GamesPage() {
  return (
    <div className="space-y-8">
      <section className="bg-card p-6 rounded-lg shadow fade-in">
        <h1 className="text-3xl font-bold mb-4 text-primary">游戏库</h1>
        <p className="text-muted-foreground mb-6">探索我们庞大的游戏收藏，找到你的下一个最爱。</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Input type="search" placeholder="搜索游戏..." className="pl-10 text-base h-11" /> {/* Increased height */}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
          <Button variant="outline" className="btn-interactive h-11"> {/* Increased height */}
            <Filter size={18} className="mr-2" />
            筛选
          </Button>
        </div>
      </section>

      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-5"> {/* Adjusted gap and columns */}
          {MOCK_GAMES.map((game, index) => (
            <GameCard 
              key={game.id} 
              game={game} 
              className="fade-in"
              style={{ animationDelay: `${0.2 + index * 0.05}s` }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
