'use client';

import React, { useDeferredValue, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  X,
  History,
  Flame,
  Star,
  Download,
  Loader2,
  FileText,
  MessageSquare,
  Gamepad2,
  Hash,
} from 'lucide-react';
import type { SearchResult, ApiGame } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { trackedApiFetch } from '@/lib/api';
import {
  createEmptyGlobalSearchResult,
  searchGlobal,
  type GlobalSearchResult,
} from '@/lib/search-api';

interface SearchOverlayProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const MAX_HISTORY_LENGTH = 6;
const HISTORY_STORAGE_KEY = 'game-universe-search-history';
const SEARCH_LIMIT_PER_TYPE = 6;

function transformApiGameToSearchResult(apiGame: ApiGame): SearchResult {
  return {
    id: String(apiGame._id || '').trim(),
    pkg: String(apiGame.pkg || '').trim(),
    title: String(apiGame.name || '').trim(),
    category: apiGame.tags?.[0] || '游戏',
    imageUrl: apiGame.icon,
    rating: apiGame.star,
    region: apiGame.metadata?.region,
    type: 'game',
    href: `/app/${encodeURIComponent(String(apiGame.pkg || apiGame._id || '').trim())}`,
    subtitle: String(apiGame.summary || '').trim(),
  };
}

function createEmptySearchState(keyword = ''): GlobalSearchResult {
  return createEmptyGlobalSearchResult(keyword, SEARCH_LIMIT_PER_TYPE);
}

function getResultTypeLabel(type: SearchResult['type']) {
  if (type === 'game') return '游戏';
  if (type === 'article') return '文章';
  if (type === 'post') return '帖子';
  return '话题';
}

function renderResultIcon(type: SearchResult['type']) {
  if (type === 'game') return <Gamepad2 className="h-4 w-4 text-primary" />;
  if (type === 'article') return <FileText className="h-4 w-4 text-orange-500" />;
  if (type === 'post') return <MessageSquare className="h-4 w-4 text-emerald-500" />;
  return <Hash className="h-4 w-4 text-sky-500" />;
}

