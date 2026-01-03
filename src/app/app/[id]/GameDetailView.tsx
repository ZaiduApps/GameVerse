
'use client';

import type { Game, NewsArticle, GameDetailData, ApiRecommendedGame, ApiGameDetail } from '@/types';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Download, Users, Tag, CalendarDays, Info, HardDrive, Tags as TagsIcon, AlertTriangle, Megaphone, Newspaper as NewsIcon, Briefcase, MessageSquare, Link as LinkIcon, BellRing, MessageCircle as CommentIcon, MessageSquarePlus, History, ChevronUp, ChevronDown, Camera, X as CloseIcon, ThumbsUp, ExternalLink, RefreshCw, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import GameDownloadDialog from '@/components/game-download-dialog';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import React, { useState, useEffect, useRef } from 'react';
import { MOCK_NEWS_ARTICLES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { notFound } from 'next/navigation';
import Loading from '../loading';

interface MockComment {
  id: string;
  username: string;
  avatarFallback: string;
  avatarUrl?: string;
  dataAiHint?: string;
  timestamp: string;
  text: string;
}

const mockComments: MockComment[] = [
  { id: 'c1', username: '游戏达人小明', avatarFallback: 'XM', timestamp: '2 小时前', text: '这款游戏太棒了，画面精美，玩法新颖！希望开发组能多出点活动。' },
  { id: 'c2', username: '萌新小白', avatarFallback: 'XB', avatarUrl: 'https://placehold.co/40x40.png?text=MB', dataAiHint: "avatar user", timestamp: '5 小时前', text: '刚开始玩，感觉有点难上手，不过剧情很吸引人。有没有大佬带带我？' },
  { id: 'c3', username: '氪金大佬', avatarFallback: 'DL', timestamp: '1 天前', text: '服务器再稳定一点就好了，其他都挺满意的。' },
];

interface GameDetailViewProps {
  id: string;
  initialGameData?: GameDetailData | null;
  initialRecommendedGames?: ApiRecommendedGame[] | null;
}

const DESCRIPTION_CHAR_LIMIT = 120;
const MAX_NEWS_DISPLAY = 4;
const MAX_RECOMMENDED_GAMES = 5;

// Helper to format bytes into a human-readable string
const formatBytes = (bytes: number | null, decimals = 2) => {
    if (bytes === null || bytes === 0) return 'N/A';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


export default function GameDetailView({ id, initialGameData, initialRecommendedGames }: GameDetailViewProps) {
  const [gameData, setGameData] = useState<GameDetailData | null>(initialGameData || null);
  const [recommendedGames, setRecommendedGames] = useState<ApiRecommendedGame[]>(
    (initialRecommendedGames || []).slice(0, MAX_RECOMMENDED_GAMES)
  );
  const [isLoading, setIsLoading] = useState(!initialGameData);

  useEffect(() => {
    // If we have initial data for the current id, don't re-fetch
    if (initialGameData && gameData?.app.pkg === id) {
        setGameData(initialGameData);
        setRecommendedGames((initialRecommendedGames || []).slice(0, MAX_RECOMMENDED_GAMES));
        setIsLoading(false);
        return;
    }

    // This will run for client-side navigation
    async function fetchData() {
      setIsLoading(true);
      try {
        const gameDetailsRes = await fetch(`/api/game/details?param=${id}`);
        if (!gameDetailsRes.ok) throw new Error('Failed to fetch game details');
        const gameDetailsJson = await gameDetailsRes.json();
        if (gameDetailsJson.code !== 0 || !gameDetailsJson.data) {
          throw new Error('Game not found');
        }
        const fetchedGameData = gameDetailsJson.data;
        setGameData(fetchedGameData);

        const pkg = fetchedGameData.app.pkg;
        if (pkg) {
            const recommendedGamesRes = await fetch(`/api/game/recommendedApp?param=${pkg}`);
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
        console.error("Error fetching data:", error);
        // Using notFound() in a client component can be tricky, 
        // a better approach might be to set an error state and show an error message.
        setGameData(null); // Clear previous data
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [id, initialGameData, initialRecommendedGames, gameData?.app.pkg]);


  const { app: game, resources } = gameData || {};
  const [showFab, setShowFab] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const commentsSectionRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  
  // Screenshot Preview State
  const [selectedScreenshotIndex, setSelectedScreenshotIndex] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);


  const [isFetchingRecommended, setIsFetchingRecommended] = useState(false);

  const fetchRecommendedGames = async () => {
    if (!game?.pkg || isFetchingRecommended) return;
    setIsFetchingRecommended(true);
    try {
      const res = await fetch(`/api/game/recommendedApp?param=${game.pkg}`, { cache: 'no-store' });
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
    if (selectedScreenshotIndex !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [selectedScreenshotIndex]);


  const handleFabClick = () => {
    if (commentsSectionRef.current) {
      commentsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 350); 
  };

  const createLocalExcerpt = (text: string, maxLength: number = 100): string => {
    if (!text) return '';
    const firstParagraph = text.split('\n\n')[0];
    if (firstParagraph.length <= maxLength) return firstParagraph;
    
    let cutPoint = -1;
    const punctuation = ['。', '！', '？', '.', '!', '?'];
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

  const truncateDescription = (text: string, limit: number): string => {
    if (text.length <= limit) {
      return text;
    }
    let breakPoint = text.substring(0, limit).lastIndexOf('。');
    if (breakPoint === -1 || breakPoint < limit / 2) breakPoint = text.substring(0, limit).lastIndexOf('！');
    if (breakPoint === -1 || breakPoint < limit / 2) breakPoint = text.substring(0, limit).lastIndexOf('？');
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
  };

  const closeScreenshotPreview = () => {
    setSelectedScreenshotIndex(null);
  };
  
  const handleZoom = (newZoomLevel: number) => {
    const clampedZoom = Math.max(0.2, Math.min(newZoomLevel, 3));
    setZoomLevel(clampedZoom);
    if (clampedZoom <= 1) {
      setPosition({ x: 0, y: 0 }); // Reset position when zoomed out
    }
  }

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (zoomLevel <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setStartPos({
      x: clientX - position.x,
      y: clientY - position.y,
    });
    if (imageRef.current) imageRef.current.style.cursor = 'grabbing';
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setPosition({
      x: clientX - startPos.x,
      y: clientY - startPos.y,
    });
  };

  const handleDragEnd = () => {
    if (zoomLevel <= 1) return;
    setIsDragging(false);
    if (imageRef.current) imageRef.current.style.cursor = 'grab';
  };
  
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

  if (isLoading) {
      return <Loading />;
  }

  if (!game) {
    return <div className="text-center py-10">无法加载游戏数据，请稍后重试。</div>;
  }
  
  const gameSpecificNews = MOCK_NEWS_ARTICLES.filter(article => article.gameId === game._id);
  const generalNews = MOCK_NEWS_ARTICLES.filter(article => article.gameId !== game._id && !article.gameId);
  
  let combinedNews = [...gameSpecificNews];
  if (combinedNews.length < MAX_NEWS_DISPLAY) {
    combinedNews = [...combinedNews, ...generalNews.slice(0, MAX_NEWS_DISPLAY - combinedNews.length)];
  }
  const newsToShow = combinedNews.slice(0, MAX_NEWS_DISPLAY);
  const hasMoreGameSpecificNews = gameSpecificNews.length > newsToShow.filter(n => n.gameId === game._id).length || gameSpecificNews.length > MAX_NEWS_DISPLAY;
  
  const cleanDescription = game.description.replace(/<br\s*\/?>/gi, '\n');
  const needsExpansion = cleanDescription.length > DESCRIPTION_CHAR_LIMIT;
  const shortDescriptionText = truncateDescription(cleanDescription, DESCRIPTION_CHAR_LIMIT);
  const selectedScreenshotUrl = selectedScreenshotIndex !== null ? game.detail_images?.[selectedScreenshotIndex] : null;

  return (
    <div className="space-y-8 fade-in">
      <Card className="bg-primary/5 border-primary/20 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-primary text-sm md:text-base">全站重要公告</h3>
              <p className="text-xs md:text-sm text-primary/80">
                游戏宇宙系统维护通知：预计今晚10点进行服务器升级，期间部分服务可能短暂中断，敬请谅解。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center">
            <Megaphone className="w-5 h-5 text-accent mr-3 flex-shrink-0" />
            <p className="text-xs md:text-sm text-foreground/80">
              <span className="font-semibold text-accent">跑马灯位置：</span> 热门活动《夏季嘉年华》火热进行中！ | 《${game.name}》新版本 V${game.version || '1.0.0'} 现已上线，快来体验！
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-visible shadow-xl">
      <CardHeader className="p-0 relative h-[200px]">
  <Image
    src={game.header_image}
    alt={`${game.name} banner`}
    fill
    priority
    // 确保图片本身被正确裁剪
    className="object-cover object-center rounded-t-lg" 
    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 1200px"
  />

  {/* 核心修改：遮罩层 */}
  <div 
    className="absolute inset-0 backdrop-blur-sm pointer-events-none"
    style={{
       // 顶部20%模糊，底部20%模糊，中间60%清晰to bottom, black 0%, transparent 20%, transparent 80%, black 100%
       maskImage: 'linear-gradient(to bottom, black 0, transparent 10%, transparent 45%, black 70%)',
       WebkitMaskImage: 'linear-gradient(to bottom, black 0, transparent 10%, transparent 45%, black 70%)',
       marginTop: 0,
       backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 20%, transparent 50%)',
    }}
  >
    {/* 为了增强底部的融合感（你原来的设计），我们可以在模糊层里加一点点颜色 */}
    <div className="w-full h-full bg-gradient-to-t from-card/80 to-transparent opacity-50"></div>
  </div>
</CardHeader>
        <CardContent className="p-4 md:p-6 space-y-6 relative -mt-20 z-10">
          <div className="md:grid md:grid-cols-12 md:gap-x-8">
            <div className="md:col-span-8 space-y-6">
              <div className="flex items-start justify-between gap-4 sm:gap-6">
                <div className="flex items-start gap-4 sm:gap-6">
                  <Image
                    src={game.icon}
                    alt={`${game.name} icon`}
                    width={144}
                    height={144}
                    className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-xl object-cover flex-shrink-0 border-4 border-background shadow-lg"
                    data-ai-hint={`game icon large ${game.name}`}
                  />
                  <div className="pt-1 sm:pt-2">
                    <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{game.name}</h1>
                    <p className="text-sm text-muted-foreground mt-1 sm:mt-2">{game.developer}</p>
                  </div>
                </div>
                <div className="hidden sm:block flex-shrink-0 pt-2">
                  <GameDownloadDialog pkg={game.pkg} resources={resources} />
                </div>
              </div>

               <div className="sm:hidden w-full">
                  <GameDownloadDialog pkg={game.pkg} resources={resources} />
                </div>


              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 text-sm pt-2">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-2" />
                  <div>
                    <p className="text-muted-foreground text-xs">评分</p>
                    <p className="font-semibold">{game.star || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Download className="w-4 h-4 text-primary mr-2" />
                  <div>
                    <p className="text-muted-foreground text-xs">下载量</p>
                    <p className="font-semibold">{game.download_count_show || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Tag className="w-4 h-4 text-blue-500 mr-2" />
                  <div>
                    <p className="text-muted-foreground text-xs">类型</p>
                    <p className="font-semibold">{game.tags?.[0] || '未知'}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <CalendarDays className="w-4 h-4 text-green-500 mr-2" />
                  <div>
                    <p className="text-muted-foreground text-xs">发布日期</p>
                    <p className="font-semibold">{game.release_at ? new Date(game.release_at).toLocaleDateString('zh-CN') : '未知'}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <History className="w-4 h-4 text-purple-500 mr-2" />
                  <div>
                    <p className="text-muted-foreground text-xs">更新日期</p>
                    <p className="font-semibold">{game.latest_at ? new Date(game.latest_at).toLocaleDateString('zh-CN') : '未知'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Info className="w-4 h-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="flex-grow">
                    <p className="text-muted-foreground text-xs">版本</p>
                    <div className="flex items-center gap-x-2 flex-wrap">
                        <p className="font-semibold">{game.version || 'N/A'}</p>
                        {game.version && (
                          <Button
                              variant="outline"
                              size="sm"
                              className="h-auto px-2 py-0.5 text-xs btn-interactive"
                              onClick={() => alert('催更请求已发送 (模拟)')}
                          >
                              <BellRing className="w-3 h-3 mr-1" />
                              催更
                          </Button>
                        )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center col-span-2 sm:col-span-1">
                  <HardDrive className="w-4 h-4 text-orange-500 mr-2" />
                  <div>
                    <p className="text-muted-foreground text-xs">大小</p>
                    <p className="font-semibold">{formatBytes(game.file_size)}</p>
                  </div>
                </div>
              </div>

              {game.tags && game.tags.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-base font-semibold text-muted-foreground mb-2 flex items-center">
                    <TagsIcon className="w-4 h-4 mr-2" />
                    标签
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {game.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator className="my-4 md:my-6" />

              <div>
                <h2 className="text-xl font-semibold mb-3">游戏介绍</h2>
                <div 
                  className="text-foreground/80 leading-relaxed whitespace-pre-line prose prose-sm sm:prose-base dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: isDescriptionExpanded ? game.description.replace(/<br\s*\/?>/gi, '\n') : truncateDescription(cleanDescription, DESCRIPTION_CHAR_LIMIT) }}
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

            <div className="md:col-span-4 mt-8 md:mt-0">
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
                           sizes="(max-width: 639px) 100vw, (max-width: 767px) 160px, (max-width: 1023px) 176px, (max-width: 1279px) 176px, 176px"
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

      <div className="pt-6 mt-6 border-t">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <LinkIcon className="w-5 h-5 text-primary mr-2" />
          更多资源与支持
        </h2>
        <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-3">
            <h3 className="text-lg font-medium flex items-center text-foreground/90">
              <Users className="w-5 h-5 mr-2 text-accent" />
              玩家交流群
            </h3>
            <Button variant="outline" className="w-full justify-start btn-interactive">
              <MessageSquare className="w-4 h-4 mr-2" /> 加入官方QQ群: 123456789 (模拟)
            </Button>
            <Button variant="outline" className="w-full justify-start btn-interactive">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21.025 4.005C21.025 4.005 22.275 12.135 18.705 18.435C18.705 18.435 16.665 22.455 11.905 22.455C11.905 22.455 7.415000000000001 22.515 4.475000000000001 17.985C4.475000000000001 17.985 0.78500000000000034 12.045 0.78500000000000034 4.005C0.78500000000000034 4.005 3.2050000000000003 1.5150000000000001 7.2350000000000003 1.5150000000000001C7.2350000000000003 1.5150000000000001 10.015 1.0500000000000003 11.915 1.0500000000000003C11.915 1.0500000000000003 17.065 0.6800000000000004 21.025 4.005Z"/><path d="M8.324999999999999 10.11C8.324999999999999 10.11 9.044999999999998 9.134999999999999 10.115 9.134999999999999C11.185 9.134999999999999 11.665 10.02 11.665 10.02L12.505 13.38C12.505 13.38 12.025 13.89 11.025 13.89C10.025 13.89 8.484999999999999 12.675 8.484999999999999 12.675L8.324999999999999 10.11Z"/><path d="M15.635 10.11C15.635 10.11 14.915 9.134999999999999 13.845 9.134999999999999C12.775 9.134999999999999 12.295 10.02 12.295 10.02L11.455 13.38C11.455 13.38 11.935 13.89 12.935 13.89C13.935 13.89 15.475 12.675 15.475 12.675L15.635 10.11Z"/></svg>
              加入Discord服务器 (模拟)
            </Button>
            <Button variant="outline" className="w-full justify-start btn-interactive">
              <Users className="w-4 h-4 mr-2" /> 官方论坛/社区 (模拟)
            </Button>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-medium flex items-center text-foreground/90">
              <Briefcase className="w-5 h-5 mr-2 text-accent" />
              合作与支持
            </h3>
            <Button variant="outline" className="w-full justify-start btn-interactive">
              <Briefcase className="w-4 h-4 mr-2" /> 商务合作洽谈 (模拟)
            </Button>
            <Button variant="outline" className="w-full justify-start btn-interactive">
              <NewsIcon className="w-4 h-4 mr-2" /> 媒体与内容创作 (模拟)
            </Button>
             <Button variant="outline" className="w-full justify-start btn-interactive">
              <AlertTriangle className="w-4 h-4 mr-2" /> Bug反馈与建议 (模拟)
            </Button>
          </div>
        </div>
      </div>

      <div ref={commentsSectionRef} className="pt-8 mt-8 border-t">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <CommentIcon className="w-6 h-6 text-primary mr-3" />
          玩家评论区
        </h2>

        <Card className="mb-6 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Avatar className="mt-1">
                <AvatarImage src="https://placehold.co/40x40.png?text=ME" alt="当前用户" data-ai-hint="avatar user" />
                <AvatarFallback>我</AvatarFallback>
              </Avatar>
              <div className="flex-grow space-y-2">
                <Textarea
                  ref={commentInputRef}
                  placeholder="发表你的看法，分享游戏心得..."
                  rows={3}
                  className="text-sm"
                />
                <div className="flex justify-end">
                  <Button className="btn-interactive">发表评论</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {mockComments.map((comment) => (
            <Card key={comment.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Avatar>
                    {comment.avatarUrl ? (
                       <AvatarImage src={comment.avatarUrl} alt={comment.username} data-ai-hint={comment.dataAiHint || "avatar user"} />
                    ) : (
                       <AvatarImage src={`https://placehold.co/40x40.png?text=${comment.avatarFallback}`} alt={comment.username} data-ai-hint="avatar user" />
                    )}
                    <AvatarFallback>{comment.avatarFallback}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-foreground">{comment.username}</span>
                      <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                    </div>
                    <p className="text-sm text-foreground/90 whitespace-pre-line">{comment.text}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {mockComments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">暂无评论，快来抢沙发吧！</p>
          )}
        </div>
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

      {selectedScreenshotUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in-50"
          onClick={closeScreenshotPreview}
        >
          {game.detail_images && game.detail_images.length > 1 && (
            <>
              <Button variant="ghost" size="icon" className="fixed left-2 sm:left-4 z-[110] rounded-full bg-background/30 hover:bg-background/70 text-white hover:text-primary w-10 h-10 sm:w-12 sm:h-12" onClick={(e) => { e.stopPropagation(); handlePrevScreenshot(); }} aria-label="上一张">
                  <ChevronLeft className="w-6 h-6"/>
              </Button>
              <Button variant="ghost" size="icon" className="fixed right-2 sm:right-4 z-[110] rounded-full bg-background/30 hover:bg-background/70 text-white hover:text-primary w-10 h-10 sm:w-12 sm:h-12" onClick={(e) => { e.stopPropagation(); handleNextScreenshot(); }} aria-label="下一张">
                  <ChevronRight className="w-6 h-6"/>
              </Button>
            </>
          )}

          <div
            className="relative flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          >
             <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-3 md:top-2 md:right-2 z-[110] rounded-full bg-background/50 hover:bg-background/80 text-foreground hover:text-primary w-8 h-8 md:w-10 md:h-10"
              onClick={closeScreenshotPreview}
              aria-label="关闭预览"
            >
              <CloseIcon className="w-5 h-5 md:w-6 md:h-6" />
            </Button>
            
            <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
                <Image
                    ref={imageRef}
                    src={selectedScreenshotUrl}
                    alt="游戏截图预览"
                    width={1280}
                    height={720}
                    className="object-contain rounded-lg shadow-2xl transition-transform duration-300 select-none"
                    style={{
                        transform: `scale(${zoomLevel}) translate(${position.x}px, ${position.y}px)`,
                        maxWidth: 'calc(100vw - 4rem)',
                        maxHeight: 'calc(100vh - 8rem)',
                        cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                    }}
                    onMouseDown={handleDragStart}
                    onTouchStart={handleDragStart}
                />
            </div>
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 p-2 rounded-full flex items-center gap-2 shadow-lg">
                <Button variant="ghost" size="icon" onClick={() => handleZoom(zoomLevel - 0.2)} aria-label="缩小">
                    <ZoomOut className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => { handleZoom(1); setPosition({x:0, y:0}) }} aria-label="重置大小">
                    <RotateCcw className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleZoom(zoomLevel + 0.2)} aria-label="放大">
                    <ZoomIn className="w-5 h-5" />
                </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
