
'use client';

import GameCard from '@/components/game-card';
import { MOCK_GAMES } from '@/lib/constants';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, ListFilter } from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import type { Game } from '@/types';
import { cn } from '@/lib/utils';

export default function GamesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('全部类型');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true); // Ensure client-side specific logic runs after mounting
  }, []);

  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    MOCK_GAMES.forEach(game => categories.add(game.category));
    return ['全部类型', ...Array.from(categories).sort()];
  }, []);

  const displayedGames = useMemo(() => {
    return MOCK_GAMES.filter(game => {
      const matchesCategory = selectedCategory === '全部类型' || game.category === selectedCategory;
      const matchesSearch =
        searchTerm.trim() === '' ||
        game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (game.shortDescription || game.description).toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchTerm]); // MOCK_GAMES removed as it's constant

  if (!isMounted) {
    // Optional: Render a loading state or null to prevent hydration mismatches
    // if initial render relies heavily on client-side calculated uniqueCategories
    // For this setup, it's mainly to ensure dynamic content like filter buttons
    // are consistent after hydration.
    return (
      <div className="space-y-8">
        <section className="bg-card p-6 rounded-lg shadow">
          <h1 className="text-3xl font-bold mb-4 text-primary">游戏库</h1>
          <p className="text-muted-foreground mb-6">探索我们庞大的游戏收藏，找到你的下一个最爱。</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Input 
                type="search" 
                placeholder="搜索游戏..." 
                className="pl-10 text-base h-11" 
                disabled 
                value="" // Make the disabled input controlled
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </section>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-5">
          {/* Placeholder or loading skeleton for games */}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="bg-card p-6 rounded-lg shadow fade-in">
        <h1 className="text-3xl font-bold mb-4 text-primary">游戏库</h1>
        <p className="text-muted-foreground mb-6">探索我们庞大的游戏收藏，找到你的下一个最爱。</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Input
              type="search"
              placeholder="搜索游戏名称或描述..."
              className="pl-10 text-base h-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
          {/* Original Filter Button - can be removed or repurposed if category buttons are sufficient */}
          {/* <Button variant="outline" className="btn-interactive h-11">
            <Filter size={18} className="mr-2" />
            筛选
          </Button> */}
        </div>
      </section>

      <section className="fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="mb-6 flex flex-wrap gap-2 items-center">
          <ListFilter size={20} className="mr-2 text-muted-foreground" />
          <span className="text-sm font-medium mr-2 text-muted-foreground">类型:</span>
          {uniqueCategories.map((category, index) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "btn-interactive transition-all duration-200 text-xs sm:text-sm",
                selectedCategory === category ? "shadow-md" : "hover:bg-muted/50"
              )}
              style={{ animationDelay: `${0.3 + index * 0.03}s` }}
            >
              {category}
            </Button>
          ))}
        </div>

        {displayedGames.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-5">
            {displayedGames.map((game, index) => (
              <GameCard
                key={game.id}
                game={game}
                className="fade-in"
                style={{ animationDelay: `${0.4 + index * 0.05}s` }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground fade-in" style={{ animationDelay: '0.5s' }}>
            <p className="text-xl mb-2">Σ( ° △ °|||)︴ 哎呀！</p>
            <p>没有找到符合筛选条件的游戏。</p>
            <p>尝试调整搜索词或清除筛选条件看看？</p>
          </div>
        )}
      </section>
    </div>
  );
}
