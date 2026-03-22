
'use client';

import type { Game, NewsArticle, GameDetailData, ApiRecommendedGame, CardConfigItem, CommunityPost } from '@/types';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Download, Users, Tag, CalendarDays, Info, HardDrive, Tags as TagsIcon, Megaphone, Newspaper as NewsIcon, Briefcase, MessageSquare, Link as LinkIcon, BellRing, MessageCircle as CommentIcon, MessageSquarePlus, History, ChevronUp, ChevronDown, Camera, X as CloseIcon, ThumbsUp, ExternalLink, RefreshCw, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Loader2, Contact } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import GameDownloadDialog from '@/components/game-download-dialog';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MOCK_NEWS_ARTICLES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { notFound, usePathname } from 'next/navigation';
import Loading from '../loading';
import GameAnnouncements from '@/components/game-announcements';
import { trackedApiFetch } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getCommunityPostsByGame } from '@/lib/community-api';

interface GameDetailViewProps {
  id: string;
  initialGameData?: GameDetailData | null;
  initialRecommendedGames?: ApiRecommendedGame[] | null;
}

const DESCRIPTION_CHAR_LIMIT = 120;
const MAX_NEWS_DISPLAY = 4;
const MAX_RECOMMENDED_GAMES = 5;
const CLIENT_PLATFORM = process.env.NEXT_PUBLIC_CLIENT_PLATFORM || 'android';
const CLIENT_REGION = process.env.NEXT_PUBLIC_CLIENT_REGION || '';
const CLIENT_VERSION = process.env.NEXT_PUBLIC_CLIENT_VERSION || '';

