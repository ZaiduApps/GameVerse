
'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
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
  Search,
  Swords,
  Theater,
  Trophy,
  X,
} from 'lucide-react';

import { trackedApiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { ApiGame, Game } from '@/types';

const PAGE_SIZE = 24;
const DEFAULT_GAME_QUERY = '国际服';
const GAME_LIST_REQUEST_TIMEOUT_MS = 12000;
const GAME_LIST_RETRY_ATTEMPTS = 3;
const GAME_LIST_RETRY_DELAY_MS = 1200;
const FALLBACK_ICON = '/favicon.ico';
const FALLBACK_BANNER = '/favicon.ico';
const HIGH_SCORE_THRESHOLD = 4.5;

type SortMode = 'latest' | 'rating' | 'name';
type RatingFilter = 'all' | '4+' | '4.5+';
type UpdateWindow = 'all' | '7d' | '30d' | '90d';
type DeviceFilter = 'all' | 'android' | 'ios' | 'pc';

interface LibraryGame extends Game {
  sourceIndex: number;
  region: string;
  deviceList: Array<Exclude<DeviceFilter, 'all'>>;
  latestAt: string;
  latestTimestamp: number;
}

interface FacetOption {
  id: string;
  name: string;
  count: number;
}

const SIDEBAR_ICONS = [Grid3X3, Theater, Swords, Trophy, Brain];
const DEVICE_LABELS: Record<Exclude<DeviceFilter, 'all'>, string> = {
  android: 'Android',
  ios: 'iOS',
  pc: 'PC',
};
const RATING_FILTER_OPTIONS: Array<{ id: RatingFilter; label: string }> = [
  { id: 'all', label: '全部评分' },
  { id: '4.5+', label: '4.5 分以上' },
  { id: '4+', label: '4 分以上' },
];
const UPDATE_WINDOW_OPTIONS: Array<{ id: UpdateWindow; label: string }> = [
  { id: 'all', label: '全部时间' },
  { id: '7d', label: '7 天内更新' },
  { id: '30d', label: '30 天内更新' },
  { id: '90d', label: '90 天内更新' },
];
const PRIORITY_TAGS = [
  '角色扮演',
  '动作',
  '射击游戏',
  '策略',
  '卡牌',
  '冒险',
  '休闲',
  '多人竞技',
  'MOBA',
  '回合制角色扮演',
  '动作策略',
  '动漫',
];

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

function normalizeFacetValue(value: string): string {
  return String(value || '').trim().toLowerCase();
}

function isNoiseTag(tag: string): boolean {
  const normalized = String(tag || '').trim();
  if (!normalized) return true;
  if (normalized.startsWith('#')) return true;
  return /创收最高|热门免费|热门付费/.test(normalized);
}

function normalizeGameTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return Array.from(
    new Set(
      tags
        .map((tag) => String(tag || '').trim())
        .filter((tag) => tag && !isNoiseTag(tag)),
    ),
  );
}

function buildGameSearchText(game: LibraryGame): string {
  return [
    game.title,
    game.description,
    game.shortDescription,
    game.category,
    game.pkg,
    game.region,
    ...game.deviceList,
    ...(game.tags || []),
  ]
    .join(' ')
    .toLowerCase();
}

function getTagPriority(tag: string): number {
  const index = PRIORITY_TAGS.findIndex((item) => item === tag);
  return index === -1 ? PRIORITY_TAGS.length + 1 : index;
}

function getMinimumRating(ratingFilter: RatingFilter, onlyHighScore: boolean): number {
  const ratingFloor = ratingFilter === '4.5+' ? 4.5 : ratingFilter === '4+' ? 4 : 0;
  return Math.max(ratingFloor, onlyHighScore ? HIGH_SCORE_THRESHOLD : 0);
}

function getUpdateWindowThreshold(updateWindow: UpdateWindow): number {
  const now = Date.now();
  if (updateWindow === '7d') return now - 7 * 24 * 60 * 60 * 1000;
  if (updateWindow === '30d') return now - 30 * 24 * 60 * 60 * 1000;
  if (updateWindow === '90d') return now - 90 * 24 * 60 * 60 * 1000;
  return 0;
}