export default function SearchOverlay({ isOpen, setIsOpen }: SearchOverlayProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [searchData, setSearchData] = useState<GlobalSearchResult>(() => createEmptySearchState());
  const [recommendedGames, setRecommendedGames] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [resultFilter, setResultFilter] = useState<'all' | 'game' | 'article' | 'post' | 'topic'>('all');

  useEffect(() => {
    if (isOpen) {
      try {
        const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (storedHistory) {
          setSearchHistory(JSON.parse(storedHistory));
        }
      } catch (error) {
        console.error('Failed to parse search history from localStorage', error);
      }
    }
  }, [isOpen]);

  const updateSearchHistory = (term: string) => {
    const normalizedTerm = term.trim();
    if (normalizedTerm.length < 2) return;
    const newHistory = [normalizedTerm, ...searchHistory.filter((item) => item !== normalizedTerm)].slice(0, MAX_HISTORY_LENGTH);
    setSearchHistory(newHistory);
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Failed to save search history to localStorage', error);
    }
  };

  const handleSearchSubmit = (term: string) => {
    const trimmedTerm = term.trim();
    if (trimmedTerm) {
      setSearchTerm(trimmedTerm);
      updateSearchHistory(trimmedTerm);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => document.getElementById('search-overlay-input')?.focus(), 100);

      if (recommendedGames.length === 0) {
        setIsLoading(true);
        trackedApiFetch('/albums/album-details/6957c97f4ca3f95323fc6e44')
          .then((res) => res.json())
          .then((data) => {
            if (data.code === 0 && data.data?.games) {
              const transformedGames = data.data.games.map(transformApiGameToSearchResult);
              setRecommendedGames(transformedGames);
            }
          })
          .catch((error) => {
            console.error('Failed to fetch recommended games:', error);
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
    const keyword = deferredSearchTerm.trim();
    if (!keyword) {
      setSearchData(createEmptySearchState());
      setResultFilter('all');
      setIsSearching(false);
      return;
    }

    if (keyword.length < 2) {
      setSearchData(createEmptySearchState(keyword));
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const debounceTimer = setTimeout(() => {
      setIsSearching(true);
      searchGlobal({
        q: keyword,
        limitPerType: SEARCH_LIMIT_PER_TYPE,
        signal: controller.signal,
      })
        .then((data) => {
          setSearchData(data);
        })
        .catch((error) => {
          if (controller.signal.aborted) {
            return;
          }
          console.error('Failed to fetch search results:', error);
          setSearchData(createEmptySearchState(keyword));
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsSearching(false);
          }
        });
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(debounceTimer);
    };
  }, [deferredSearchTerm]);

  const handleClearHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear search history from localStorage', error);
    }
  };

  const keywordLength = searchTerm.trim().length;
  const hasSearchResults = keywordLength > 0;
  const resultCounts = {
    game: Number(searchData.games.total || 0),
    article: Number(searchData.articles.total || 0),
    post: Number(searchData.posts.total || 0),
    topic: Number(searchData.topics.total || 0),
  };

  const filteredResults = (() => {
    if (resultFilter === 'game') return searchData.games.list;
    if (resultFilter === 'article') return searchData.articles.list;
    if (resultFilter === 'post') return searchData.posts.list;
    if (resultFilter === 'topic') return searchData.topics.list;
    return [
      ...searchData.games.list,
      ...searchData.topics.list,
      ...searchData.posts.list,
      ...searchData.articles.list,
    ];
  })();

  const totalResultCount =
    resultCounts.game +
    resultCounts.article +
    resultCounts.post +
    resultCounts.topic;
  const visibleResultCount = filteredResults.length;

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] animate-in fade-in-50 bg-background/80 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
      <div className="mx-auto mt-[10vh] w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="relative p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearchSubmit(searchTerm);
            }}
          >
            <Input
              id="search-overlay-input"
              name="search"
              type="search"
              placeholder="搜索游戏、话题、帖子、文章..."
              className="h-14 w-full rounded-full border-2 bg-background/80 pl-14 pr-14 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
            />
          </form>
          <Search className="absolute left-8 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-6 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full"
            onClick={() => setIsOpen(false)}
            aria-label="关闭搜索"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="max-h-[calc(80vh-72px)] overflow-y-auto p-4 pt-2">
          {hasSearchResults ? (
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2 px-2">
                <Button
                  size="sm"
                  variant={resultFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setResultFilter('all')}
                >
                  全部 ({totalResultCount})
                </Button>
                <Button
                  size="sm"
                  variant={resultFilter === 'game' ? 'default' : 'outline'}
                  onClick={() => setResultFilter('game')}
                >
                  游戏 ({resultCounts.game})
                </Button>
                <Button
                  size="sm"
                  variant={resultFilter === 'topic' ? 'default' : 'outline'}
                  onClick={() => setResultFilter('topic')}
                >
                  话题 ({resultCounts.topic})
                </Button>
                <Button
                  size="sm"
                  variant={resultFilter === 'post' ? 'default' : 'outline'}
                  onClick={() => setResultFilter('post')}
                >
                  帖子 ({resultCounts.post})
                </Button>
                <Button
                  size="sm"
                  variant={resultFilter === 'article' ? 'default' : 'outline'}
                  onClick={() => setResultFilter('article')}
                >
                  文章 ({resultCounts.article})
                </Button>
              </div>

              <div className="space-y-2 pr-2">
                {isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : keywordLength < 2 ? (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">请输入至少 2 个字符开始搜索。</p>
                  </div>
                ) : visibleResultCount > 0 ? (
                  <>
                    {filteredResults.map((item) => (
                      <Link
                        href={
                          item.href ||
                          (item.type === 'game'
                            ? `/app/${item.pkg || item.id}`
                            : item.type === 'topic'
                              ? `/community/topic/${item.id}`
                              : `/community/post/${item.id}`)
                        }
                        key={`${item.type}-${item.id}`}
                        onClick={() => {
                          setIsOpen(false);
                          updateSearchHistory(searchTerm);
                        }}
                        className="block"
                      >
                        <div className="flex items-center rounded-lg p-3 hover:bg-muted">
                          <Image
                            src={item.imageUrl || '/favicon.ico'}
                            alt={item.title}
                            width={48}
                            height={48}
                            className="mr-4 h-12 w-12 rounded-md object-cover"
                          />
                          <div className="min-w-0 flex-grow">
                            <div className="flex items-center gap-2">
                              {renderResultIcon(item.type)}
                              <p className="truncate font-semibold">{item.title}</p>
                            </div>
                            <p className="mt-0.5 truncate text-sm text-muted-foreground">
                              {item.subtitle || item.category}
                            </p>
                          </div>
                          {item.type === 'game' && item.region ? (
                            <Badge variant="outline" className="mx-2 min-w-[3rem] justify-center whitespace-nowrap text-xs text-center">
                              {item.region}
                            </Badge>
                          ) : null}
                          {item.type === 'game' && item.rating ? (
                            <div className="flex items-center text-sm">
                              <Star className="mr-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
                              {item.rating}
                            </div>
                          ) : null}
                          <Badge variant="outline" className="ml-2 text-xs">
                            {getResultTypeLabel(item.type)}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">
                      {totalResultCount > 0 ? '当前分类暂无结果。' : '未找到相关结果。'}
                    </p>
                    <Link
                      href="/submit-resource"
                      onClick={() => setIsOpen(false)}
                      className="mx-auto mt-3 inline-flex text-sm font-medium text-primary hover:underline"
                    >
                      找不到资源？点我反馈
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in-50 space-y-6">
              {searchHistory.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center justify-between px-4">
                    <h3 className="flex items-center text-sm font-semibold text-muted-foreground">
                      <History className="mr-2 h-4 w-4" /> 搜索历史
                    </h3>
                    <Button variant="ghost" size="sm" className="h-auto py-1 text-xs" onClick={handleClearHistory}>
                      清除
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 px-4">
                    {searchHistory.map((item, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-md border border-border/30 bg-card px-3 text-xs font-medium text-slate-900 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-card hover:text-slate-950 hover:shadow-md dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/16 dark:hover:text-white"
                        onClick={() => handleSearchSubmit(item)}
                      >
                        {item}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="mb-3 flex items-center px-4 text-sm font-semibold text-muted-foreground">
                  <Flame className="mr-2 h-4 w-4 text-red-500" /> 热门推荐
                </h3>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : recommendedGames.length > 0 ? (
                  <div className="grid grid-cols-1 gap-x-4 gap-y-1 px-2 sm:grid-cols-2">
                    {recommendedGames.map((item) => (
                      <Link
                        href={item.href || `/app/${item.pkg || item.id}`}
                        key={item.id}
                        onClick={() => setIsOpen(false)}
                        className="group block"
                      >
                        <div className="flex items-center rounded-lg p-2 hover:bg-muted">
                          <Image
                            src={item.imageUrl || '/favicon.ico'}
                            alt={item.title}
                            width={40}
                            height={40}
                            className="mr-3 h-10 w-10 rounded-md object-cover"
                          />
                          <div className="flex-grow">
                            <p className="text-sm font-semibold">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.category}</p>
                          </div>
                          {item.region ? (
                            <Badge variant="outline" className="ml-2 min-w-[3rem] justify-center whitespace-nowrap text-xs text-center">
                              {item.region}
                            </Badge>
                          ) : null}
                          <Button variant="ghost" size="sm" className="text-primary opacity-0 transition-opacity group-hover:opacity-100">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-muted-foreground">暂无热门推荐。</p>
                )}
                <div className="flex justify-center px-4 pt-3">
                  <Link
                    href="/submit-resource"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex text-sm font-medium text-primary hover:underline"
                  >
                    找不到资源？点我反馈
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
