'use client';

import React, { useDeferredValue, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  X,
  ArrowRight,
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
import { SEARCH_RECOMMEND_ALBUM_ID } from '@/lib/search-recommend-album';

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

/** 接口返回的是原始浮点（如 4.3212676），列表里统一显示 1 位小数。 */
function formatRating(rating: number) {
  const value = Number(rating);
  return Number.isFinite(value) ? value.toFixed(1) : '';
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
        trackedApiFetch(`/albums/album-details/${encodeURIComponent(SEARCH_RECOMMEND_ALBUM_ID)}`)
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
            data-acbox-action="global_search_form"
            data-acbox-label="全局搜索表单"
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
              className="h-14 w-full rounded-full border bg-background/80 pl-14 pr-14 text-lg"
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
            data-acbox-action="global_search_close"
            data-acbox-label="关闭搜索"
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
                  data-acbox-action="global_search_filter"
                  data-acbox-label="全部"
                  onClick={() => setResultFilter('all')}
                >
                  全部 ({totalResultCount})
                </Button>
                <Button
                  size="sm"
                  variant={resultFilter === 'game' ? 'default' : 'outline'}
                  data-acbox-action="global_search_filter"
                  data-acbox-label="游戏"
                  onClick={() => setResultFilter('game')}
                >
                  游戏 ({resultCounts.game})
                </Button>
                <Button
                  size="sm"
                  variant={resultFilter === 'topic' ? 'default' : 'outline'}
                  data-acbox-action="global_search_filter"
                  data-acbox-label="话题"
                  onClick={() => setResultFilter('topic')}
                >
                  话题 ({resultCounts.topic})
                </Button>
                <Button
                  size="sm"
                  variant={resultFilter === 'post' ? 'default' : 'outline'}
                  data-acbox-action="global_search_filter"
                  data-acbox-label="帖子"
                  onClick={() => setResultFilter('post')}
                >
                  帖子 ({resultCounts.post})
                </Button>
                <Button
                  size="sm"
                  variant={resultFilter === 'article' ? 'default' : 'outline'}
                  data-acbox-action="global_search_filter"
                  data-acbox-label="文章"
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
                    {filteredResults.map((item) => {
                      const typeLabel = getResultTypeLabel(item.type);
                      // 分类只在能和类型标签区分开、且摘要行没占用它时才单独显示，
                      // 否则「帖子 / 游戏」这类行会把同一个词打印两遍。
                      const metaCategory =
                        item.subtitle && item.category && item.category !== typeLabel ? item.category : '';
                      return (
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
                          data-acbox-action="global_search_result_click"
                          data-acbox-label={`${typeLabel}：${item.title}`}
                          onClick={() => {
                            setIsOpen(false);
                            updateSearchHistory(searchTerm);
                          }}
                          className="block"
                        >
                          <div className="flex items-center gap-3 rounded-lg p-3 hover:bg-muted">
                            <Image
                              src={item.imageUrl || '/favicon.ico'}
                              alt={item.title}
                              width={48}
                              height={48}
                              className="h-12 w-12 shrink-0 rounded-md object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="shrink-0">{renderResultIcon(item.type)}</span>
                                <p className="truncate font-semibold">{item.title}</p>
                              </div>
                              <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                                {item.subtitle || item.category}
                              </p>
                              {/* 版本/大小等补充信息放在摘要下面单独一行：移动端不会把标题挤成省略号。
                                  /search/global 目前不返回这些字段，故暂不渲染对应项。 */}
                              <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
                                {metaCategory ? <span>{metaCategory}</span> : null}
                                {item.type === 'game' && item.region ? (
                                  <Badge variant="outline" className="px-1.5 py-0 text-[11px] font-normal">
                                    {item.region}
                                  </Badge>
                                ) : null}
                                {item.type === 'game' && item.rating ? (
                                  <span className="inline-flex items-center gap-0.5">
                                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                                    <span className="sr-only">评分 </span>
                                    <span className="tabular-nums">{formatRating(item.rating)}</span>
                                  </span>
                                ) : null}
                                <Badge variant="outline" className="px-1.5 py-0 text-[11px] font-normal">
                                  {typeLabel}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">
                      {totalResultCount > 0 ? '当前分类暂无结果。' : '未找到相关结果。'}
                    </p>
                    <Link
                      href="/submit-resource"
                      data-acbox-action="global_search_submit_resource"
                      data-acbox-label="找不到资源反馈"
                      onClick={() => setIsOpen(false)}
                      className="mx-auto mt-3 inline-flex text-sm font-medium text-primary hover:underline"
                    >
                      找不到资源？点我反馈
                    </Link>
                  </div>
                )}
              </div>

              {keywordLength > 0 ? (
                <div className="mt-3 flex justify-center px-2 pb-2">
                  <Link
                    href={`/search?q=${encodeURIComponent(searchTerm.trim())}`}
                    data-acbox-action="global_search_view_all"
                    data-acbox-label="查看全部结果"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex items-center text-sm font-medium text-primary hover:underline"
                  >
                    查看全部结果
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="animate-in fade-in-50 space-y-6">
              {searchHistory.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center justify-between px-4">
                    <h3 className="flex items-center text-sm font-semibold text-muted-foreground">
                      <History className="mr-2 h-4 w-4 text-tone-blue" /> 搜索历史
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto py-1 text-xs"
                      data-acbox-action="global_search_history_clear"
                      data-acbox-label="清除搜索历史"
                      onClick={handleClearHistory}
                    >
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
                        data-acbox-action="global_search_history_click"
                        data-acbox-label={item}
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
                  <Flame className="mr-2 h-4 w-4 text-tone-amber" /> 热门推荐
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
                        data-acbox-action="global_search_recommend_click"
                        data-acbox-label={item.title}
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
                    data-acbox-action="global_search_submit_resource"
                    data-acbox-label="热门推荐资源反馈"
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
