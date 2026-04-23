'use client';

import type { ApiRecommendedGame, CardConfigItem, CommunityPost, GameDetailData } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent, type WheelEvent } from 'react';
import {
  ArrowLeft,
  BellRing,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Heart,
  Link as LinkIcon,
  MessageSquare,
  RotateCcw,
  Star,
  ThumbsUp,
  Users,
  X as CloseIcon,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import GameAnnouncements from '@/components/game-announcements';
import GameDownloadDialog from '@/components/game-download-dialog';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { trackedApiFetch } from '@/lib/api';
import { getCommunityPostsByGame } from '@/lib/community-api';
import { cn } from '@/lib/utils';

interface GameDetailViewProps {
  id: string;
  initialGameData?: GameDetailData | null;
  initialRecommendedGames?: ApiRecommendedGame[] | null;
}

const MAX_RECOMMENDED_GAMES = 5;
const CLIENT_PLATFORM = process.env.NEXT_PUBLIC_CLIENT_PLATFORM || 'android';
const CLIENT_REGION = process.env.NEXT_PUBLIC_CLIENT_REGION || '';
const CLIENT_VERSION = process.env.NEXT_PUBLIC_CLIENT_VERSION || '';

type DragState = {
  dragging: boolean;
  startX: number;
  startY: number;
  baseX: number;
  baseY: number;
};

function buildGameDetailsUrl(param: string) {
  const query = new URLSearchParams();
  query.set('param', param);
  if (CLIENT_PLATFORM) query.set('platform', CLIENT_PLATFORM);
  if (CLIENT_REGION) query.set('region', CLIENT_REGION);
  if (CLIENT_VERSION) query.set('client_version', CLIENT_VERSION);
  return `/game/details?${query.toString()}`;
}

function formatBytes(size?: number | null) {
  if (!size || size <= 0) return '未知';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  return `${(size / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

function cleanText(input?: string | null) {
  if (!input) return '';
  return input
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeRichHtml(input: string) {
  return input
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?(?:script|style|iframe|object|embed|link|meta)[^>]*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '')
    .replace(/\s(href|src)\s*=\s*("|\')\s*javascript:[\s\S]*?\2/gi, ' $1="#"');
}

function formatDescriptionHtml(input?: string | null) {
  const raw = String(input || '').replace(/\r\n?/g, '\n').trim();
  if (!raw) return '';

  const hasHtmlTag = /<\/?[a-z][^>]*>/i.test(raw);
  if (hasHtmlTag) {
    return sanitizeRichHtml(raw).replace(/\n/g, '<br />');
  }

  return escapeHtml(raw)
    .replace(/\n{2,}/g, '<br /><br />')
    .replace(/\n/g, '<br />');
}

function markdownToPlainText(input?: string | null) {
  if (!input) return '';
  return String(input)
    .replace(/\r\n?/g, '\n')
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1')
    .replace(
      /<p[^>]*class=["'][^"']*defined-image[^"']*["'][^>]*>[\s\S]*?<\/p>/gi,
      ' ',
    )
    .replace(/<img[^>]*>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/!\[([^\]]*)\]\((?:[^)]+)\)/g, '$1')
    .replace(/\[([^\]]+)\]\((?:[^)]+)\)/g, '$1')
    .replace(/^>+\s?/gm, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^---+$/gm, ' ')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/[`*_~]/g, '')
    .replace(/\b(?:https?|acbox|uu-mobile):\/\/[^\s<>"')\]]+/gi, ' ')
    .replace(/<\/?(?:p|div|section|article|blockquote|li|ul|ol|h[1-6]|span|strong|em|code|pre)[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getPostPreviewText(post: CommunityPost, maxLength = 180, fallback = '暂无内容') {
  const contentText = markdownToPlainText(post.content || '');
  const summaryText = markdownToPlainText(post.summary || '');
  const source =
    (summaryText.length >= 12 ? summaryText : '') ||
    (contentText.length >= 12 ? contentText : '') ||
    summaryText ||
    contentText ||
    fallback;
  if (source.length <= maxLength) return source;
  return `${source.slice(0, maxLength).trim()}...`;
}

function formatDateText(value?: string | null) {
  if (!value) return '未知';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '未知';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatCompactCount(input?: number | string | null) {
  const value = Number(input || 0);
  if (!Number.isFinite(value) || value <= 0) return '0';
  if (value >= 10000) return `${(value / 10000).toFixed(1)}w`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(Math.round(value));
}

function normalizeScore(raw?: number | string | null, fallback = 9.2) {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return fallback.toFixed(1);
  return value.toFixed(1);
}

function safeHref(path?: string, fallback = '#') {
  const value = String(path || '').trim();
  return value || fallback;
}

function extractPostImage(post: CommunityPost) {
  if (post.imageUrl) return post.imageUrl;
  const markdownMatch = String(post.content || '').match(/!\[[^\]]*]\((https?:\/\/[^)\s]+)(?:\s+[^)]*)?\)/i);
  if (markdownMatch?.[1]) return markdownMatch[1];
  const htmlMatch = String(post.content || '').match(/<img[^>]*src=["'](https?:\/\/[^"']+)["'][^>]*>/i);
  if (htmlMatch?.[1]) return htmlMatch[1];
  return '';
}

function normalizePreviewUrl(input?: string | null) {
  const raw = String(input || '').trim();
  if (!raw) return '';
  try {
    const parsed = new URL(
      raw,
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
    );
    if (parsed.pathname === '/_next/image') {
      const original = parsed.searchParams.get('url');
      if (original) return decodeURIComponent(original);
    }
    return parsed.toString();
  } catch {
    return raw;
  }
}

function resolveSupportItems(cardConfig: Record<string, CardConfigItem[] | undefined>) {
  const priorityKeys = ['contact', 'partner', 'top', 'middle', 'bottom'];
  const items: CardConfigItem[] = [];
  const pushItems = (list?: CardConfigItem[]) => {
    if (!Array.isArray(list)) return;
    list.forEach((item) => {
      if (item && item.content) {
        items.push(item);
      }
    });
  };

  priorityKeys.forEach((key) => pushItems(cardConfig[key]));

  Object.entries(cardConfig).forEach(([key, list]) => {
    if (priorityKeys.includes(key) || key === 'download_notice') return;
    pushItems(list);
  });

  const deduped: CardConfigItem[] = [];
  const seen = new Set<string>();
  items.forEach((item) => {
    const key = `${item._id}-${item.content?.title || ''}-${item.content?.link || ''}`;
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(item);
  });
  return deduped.slice(0, 6);
}

function ViewSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[420px] w-full rounded-[2rem]" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <Skeleton className="h-[680px] rounded-[2rem]" />
        <Skeleton className="h-[680px] rounded-[2rem]" />
      </div>
    </div>
  );
}

