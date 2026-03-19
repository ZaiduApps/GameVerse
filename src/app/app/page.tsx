
'use client';

import GameCard from '@/components/game-card';
import { Button } from '@/components/ui/button';
import { ListFilter, Loader2 } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import type { Game, ApiGame } from '@/types';
import { cn } from '@/lib/utils';
import { apiUrl, trackedApiFetch } from '@/lib/api';

interface ApiTag {
  _id: string; // use tag name as synthetic id in public mode
  name: string;
}

interface PaginationState {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

function transformApiGameToGame(apiGame: ApiGame): Game {
  return {
    id: apiGame._id,
    pkg: apiGame.pkg,
    title: apiGame.name,
    description: apiGame.summary,
    shortDescription: apiGame.summary,
    imageUrl: apiGame.icon || 'https://placehold.co/300x300.png', // Fallback
    bannerUrl: apiGame.header_image || apiGame.icon || 'https://placehold.co/600x338.png', // Fallback
    category: apiGame.tags?.[0] || '娓告垙',
    rating: apiGame.star,
    tags: apiGame.tags,
    status: 'released', // This might need to be derived differently
    dataAiHint: `game icon ${apiGame.name}`
  };
}


export default function GamesPage() {
  const TAG_VISIBLE_LIMIT = 25;
  const [isLoading, setIsLoading] = useState(true);
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [selectedTag, setSelectedTag] = useState<ApiTag | null>(null);
  const [showAllTags, setShowAllTags] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const tags = useMemo<ApiTag[]>(() => {
    const uniqueTagNames = Array.from(
      new Set(
        allGames
          .flatMap((game) => game.tags || [])
          .map((tagName) => tagName?.trim())
          .filter(Boolean) as string[],
      ),
    );

    return uniqueTagNames.map((name) => ({ _id: name, name }));
  }, [allGames]);

  const displayedTags = useMemo<ApiTag[]>(() => {
    if (showAllTags || tags.length <= TAG_VISIBLE_LIMIT) return tags;
    const limited = tags.slice(0, TAG_VISIBLE_LIMIT);
    if (!selectedTag || limited.some((tag) => tag._id === selectedTag._id)) return limited;
    return [selectedTag, ...limited];
  }, [showAllTags, tags, selectedTag]);

  const hiddenTagCount = Math.max(0, tags.length - TAG_VISIBLE_LIMIT);

  useEffect(() => {
    async function fetchPublicGames() {
      setIsLoading(true);
      try {
        const res = await trackedApiFetch('/game/list', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data?.data) ? data.data : [];
          setAllGames(list.map(transformApiGameToGame));
        } else {
          setAllGames([]);
        }
      } catch (error) {
        console.error('Failed to fetch games:', error);
        setAllGames([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPublicGames();
  }, []);

  useEffect(() => {
    const pageSize = 20;
    const filtered = selectedTag
      ? allGames.filter((game) => game.tags?.includes(selectedTag.name))
      : allGames;

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, currentPage), totalPages);
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    const list = filtered.slice(start, end);

    setGames(list);
    setPagination({
      total,
      page: safePage,
      pageSize,
      totalPages,
      hasMore: safePage < totalPages,
    });
  }, [allGames, selectedTag, currentPage]);
  
  const handleTagClick = (tag: ApiTag | null) => {
    setSelectedTag(tag);
    setCurrentPage(1);
  }

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && (!pagination || newPage <= pagination.totalPages)) {
      setCurrentPage(newPage);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="space-y-8">
      <section className="bg-card p-6 rounded-lg shadow fade-in">
        <h1 className="text-3xl font-bold mb-4 text-primary">游戏库</h1>
        <p className="text-muted-foreground">探索海量游戏资源，找到你的下一款最爱。</p>
      </section>

      <section className="fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="mb-6 flex flex-wrap gap-2 items-center">
          <ListFilter size={20} className="mr-2 text-muted-foreground" />
          <span className="text-sm font-medium mr-2 text-muted-foreground">绫诲瀷:</span>
          
          <Button
              key="all-games"
              variant={!selectedTag ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTagClick(null)}
              className="btn-interactive transition-all duration-200 text-xs sm:text-sm"
          >
              鍏ㄩ儴娓告垙
          </Button>

          {displayedTags.map((tag) => (
            <Button
              key={tag._id}
              variant={selectedTag?._id === tag._id ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTagClick(tag)}
              className={cn(
                "btn-interactive transition-all duration-200 text-xs sm:text-sm",
                selectedTag?._id === tag._id ? "shadow-md" : "hover:bg-muted/50"
              )}
            >
              {tag.name}
            </Button>
          ))}

          {hiddenTagCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAllTags((prev) => !prev)}
              className="btn-interactive transition-all duration-200 text-xs sm:text-sm"
            >
              {showAllTags ? '鏀惰捣' : `鏌ョ湅鏇村 (${hiddenTagCount})`}
            </Button>
          )}
        </div>
        
        {isLoading ? (
           <div className="flex justify-center items-center py-20">
             <Loader2 className="h-12 w-12 text-primary animate-spin" />
           </div>
        ) : games.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-5">
              {games.map((game, index) => (
                <GameCard
                  key={game.id}
                  game={game}
                  className="fade-in"
                  style={{ animationDelay: `${0.1 + index * 0.03}s` }}
                />
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-10">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="btn-interactive"
                >
                  涓婁竴椤?
                </Button>
                <span className="text-sm text-muted-foreground">
                  绗?{currentPage} 椤?/ 鍏?{pagination.totalPages} 椤?
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= pagination.totalPages}
                  className="btn-interactive"
                >
                  涓嬩竴椤?
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-10 text-muted-foreground fade-in">
              <p className="text-xl mb-2">未找到结果</p>
              <p>没有找到符合条件的游戏。</p>
          </div>
        )}
      </section>
    </div>
  );
}