// Helper to format bytes into a human-readable string
const formatBytes = (bytes: number | null, decimals = 2) => {
    if (bytes === null || bytes === 0) return 'N/A';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const buildGameDetailsUrl = (param: string) => {
  const query = new URLSearchParams();
  query.set('param', param);
  if (CLIENT_PLATFORM) query.set('platform', CLIENT_PLATFORM);
  if (CLIENT_REGION) query.set('region', CLIENT_REGION);
  if (CLIENT_VERSION) query.set('client_version', CLIENT_VERSION);
  return `/game/details?${query.toString()}`;
};


export default function GameDetailView({ id, initialGameData, initialRecommendedGames }: GameDetailViewProps) {
  const { token, user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [gameData, setGameData] = useState<GameDetailData | null | undefined>(initialGameData);
  const [recommendedGames, setRecommendedGames] = useState<ApiRecommendedGame[]>(
    (initialRecommendedGames || []).slice(0, MAX_RECOMMENDED_GAMES)
  );
  const [isLoading, setIsLoading] = useState(!initialGameData);
  const pathname = usePathname(); // Get current path to detect navigation
  const [pageError, setPageError] = useState(false);

  useEffect(() => {
    // This effect handles data fetching for client-side navigation.
    // The `id` prop (from the URL) is the trigger.
    
    // On initial server render with data, `initialGameData` is present.
    // We set the state and don't need to fetch.
    if (initialGameData && initialGameData.app.pkg === id) {
      setGameData(initialGameData);
      setRecommendedGames((initialRecommendedGames || []).slice(0, MAX_RECOMMENDED_GAMES));
      setIsLoading(false);
      return;
    }

    // This runs for client-side navigation or if initial data was for a different game.
    async function fetchData(fetchId: string) {
      setIsLoading(true);
      setPageError(false);
      try {
        const gameDetailsRes = await trackedApiFetch(buildGameDetailsUrl(fetchId), {
          cache: 'no-store',
        });
        if (!gameDetailsRes.ok) throw new Error('Failed to fetch game details');
        
        const gameDetailsJson = await gameDetailsRes.json();
        if (gameDetailsJson.code !== 0 || !gameDetailsJson.data) {
          throw new Error('Game not found from API');
        }
        
        const fetchedGameData: GameDetailData = gameDetailsJson.data;
        setGameData(fetchedGameData);

        // Fetch recommended games if package name exists
        if (fetchedGameData.app.pkg) {
            const recommendedGamesRes = await trackedApiFetch(
              `/game/recommendedApp?param=${fetchedGameData.app.pkg}`,
              { cache: 'no-store' },
            );
            if (recommendedGamesRes.ok) {
                const recommendedGamesJson = await recommendedGamesRes.json();
                 if (recommendedGamesJson.code === 0 && recommendedGamesJson.data) {
                    setRecommendedGames(recommendedGamesJson.data.slice(0, MAX_RECOMMENDED_GAMES));
                }
            } else {
               setRecommendedGames([]);
            }
        } else {
            setRecommendedGames([]);
        }

      } catch (error) {
        console.error("Error fetching client-side data:", error);
        setGameData(null); // Set to null to indicate an error
        setPageError(true);
      } finally {
        setIsLoading(false);
      }
    }

    // We fetch if the current page's ID doesn't match the data we have
    if (gameData?.app.pkg !== id) {
       fetchData(id);
    }
  }, [id, initialGameData, initialRecommendedGames, gameData?.app.pkg]); // Re-run only when the page ID changes

  useEffect(() => {
    // SSR initial data path does not call /game/details in browser.
    // Send a lightweight ping so detail view stats are not missed.
    if (!initialGameData || initialGameData.app.pkg !== id) return;
    const appId = String(gameData?.app?._id || '').trim();
    const pkg = String(gameData?.app?.pkg || '').trim();
    const dedupeKey = pkg || appId || id;
    if (!dedupeKey || trackedDetailViewIdRef.current === dedupeKey) return;
    trackedDetailViewIdRef.current = dedupeKey;

    void trackedApiFetch('/game/track/detail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: appId || undefined,
        pkg: pkg || undefined,
        resource_count: Array.isArray(gameData?.resources) ? gameData.resources.length : 0,
        source: 'web_ssr_initial',
      }),
    }).catch(() => undefined);
  }, [id, initialGameData, gameData?.app?._id, gameData?.app?.pkg, gameData?.resources]);


  const { app: game, resources, Announcements, cardConfig } = gameData || {};
  const [showFab, setShowFab] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const commentsSectionRef = useRef<HTMLDivElement>(null);
  const [communitySort, setCommunitySort] = useState<'latest' | 'hot'>('latest');
  const [relatedPosts, setRelatedPosts] = useState<CommunityPost[]>([]);
  const [isCommunityLoading, setIsCommunityLoading] = useState(false);
  const [isCommunityLoaded, setIsCommunityLoaded] = useState(false);
  const [communityReloadKey, setCommunityReloadKey] = useState(0);
  const [likePendingPostId, setLikePendingPostId] = useState<string | null>(null);
  const [likedPostIds, setLikedPostIds] = useState<Record<string, boolean>>({});
  const [postLikeCounts, setPostLikeCounts] = useState<Record<string, number>>({});
  const [isSubmittingUrge, setIsSubmittingUrge] = useState(false);
  
  // Screenshot Preview State
  const [selectedScreenshotIndex, setSelectedScreenshotIndex] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPreviewMounted, setIsPreviewMounted] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);


  const [isFetchingRecommended, setIsFetchingRecommended] = useState(false);
  const trackedDetailViewIdRef = useRef('');

  const fetchRecommendedGames = async () => {
    if (!game?.pkg || isFetchingRecommended) return;
    setIsFetchingRecommended(true);
    try {
      const res = await trackedApiFetch(`/game/recommendedApp?param=${game.pkg}`, { cache: 'no-store' });
      if (res.ok) {
        const jsonResponse = await res.json();
        if (jsonResponse.code === 0 && jsonResponse.data) {
          // Shuffle the new list before setting it
          const shuffled = [...jsonResponse.data].sort(() => 0.5 - Math.random());
          setRecommendedGames(shuffled.slice(0, MAX_RECOMMENDED_GAMES));
        }
      }
    } catch (error) {
      console.error("Error refreshing recommended games:", error);
    } finally {
      setIsFetchingRecommended(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadRelatedPosts() {
      if (!game?._id && !game?.pkg && !game?.name) {
        setRelatedPosts([]);
        setIsCommunityLoaded(true);
        return;
      }

      setIsCommunityLoading(true);
      try {
        const list = await getCommunityPostsByGame({
          sort: communitySort,
          pageSize: 20,
          appId: game?._id,
          pkg: game?.pkg,
          gameName: game?.name,
        });
        if (cancelled) return;

        setRelatedPosts(list);
        setPostLikeCounts((prev) => {
          const next = { ...prev };
          list.forEach((post) => {
            if (typeof next[post.id] !== 'number') next[post.id] = post.likesCount || 0;
          });
          return next;
        });
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load related community posts:', error);
          setRelatedPosts([]);
        }
      } finally {
        if (!cancelled) {
          setIsCommunityLoading(false);
          setIsCommunityLoaded(true);
        }
      }
    }

    loadRelatedPosts();
    return () => {
      cancelled = true;
    };
  }, [communitySort, communityReloadKey, game?._id, game?.pkg, game?.name]);

  const handleRelatedPostLike = async (postId: string) => {
    if (likePendingPostId === postId) return;
    if (!isAuthenticated || !token) {
      toast({
        title: '需要登录',
        description: '请先登录后再点赞社区帖子。',
        variant: 'destructive',
      });
      return;
    }

    const wasLiked = Boolean(likedPostIds[postId]);
    const previousCount = postLikeCounts[postId] ?? 0;
    const nextLiked = !wasLiked;

    setLikedPostIds((prev) => ({ ...prev, [postId]: nextLiked }));
    setPostLikeCounts((prev) => ({
      ...prev,
      [postId]: nextLiked ? previousCount + 1 : Math.max(0, previousCount - 1),
    }));
    setLikePendingPostId(postId);

    try {
      const res = await trackedApiFetch(`/content/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'toggle' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.code !== 0) {
        throw new Error(json?.message || `HTTP ${res.status}`);
      }

      const serverLiked = Boolean(json?.data?.liked);
      const serverCount = Number(json?.data?.like_count);
      setLikedPostIds((prev) => ({ ...prev, [postId]: serverLiked }));
      setPostLikeCounts((prev) => ({
        ...prev,
        [postId]: Number.isFinite(serverCount) ? serverCount : prev[postId] ?? 0,
      }));
    } catch (error) {
      console.error('Failed to like related community post:', error);
      setLikedPostIds((prev) => ({ ...prev, [postId]: wasLiked }));
      setPostLikeCounts((prev) => ({ ...prev, [postId]: previousCount }));
      toast({
        title: '点赞失败',
        description: '请稍后重试。',
        variant: 'destructive',
      });
    } finally {
      setLikePendingPostId((prev) => (prev === postId ? null : prev));
    }
  };
  useEffect(() => {
    const commentsDiv = commentsSectionRef.current;
    if (!commentsDiv) return;

    const handleScroll = () => {
      const commentsDivTop = commentsDiv.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;
      if (commentsDivTop > windowHeight * 0.7 && window.scrollY > 200) {
        setShowFab(true);
      } else {
        setShowFab(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); 

    return () => window.removeEventListener('scroll', handleScroll);
  }, [gameData]); // Depend on gameData to re-attach after loading

  useEffect(() => {
    setIsPreviewMounted(true);
    return () => setIsPreviewMounted(false);
  }, []);

  useEffect(() => {
    if (selectedScreenshotIndex !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [selectedScreenshotIndex]);

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState || event.pointerId !== dragState.pointerId) return;

      event.preventDefault();
      setPosition({
        x: dragState.originX + (event.clientX - dragState.startX),
        y: dragState.originY + (event.clientY - dragState.startY),
      });
    };

    const handlePointerEnd = (event: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState || event.pointerId !== dragState.pointerId) return;
      dragStateRef.current = null;
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerEnd);
    window.addEventListener('pointercancel', handlePointerEnd);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerEnd);
      window.removeEventListener('pointercancel', handlePointerEnd);
    };
  }, [isDragging]);

  useEffect(() => {
    if (selectedScreenshotIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeScreenshotPreview();
        return;
      }

      if (!game?.detail_images || game.detail_images.length <= 1) return;

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setSelectedScreenshotIndex((prev) => {
          if (prev === null) return prev;
          return (prev - 1 + game.detail_images.length) % game.detail_images.length;
        });
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setSelectedScreenshotIndex((prev) => {
          if (prev === null) return prev;
          return (prev + 1) % game.detail_images.length;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedScreenshotIndex, game?.detail_images]);


  const handleFabClick = () => {
    if (commentsSectionRef.current) {
      commentsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleUrgeUpdate = async () => {
    if (!game?.name || isSubmittingUrge) return;

    setIsSubmittingUrge(true);
    try {
      const payload = {
        type: 'missing',
        title: '求添加资源反馈',
        description: [
          `缺少资源：${game.name}`,
          `游戏包名：${game.pkg || '未提供'}`,
          `当前版本：${game.version || '未提供'}`,
          '',
          `提交用户：${user?.name || user?.username || '游客'}`,
          `联系方式：${user?.email || user?.phone || '未提供'}`,
        ].join('\n'),
        user_id: user?._id || '',
        nickname: user?.name || user?.username || '游客',
        contact: user?.email || user?.phone || '',
        clientType: 'Web',
        clientVersion: process.env.NEXT_PUBLIC_CLIENT_VERSION || '',
        osVersion: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        deviceModel: typeof navigator !== 'undefined' ? navigator.platform : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await trackedApiFetch('/feedbacks', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.code !== 0) {
        throw new Error(json?.message || `HTTP ${res.status}`);
      }

      toast({
        title: '催更已提交',
        description: '已按反馈工单提交，请等待处理。',
      });
    } catch (error) {
      toast({
        title: '提交失败',
        description: error instanceof Error ? error.message : '请稍后重试。',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingUrge(false);
    }
  };

  const createLocalExcerpt = (text: string, maxLength: number = 100): string => {
    if (!text) return '';
    const firstParagraph = text.split('\n\n')[0];
    if (firstParagraph.length <= maxLength) return firstParagraph;
    
    let cutPoint = -1;
    const punctuation = ['。', '，', '！', '.', '!', '?'];
    for (const p of punctuation) {
      const point = firstParagraph.lastIndexOf(p, maxLength);
      if (point > cutPoint) {
        cutPoint = point;
      }
    }
  
    if (cutPoint === -1 || cutPoint < maxLength / 3) {
      cutPoint = firstParagraph.lastIndexOf(' ', maxLength);
    }

    if (cutPoint === -1 || cutPoint < maxLength / 3) {
        return firstParagraph.substring(0, maxLength) + '...';
    }
    return firstParagraph.substring(0, cutPoint + 1) + '...';
  };

  const getPostExcerpt = (post: CommunityPost): string => {
    const raw = post.content || post.title || '';
    const normalized = raw
      .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
      .replace(/[`#>*_~\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return createLocalExcerpt(normalized, 120) || '点击查看帖子详情';
  };

  const truncateDescription = (text: string, limit: number): string => {
    if (!text || text.length <= limit) {
      return text;
    }
    let breakPoint = text.substring(0, limit).lastIndexOf('。');
    if (breakPoint === -1 || breakPoint < limit / 2) breakPoint = text.substring(0, limit).lastIndexOf('，');
    if (breakPoint === -1 || breakPoint < limit / 2) breakPoint = text.substring(0, limit).lastIndexOf('！');
    if (breakPoint === -1 || breakPoint < limit / 2) breakPoint = text.substring(0, limit).lastIndexOf(' ');

    if (breakPoint > limit / 2) {
        return text.substring(0, breakPoint + 1) + '...';
    }
    return text.substring(0, limit) + '...';
  };
 
  // Screenshot Preview Handlers
  const openScreenshotPreview = (index: number) => {
    setSelectedScreenshotIndex(index);
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const closeScreenshotPreview = () => {
    setIsDragging(false);
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
    setSelectedScreenshotIndex(null);
  };
  
  const handleZoom = (newZoomLevel: number) => {
    const clampedZoom = Math.max(0.2, Math.min(newZoomLevel, 3));
    setZoomLevel(clampedZoom);
    if (clampedZoom <= 1) {
      setPosition({ x: 0, y: 0 }); // Reset position when zoomed out
    }
  }

  const handleDragStart = (event: React.PointerEvent<HTMLImageElement>) => {
    if (zoomLevel <= 1) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
    };

    setIsDragging(true);
  };

  // Legacy handlers kept for compatibility with existing JSX block below.
  const handleDragMove = () => {};
  const handleDragEnd = () => {};
  
  const handleNextScreenshot = () => {
    if (selectedScreenshotIndex === null || !game?.detail_images) return;
    const nextIndex = (selectedScreenshotIndex + 1) % game.detail_images.length;
    openScreenshotPreview(nextIndex);
  };
  
  const handlePrevScreenshot = () => {
    if (selectedScreenshotIndex === null || !game?.detail_images) return;
    const prevIndex = (selectedScreenshotIndex - 1 + game.detail_images.length) % game.detail_images.length;
    openScreenshotPreview(prevIndex);
  };

  const handlePreviewKeydown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      closeScreenshotPreview();
      return;
    }

    if (!game?.detail_images || game.detail_images.length <= 1) return;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      handlePrevScreenshot();
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      handleNextScreenshot();
    }
  };

  const handlePreviewBackdropClick = () => {
    const isTransformed = zoomLevel > 1 || position.x !== 0 || position.y !== 0;
    if (isTransformed) {
      setIsDragging(false);
      handleZoom(1);
      setPosition({ x: 0, y: 0 });
      return;
    }

    closeScreenshotPreview();
  };

  if (isLoading) {
      return <Loading />;
  }

  if (pageError || !gameData || !game) {
    notFound();
    return null;
  }
  
  const gameSpecificNews = MOCK_NEWS_ARTICLES.filter(article => article.gameId === game._id);
  const generalNews = MOCK_NEWS_ARTICLES.filter(article => article.gameId !== game._id && !article.gameId);
  
  let combinedNews = [...gameSpecificNews];
  if (combinedNews.length < MAX_NEWS_DISPLAY) {
    combinedNews = [...combinedNews, ...generalNews.slice(0, MAX_NEWS_DISPLAY - combinedNews.length)];
  }
  const newsToShow = combinedNews.slice(0, MAX_NEWS_DISPLAY);
  const hasMoreGameSpecificNews = gameSpecificNews.length > newsToShow.filter(n => n.gameId === game._id).length || gameSpecificNews.length > MAX_NEWS_DISPLAY;
  
  const cleanDescription = game.description?.replace(/<br\s*\/?>/gi, '\n') || '';
  const needsExpansion = cleanDescription.length > DESCRIPTION_CHAR_LIMIT;
  const shortDescriptionText = truncateDescription(cleanDescription, DESCRIPTION_CHAR_LIMIT);
  const selectedScreenshotUrl = selectedScreenshotIndex !== null && game.detail_images ? game.detail_images[selectedScreenshotIndex] : null;

  return (
    <div className="space-y-8 fade-in">
      <GameAnnouncements announcements={Announcements} position="game_detail" />

      <Card className="overflow-visible shadow-xl">
      <CardHeader className="p-0 relative h-[200px] bg-muted">
        {game.header_image && (
          <Image
            src={game.header_image}
            alt={`${game.name} banner`}
            fill
            priority
            className="object-cover object-center rounded-t-lg" 
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 1200px"
          />
        )}
        <div 
          className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent"
        >
        </div>
      </CardHeader>
        <CardContent className="p-4 md:p-6 space-y-6 relative -mt-20 z-10">
          <div className="flex flex-col md:grid md:grid-cols-12 md:gap-x-8">
            <div className="md:col-span-8 space-y-6">
              <div className="flex items-start justify-between gap-4 sm:gap-6">
                <div className="flex items-start gap-4 sm:gap-6">
                  {game.icon && (
                    <Image
                      src={game.icon}
                      alt={`${game.name} icon`}
                      width={144}
                      height={144}
                      className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-xl object-cover flex-shrink-0 border-4 border-background shadow-lg"
                      data-ai-hint={`game icon large ${game.name}`}
                    />
                  )}
                  <div className="pt-1 sm:pt-2">
                    <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{game.name}</h1>
                    <p className="text-sm text-muted-foreground mt-1 sm:mt-2">{game.developer}</p>
                  </div>
                </div>
                <div className="hidden sm:block flex-shrink-0 pt-2">
                  <GameDownloadDialog appId={game._id} pkg={game.pkg} resources={resources || []} downloadNotices={cardConfig?.download_notice} />
                </div>
              </div>

               <div className="sm:hidden w-full">
                  <GameDownloadDialog appId={game._id} pkg={game.pkg} resources={resources || []} downloadNotices={cardConfig?.download_notice} />
                </div>


              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 text-sm pt-2">
                
                {game.star > 0 && (
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-2" />
                    <div>
                      <p className="text-muted-foreground text-xs">评分</p>
                      <p className="font-semibold">{game.star}</p>
                    </div>
                  </div>
                )}
                {game.download_count_show && (
                  <div className="flex items-center">
                    <Download className="w-4 h-4 text-primary mr-2" />
                    <div>
                      <p className="text-muted-foreground text-xs">下载量</p>
                      <p className="font-semibold">{game.download_count_show}</p>
                    </div>
                  </div>
                )}
                {game.tags?.[0] && (
                  <div className="flex items-center">
                    <Tag className="w-4 h-4 text-blue-500 mr-2" />
                    <div>
                      <p className="text-muted-foreground text-xs">类型</p>
                      <p className="font-semibold">{game.tags[0]}</p>
                    </div>
                  </div>
                )}
                {game.release_at && (
                  <div className="flex items-center">
                    <CalendarDays className="w-4 h-4 text-green-500 mr-2" />
                    <div>
                      <p className="text-muted-foreground text-xs">发布日期</p>
                      <p className="font-semibold">{new Date(game.release_at).toLocaleDateString('zh-CN')}</p>
                    </div>
                  </div>
                )}
                {game.latest_at && (
                  <div className="flex items-center">
                    <History className="w-4 h-4 text-purple-500 mr-2" />
                    <div>
                      <p className="text-muted-foreground text-xs">更新日期</p>
                      <p className="font-semibold">{new Date(game.latest_at).toLocaleDateString('zh-CN')}</p>
                    </div>
                  </div>
                )}
                
                {game.version && (
                  <div className="flex items-start">
                    <Info className="w-4 h-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="flex-grow">
                      <p className="text-muted-foreground text-xs">版本</p>
                      <div className="flex items-center gap-x-2 flex-wrap">
                          <p className="font-semibold">{game.version}</p>
                          <Button
                              variant="outline"
                              size="sm"
                              className="h-auto px-2 py-0.5 text-xs btn-interactive"
                              onClick={handleUrgeUpdate}
                              disabled={isSubmittingUrge}
                          >
                              <BellRing className="w-3 h-3 mr-1" />
                              催更
                          </Button>
                      </div>
                    </div>
                  </div>
                )}

                {Number.isFinite(Number(game.file_size || 0)) && Number(game.file_size || 0) > 0 && (
                  <div className="flex items-center col-span-2 sm:col-span-1">
                    <HardDrive className="w-4 h-4 text-orange-500 mr-2" />
                    <div>
                      <p className="text-muted-foreground text-xs">大小</p>
                      <p className="font-semibold">{formatBytes(Number(game.file_size || 0))}</p>
                    </div>
                  </div>
                )}


              </div>

              {game.tags && game.tags.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-base font-semibold text-muted-foreground mb-2 flex items-center">
                    <TagsIcon className="w-4 h-4 mr-2" />
                    标签
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {game.tags.map((tag, index) => (
                      <Badge
                        key={`${game._id}-tag-${index}-${tag}`}
                        variant="outline"
                        className="text-xs border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-400/30 dark:bg-orange-400/15 dark:text-orange-200"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator className="my-4 md:my-6" />

              <div>
                <h2 className="text-xl font-semibold mb-3">游戏介绍</h2>
                <div 
                  className="text-foreground/80 leading-relaxed whitespace-pre-line prose prose-sm sm:prose-base dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: isDescriptionExpanded ? cleanDescription : shortDescriptionText }}
                />
                {needsExpansion && (
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary hover:underline mt-2 text-sm"
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  >
                    {isDescriptionExpanded ? '收起' : '展开全文'}
                    {isDescriptionExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                  </Button>
                )}
              </div>
            </div>

            <div className="md:col-span-4 mt-8 md:mt-0 order-2 md:order-none">
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <ThumbsUp className="w-5 h-5 mr-2 text-primary" />
                    为你推荐
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={fetchRecommendedGames} className="text-xs text-muted-foreground hover:text-primary btn-interactive" disabled={isFetchingRecommended}>
                     <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", isFetchingRecommended && "animate-spin")} />
                     换一换
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  {recommendedGames.length > 0 ? recommendedGames.map(recGame => (
                    <Link key={recGame._id} href={`/app/${recGame.pkg}`} className="block hover:bg-muted/50 p-2.5 rounded-lg transition-colors border border-transparent hover:border-primary/20">
                      <div className="flex items-start gap-3">
                        <Image
                          src={recGame.icon}
                          alt={recGame.name}
                          width={64}
                          height={64}
                          className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                          data-ai-hint={`game icon small ${recGame.name}`}
                        />
                        <div className="flex-grow">
                          <h4 className="font-semibold text-sm text-foreground group-hover:text-primary line-clamp-2">{recGame.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{recGame.tags?.[0]?.name || '游戏'}</p>
                           <Button variant="link" size="sm" className="text-xs p-0 h-auto mt-1 text-primary/80 hover:text-primary">
                            查看详情 <ExternalLink className="w-3 h-3 ml-1" />
                           </Button>
                        </div>
                      </div>
                    </Link>
                  )) : (
                    <p className="text-sm text-muted-foreground">暂无更多推荐。</p>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {cardConfig && (
                <div className="pt-6 mt-6 border-t md:col-span-12 order-1 md:order-none">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <LinkIcon className="w-5 h-5 text-primary mr-2" />
                    更多资源与支持
                </h2>
                <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
                    {cardConfig.contact && cardConfig.contact.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-lg font-medium flex items-center text-foreground/90">
                        <Users className="w-5 h-5 mr-2 text-accent" />
                        玩家交流群
                        </h3>
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {cardConfig.contact.map(item => (
                            <Button key={item._id} variant="outline" asChild className="btn-interactive justify-start">
                                <a href={item.content.link} target="_blank" rel="noopener noreferrer">
                                {item.content.icon ? (
                                    <Image src={item.content.icon} alt={item.content.title} width={20} height={20} className="mr-2" />
                                ) : <Contact className="mr-2" />}
                                {item.content.title}
                                </a>
                            </Button>
                            ))}
                        </div>
                    </div>
                    )}
                    
                    {cardConfig.partner && cardConfig.partner.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-lg font-medium flex items-center text-foreground/90">
                        <Briefcase className="w-5 h-5 mr-2 text-accent" />
                        合作与支持
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {cardConfig.partner.map(item => (
                            <Button key={item._id} variant="outline" asChild className="btn-interactive justify-start">
                                <a href={item.content.link} target="_blank" rel="noopener noreferrer">
                                {item.content.icon ? (
                                    <Image src={item.content.icon} alt={item.content.title} width={20} height={20} className="mr-2" />
                                ) : <Briefcase className="mr-2" />}
                                {item.content.title}
                                </a>
                            </Button>
                            ))}
                        </div>
                    </div>
                    )}
                </div>
                </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mt-6 mb-3 flex items-center">
          <Camera className="w-5 h-5 text-primary mr-2" />
          游戏截图
        </h2>
        {game.detail_images && game.detail_images.length > 0 ? (
          <div className="flex overflow-x-auto space-x-3 md:space-x-4 py-2 -mx-1 px-1">
            {game.detail_images.map((screenshotUrl, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-60 md:w-72 aspect-video bg-muted rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow cursor-pointer group relative"
                onClick={() => openScreenshotPreview(index)}
              >
                <Image
                  src={screenshotUrl}
                  alt={`游戏截图 ${index + 1}`}
                  width={288}
                  height={162}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  data-ai-hint={`gameplay screenshot ${game.name}`}
                  sizes="(max-width: 767px) 240px, 288px"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">暂无游戏截图。</p>
        )}
      </div>

      {newsToShow.length > 0 && (
        <div className="pt-6 mt-6 border-t">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <NewsIcon className="w-5 h-5 text-primary mr-2" />
            《{game.name}》相关资讯
          </h2>
          <div
            className={cn(
              "py-2 -mx-1 px-1 md:mx-0 md:px-0", 
              "flex space-x-3 overflow-x-auto", 
              "md:grid md:gap-x-4 md:gap-y-6", 
              newsToShow.length === 1 && "md:grid-cols-1",
              newsToShow.length === 2 && "md:grid-cols-2",
              newsToShow.length >= 3 && "md:grid-cols-2 lg:grid-cols-3"
            )}
          >
            {newsToShow.map(newsItem => (
              <Card
                key={newsItem.id}
                className={cn(
                  "w-[calc(100vw-4rem)] max-w-md sm:w-96 flex-shrink-0 hover:shadow-lg transition-shadow duration-200 ease-in-out", 
                  "md:w-auto"
                )}
              >
                <CardContent className="p-3">
                  <div className="flex flex-col sm:flex-row gap-x-3 gap-y-3">
                    <Link href={`/news/${newsItem.id}`} className="block w-full sm:w-40 md:w-44 flex-shrink-0">
                      <div className="relative w-full aspect-video rounded-md overflow-hidden bg-muted group">
                        <Image
                          src={newsItem.imageUrl}
                          alt={newsItem.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          data-ai-hint={newsItem.dataAiHint || 'news article image'}
                           sizes="(max-width: 639px) 100vw, (max-width: 767px) 160px, (max-width: 1023px) 176px, (max-width: 1279px) 176px"
                        />
                      </div>
                    </Link>
                    <div className="flex-grow flex flex-col">
                      <h3 className="text-base font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 mb-1">
                        <Link href={`/news/${newsItem.id}`}>{newsItem.title}</Link>
                      </h3>
                      <p className="text-xs text-foreground/80 line-clamp-3 flex-grow mb-2">
                        {newsItem.excerpt || createLocalExcerpt(newsItem.content, 100)}
                      </p>
                      <div className="flex items-center justify-between mt-auto pt-1">
                         <p className="text-xs text-muted-foreground">{newsItem.date}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {hasMoreGameSpecificNews && (
            <div className="mt-6 text-center">
              <Button variant="outline" asChild className="btn-interactive">
                <Link href={`/news?tag=${encodeURIComponent(game.name)}`}>查看更多《{game.name}》资讯</Link>
              </Button>
            </div>
          )}
        </div>
      )}

      <div ref={commentsSectionRef} className="pt-8 mt-8 border-t">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold flex items-center">
            <CommentIcon className="w-6 h-6 text-primary mr-3" />
            玩家评论区
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={communitySort === 'latest' ? 'default' : 'outline'}
              size="sm"
              className="btn-interactive"
              onClick={() => setCommunitySort('latest')}
            >
              最新
            </Button>
            <Button
              type="button"
              variant={communitySort === 'hot' ? 'default' : 'outline'}
              size="sm"
              className="btn-interactive"
              onClick={() => setCommunitySort('hot')}
            >
              最热
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="btn-interactive"
              onClick={() => {
                setIsCommunityLoaded(false);
                setCommunityReloadKey((v) => v + 1);
              }}
            >
              刷新
            </Button>
            <Button asChild size="sm" className="btn-interactive">
              <Link href={game?.pkg ? `/community?app=${encodeURIComponent(game.pkg)}` : '/community'}>
                去社区发帖
              </Link>
            </Button>
          </div>
        </div>

        {isCommunityLoading && (
          <div className="py-8 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            正在加载关联帖子...
          </div>
        )}

        {!isCommunityLoading && relatedPosts.length > 0 && (
          <div className="space-y-4">
            {relatedPosts.map((post) => {
              const likeCount = postLikeCounts[post.id] ?? post.likesCount ?? 0;
              const isLiked = Boolean(likedPostIds[post.id]);
              const cover = post.imageUrl || post.relatedApp?.icon;
              return (
                <Card key={post.id} className="overflow-hidden border-border/60 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.user.avatarUrl} alt={post.user.name} />
                        <AvatarFallback>{(post.user.name || 'U').slice(0, 1)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-semibold text-foreground">{post.user.name || '匿名用户'}</span>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{post.timestamp}</span>
                        </div>
                        <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug">
                          <Link href={`/community/post/${post.id}`} className="hover:text-primary transition-colors">
                            {post.title || '社区帖子'}
                          </Link>
                        </h3>
                        <p className="mt-1.5 text-sm text-foreground/80 line-clamp-3">
                          {getPostExcerpt(post)}
                        </p>
                      </div>
                      {cover && (
                        <Link href={`/community/post/${post.id}`} className="relative hidden h-20 w-32 shrink-0 overflow-hidden rounded-md border bg-muted sm:block">
                          <Image
                            src={cover}
                            alt={post.title || '帖子封面'}
                            fill
                            className="object-cover"
                            data-ai-hint="community post cover"
                          />
                        </Link>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn('px-2 text-xs', isLiked && 'text-primary')}
                        disabled={likePendingPostId === post.id}
                        onClick={() => handleRelatedPostLike(post.id)}
                      >
                        <ThumbsUp className={cn('mr-1.5 h-4 w-4', isLiked && 'fill-primary')} />
                        点赞 {likeCount}
                      </Button>
                      <Button asChild variant="ghost" size="sm" className="px-2 text-xs">
                        <Link href={`/community/post/${post.id}#comments`}>
                          <MessageSquare className="mr-1.5 h-4 w-4" />
                          评论 {post.commentsCount || 0}
                        </Link>
                      </Button>
                      <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{post.viewsCount || 0} 浏览</span>
                        <Link href={`/community/post/${post.id}`} className="inline-flex items-center text-primary hover:underline">
                          快捷跳转
                          <ExternalLink className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!isCommunityLoading && isCommunityLoaded && relatedPosts.length === 0 && (
          <Card className="shadow-sm">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              暂无关联社区帖子，欢迎发布第一条讨论。
            </CardContent>
          </Card>
        )}
      </div>

      {showFab && (
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-8 right-8 z-50 rounded-full w-14 h-14 shadow-xl btn-interactive"
          onClick={handleFabClick}
          aria-label="快速评论"
        >
          <MessageSquarePlus className="w-6 h-6" />
        </Button>
      )}

      {selectedScreenshotUrl &&
        isPreviewMounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm"
            onClick={handlePreviewBackdropClick}
            onKeyDown={handlePreviewKeydown}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
          >
            {game.detail_images && game.detail_images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="fixed left-2 top-1/2 z-[10000] -translate-y-1/2 rounded-full bg-background/30 text-white hover:bg-background/70 hover:text-primary sm:left-4 sm:h-12 sm:w-12"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevScreenshot();
                  }}
                  aria-label="Previous screenshot"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="fixed right-2 top-1/2 z-[10000] -translate-y-1/2 rounded-full bg-background/30 text-white hover:bg-background/70 hover:text-primary sm:right-4 sm:h-12 sm:w-12"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextScreenshot();
                  }}
                  aria-label="Next screenshot"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            <div className="relative flex h-full w-full items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="fixed right-4 top-4 z-[10000] h-10 w-10 rounded-full bg-background/50 text-foreground hover:bg-background/80 hover:text-primary"
                onClick={closeScreenshotPreview}
                aria-label="Close preview"
              >
                <CloseIcon className="h-6 w-6" />
              </Button>

              <Image
                src={selectedScreenshotUrl}
                alt="Screenshot preview"
                width={1280}
                height={720}
                className="select-none rounded-lg object-contain shadow-2xl transition-transform duration-200"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                  maxWidth: 'calc(100vw - 2rem)',
                  maxHeight: 'calc(100vh - 5rem)',
                  touchAction: zoomLevel > 1 ? 'none' : 'manipulation',
                  cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                }}
                onPointerDown={handleDragStart}
              />

              <div className="fixed bottom-4 left-1/2 z-[10000] flex -translate-x-1/2 items-center gap-2 rounded-full bg-background/80 p-2 shadow-lg">
                <Button variant="ghost" size="icon" onClick={() => handleZoom(zoomLevel - 0.2)} aria-label="Zoom out">
                  <ZoomOut className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    handleZoom(1);
                    setPosition({ x: 0, y: 0 });
                  }}
                  aria-label="Reset zoom"
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleZoom(zoomLevel + 0.2)} aria-label="Zoom in">
                  <ZoomIn className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}



    


