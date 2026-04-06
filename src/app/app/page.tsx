
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus_Jakarta_Sans } from 'next/font/google';
import {
  Brain,
  ChevronDown,
  Flame,
  Grid3X3,
  ListFilter,
  LoaderCircle,
  Swords,
  Theater,
  Trophy,
  X,
} from 'lucide-react';

import { trackedApiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { ApiGame, Game } from '@/types';

const PAGE_SIZE = 8;
const DEFAULT_GAME_QUERY = 'com';
const GAME_LIST_REQUEST_TIMEOUT_MS = 12000;
const GAME_LIST_RETRY_ATTEMPTS = 3;
const GAME_LIST_RETRY_DELAY_MS = 1200;
const FALLBACK_ICON = 'https://placehold.co/96x96.png?text=Game';
const FALLBACK_BANNER = 'https://placehold.co/640x360.png?text=ACBOX';

type SortMode = 'latest' | 'rating' | 'name';

interface LibraryGame extends Game {
  sourceIndex: number;
}

interface CategoryItem {
  id: string;
  name: string;
  count: number;
}

const SIDEBAR_ICONS = [Grid3X3, Theater, Swords, Trophy, Brain];

const TAG_TONE_CLASSES = [
  'text-blue-600 bg-blue-50',
  'text-red-600 bg-red-50',
  'text-green-600 bg-green-50',
  'text-purple-600 bg-purple-50',
  'text-yellow-700 bg-yellow-50',
  'text-orange-600 bg-orange-50',
  'text-pink-600 bg-pink-50',
];

const FALLBACK_SIDEBAR_CATEGORIES = ['角色扮演', '动作冒险', '竞技体育', '策略解谜'];
const FALLBACK_THEME_TAGS = ['幻想', '都市', '赛博朋克', '校园', '末世'];

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

function getTagToneClass(tag: string): string {
  const normalized = String(tag || '').trim();
  if (!normalized) return TAG_TONE_CLASSES[0];
  const sum = normalized.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return TAG_TONE_CLASSES[sum % TAG_TONE_CLASSES.length];
}

function transformApiGameToGame(apiGame: ApiGame, sourceIndex: number): LibraryGame {
  const tags = Array.isArray(apiGame.tags)
    ? apiGame.tags.map((tag) => String(tag || '').trim()).filter(Boolean)
    : [];

  return {
    id: String(apiGame._id || `game-${sourceIndex}`),
    pkg: String(apiGame.pkg || '').trim(),
    title: String(apiGame.name || '未命名游戏').trim(),
    description: String(apiGame.summary || '').trim() || '精彩内容敬请体验',
    shortDescription: String(apiGame.summary || '').trim() || '精彩内容敬请体验',
    imageUrl: String(apiGame.icon || '').trim() || FALLBACK_ICON,
    bannerUrl: String(apiGame.header_image || '').trim() || FALLBACK_BANNER,
    category: tags[0] || '游戏',
    rating: Number(apiGame.star || 0),
    tags,
    status: 'released',
    dataAiHint: `game cover ${String(apiGame.name || '').trim() || 'game'}`,
    sourceIndex,
  };
}

function normalizeGameQueryResult(payload: unknown): {
  code: number;
  list: ApiGame[];
  total: number;
  page: number;
  pageSize: number;
} {
  if (!payload || typeof payload !== 'object') {
    return { code: -1, list: [], total: 0, page: 1, pageSize: PAGE_SIZE };
  }

  const raw = payload as {
    code?: number;
    data?: {
      list?: unknown;
      total?: number;
      page?: number;
      pageSize?: number;
    };
  };
  const list = Array.isArray(raw.data?.list) ? (raw.data?.list as ApiGame[]) : [];
  const total = Number(raw.data?.total ?? 0);
  const page = Math.max(1, Number(raw.data?.page ?? 1));
  const pageSize = Math.max(1, Number(raw.data?.pageSize ?? PAGE_SIZE));
  return {
    code: Number(raw.code ?? -1),
    list,
    total: Number.isFinite(total) ? total : 0,
    page,
    pageSize,
  };
}

function gameMatchesKeyword(game: LibraryGame, keyword: string): boolean {
  const query = keyword.trim().toLowerCase();
  if (!query) return true;
  const haystack = [
    game.title,
    game.description,
    game.shortDescription,
    game.category,
    ...(game.tags || []),
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

function getGameHref(game: LibraryGame): string {
  const target = String(game.pkg || game.id || '').trim();
  return `/app/${encodeURIComponent(target)}`;
}

function getSortLabel(sortMode: SortMode): string {
  if (sortMode === 'rating') return '高分优先';
  if (sortMode === 'name') return '名称排序';
  return '最新发布';
}

function LibraryGameCard({ game }: { game: LibraryGame }) {
  const scoreText =
    typeof game.rating === 'number' && Number.isFinite(game.rating) && game.rating > 0
      ? game.rating.toFixed(1)
      : '--';
  const cardTags = Array.isArray(game.tags) ? game.tags.slice(0, 2) : [];

  return (
    <div className="group relative flex flex-col gap-3">
      <Link
        href={getGameHref(game)}
        className="relative aspect-video overflow-hidden rounded-xl bg-white shadow-[0_24px_32px_-12px_rgba(44,47,48,0.06)]"
      >
        <Image
          src={game.bannerUrl || game.imageUrl || FALLBACK_BANNER}
          alt={game.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          data-ai-hint={game.dataAiHint || 'game cover'}
        />
        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-[10px] font-black text-white backdrop-blur-md">
          <span className="text-xs text-yellow-400">★</span>
          {scoreText}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="translate-y-4 rounded-full bg-[#b71211] px-6 py-2 text-xs font-bold uppercase tracking-widest text-white transition-transform group-hover:translate-y-0">
            立即下载
          </span>
        </div>
      </Link>

      <div className="px-1">
        <div className="mb-2 flex flex-wrap gap-1">
          {cardTags.map((tag) => (
            <span
              key={`${game.id}-${tag}`}
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                getTagToneClass(tag),
              )}
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-1 text-base font-bold text-[#2c2f30] transition-colors group-hover:text-[#b71211]">
              {game.title}
            </h3>
            <p className="mt-1 line-clamp-1 text-sm text-zinc-500">
              {game.shortDescription || game.description || '精彩内容敬请体验'}
            </p>
          </div>
          <Link
            href={getGameHref(game)}
            className="whitespace-nowrap rounded-full bg-[#005e9f] px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            安装
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function GamesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadingAttempt, setLoadingAttempt] = useState(1);
  const [allGames, setAllGames] = useState<LibraryGame[]>([]);
  const [totalGames, setTotalGames] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadError, setLoadError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [queryKeyword, setQueryKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortMode, setSortMode] = useState<SortMode>('latest');
  const [onlyHighScore, setOnlyHighScore] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQueryKeyword(searchInput.trim());
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  async function fetchGamePage(
    page: number,
    options?: { append?: boolean; externalSignal?: AbortSignal; keywordOverride?: string },
  ): Promise<boolean> {
    const append = Boolean(options?.append);
    const externalSignal = options?.externalSignal;
    const keyword = (options?.keywordOverride ?? queryKeyword).trim();
    const query = keyword || DEFAULT_GAME_QUERY;

    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setLoadError('');
      setLoadingAttempt(1);
    }
    try {
      for (let attempt = 0; attempt < GAME_LIST_RETRY_ATTEMPTS; attempt += 1) {
        if (externalSignal?.aborted) return false;
        setLoadingAttempt(attempt + 1);

        const requestController = new AbortController();
        const requestTimeoutId = window.setTimeout(() => {
          requestController.abort();
        }, GAME_LIST_REQUEST_TIMEOUT_MS);
        const relayAbort = () => requestController.abort();
        externalSignal?.addEventListener('abort', relayAbort, { once: true });

        try {
          const params = new URLSearchParams({
            q: query,
            page: String(page),
            pageSize: String(PAGE_SIZE),
          });
          const res = await trackedApiFetch(`/game/q?${params.toString()}`, {
            cache: 'no-store',
            signal: requestController.signal,
          });
          const json = await res.json().catch(() => null);

          if (!res.ok) {
            if (attempt < GAME_LIST_RETRY_ATTEMPTS - 1) {
              await new Promise((resolve) => window.setTimeout(resolve, GAME_LIST_RETRY_DELAY_MS));
              continue;
            }
            setLoadError(`游戏服务异常（${res.status}）`);
            return false;
          }

          const result = normalizeGameQueryResult(json);
          if (result.code !== 0) {
            if (attempt < GAME_LIST_RETRY_ATTEMPTS - 1) {
              await new Promise((resolve) => window.setTimeout(resolve, GAME_LIST_RETRY_DELAY_MS));
              continue;
            }
            setLoadError('游戏接口返回异常，请稍后重试');
            return false;
          }

          const mapped = result.list.map((item, index) =>
            transformApiGameToGame(item, (result.page - 1) * result.pageSize + index),
          );
          setCurrentPage(Math.max(1, Number(result.page || page)));
          if (append) {
            setAllGames((prev) => {
              const next = [...prev, ...mapped];
              setTotalGames(Math.max(Number(result.total || 0), next.length));
              return next;
            });
          } else {
            setAllGames(mapped);
            setTotalGames(Math.max(Number(result.total || 0), mapped.length));
          }
          setLoadError('');
          return true;
        } catch (error) {
          if (externalSignal?.aborted) return false;
          if (attempt < GAME_LIST_RETRY_ATTEMPTS - 1) {
            await new Promise((resolve) => window.setTimeout(resolve, GAME_LIST_RETRY_DELAY_MS));
            continue;
          }
          if ((error as Error)?.name === 'AbortError') {
            setLoadError('游戏服务请求超时，请稍后重试');
          } else {
            console.error('Failed to fetch games page:', error);
            setLoadError('游戏服务不可用，请检查接口服务是否启动');
          }
          return false;
        } finally {
          clearTimeout(requestTimeoutId);
          externalSignal?.removeEventListener('abort', relayAbort);
        }
      }
      return false;
    } finally {
      if (append) {
        setIsLoadingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    setAllGames([]);
    setCurrentPage(1);
    setTotalGames(0);
    void fetchGamePage(1, { append: false, externalSignal: controller.signal });
    return () => controller.abort();
  }, [queryKeyword, reloadToken]);

  const categories = useMemo<CategoryItem[]>(() => {
    const counts = new Map<string, number>();
    allGames.forEach((game) => {
      (game.tags || []).forEach((tag) => {
        const safeTag = String(tag || '').trim();
        if (!safeTag) return;
        counts.set(safeTag, Number(counts.get(safeTag) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ id: name, name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'));
  }, [allGames]);

  const sidebarCategories = useMemo(() => {
    if (categories.length > 0) return categories.slice(0, 4);
    return FALLBACK_SIDEBAR_CATEGORIES.map((name) => ({ id: name, name, count: 0 }));
  }, [categories]);
  const themeTags = useMemo(() => {
    if (categories.length > 4) return categories.slice(4, 9);
    return FALLBACK_THEME_TAGS.map((name) => ({ id: name, name, count: 0 }));
  }, [categories]);

  const filteredGames = useMemo(() => {
    const normalizedKeyword = searchInput.trim();

    const filtered = allGames.filter((game) => {
      if (
        selectedCategory !== 'all' &&
        !(game.tags || []).includes(selectedCategory)
      ) {
        return false;
      }
      if (onlyHighScore && Number(game.rating || 0) < 8) {
        return false;
      }
      if (!gameMatchesKeyword(game, normalizedKeyword)) {
        return false;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      if (sortMode === 'rating') return Number(b.rating || 0) - Number(a.rating || 0);
      if (sortMode === 'name') return a.title.localeCompare(b.title, 'zh-CN');
      return a.sourceIndex - b.sourceIndex;
    });
  }, [allGames, onlyHighScore, searchInput, selectedCategory, sortMode]);

  const hasMore = !isLoading && !isLoadingMore && allGames.length < Math.max(totalGames, allGames.length);
  const renderedGames = isLoading ? [] : filteredGames;
  const placeholderCount = isLoading
    ? PAGE_SIZE
    : isLoadingMore
      ? 4
      : Math.max(4 - renderedGames.length, 0);

  const selectedCategoryName =
    selectedCategory === 'all' ? '' : selectedCategory;

  return (
    <div className={cn('app-library-page min-h-screen bg-background text-foreground', plusJakartaSans.className)}>
      <div className="mx-auto flex max-w-screen-2xl items-start pt-6">
        <aside className="hidden h-[calc(100vh-6rem)] w-64 shrink-0 flex-col gap-2 overflow-y-auto rounded-r-2xl border-r border-border/40 bg-card/70 p-4 lg:sticky lg:top-24 lg:flex">
          <div className="mb-6 px-4">
            <h2 className="text-lg font-bold">游戏分类</h2>
            <p className="text-xs text-muted-foreground">寻找你的下一场冒险</p>
          </div>

          <nav className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={cn(
                'flex items-center gap-3 rounded-full px-4 py-2.5 text-left transition-transform duration-200 hover:translate-x-1',
                selectedCategory === 'all'
                  ? 'bg-primary/12 font-bold text-primary'
                  : 'text-muted-foreground hover:bg-muted/70',
              )}
            >
              <Grid3X3 className="h-4 w-4" />
              <span className="text-sm font-medium">全部游戏</span>
            </button>

            {sidebarCategories.map((category, index) => {
              const Icon = SIDEBAR_ICONS[(index + 1) % SIDEBAR_ICONS.length];
              const active = selectedCategory === category.name;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.name)}
                  className={cn(
                    'flex items-center gap-3 rounded-full px-4 py-2.5 text-left transition-transform duration-200 hover:translate-x-1',
                    active
                      ? 'bg-primary/12 font-bold text-primary'
                      : 'text-muted-foreground hover:bg-muted/70',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{category.name}</span>
                </button>
              );
            })}
          </nav>

          {themeTags.length ? (
            <div className="mt-8 px-4">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                游戏题材
              </h3>
              <div className="flex flex-wrap gap-2">
                {themeTags.map((tag) => (
                  <button
                    key={`theme-${tag.id}`}
                    type="button"
                    onClick={() => setSelectedCategory(tag.name)}
                    className={cn(
                      'rounded-full bg-muted/70 px-3 py-1 text-xs transition-colors hover:bg-primary/14',
                      selectedCategory === tag.name ? 'text-primary' : 'text-muted-foreground',
                    )}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </aside>

        <main className="min-w-0 flex-1 px-4 pb-20 lg:px-8">
          <section className="mb-10 mt-4">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <h1 className="mb-2 text-[24px] font-black leading-[1.1] tracking-tight sm:text-[28px]">发现。游玩。热爱。</h1>
                <p className="max-w-md text-zinc-500">
                  探索 ACBOX 精选的高品质二次元游戏，从开放世界到战术竞技，应有尽有。
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full bg-[#dadddf] px-5 py-2 text-sm font-semibold text-[#2c2f30] transition-colors hover:bg-[#cdd1d4]"
                  onClick={() =>
                    setSortMode((prev) =>
                      prev === 'latest' ? 'rating' : prev === 'rating' ? 'name' : 'latest',
                    )
                  }
                >
                  状态：{getSortLabel(sortMode)}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full bg-[#b71211] px-5 py-2 text-sm font-semibold text-[#ffefed] shadow-lg shadow-[#b71211]/20 transition-opacity hover:opacity-90"
                  onClick={() => setOnlyHighScore((prev) => !prev)}
                >
                  <ListFilter className="mr-1 h-4 w-4" />
                  筛选
                </button>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setOnlyHighScore((prev) => !prev)}
                className={cn(
                  'flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold transition-opacity',
                  onlyHighScore
                    ? 'bg-[#fdc003] text-[#553e00]'
                    : 'bg-[#ffe8ab] text-[#7a6000] opacity-75',
                )}
              >
                <Flame className="h-3.5 w-3.5" />
                热门趋势
              </button>

              <div className="rounded-full bg-[#b3d4ff] px-4 py-1.5 text-xs font-bold text-[#004a7e]">
                二次元
              </div>

              {selectedCategoryName ? (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="flex items-center gap-2 rounded-full bg-zinc-200 px-4 py-1.5 text-xs font-medium text-zinc-600"
                >
                  {selectedCategoryName}
                  <X className="h-3 w-3" />
                </button>
              ) : null}
            </div>
          </section>

          {isLoading ? (
            <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
              <div className="flex items-center gap-2">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                <span>
                  正在请求第 {currentPage} 页（第 {loadingAttempt}/{GAME_LIST_RETRY_ATTEMPTS} 次尝试）
                </span>
              </div>
            </div>
          ) : null}

          {!isLoading && loadError ? (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
              <span>{loadError}</span>
              <button
                type="button"
                onClick={() => setReloadToken((prev) => prev + 1)}
                className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-200"
              >
                重新加载
              </button>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {renderedGames.map((game) => (
              <LibraryGameCard key={game.id} game={game} />
            ))}

            {Array.from({ length: placeholderCount }).map((_, index) => (
              <div key={`placeholder-${index}`} className="flex flex-col gap-3 opacity-80">
                <div className="aspect-video animate-pulse rounded-xl bg-[#eff1f2]" />
                <div className="mt-2 h-5 w-3/4 rounded bg-zinc-200" />
              </div>
            ))}
          </div>

          <div className="mt-14 flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={() => {
                if (isLoading || isLoadingMore || !hasMore) return;
                void fetchGamePage(currentPage + 1, { append: true });
              }}
              disabled={isLoading || isLoadingMore || !hasMore}
              className={cn(
                'group rounded-full bg-[#dadddf] px-6 py-2 text-sm font-semibold transition-colors',
                !isLoading && !isLoadingMore && hasMore ? 'hover:bg-[#cdd1d4]' : 'cursor-not-allowed opacity-50',
              )}
            >
              {isLoading ? '加载中...' : isLoadingMore ? '加载更多中...' : '查看更多精彩游戏'}
              <span className="ml-2 inline-block transition-transform group-hover:translate-y-1">
                ▼
              </span>
            </button>
            <p className="text-xs text-zinc-400">
              已加载 {allGames.length} / {totalGames || allGames.length} 款 · 当前展示 {renderedGames.length} 款
            </p>
          </div>
        </main>
      </div>

    </div>
  );
}

