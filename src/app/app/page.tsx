
'use client';

import GameCard from '@/components/game-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ListFilter, Loader2 } from 'lucide-react';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Game, ApiGame } from '@/types';
import { cn } from '@/lib/utils';

// Define a type for the API tag response
interface ApiTag {
  _id: string;
  name: string;
}

interface PaginationState {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

// Helper to transform API game data to our Game type
function transformApiGameToGame(apiGame: ApiGame): Game {
  return {
    id: apiGame._id,
    pkg: apiGame.pkg,
    title: apiGame.name,
    description: apiGame.summary,
    shortDescription: apiGame.summary,
    imageUrl: apiGame.icon,
    bannerUrl: apiGame.header_image,
    category: apiGame.tags?.[0] || '游戏',
    rating: apiGame.star,
    tags: apiGame.tags,
    status: 'released', // This might need to be derived differently
    dataAiHint: `game icon ${apiGame.name}`
  };
}


export default function GamesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Game[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [tags, setTags] = useState<ApiTag[]>([]);
  const [selectedTag, setSelectedTag] = useState<ApiTag | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch tags on component mount
  useEffect(() => {
    async function fetchTags() {
      try {
        const res = await fetch('/api/tags/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page: 1, pageSize: 15, sortType: "most_used" })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.code === 0 && data.data?.list) {
            setTags(data.data.list);
          }
        }
      } catch (error) {
        console.error("Failed to fetch tags:", error);
      }
    }
    fetchTags();
  }, []);

  // Fetch games based on selected tag or page change
  const fetchGames = useCallback(async (tagId: string | null, page: number) => {
    setIsLoading(true);
    try {
      const body = {
        id: tagId,
        page: page,
        pageSize: 20
      };
      if (!tagId) {
        delete (body as any).id;
      }
      
      const res = await fetch('/api/tags/list-games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.code === 0 && data.data) {
          const transformedGames = data.data.list.map(transformApiGameToGame);
          setGames(transformedGames);
          setPagination(data.data.pagination);
        } else {
          setGames([]);
          setPagination(null);
        }
      } else {
        setGames([]);
        setPagination(null);
      }
    } catch (error) {
      console.error("Failed to fetch games:", error);
      setGames([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames(selectedTag?._id || null, currentPage);
  }, [selectedTag, currentPage, fetchGames]);
  
  // Handle search logic
  useEffect(() => {
    const handleSearch = async () => {
      if (searchTerm.trim() === '') {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(`/api/game/q?q=${encodeURIComponent(searchTerm)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.code === 0 && data.data?.list) {
            setSearchResults(data.data.list.map(transformApiGameToGame));
          } else {
            setSearchResults([]);
          }
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(handleSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);
  
  const handleTagClick = (tag: ApiTag | null) => {
    setSelectedTag(tag);
    setCurrentPage(1); // Reset to first page on new tag selection
  }

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && (!pagination || newPage <= pagination.totalPages)) {
      setCurrentPage(newPage);
      window.scrollTo(0, 0);
    }
  };

  const displayedGames = searchTerm.trim().length > 0 ? searchResults : games;

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
        </div>
      </section>

      <section className="fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="mb-6 flex flex-wrap gap-2 items-center">
          <ListFilter size={20} className="mr-2 text-muted-foreground" />
          <span className="text-sm font-medium mr-2 text-muted-foreground">类型:</span>
          
          <Button
              key="all-games"
              variant={!selectedTag ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTagClick(null)}
              className="btn-interactive transition-all duration-200 text-xs sm:text-sm"
          >
              全部游戏
          </Button>

          {tags.map((tag) => (
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
        </div>
        
        {isLoading || isSearching ? (
           <div className="flex justify-center items-center py-20">
             <Loader2 className="h-12 w-12 text-primary animate-spin" />
           </div>
        ) : displayedGames.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-5">
              {displayedGames.map((game, index) => (
                <GameCard
                  key={game.id}
                  game={game}
                  className="fade-in"
                  style={{ animationDelay: `${0.1 + index * 0.03}s` }}
                />
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && !searchTerm && (
              <div className="flex justify-center items-center space-x-2 mt-10">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="btn-interactive"
                >
                  上一页
                </Button>
                <span className="text-sm text-muted-foreground">
                  第 {currentPage} 页 / 共 {pagination.totalPages} 页
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= pagination.totalPages}
                  className="btn-interactive"
                >
                  下一页
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-10 text-muted-foreground fade-in">
            <p className="text-xl mb-2">Σ( ° △ °|||)︴ 哎呀！</p>
            <p>没有找到符合条件的游戏。</p>
          </div>
        )}
      </section>
    </div>
  );
}
