'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, History, Flame, Star, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SearchResult, Game, ApiGame } from '@/types';
import { MOCK_SEARCH_HISTORY } from '@/lib/constants';
import Link from 'next/link';
import Image from 'next/image';

interface SearchOverlayProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

// Helper to transform API game data to our SearchResult type
function transformApiGameToSearchResult(apiGame: ApiGame): SearchResult {
  return {
    id: apiGame._id,
    pkg: apiGame.pkg,
    title: apiGame.name,
    category: apiGame.tags?.[0] || '游戏',
    imageUrl: apiGame.icon,
    rating: apiGame.star,
    type: 'game',
  };
}


export default function SearchOverlay({ isOpen, setIsOpen }: SearchOverlayProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recommendedGames, setRecommendedGames] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => document.getElementById('search-overlay-input')?.focus(), 100);

      // Fetch recommended games only if they haven't been fetched yet
      if (recommendedGames.length === 0) {
        setIsLoading(true);
        fetch('https://api.us.apks.cc/albums/album-details/6957c97f4ca3f95323fc6e44')
          .then(res => res.json())
          .then(data => {
            if (data.code === 0 && data.data?.games) {
              const transformedGames = data.data.games.map(transformApiGameToSearchResult);
              setRecommendedGames(transformedGames);
            }
          })
          .catch(error => {
            console.error("Failed to fetch recommended games:", error);
            // Optionally set an error state here
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }

    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, recommendedGames.length]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      return;
    }

    const debounceTimer = setTimeout(() => {
        setIsLoading(true);
        fetch(`https://api.us.apks.cc/search/main?keyword=${searchTerm}`)
          .then(res => res.json())
          .then(data => {
            if (data.code === 0 && data.data?.games) {
              const results = data.data.games.map((game: ApiGame) => ({
                id: game._id,
                title: game.name,
                category: game.tags?.[0] || '游戏',
                imageUrl: game.icon,
                pkg: game.pkg,
                rating: game.star,
                type: 'game',
              }));
              setSearchResults(results);
            } else {
              setSearchResults([]);
            }
          })
          .catch(error => {
              console.error("Failed to fetch search results:", error);
              setSearchResults([]);
          })
          .finally(() => {
            setIsLoading(false);
          });
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  if (!isOpen) {
    return null;
  }

  const handleClearHistory = () => {
    alert('模拟清除历史记录');
  }

  const hasSearchResults = searchTerm.trim().length > 0;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm animate-in fade-in-50"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="mx-auto mt-[10vh] w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar */}
        <div className="relative p-4">
          <Input
            id="search-overlay-input"
            type="search"
            placeholder="搜索游戏、应用、资讯..."
            className="w-full h-14 pl-14 pr-14 rounded-full text-lg bg-background/80 border-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-6 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full"
            onClick={() => setIsOpen(false)}
            aria-label="关闭搜索"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Content Area */}
        <div className="p-4 pt-2">
            {hasSearchResults ? (
                // Search Results
                <div>
                     <h3 className="text-sm font-semibold text-muted-foreground px-4 mb-3">
                        搜索结果
                    </h3>
                    <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
                        {isLoading ? (
                            <div className="flex justify-center items-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : searchResults.length > 0 ? (
                            searchResults.map(item => (
                                <Link href={`/app/${item.pkg || item.id}`} key={item.id} onClick={() => setIsOpen(false)} className="block">
                                    <div className="flex items-center p-3 rounded-lg hover:bg-muted">
                                        <Image src={item.imageUrl} alt={item.title} width={48} height={48} className="w-12 h-12 rounded-md object-cover mr-4" />
                                        <div className="flex-grow">
                                            <p className="font-semibold">{item.title}</p>
                                            <p className="text-sm text-muted-foreground">{item.category}</p>
                                        </div>
                                        {item.rating && <div className="flex items-center text-sm"><Star className="w-4 h-4 mr-1 text-yellow-400 fill-yellow-400" /> {item.rating}</div>}
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground py-8">未找到相关结果。</p>
                        )}
                    </div>
                </div>
            ) : (
                // Initial State: History & Recommendations
                <div className="space-y-6 animate-in fade-in-50">
                    {/* Search History */}
                    <div>
                        <div className="flex justify-between items-center px-4 mb-3">
                            <h3 className="text-sm font-semibold text-muted-foreground flex items-center"><History className="w-4 h-4 mr-2" /> 搜索历史</h3>
                            <Button variant="ghost" size="sm" className="text-xs h-auto py-1" onClick={handleClearHistory}>清除</Button>
                        </div>
                        <div className="flex flex-wrap gap-2 px-4">
                            {MOCK_SEARCH_HISTORY.map((item, index) => (
                                <Button key={index} variant="secondary" size="sm" className="font-normal" onClick={() => setSearchTerm(item)}>{item}</Button>
                            ))}
                        </div>
                    </div>
                    {/* Recommendations */}
                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground px-4 mb-3 flex items-center"><Flame className="w-4 h-4 mr-2 text-red-500" /> 热门推荐</h3>
                        {isLoading ? (
                           <div className="flex justify-center items-center py-8">
                             <Loader2 className="w-8 h-8 animate-spin text-primary" />
                           </div>
                        ) : recommendedGames.length > 0 ? (
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 px-2">
                            {recommendedGames.map(item => (
                                <Link href={`/app/${item.pkg || item.id}`} key={item.id} onClick={() => setIsOpen(false)} className="block group">
                                    <div className="flex items-center p-2 rounded-lg hover:bg-muted">
                                        <Image src={item.imageUrl} alt={item.title} width={40} height={40} className="w-10 h-10 rounded-md object-cover mr-3" />
                                        <div className="flex-grow">
                                            <p className="font-semibold text-sm">{item.title}</p>
                                            <p className="text-xs text-muted-foreground">{item.category}</p>
                                        </div>
                                        <Button variant="ghost" size="sm" className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Download className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </Link>
                            ))}
                           </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">暂无热门推荐。</p>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
