
'use client';

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
import React, { useState, useRef } from 'react'; // Import useState and useRef

export default function HomePage() {
  const featuredGames = MOCK_GAMES.slice(0, 5);
  const popularGames = MOCK_GAMES.filter(g => g.status === 'released').sort((a,b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5);
  const newReleaseGames = MOCK_GAMES.filter(g => g.status === 'released').sort((a, b) => new Date(b.releaseDate || 0).getTime() - new Date(a.releaseDate || 0).getTime()).slice(0, 10);
  const preregistrationGames = MOCK_GAMES.filter(g => g.status === 'pre-registration').slice(0, 10);

  const newsItemsForHomepage = MOCK_GAMES.slice(0, 3).map(game => {
    const firstArticleForGame = MOCK_NEWS_ARTICLES.find(article => article.gameId === game.id);
    return {
      game: game,
      article: firstArticleForGame
    };
  });

  // State and refs for New Releases drag scroll
  const newReleasesContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingNewReleases, setIsDraggingNewReleases] = useState(false);
  const [startXNewReleases, setStartXNewReleases] = useState(0);
  const [scrollLeftStartNewReleases, setScrollLeftStartNewReleases] = useState(0);

  // State and refs for Pre-registration drag scroll
  const preregContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingPrereg, setIsDraggingPrereg] = useState(false);
  const [startXPrereg, setStartXPrereg] = useState(0);
  const [scrollLeftStartPrereg, setScrollLeftStartPrereg] = useState(0);

  // Event handlers for New Releases
  const handleMouseDownNewReleases = (e: React.MouseEvent) => {
    if (!newReleasesContainerRef.current) return;
    setIsDraggingNewReleases(true);
    setStartXNewReleases(e.pageX - newReleasesContainerRef.current.offsetLeft);
    setScrollLeftStartNewReleases(newReleasesContainerRef.current.scrollLeft);
    newReleasesContainerRef.current.style.cursor = 'grabbing';
    newReleasesContainerRef.current.style.userSelect = 'none';
  };

  const handleMouseLeaveNewReleases = () => {
    if (!newReleasesContainerRef.current) return;
    setIsDraggingNewReleases(false);
    newReleasesContainerRef.current.style.cursor = 'grab';
    newReleasesContainerRef.current.style.userSelect = 'auto';
  };

  const handleMouseUpNewReleases = () => {
    if (!newReleasesContainerRef.current) return;
    setIsDraggingNewReleases(false);
    newReleasesContainerRef.current.style.cursor = 'grab';
    newReleasesContainerRef.current.style.userSelect = 'auto';
  };

  const handleMouseMoveNewReleases = (e: React.MouseEvent) => {
    if (!isDraggingNewReleases || !newReleasesContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - newReleasesContainerRef.current.offsetLeft;
    const walk = (x - startXNewReleases) * 1.5; // Multiplier for drag speed
    newReleasesContainerRef.current.scrollLeft = scrollLeftStartNewReleases - walk;
  };

  // Event handlers for Pre-registration
  const handleMouseDownPrereg = (e: React.MouseEvent) => {
    if (!preregContainerRef.current) return;
    setIsDraggingPrereg(true);
    setStartXPrereg(e.pageX - preregContainerRef.current.offsetLeft);
    setScrollLeftStartPrereg(preregContainerRef.current.scrollLeft);
    preregContainerRef.current.style.cursor = 'grabbing';
    preregContainerRef.current.style.userSelect = 'none';
  };

  const handleMouseLeavePrereg = () => {
    if (!preregContainerRef.current) return;
    setIsDraggingPrereg(false);
    preregContainerRef.current.style.cursor = 'grab';
    preregContainerRef.current.style.userSelect = 'auto';
  };

  const handleMouseUpPrereg = () => {
    if (!preregContainerRef.current) return;
    setIsDraggingPrereg(false);
    preregContainerRef.current.style.cursor = 'grab';
    preregContainerRef.current.style.userSelect = 'auto';
  };

  const handleMouseMovePrereg = (e: React.MouseEvent) => {
    if (!isDraggingPrereg || !preregContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - preregContainerRef.current.offsetLeft;
    const walk = (x - startXPrereg) * 1.5; // Multiplier for drag speed
    preregContainerRef.current.scrollLeft = scrollLeftStartPrereg - walk;
  };


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
        <div
          ref={newReleasesContainerRef}
          className="flex overflow-x-auto space-x-3 sm:space-x-4 py-2 -mx-1 px-1 cursor-grab select-none"
          onMouseDown={handleMouseDownNewReleases}
          onMouseLeave={handleMouseLeaveNewReleases}
          onMouseUp={handleMouseUpNewReleases}
          onMouseMove={handleMouseMoveNewReleases}
        >
          {newReleaseGames.map((game, index) => (
            <NewReleaseGameCard
              key={game.id}
              game={game}
              className="fade-in flex-shrink-0" // Added flex-shrink-0
              style={{ animationDelay: `${0.7 + index * 0.05}s` }}
            />
          ))}
          {newReleaseGames.length === 0 && (
             <p className="w-full text-center text-muted-foreground py-4">暂无新游戏。</p>
          )}
        </div>
      </section>

      <Separator className="my-8 bg-border/50" />

      <section className="fade-in" style={{ animationDelay: '0.9s' }}>
        <SectionHeader title="事前登录" icon={Gift} iconClassName="text-green-500" moreHref="/games?status=preregistration" />
        <div
          ref={preregContainerRef}
          className="flex overflow-x-auto space-x-3 sm:space-x-4 py-2 -mx-1 px-1 cursor-grab select-none"
          onMouseDown={handleMouseDownPrereg}
          onMouseLeave={handleMouseLeavePrereg}
          onMouseUp={handleMouseUpPrereg}
          onMouseMove={handleMouseMovePrereg}
        >
          {preregistrationGames.map((game, index) => (
            <PreregistrationGameCard
              key={game.id}
              game={game}
              className="fade-in flex-shrink-0" // Added flex-shrink-0
              style={{ animationDelay: `${1.0 + index * 0.05}s` }}
            />
          ))}
          {preregistrationGames.length === 0 && (
            <p className="w-full text-center text-muted-foreground py-4">暂无事前登录游戏。</p>
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