export default function GameDetailView({ id, initialGameData, initialRecommendedGames }: GameDetailViewProps) {
  const { token, user } = useAuth();
  const { toast } = useToast();

  const [gameData, setGameData] = useState<GameDetailData | null | undefined>(initialGameData);
  const [recommendedGames, setRecommendedGames] = useState<ApiRecommendedGame[]>(
    (initialRecommendedGames || []).slice(0, MAX_RECOMMENDED_GAMES),
  );
  const [relatedPosts, setRelatedPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(!initialGameData);
  const [hasError, setHasError] = useState(false);
  const [isSubmittingUrge, setIsSubmittingUrge] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [sort, setSort] = useState<'latest' | 'hot'>('latest');
  const [isFavorite, setIsFavorite] = useState(false);

  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewOffset, setPreviewOffset] = useState({ x: 0, y: 0 });
  const [isPreviewImageError, setIsPreviewImageError] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const dragStateRef = useRef<DragState>({
    dragging: false,
    startX: 0,
    startY: 0,
    baseX: 0,
    baseY: 0,
  });

  const game = gameData?.app;
  const resources = gameData?.resources || [];
  const cardConfig = (gameData?.cardConfig || {}) as Record<string, CardConfigItem[] | undefined>;
  const supportItems = useMemo(() => resolveSupportItems(cardConfig), [cardConfig]);
  const downloadNotices = (cardConfig.download_notice || []) as CardConfigItem[];

  const tags = useMemo(() => {
    const list = (game?.tags || []).filter(Boolean);
    if (list.length > 0) return list.slice(0, 8);
    return ['人气推荐', '角色扮演', '二次元', '回合制'];
  }, [game?.tags]);

  const screenshots = useMemo(() => {
    const list = (game?.detail_images || []).filter(Boolean);
    if (list.length > 0) return list;
    return [game?.header_image, game?.icon].filter(Boolean) as string[];
  }, [game?.detail_images, game?.header_image, game?.icon]);
  const previewScreenshots = useMemo(() => {
    const normalized = screenshots
      .map((value) => normalizePreviewUrl(value))
      .filter(Boolean);
    if (normalized.length > 0) return normalized;
    return screenshots;
  }, [screenshots]);

  const heroImage = game?.header_image || screenshots[0] || game?.icon || '';
  const rawGameDescription = String(game?.description || game?.summary || '');
  const gameDescription = cleanText(rawGameDescription);
  const shortDescription =
    gameDescription.length > 260
      ? `${gameDescription.slice(0, 260).replace(/\s+\S*$/, '')}...`
      : gameDescription;
  const fullDescriptionHtml = formatDescriptionHtml(rawGameDescription);
  const shortDescriptionHtml = formatDescriptionHtml(shortDescription);

  const recommendationList = useMemo(() => {
    if (recommendedGames.length > 0) return recommendedGames;
    if (!game) return [];
    return [
      {
        _id: game._id,
        name: `${game.name} 同类推荐`,
        pkg: game.pkg,
        summary: game.summary || '',
        star: Number(game.star || 0),
        icon: game.icon,
        match_score: 100,
        tags: [{ id: 'fallback', name: tags[0] || '游戏' }],
      },
    ] as ApiRecommendedGame[];
  }, [recommendedGames, game, tags]);

  const previewUrl = previewIndex !== null ? previewScreenshots[previewIndex] : '';
  const canPreviewNavigate = previewScreenshots.length > 1;

  useEffect(() => {
    let cancelled = false;

    async function loadDetails() {
      if (initialGameData && (initialGameData.app.pkg === id || String(initialGameData.app._id) === id)) {
        setGameData(initialGameData);
        setRecommendedGames((initialRecommendedGames || []).slice(0, MAX_RECOMMENDED_GAMES));
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setHasError(false);

      try {
        const detailRes = await trackedApiFetch(buildGameDetailsUrl(id), { cache: 'no-store' });
        if (!detailRes.ok) throw new Error('details-request-failed');

        const detailJson = await detailRes.json();
        if (detailJson?.code !== 0 || !detailJson?.data) throw new Error('details-invalid-response');

        if (cancelled) return;
        setGameData(detailJson.data as GameDetailData);

        const pkg = String(detailJson.data?.app?.pkg || '').trim();
        if (pkg) {
          const recRes = await trackedApiFetch(`/game/recommendedApp?param=${encodeURIComponent(pkg)}`, {
            cache: 'no-store',
          });
          if (recRes.ok) {
            const recJson = await recRes.json();
            if (recJson?.code === 0 && Array.isArray(recJson?.data)) {
              setRecommendedGames(recJson.data.slice(0, MAX_RECOMMENDED_GAMES));
            }
          }
        }
      } catch {
        if (!cancelled) setHasError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadDetails();
    return () => {
      cancelled = true;
    };
  }, [id, initialGameData, initialRecommendedGames]);

  useEffect(() => {
    let cancelled = false;

    async function loadRelatedPosts() {
      if (!game) return;
      const list = await getCommunityPostsByGame({
        sort,
        pageSize: 20,
        appId: game._id,
        pkg: game.pkg,
        gameName: game.name,
      }).catch(() => []);

      if (!cancelled) {
        setRelatedPosts(list);
      }
    }

    void loadRelatedPosts();
    return () => {
      cancelled = true;
    };
  }, [sort, game?._id, game?.pkg, game?.name]);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (previewIndex === null) return;
    setPreviewZoom(1);
    setPreviewOffset({ x: 0, y: 0 });
    setIsPreviewImageError(false);
  }, [previewIndex]);

  useEffect(() => {
    document.body.style.overflow = previewIndex !== null ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [previewIndex]);

  useEffect(() => {
    if (previewIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewIndex(null);
      if (!canPreviewNavigate) return;
      if (event.key === 'ArrowLeft') {
        setPreviewIndex((current) => (current === null ? null : (current - 1 + previewScreenshots.length) % previewScreenshots.length));
      }
      if (event.key === 'ArrowRight') {
        setPreviewIndex((current) => (current === null ? null : (current + 1) % previewScreenshots.length));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [previewIndex, previewScreenshots.length, canPreviewNavigate]);

  const handleShare = useCallback(async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${game?.name || '游戏详情'} - ACBOX`,
          url: shareUrl,
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: '复制成功', description: '链接已复制。' });
      }
    } catch {
      // ignore user-cancel/share errors
    }
  }, [game?.name, toast]);

  const handleFavoriteToggle = useCallback(() => {
    const next = !isFavorite;
    setIsFavorite(next);
    toast({
      title: next ? '已加入收藏' : '已取消收藏',
      description: next ? '你可以在收藏列表中快速找到该游戏。' : '该游戏已从收藏中移除。',
    });
  }, [isFavorite, toast]);

  const handleBack = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = '/app';
  }, []);

  const handleUrge = useCallback(async () => {
    if (!game || isSubmittingUrge) return;

    setIsSubmittingUrge(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      await trackedApiFetch('/feedbacks', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type: 'missing',
          title: '求添加资源反馈',
          description: `缺少资源：${game.name}\n游戏包名：${game.pkg || '未提供'}\n当前版本：${game.version || '未提供'}\n提交用户：${user?.name || user?.username || '游客'}`,
        }),
      });

      toast({ title: '催更已提交', description: '工单已提交，请等待处理。' });
    } catch {
      toast({ title: '提交失败', description: '请稍后重试。', variant: 'destructive' });
    } finally {
      setIsSubmittingUrge(false);
    }
  }, [game, isSubmittingUrge, token, user?.name, user?.username, toast]);

  const setZoom = useCallback((value: number) => {
    const clamped = Math.min(3, Math.max(1, Number(value.toFixed(2))));
    setPreviewZoom(clamped);
    if (clamped <= 1) setPreviewOffset({ x: 0, y: 0 });
  }, []);

  const handlePreviewWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      const next = previewZoom + (event.deltaY < 0 ? 0.2 : -0.2);
      setZoom(next);
    },
    [previewZoom, setZoom],
  );

  const handlePreviewPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (previewZoom <= 1) return;
      dragStateRef.current = {
        dragging: true,
        startX: event.clientX,
        startY: event.clientY,
        baseX: previewOffset.x,
        baseY: previewOffset.y,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [previewZoom, previewOffset.x, previewOffset.y],
  );

  const handlePreviewPointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const state = dragStateRef.current;
    if (!state.dragging) return;
    setPreviewOffset({
      x: state.baseX + (event.clientX - state.startX),
      y: state.baseY + (event.clientY - state.startY),
    });
  }, []);

  const handlePreviewPointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.dragging) return;
    dragStateRef.current.dragging = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const closePreview = useCallback(() => setPreviewIndex(null), []);
  const handlePreviewBlankClick = useCallback(() => {
    if (previewZoom > 1) {
      setZoom(1);
      setPreviewOffset({ x: 0, y: 0 });
      return;
    }
    closePreview();
  }, [closePreview, previewZoom, setZoom]);

  const toPrevPreview = useCallback(() => {
    if (!canPreviewNavigate) return;
    setPreviewIndex((current) => (current === null ? null : (current - 1 + previewScreenshots.length) % previewScreenshots.length));
    setIsPreviewImageError(false);
  }, [canPreviewNavigate, previewScreenshots.length]);

  const toNextPreview = useCallback(() => {
    if (!canPreviewNavigate) return;
    setPreviewIndex((current) => (current === null ? null : (current + 1) % previewScreenshots.length));
    setIsPreviewImageError(false);
  }, [canPreviewNavigate, previewScreenshots.length]);

  if (isLoading) return <ViewSkeleton />;

  if (hasError || !gameData || !game) {
    return (
      <div className="rounded-2xl border border-[#abadae]/30 bg-white p-8 text-center text-sm text-[#595c5d]">
        游戏详情加载失败，请刷新重试。
      </div>
    );
  }

  const detailAnnouncements =
    (gameData as { Announcements?: unknown; announcements?: unknown }).Announcements ??
    (gameData as { announcements?: unknown }).announcements;
  const hasDetailAnnouncements =
    Array.isArray(detailAnnouncements)
      ? detailAnnouncements.length > 0
      : Boolean(
          detailAnnouncements &&
            typeof detailAnnouncements === 'object' &&
            Object.values(detailAnnouncements as Record<string, unknown>).some(
              (group) => Array.isArray(group) && group.length > 0,
            ),
        );

  return (
    <div className="game-detail-stitch relative min-h-screen overflow-x-hidden bg-[#f5f6f7] text-[#2c2f30] dark:bg-[#080d14] dark:text-[#f3f6fb]">
      <h1 className="sr-only">{game.name}</h1>
      {hasDetailAnnouncements && (
        <div className="relative z-20 px-4 pt-20 sm:px-6 lg:px-16 lg:pt-6 2xl:px-20">
          <div className="mx-auto max-w-7xl">
            <GameAnnouncements announcements={detailAnnouncements as any} position="game_detail" />
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute left-0 top-0 z-0 hidden h-[870px] w-full lg:block">
        {heroImage ? (
          <Image src={heroImage} alt={`${game.name} 背景图`} fill priority className="object-cover object-center" sizes="100vw" />
        ) : (
          <div className="h-full w-full bg-[#e6e8ea] dark:bg-[#121924]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#f5f6f7]/82 to-[#f5f6f7] dark:from-[#05070c]/28 dark:via-[#080d14]/86 dark:to-[#080d14]" />
      </div>

      <div className="fixed bottom-8 right-8 z-[60] hidden flex-col gap-3 lg:flex">
        <Button
          size="icon"
          variant="outline"
          className="h-12 w-12 rounded-full border-[#abadae]/30 bg-white/80 shadow-xl backdrop-blur-md transition-transform hover:scale-110 dark:border-border/50 dark:bg-card/90"
          onClick={handleShare}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className={cn(
            'h-12 w-12 rounded-full border-[#abadae]/30 bg-white/80 shadow-xl backdrop-blur-md transition-transform hover:scale-110 dark:border-border/50 dark:bg-card/90',
            isFavorite && 'border-[#b71211]/30 text-[#b71211]',
          )}
          onClick={handleFavoriteToggle}
        >
          <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} />
        </Button>
      </div>

      <div className="relative z-10 hidden px-4 pb-20 sm:px-6 lg:block lg:px-16 2xl:px-20">
        <div className="mx-auto max-w-7xl">
          <section
            className={cn(
              'mb-8',
              hasDetailAnnouncements ? 'pt-[136px]' : 'pt-[208px]',
            )}
          >
            <div className="flex items-end gap-10">
              <div className="h-36 w-36 shrink-0 overflow-hidden rounded-2xl shadow-2xl xl:h-40 xl:w-40">
                {game.icon ? (
                  <Image src={game.icon} alt={`${game.name} icon`} width={160} height={160} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-[#dadddf]" />
                )}
              </div>

              <div className="flex min-w-0 flex-1 items-end justify-between gap-8 pb-4">
                <div className="min-w-0 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    {tags.slice(0, 4).map((tag, index) => (
                      <Badge
                        key={`${tag}-${index}`}
                        className={cn(
                          'rounded-full border-none px-4 py-1.5 text-sm font-bold',
                          index === 0 && 'bg-[#fdc003] text-[#604700]',
                          index === 1 && 'bg-[#b3d4ff] text-[#004a7e]',
                          index === 2 && 'bg-[#ff7767] text-[#4f0001]',
                          index > 2 && 'bg-[#c8e6c9] text-[#2e7d32]',
                        )}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <h2 className="line-clamp-2 text-3xl font-black leading-tight tracking-tight text-white [text-shadow:0_10px_28px_rgba(0,0,0,0.55)] xl:text-5xl">
                    {game.name}
                  </h2>

                  <div className="flex flex-wrap gap-5 text-sm text-white/90 [text-shadow:0_3px_10px_rgba(0,0,0,0.45)]">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-4 w-4 text-[#005e9f]" />
                      开发者：{game.developer || '未知'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-4 w-4 fill-[#fdc003] text-[#fdc003]" />
                      评分：{normalizeScore(game.star)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Download className="h-4 w-4 text-[#005e9f]" />
                      {game.download_count_show || '50W+'} 下载
                    </span>
                  </div>
                </div>

                <div className="w-56">
                  <GameDownloadDialog
                    appId={game._id}
                    pkg={game.pkg}
                    resources={resources}
                    downloadNotices={downloadNotices}
                    triggerClassName="stitch-primary-btn h-12 w-full rounded-full border-none text-base font-bold text-white"
                    triggerLabel="立即下载"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="mb-10 rounded-[2rem] border border-[#abadae]/10 bg-[#eff1f2]/60 p-6 backdrop-blur-sm dark:border-border/45 dark:bg-card/50">
            <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-[#595c5d]">发布日期</p>
                <p className="text-lg font-bold">{formatDateText(game.release_at)}</p>
              </div>

              <div className="space-y-1 border-l border-[#abadae]/20 pl-8 dark:border-border/45">
                <p className="text-xs font-bold uppercase tracking-wider text-[#595c5d]">更新日期</p>
                <p className="text-lg font-bold">{formatDateText(game.latest_at)}</p>
              </div>

              <div className="space-y-1 border-l border-[#abadae]/20 pl-8 dark:border-border/45">
                <p className="text-xs font-bold uppercase tracking-wider text-[#595c5d]">文件大小</p>
                <p className="text-lg font-bold">{formatBytes(game.file_size)}</p>
              </div>

              <div className="flex items-center justify-between border-l border-[#abadae]/20 pl-8 dark:border-border/45">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#595c5d]">当前版本</p>
                  <p className="text-lg font-bold">{game.version || '未知'}</p>
                </div>
                <Button
                  type="button"
                  onClick={handleUrge}
                  disabled={isSubmittingUrge}
                  className="flex items-center gap-2 rounded-full border border-[#b71211] bg-transparent px-4 py-2 text-sm font-bold text-[#b71211] transition-colors hover:bg-[#b71211]/5 dark:border-primary dark:text-primary dark:hover:bg-primary/10"
                >
                  <BellRing className="h-4 w-4" />
                  {isSubmittingUrge ? '提交中...' : '催更'}
                </Button>
              </div>
            </div>
          </section>

          <section className="mb-14 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card className="rounded-[2rem] border-[#abadae]/10 bg-white/70 dark:border-border/45 dark:bg-card/70">
              <CardContent className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                <p className="text-sm text-[#595c5d]">综合评分</p>
                <p className="text-xl font-black">{normalizeScore(game.star)}</p>
              </CardContent>
            </Card>
            <Card className="rounded-[2rem] border-[#abadae]/10 bg-white/70 dark:border-border/45 dark:bg-card/70">
              <CardContent className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                <p className="text-sm text-[#595c5d]">游戏分类</p>
                <p className="text-xl font-black">{tags[0] || game.type || 'RPG'}</p>
              </CardContent>
            </Card>
            <Card className="rounded-[2rem] border-[#abadae]/10 bg-white/70 dark:border-border/45 dark:bg-card/70">
              <CardContent className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                <p className="text-sm text-[#595c5d]">下载总量</p>
                <p className="text-xl font-black">{game.download_count_show || '0'}</p>
              </CardContent>
            </Card>
            <Card className="rounded-[2rem] border-[#abadae]/10 bg-white/70 dark:border-border/45 dark:bg-card/70">
              <CardContent className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                <p className="text-sm text-[#595c5d]">适配系统</p>
                <p className="text-xl font-black">{game.metadata?.region || 'Android'}</p>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)]">
            <div className="space-y-12">
              <section>
                <h2 className="mb-6 flex items-center gap-3 text-xl font-bold">
                  <span className="h-8 w-2 rounded-full bg-[#b71211]" />
                  游戏介绍
                </h2>
                <div
                  className="text-base leading-relaxed text-[#595c5d] [&_p]:mb-3 [&_p:last-child]:mb-0"
                  dangerouslySetInnerHTML={{
                    __html: showFullDescription
                      ? fullDescriptionHtml || '暂无介绍'
                      : shortDescriptionHtml || '暂无介绍',
                  }}
                />

                <div className="mt-8">
                  <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-[#595c5d]">游戏标签</h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, idx) => (
                      <span
                        key={`${tag}-${idx}`}
                        className="rounded-full border border-[#abadae]/30 bg-white/75 px-5 py-2 text-sm font-bold text-[#2c2f30] dark:border-border/50 dark:bg-card/75 dark:text-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {gameDescription.length > shortDescription.length && (
                  <button
                    type="button"
                    className="mt-8 inline-flex items-center gap-1 text-sm font-bold text-[#005e9f] hover:underline"
                    onClick={() => setShowFullDescription((value) => !value)}
                  >
                    {showFullDescription ? '收起详情' : '查看更多详情'}
                    <ChevronRight className={cn('h-4 w-4 transition-transform', showFullDescription && 'rotate-90')} />
                  </button>
                )}
              </section>

              <section>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="flex items-center gap-3 text-xl font-bold">
                    <span className="h-8 w-2 rounded-full bg-[#fdc003]" />
                    精彩截图
                  </h2>
                  <span className="text-sm font-bold text-[#005e9f]">点击查看大图</span>
                </div>
                <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-6">
                  {previewScreenshots.map((url, index) => (
                    <button
                      type="button"
                      key={`${url}-${index}`}
                      className="group relative aspect-[16/9] min-w-[360px] overflow-hidden rounded-[1.5rem] bg-white/60 dark:bg-card/60"
                      onClick={() => setPreviewIndex(index)}
                    >
                      <Image
                        src={url}
                        alt={`${game.name} 截图 ${index + 1}`}
                        fill
                        sizes="420px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </button>
                  ))}
                </div>
              </section>

              <section className="pb-8">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-3 text-xl font-bold">
                    <span className="h-8 w-2 rounded-full bg-[#005e9f]" />
                    社区动态
                  </h2>
                  <Link href="/community" className="inline-flex items-center gap-2 text-sm font-medium text-[#595c5d] transition-colors hover:text-[#b71211]">
                    发现更多精彩
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="mb-8 flex items-center justify-between">
                  <h3 className="inline-flex items-center gap-2 text-lg font-bold text-[#2c2f30]">
                    <MessageSquare className="h-5 w-5 text-[#005e9f]" />
                    社区热议
                  </h3>
                  <div className="inline-flex rounded-full bg-white/80 p-1">
                    <button
                      type="button"
                      className={cn(
                        'rounded-full px-4 py-2 text-sm font-bold transition-colors',
                        sort === 'latest' ? 'bg-[#b71211] text-white' : 'text-[#595c5d]',
                      )}
                      onClick={() => setSort('latest')}
                    >
                      最新
                    </button>
                    <button
                      type="button"
                      className={cn(
                        'rounded-full px-4 py-2 text-sm font-bold transition-colors',
                        sort === 'hot' ? 'bg-[#b71211] text-white' : 'text-[#595c5d]',
                      )}
                      onClick={() => setSort('hot')}
                    >
                      热门
                    </button>
                  </div>
                </div>

                <div className="grid max-w-3xl grid-cols-1 gap-6">
                  {relatedPosts.length > 0 ? (
                    relatedPosts.slice(0, 6).map((post) => {
                      const cover = extractPostImage(post);
                      return (
                        <Card key={post.id} className="overflow-hidden rounded-2xl border border-[#abadae]/15 bg-white shadow-sm transition-shadow hover:shadow-md">
                          <CardContent className="p-5">
                            <div className="mb-4 flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={post.user.avatarUrl} alt={post.user.name} />
                                <AvatarFallback>{post.user.name.slice(0, 1)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold">{post.user.name}</p>
                                <p className="text-xs text-[#595c5d]">{post.timestamp}</p>
                              </div>
                            </div>

                            <p className="line-clamp-3 text-sm leading-relaxed text-[#2c2f30]">{getPostPreviewText(post, 180, '暂无内容')}</p>

                            {cover && (
                              <div className="relative mt-4 aspect-[16/9] overflow-hidden rounded-xl">
                                <Image src={cover} alt={post.title || post.summary || '社区帖子配图'} fill sizes="(min-width: 1024px) 620px, 100vw" className="object-cover" />
                              </div>
                            )}

                            <div className="mt-5 flex items-center gap-6 text-xs text-[#595c5d]">
                              <span className="inline-flex items-center gap-1.5">
                                <ThumbsUp className="h-4 w-4" />
                                {formatCompactCount(post.likesCount)}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <MessageSquare className="h-4 w-4" />
                                {formatCompactCount(post.commentsCount)}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <Users className="h-4 w-4" />
                                {formatCompactCount(post.viewsCount)}
                              </span>
                              <Link href={safeHref(post.id ? `/community/post/${post.id}` : '/community')} className="ml-auto text-sm font-bold text-[#005e9f] hover:underline">
                                查看详情
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <Card className="rounded-[2rem] border-[#abadae]/10 bg-white/85">
                      <CardContent className="p-6 text-sm text-[#595c5d]">暂无关联社区动态。</CardContent>
                    </Card>
                  )}
                </div>
              </section>
            </div>

            <aside className="space-y-10">
              <section className="rounded-[2rem] border border-[#abadae]/10 bg-[#dadddf]/20 p-8">
                <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
                  <LinkIcon className="h-6 w-6 text-[#b71211]" />
                  资源与支持
                </h2>

                <div className="space-y-4">
                  {supportItems.length > 0 ? (
                    supportItems.map((item) => {
                      const title = cleanText(item.content?.title) || '资源链接';
                      const text = cleanText(item.content?.text || item.content?.html) || '点击查看';
                      const href = String(item.content?.link || '').trim();
                      const isExternal = /^https?:\/\//i.test(href);
                      return (
                        <div key={item._id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-[#2c2f30]">{title}</p>
                            <p className="truncate text-xs text-[#595c5d]">{text}</p>
                          </div>
                          {href ? (
                            <a
                              href={href}
                              target={isExternal ? '_blank' : undefined}
                              rel={isExternal ? 'noopener noreferrer' : undefined}
                              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#005e9f] px-4 py-1.5 text-xs font-bold text-white"
                            >
                              打开
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <span className="text-xs text-[#757778]">无链接</span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl bg-white p-4 text-sm text-[#595c5d]">暂无资源与支持信息。</div>
                  )}
                </div>
              </section>

              <section className="rounded-[2rem] border border-[#abadae]/10 bg-white p-8">
                <h2 className="mb-6 text-xl font-bold">玩家评论区</h2>
                <div className="space-y-5">
                  {relatedPosts.length > 0 ? (
                    relatedPosts.slice(0, 4).map((post) => (
                      <div key={`comment-${post.id}`} className="space-y-3 border-b border-[#abadae]/15 pb-5 last:border-b-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={post.user.avatarUrl} alt={post.user.name} />
                            <AvatarFallback>{post.user.name.slice(0, 1)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-bold">{post.user.name}</p>
                            <p className="text-xs text-[#595c5d]">{post.timestamp}</p>
                          </div>
                        </div>
                        <p className="line-clamp-2 text-sm text-[#595c5d]">{getPostPreviewText(post, 120, '暂无内容')}</p>
                        <div className="flex items-center gap-5 text-xs text-[#595c5d]">
                          <span className="inline-flex items-center gap-1">
                            <ThumbsUp className="h-3.5 w-3.5" />
                            {formatCompactCount(post.likesCount)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {formatCompactCount(post.commentsCount)}
                          </span>
                          <Link href={safeHref(post.id ? `/community/post/${post.id}` : '/community')} className="ml-auto text-xs font-bold text-[#005e9f] hover:underline">
                            去评论
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[#595c5d]">暂无关联评论内容。</p>
                  )}
                </div>
              </section>

              <section>
                <h2 className="mb-6 text-xl font-bold">相似推荐</h2>
                <div className="space-y-4">
                  {recommendationList.map((item) => {
                    const href = item.pkg || item._id ? `/app/${encodeURIComponent(item.pkg || item._id)}` : '/app';
                    return (
                      <Link
                        key={`rec-${item._id}-${item.pkg}`}
                        href={href}
                        className="flex items-center gap-4 rounded-2xl p-3 transition-colors hover:bg-[#e0e3e4]/70"
                      >
                        <div className="relative h-14 w-14 overflow-hidden rounded-2xl shadow-md">
                          {item.icon ? (
                            <Image src={item.icon} alt={item.name} fill sizes="56px" className="object-cover" />
                          ) : (
                            <div className="h-full w-full bg-[#dadddf]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold">{item.name}</p>
                          <p className="truncate text-xs text-[#595c5d]">{cleanText(item.summary) || '同类热门推荐'}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[#595c5d]" />
                      </Link>
                    );
                  })}
                </div>
              </section>
            </aside>
          </section>
        </div>
      </div>

      <div className="fixed left-0 top-0 z-[70] flex h-16 w-full items-center justify-between bg-white/80 px-4 shadow-sm backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-black/5"
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5 text-[#b71211]" />
          </button>
          <p className="text-xl font-black tracking-tight text-[#2c2f30]">游戏详情</p>
        </div>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-black/5"
          onClick={handleShare}
        >
          <LinkIcon className="h-5 w-5 text-[#b71211]" />
        </button>
      </div>

      <div className="relative z-10 px-4 pb-32 pt-20 lg:hidden">
        <section className="relative h-[340px] overflow-hidden rounded-[2rem]">
          {heroImage ? (
            <Image src={heroImage} alt={`${game.name} 封面图`} fill sizes="100vw" className="object-cover" />
          ) : (
            <div className="h-full w-full bg-[#e6e8ea] dark:bg-[#121924]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#f5f6f7] via-transparent to-black/20 dark:from-[#080d14] dark:via-[#080d14]/30 dark:to-black/35" />
        </section>

        <section className="relative z-10 -mt-16 rounded-[2rem] border border-[#abadae]/10 bg-white p-6 shadow-sm dark:border-border/40 dark:bg-[#111824]">
          <div className="flex gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl shadow-lg">
              {game.icon ? (
                <Image src={game.icon} alt={`${game.name} icon`} fill sizes="80px" className="object-cover" />
              ) : (
                <div className="h-full w-full bg-[#dadddf]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="line-clamp-2 text-2xl font-black leading-tight text-[#0f1720] dark:text-[#f4f7fc]">{game.name}</h2>
              <div className="mt-1 inline-flex items-center gap-1 text-[#b71211]">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-base font-bold">{normalizeScore(game.star)}</span>
              </div>
              <p className="mt-2 text-xs text-[#757778] dark:text-[#9ca6b8]">
                {game.download_count_show || '0'} 下载 · {formatBytes(game.file_size)}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-full bg-[#eff1f2] p-3 dark:bg-[#1a2433]">
            <div className="ml-2 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#757778] dark:text-[#9ca6b8]">当前版本</span>
              <span className="text-sm font-bold text-[#1a1f26] dark:text-[#edf2fb]">v {game.version || '未知'}</span>
            </div>
            <Button
              type="button"
              onClick={handleUrge}
              disabled={isSubmittingUrge}
              className="rounded-full bg-[#b3d4ff] px-4 py-2 text-sm font-bold text-[#004a7e] hover:opacity-90"
            >
              <BellRing className="mr-1 h-4 w-4" />
              催更
            </Button>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-4 gap-2">
          <Card className="border-[#abadae]/10 bg-white">
            <CardContent className="p-2 text-center">
              <p className="text-[9px] font-bold uppercase tracking-tight text-[#757778]">更新时间</p>
              <p className="mt-0.5 truncate text-[11px] font-black">{formatDateText(game.latest_at).slice(0, 7)}</p>
            </CardContent>
          </Card>
          <Card className="border-[#abadae]/10 bg-white">
            <CardContent className="p-2 text-center">
              <p className="text-[9px] font-bold uppercase tracking-tight text-[#757778]">游戏类型</p>
              <p className="mt-0.5 truncate text-[11px] font-black text-[#005e9f]">{tags[0] || 'RPG'}</p>
            </CardContent>
          </Card>
          <Card className="border-[#abadae]/10 bg-white">
            <CardContent className="p-2 text-center">
              <p className="text-[9px] font-bold uppercase tracking-tight text-[#757778]">下载总量</p>
              <p className="mt-0.5 truncate text-[11px] font-black">{game.download_count_show || '0'}</p>
            </CardContent>
          </Card>
          <Card className="border-[#abadae]/10 bg-white">
            <CardContent className="p-2 text-center">
              <p className="text-[9px] font-bold uppercase tracking-tight text-[#757778]">操作系统</p>
              <p className="mt-0.5 truncate text-[11px] font-black">安卓</p>
            </CardContent>
          </Card>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-black">
            <span className="h-6 w-1.5 rounded-full bg-[#b71211]" />
            游戏介绍
          </h2>
          <div
            className="text-sm leading-relaxed text-[#595c5d] [&_p]:mb-2.5 [&_p:last-child]:mb-0"
            dangerouslySetInnerHTML={{
              __html: showFullDescription
                ? fullDescriptionHtml || '暂无介绍'
                : shortDescriptionHtml || '暂无介绍',
            }}
          />
          {gameDescription.length > shortDescription.length && (
            <button
              type="button"
              className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#b71211]"
              onClick={() => setShowFullDescription((value) => !value)}
            >
              {showFullDescription ? '收起' : '展开更多'}
              <ChevronRight className={cn('h-4 w-4 transition-transform', showFullDescription && 'rotate-90')} />
            </button>
          )}
        </section>

        <section className="mt-10">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-black">
            <span className="h-6 w-1.5 rounded-full bg-[#005e9f]" />
            精彩截图
          </h2>
          <div className="scrollbar-hide flex snap-x gap-4 overflow-x-auto">
            {previewScreenshots.map((url, index) => (
              <button
                type="button"
                key={`mobile-shot-${url}-${index}`}
                className="relative h-44 w-80 shrink-0 snap-center overflow-hidden rounded-2xl bg-[#dadddf]"
                onClick={() => setPreviewIndex(index)}
              >
                <Image src={url} alt={`${game.name} 截图 ${index + 1}`} fill sizes="320px" className="object-cover" />
              </button>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-black">
              <span className="h-6 w-1.5 rounded-full bg-[#fdc003]" />
              社区动态
            </h2>
            <div className="inline-flex rounded-full bg-white p-1">
              <button
                type="button"
                className={cn('rounded-full px-3 py-1 text-xs font-bold', sort === 'latest' ? 'bg-[#b71211] text-white' : 'text-[#595c5d]')}
                onClick={() => setSort('latest')}
              >
                最新
              </button>
              <button
                type="button"
                className={cn('rounded-full px-3 py-1 text-xs font-bold', sort === 'hot' ? 'bg-[#b71211] text-white' : 'text-[#595c5d]')}
                onClick={() => setSort('hot')}
              >
                热门
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {relatedPosts.length > 0 ? (
              relatedPosts.slice(0, 3).map((post) => {
                const cover = extractPostImage(post);
                return (
                  <Card key={`mobile-post-${post.id}`} className="border-[#abadae]/10 bg-white">
                    <CardContent className="p-4">
                      <div className="mb-3 flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={post.user.avatarUrl} alt={post.user.name} />
                          <AvatarFallback>{post.user.name.slice(0, 1)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">{post.user.name}</p>
                          <p className="text-[10px] text-[#757778]">{post.timestamp}</p>
                        </div>
                      </div>
                      <p className="line-clamp-3 text-sm leading-relaxed text-[#595c5d]">{getPostPreviewText(post, 150, '暂无内容')}</p>
                      {cover && (
                        <div className="relative mt-3 aspect-[16/9] overflow-hidden rounded-xl">
                          <Image src={cover} alt={post.title || post.summary || '帖子配图'} fill sizes="100vw" className="object-cover" />
                        </div>
                      )}
                      <div className="mt-3 flex items-center gap-5 text-xs text-[#595c5d]">
                        <span className="inline-flex items-center gap-1">
                          <ThumbsUp className="h-3.5 w-3.5" />
                          {formatCompactCount(post.likesCount)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {formatCompactCount(post.commentsCount)}
                        </span>
                        <Link href={safeHref(post.id ? `/community/post/${post.id}` : '/community')} className="ml-auto text-xs font-bold text-[#005e9f]">
                          查看
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card className="border-[#abadae]/10 bg-white">
                <CardContent className="p-4 text-sm text-[#595c5d]">暂无社区动态。</CardContent>
              </Card>
            )}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-xl font-black">资源与支持</h2>
          <div className="space-y-2">
            {supportItems.length > 0 ? (
              supportItems.slice(0, 4).map((item) => {
                const title = cleanText(item.content?.title) || '资源链接';
                const href = String(item.content?.link || '').trim();
                return (
                  <div key={`mobile-support-${item._id}`} className="flex items-center justify-between rounded-2xl bg-white p-4">
                    <p className="truncate text-sm font-bold">{title}</p>
                    {href ? (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[#005e9f]">
                        打开
                      </a>
                    ) : (
                      <span className="text-xs text-[#757778]">无链接</span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl bg-white p-4 text-sm text-[#595c5d]">暂无资源支持。</div>
            )}
          </div>
        </section>
      </div>

      <div
        className="fixed inset-x-0 z-50 rounded-t-2xl bg-white/90 px-4 pt-3 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] backdrop-blur-2xl lg:hidden"
        style={{
          bottom: 'max(env(safe-area-inset-bottom), 0px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)',
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/community"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#595c5d] transition-colors hover:bg-black/5 hover:text-[#b71211]"
          >
            <MessageSquare className="h-5 w-5" />
          </Link>
          <button
            type="button"
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#595c5d] transition-colors hover:bg-black/5',
              isFavorite && 'text-[#b71211]',
            )}
            onClick={handleFavoriteToggle}
          >
            <Heart className={cn('h-5 w-5', isFavorite && 'fill-current')} />
          </button>
          <GameDownloadDialog
            appId={game._id}
            pkg={game.pkg}
            resources={resources}
            downloadNotices={downloadNotices}
            triggerClassName="stitch-primary-btn h-12 w-full rounded-full border-none text-sm font-bold text-white"
            triggerLabel="立即下载"
          />
        </div>
      </div>

      {isMounted && previewIndex !== null && previewUrl
        ? createPortal(
            <div className="fixed inset-0 z-[10000] bg-black/92 backdrop-blur-sm">
              <div className="absolute right-4 top-4 z-[130] flex items-center gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-10 w-10 rounded-full bg-white/15 text-white hover:bg-white/25"
                  onClick={(event) => {
                    event.stopPropagation();
                    setZoom(previewZoom - 0.2);
                  }}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-10 w-10 rounded-full bg-white/15 text-white hover:bg-white/25"
                  onClick={(event) => {
                    event.stopPropagation();
                    setZoom(previewZoom + 0.2);
                  }}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-10 w-10 rounded-full bg-white/15 text-white hover:bg-white/25"
                  onClick={(event) => {
                    event.stopPropagation();
                    setZoom(1);
                    setPreviewOffset({ x: 0, y: 0 });
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-10 w-10 rounded-full bg-white/15 text-white hover:bg-white/25"
                  onClick={(event) => {
                    event.stopPropagation();
                    closePreview();
                  }}
                >
                  <CloseIcon className="h-4 w-4" />
                </Button>
              </div>

              {canPreviewNavigate && (
                <>
                  <button
                    type="button"
                    className="absolute left-3 top-1/2 z-[130] hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 sm:flex"
                    onClick={(event) => {
                      event.stopPropagation();
                      toPrevPreview();
                    }}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 z-[130] hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 sm:flex"
                    onClick={(event) => {
                      event.stopPropagation();
                      toNextPreview();
                    }}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              <div
                className={cn('absolute inset-0 flex items-center justify-center p-6', previewZoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in')}
                onClick={handlePreviewBlankClick}
                onWheel={handlePreviewWheel}
                onPointerDown={handlePreviewPointerDown}
                onPointerMove={handlePreviewPointerMove}
                onPointerUp={handlePreviewPointerUp}
                onPointerCancel={handlePreviewPointerUp}
              >
                <div
                  className="relative max-h-[92vh] max-w-[92vw]"
                  onClick={(event) => event.stopPropagation()}
                  style={{
                    transform: `translate3d(${previewOffset.x}px, ${previewOffset.y}px, 0) scale(${previewZoom})`,
                    transformOrigin: 'center center',
                    transition: dragStateRef.current.dragging ? 'none' : 'transform 0.15s ease-out',
                  }}
                >
                  <img
                    src={previewUrl}
                    alt={`${game.name} 截图预览`}
                    draggable={false}
                    className="max-h-[92vh] w-auto max-w-[92vw] rounded-xl object-contain"
                    onError={() => setIsPreviewImageError(true)}
                  />
                </div>
                {isPreviewImageError && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                    <div className="rounded-md bg-black/55 px-3 py-2 text-sm text-white">
                      图片加载失败，请切换下一张或稍后重试
                    </div>
                  </div>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