function transformApiGameToGame(apiGame: ApiGame, sourceIndex: number): LibraryGame {
  const tags = normalizeGameTags(apiGame.tags);
  const latestAt = String(apiGame.latest_at || '').trim();
  const latestTimestamp = latestAt ? Date.parse(latestAt) : 0;
  const region = String(apiGame.metadata?.region || '').trim() || '国际服';
  const deviceList = Array.isArray(apiGame.metadata?.deviceList)
    ? Array.from(
        new Set(
          apiGame.metadata.deviceList
            .map((device) => String(device || '').trim().toLowerCase())
            .filter((device): device is Exclude<DeviceFilter, 'all'> => device === 'android' || device === 'ios' || device === 'pc'),
        ),
      )
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
    region,
    deviceList,
    latestAt,
    latestTimestamp: Number.isFinite(latestTimestamp) ? latestTimestamp : 0,
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
  return buildGameSearchText(game).includes(query);
}

function gameMatchesCategory(game: LibraryGame, category: string): boolean {
  const query = String(category || '').trim().toLowerCase();
  if (!query) return true;
  return [game.category, ...(game.tags || [])].some((item) => normalizeFacetValue(item) === query);
}

function gameMatchesThemeTag(game: LibraryGame, tag: string): boolean {
  const query = normalizeFacetValue(tag);
  if (!query) return true;
  return (game.tags || []).some((item) => normalizeFacetValue(item) === query);
}

function gameMatchesRegion(game: LibraryGame, region: string): boolean {
  const query = normalizeFacetValue(region);
  if (!query || query === 'all') return true;
  return normalizeFacetValue(game.region) === query;
}

function gameMatchesDevice(game: LibraryGame, device: DeviceFilter): boolean {
  if (!device || device === 'all') return true;
  return game.deviceList.includes(device);
}

function mergeUniqueGames(previousGames: LibraryGame[], nextGames: LibraryGame[]): LibraryGame[] {
  const merged = new Map<string, LibraryGame>();
  [...previousGames, ...nextGames].forEach((game) => {
    const key = String(game.id || game.pkg || '').trim();
    if (key) {
      merged.set(key, game);
    }
  });
  return Array.from(merged.values());
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

function formatLatestAt(latestAt: string): string {
  const safeValue = String(latestAt || '').trim();
  if (!safeValue) return '待补充更新时间';
  const timestamp = Date.parse(safeValue);
  if (!Number.isFinite(timestamp)) return safeValue;
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(timestamp);
}

function LibraryGameCard({ game }: { game: LibraryGame }) {
  const scoreText =
    typeof game.rating === 'number' && Number.isFinite(game.rating) && game.rating > 0
      ? game.rating.toFixed(1)
      : '--';
  const cardTags = Array.isArray(game.tags) ? game.tags.slice(0, 2) : [];
  const deviceText = game.deviceList
    .map((device) => DEVICE_LABELS[device])
    .filter(Boolean)
    .join(' / ');

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
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-400">
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-500">{game.region}</span>
              {deviceText ? (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-500">{deviceText}</span>
              ) : null}
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-500">
                更新于 {formatLatestAt(game.latestAt)}
              </span>
            </div>
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

export default function GamesPage({
  initialKeyword = '',
  initialCategory = 'all',
}: {
  initialKeyword?: string;
  initialCategory?: string;
}) {
  const safeInitialCategory = String(initialCategory || '').trim() || 'all';
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadingAttempt, setLoadingAttempt] = useState(1);
  const [allGames, setAllGames] = useState<LibraryGame[]>([]);
  const [totalGames, setTotalGames] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadError, setLoadError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const [searchInput, setSearchInput] = useState(initialKeyword);
  const [queryKeyword, setQueryKeyword] = useState(initialKeyword);
  const [selectedCategory, setSelectedCategory] = useState(safeInitialCategory);
  const [selectedThemeTag, setSelectedThemeTag] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedDevice, setSelectedDevice] = useState<DeviceFilter>('all');
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  const [updateWindow, setUpdateWindow] = useState<UpdateWindow>('all');
  const [sortMode, setSortMode] = useState<SortMode>('latest');
  const [onlyHighScore, setOnlyHighScore] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQueryKeyword(searchInput.trim());
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setSearchInput(initialKeyword);
    setQueryKeyword(initialKeyword);
  }, [initialKeyword]);

  useEffect(() => {
    setSelectedCategory(String(initialCategory || '').trim() || 'all');
  }, [initialCategory]);

  function resetAllFilters() {
    setSelectedCategory('all');
    setSelectedThemeTag('');
    setSelectedRegion('all');
    setSelectedDevice('all');
    setRatingFilter('all');
    setUpdateWindow('all');
    setOnlyHighScore(false);
    setSortMode('latest');
  }

  function handleCategorySelect(category: string) {
    setSelectedCategory(category);
    if (category !== 'all') {
      setSelectedThemeTag('');
    }
  }

  function handleThemeTagToggle(tag: string) {
    setSelectedThemeTag((prev) => (prev === tag ? '' : tag));
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQueryKeyword(searchInput.trim());
  }

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
              const next = mergeUniqueGames(prev, mapped);
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

  const categories = useMemo<FacetOption[]>(() => {
    const counts = new Map<string, number>();
    allGames.forEach((game) => {
      [game.category, ...(game.tags || [])].forEach((tag) => {
        const safeTag = String(tag || '').trim();
        if (!safeTag) return;
        counts.set(safeTag, Number(counts.get(safeTag) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ id: name, name, count }))
      .sort((a, b) => {
        const priorityDelta = getTagPriority(a.name) - getTagPriority(b.name);
        if (priorityDelta !== 0) return priorityDelta;
        return b.count - a.count || a.name.localeCompare(b.name, 'zh-CN');
      });
  }, [allGames]);

  const sidebarCategories = useMemo(() => {
    if (categories.length > 0) return categories.slice(0, 6);
    return FALLBACK_SIDEBAR_CATEGORIES.map((name) => ({ id: name, name, count: 0 }));
  }, [categories]);
  const themeTags = useMemo(() => {
    const sidebarCategoryNames = new Set(sidebarCategories.map((item) => item.name));
    const extraTags = categories.filter((item) => !sidebarCategoryNames.has(item.name));
    if (extraTags.length > 0) return extraTags.slice(0, 12);
    return FALLBACK_THEME_TAGS.map((name) => ({ id: name, name, count: 0 }));
  }, [categories, sidebarCategories]);

  const regionOptions = useMemo<FacetOption[]>(() => {
    const counts = new Map<string, number>();
    allGames.forEach((game) => {
      const region = String(game.region || '').trim();
      if (!region) return;
      counts.set(region, Number(counts.get(region) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ id: name, name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'));
  }, [allGames]);

  const deviceOptions = useMemo<FacetOption[]>(() => {
    const counts = new Map<string, number>();
    allGames.forEach((game) => {
      game.deviceList.forEach((device) => {
        counts.set(device, Number(counts.get(device) || 0) + 1);
      });
    });
    return (['android', 'ios', 'pc'] as Array<Exclude<DeviceFilter, 'all'>>)
      .filter((device) => counts.has(device))
      .map((device) => ({
        id: device,
        name: DEVICE_LABELS[device],
        count: Number(counts.get(device) || 0),
      }));
  }, [allGames]);

  const filteredGames = useMemo(() => {
    const normalizedKeyword = queryKeyword.trim();
    const minimumRating = getMinimumRating(ratingFilter, onlyHighScore);
    const updateThreshold = getUpdateWindowThreshold(updateWindow);

    const filtered = allGames.filter((game) => {
      if (selectedCategory !== 'all' && !gameMatchesCategory(game, selectedCategory)) {
        return false;
      }
      if (selectedThemeTag && !gameMatchesThemeTag(game, selectedThemeTag)) {
        return false;
      }
      if (!gameMatchesRegion(game, selectedRegion)) {
        return false;
      }
      if (!gameMatchesDevice(game, selectedDevice)) {
        return false;
      }
      if (Number(game.rating || 0) < minimumRating) {
        return false;
      }
      if (updateThreshold > 0 && Number(game.latestTimestamp || 0) < updateThreshold) {
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
      return Number(b.latestTimestamp || 0) - Number(a.latestTimestamp || 0) || a.sourceIndex - b.sourceIndex;
    });
  }, [
    allGames,
    onlyHighScore,
    queryKeyword,
    ratingFilter,
    selectedCategory,
    selectedDevice,
    selectedRegion,
    selectedThemeTag,
    sortMode,
    updateWindow,
  ]);

  const hasMore = !isLoading && !isLoadingMore && allGames.length < Math.max(totalGames, allGames.length);
  const renderedGames = isLoading ? [] : filteredGames;
  const hasActiveFilters =
    selectedCategory !== 'all' ||
    !!selectedThemeTag ||
    selectedRegion !== 'all' ||
    selectedDevice !== 'all' ||
    ratingFilter !== 'all' ||
    updateWindow !== 'all' ||
    onlyHighScore ||
    sortMode !== 'latest';
  const placeholderCount = isLoading
    ? Math.min(PAGE_SIZE, 8)
    : isLoadingMore
      ? 4
      : 0;

  const selectedCategoryName =
    selectedCategory === 'all' ? '' : selectedCategory;
  const selectedDeviceName = selectedDevice === 'all' ? '' : DEVICE_LABELS[selectedDevice];
  const selectedRatingLabel =
    RATING_FILTER_OPTIONS.find((option) => option.id === ratingFilter)?.label || '';
  const selectedUpdateLabel =
    UPDATE_WINDOW_OPTIONS.find((option) => option.id === updateWindow)?.label || '';
  const resultScopeLabel = queryKeyword.trim()
    ? `关键词：${queryKeyword.trim()}`
    : `默认浏览：${DEFAULT_GAME_QUERY}`;
  const isEmpty = !isLoading && !loadError && renderedGames.length === 0;

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
              onClick={() => handleCategorySelect('all')}
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
                  onClick={() => handleCategorySelect(category.name)}
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
                    onClick={() => handleThemeTagToggle(tag.name)}
                    className={cn(
                      'rounded-full bg-muted/70 px-3 py-1 text-xs transition-colors hover:bg-primary/14',
                      selectedThemeTag === tag.name
                        ? 'bg-primary/12 font-semibold text-primary'
                        : 'text-muted-foreground',
                    )}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </aside>

        <section className="min-w-0 flex-1 px-4 pb-20 lg:px-8">
          <section className="mb-10 mt-4">
            <div className="rounded-[28px] border border-zinc-200 bg-white px-5 py-6 shadow-[0_24px_50px_-28px_rgba(25,28,31,0.18)] sm:px-7">
              <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#ffe8ab] px-3 py-1 text-xs font-bold text-[#7a6000]">
                    <Flame className="h-3.5 w-3.5" />
                    动态筛选游戏库
                  </div>
                  <h2 className="mb-2 text-[24px] font-black leading-[1.1] tracking-tight sm:text-[28px]">
                    发现。游玩。热爱。
                  </h2>
                  <p className="max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
                    用关键词、题材、地区、平台、评分和更新时间快速筛到真正可玩的内容，当前结果直接来自联调中的游戏库接口。
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full bg-[#dadddf] px-5 py-2 text-sm font-semibold text-[#2c2f30] transition-colors hover:bg-[#cdd1d4]"
                    onClick={() =>
                      setSortMode((prev) =>
                        prev === 'latest' ? 'rating' : prev === 'rating' ? 'name' : 'latest',
                      )
                    }
                  >
                    排序：{getSortLabel(sortMode)}
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold shadow-lg transition-opacity',
                      onlyHighScore
                        ? 'bg-[#b71211] text-[#ffefed] shadow-[#b71211]/20 hover:opacity-90'
                        : 'bg-[#f3f4f6] text-[#2c2f30] shadow-transparent hover:bg-[#e5e7eb]',
                    )}
                    onClick={() => setOnlyHighScore((prev) => !prev)}
                  >
                    <ListFilter className="mr-1 h-4 w-4" />
                    只看高分
                  </button>
                </div>
              </div>

              <form className="mt-6" onSubmit={handleSearchSubmit}>
                <div className="flex flex-col gap-3 lg:flex-row">
                  <label className="group flex min-h-14 flex-1 items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 transition-colors focus-within:border-[#005e9f] focus-within:bg-white">
                    <Search className="h-5 w-5 text-zinc-400 transition-colors group-focus-within:text-[#005e9f]" />
                    <input
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      className="h-full flex-1 bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
                      placeholder="搜索游戏名、包名、题材、地区，例如：Limbus、国际服、射击游戏"
                    />
                    {searchInput ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchInput('');
                          setQueryKeyword('');
                        }}
                        className="rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600"
                        aria-label="清空搜索"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </label>
                  <button
                    type="submit"
                    className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-[#005e9f] px-6 text-sm font-bold text-white shadow-[0_16px_30px_-18px_rgba(0,94,159,0.9)] transition-opacity hover:opacity-90"
                  >
                    搜索游戏库
                  </button>
                </div>
              </form>

              <div className="mt-6 rounded-3xl bg-[#f7f8fa] p-4 sm:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[#2c2f30]">多维筛选</div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {resultScopeLabel} · 共载入 {allGames.length} 款，当前命中 {renderedGames.length} 款
                    </p>
                  </div>
                  {hasActiveFilters ? (
                    <button
                      type="button"
                      onClick={resetAllFilters}
                      className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-100"
                    >
                      重置筛选
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <div className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
                        分类
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleCategorySelect('all')}
                          className={cn(
                            'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                            selectedCategory === 'all'
                              ? 'bg-[#005e9f] text-white'
                              : 'bg-white text-zinc-600 hover:bg-zinc-100',
                          )}
                        >
                          全部
                        </button>
                        {categories.slice(0, 10).map((category) => (
                          <button
                            key={`category-chip-${category.id}`}
                            type="button"
                            onClick={() => handleCategorySelect(category.name)}
                            className={cn(
                              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                              selectedCategory === category.name
                                ? 'bg-[#005e9f] text-white'
                                : 'bg-white text-zinc-600 hover:bg-zinc-100',
                            )}
                          >
                            {category.name}
                            <span className="ml-1 text-[10px] opacity-70">{category.count}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
                        题材
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {themeTags.map((tag) => (
                          <button
                            key={`theme-chip-${tag.id}`}
                            type="button"
                            onClick={() => handleThemeTagToggle(tag.name)}
                            className={cn(
                              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                              selectedThemeTag === tag.name
                                ? 'bg-[#b71211] text-white'
                                : 'bg-white text-zinc-600 hover:bg-zinc-100',
                            )}
                          >
                            {tag.name}
                            <span className="ml-1 text-[10px] opacity-70">{tag.count}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
                        地区
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedRegion('all')}
                          className={cn(
                            'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                            selectedRegion === 'all'
                              ? 'bg-[#005e9f] text-white'
                              : 'bg-white text-zinc-600 hover:bg-zinc-100',
                          )}
                        >
                          全部地区
                        </button>
                        {regionOptions.map((region) => (
                          <button
                            key={`region-chip-${region.id}`}
                            type="button"
                            onClick={() => setSelectedRegion(region.name)}
                            className={cn(
                              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                              selectedRegion === region.name
                                ? 'bg-[#005e9f] text-white'
                                : 'bg-white text-zinc-600 hover:bg-zinc-100',
                            )}
                          >
                            {region.name}
                            <span className="ml-1 text-[10px] opacity-70">{region.count}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
                        平台
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedDevice('all')}
                          className={cn(
                            'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                            selectedDevice === 'all'
                              ? 'bg-[#005e9f] text-white'
                              : 'bg-white text-zinc-600 hover:bg-zinc-100',
                          )}
                        >
                          全平台
                        </button>
                        {deviceOptions.map((device) => (
                          <button
                            key={`device-chip-${device.id}`}
                            type="button"
                            onClick={() => setSelectedDevice(device.id as DeviceFilter)}
                            className={cn(
                              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                              selectedDevice === device.id
                                ? 'bg-[#005e9f] text-white'
                                : 'bg-white text-zinc-600 hover:bg-zinc-100',
                            )}
                          >
                            {device.name}
                            <span className="ml-1 text-[10px] opacity-70">{device.count}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
                        评分
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {RATING_FILTER_OPTIONS.map((option) => (
                          <button
                            key={`rating-chip-${option.id}`}
                            type="button"
                            onClick={() => setRatingFilter(option.id)}
                            className={cn(
                              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                              ratingFilter === option.id
                                ? 'bg-[#005e9f] text-white'
                                : 'bg-white text-zinc-600 hover:bg-zinc-100',
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
                        更新时间
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {UPDATE_WINDOW_OPTIONS.map((option) => (
                          <button
                            key={`update-chip-${option.id}`}
                            type="button"
                            onClick={() => setUpdateWindow(option.id)}
                            className={cn(
                              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                              updateWindow === option.id
                                ? 'bg-[#005e9f] text-white'
                                : 'bg-white text-zinc-600 hover:bg-zinc-100',
                            )}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {onlyHighScore ? (
                    <button
                      type="button"
                      onClick={() => setOnlyHighScore(false)}
                      className="flex items-center gap-2 rounded-full bg-[#ffe8ab] px-4 py-1.5 text-xs font-bold text-[#7a6000]"
                    >
                      只看高分
                      <X className="h-3 w-3" />
                    </button>
                  ) : null}
                  {selectedCategoryName ? (
                    <button
                      type="button"
                      onClick={() => handleCategorySelect('all')}
                      className="flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-medium text-zinc-600"
                    >
                      分类：{selectedCategoryName}
                      <X className="h-3 w-3" />
                    </button>
                  ) : null}
                  {selectedThemeTag ? (
                    <button
                      type="button"
                      onClick={() => setSelectedThemeTag('')}
                      className="flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-medium text-zinc-600"
                    >
                      题材：{selectedThemeTag}
                      <X className="h-3 w-3" />
                    </button>
                  ) : null}
                  {selectedRegion !== 'all' ? (
                    <button
                      type="button"
                      onClick={() => setSelectedRegion('all')}
                      className="flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-medium text-zinc-600"
                    >
                      地区：{selectedRegion}
                      <X className="h-3 w-3" />
                    </button>
                  ) : null}
                  {selectedDeviceName ? (
                    <button
                      type="button"
                      onClick={() => setSelectedDevice('all')}
                      className="flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-medium text-zinc-600"
                    >
                      平台：{selectedDeviceName}
                      <X className="h-3 w-3" />
                    </button>
                  ) : null}
                  {ratingFilter !== 'all' ? (
                    <button
                      type="button"
                      onClick={() => setRatingFilter('all')}
                      className="flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-medium text-zinc-600"
                    >
                      评分：{selectedRatingLabel}
                      <X className="h-3 w-3" />
                    </button>
                  ) : null}
                  {updateWindow !== 'all' ? (
                    <button
                      type="button"
                      onClick={() => setUpdateWindow('all')}
                      className="flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-medium text-zinc-600"
                    >
                      更新时间：{selectedUpdateLabel}
                      <X className="h-3 w-3" />
                    </button>
                  ) : null}
                </div>
              </div>
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

          {isEmpty ? (
            <div className="rounded-[28px] border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                <Search className="h-6 w-6 text-zinc-400" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-[#2c2f30]">当前筛选下没有结果</h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-500">
                已应用的筛选条件比较严格，先清空筛选或搜索词，再继续加载更丰富的游戏库内容。
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    resetAllFilters();
                    setSearchInput('');
                    setQueryKeyword('');
                  }}
                  className="rounded-full bg-[#005e9f] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  恢复默认浏览
                </button>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-100"
                >
                  仅清空筛选
                </button>
              </div>
            </div>
          ) : (
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
          )}

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
        </section>
      </div>
    </div>
  );
}

