import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  AppWindow,
  CalendarDays,
  Flame,
  Gift,
  MessageCircle,
  Newspaper,
  ThumbsUp,
  UserCircle,
  Zap,
} from 'lucide-react';

import GameAnnouncements from '@/components/game-announcements';
import GameCarousel from '@/components/game-carousel';
import GameCard from '@/components/game-card';
import NewReleaseGameCard from '@/components/home/NewReleaseGameCard';
import PreregistrationGameCard from '@/components/home/PreregistrationGameCard';
import SectionHeader from '@/components/home/SectionHeader';
import HomeDynamicPosts from '@/components/home/HomeDynamicPosts';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type {
  ApiArticle,
  ApiGame,
  ApiDynamicPost,
  Game,
  HomeData,
  NewsArticle,
} from '@/types';
import { apiUrl, trackedApiFetch } from '@/lib/api';
import { getPublicSiteConfig } from '@/lib/site-config';
import { absoluteUrl } from '@/lib/seo';

function transformApiGameToGame(apiGame: ApiGame): Game {
  return {
    id: apiGame._id,
    pkg: apiGame.pkg,
    title: apiGame.name,
    description: apiGame.summary,
    shortDescription: apiGame.summary,
    imageUrl: apiGame.icon,
    bannerUrl: apiGame.header_image,
    category: apiGame.tags?.[0] || '未知',
    rating: apiGame.star,
    tags: apiGame.tags,
    status: 'released',
    dataAiHint: `game icon ${apiGame.name}`,
  };
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '未知时间';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '未知时间';
  return d.toLocaleDateString('zh-CN');
}

function toNumber(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

interface CombinedHomeData {
  homeData: HomeData | null;
  newsData: ApiArticle[];
  dynamicPosts: ApiDynamicPost[];
}

async function getHomeAndNewsData(): Promise<CombinedHomeData> {
  try {
    const dynamicCount = Math.min(20, Math.max(1, toNumber(process.env.HOME_DYNAMIC_COUNT, 8)));
    const platform = process.env.NEXT_PUBLIC_CLIENT_PLATFORM || process.env.CLIENT_PLATFORM || 'web';
    const region = process.env.NEXT_PUBLIC_CLIENT_REGION || process.env.CLIENT_REGION || '';
    const clientVersion = process.env.NEXT_PUBLIC_CLIENT_VERSION || process.env.CLIENT_VERSION || '';

    const params = new URLSearchParams();
    params.set('dynamic_count', String(dynamicCount));
    if (platform) params.set('platform', platform);
    if (region) params.set('region', region);
    if (clientVersion) params.set('client_version', clientVersion);

    const homeRes = await trackedApiFetch(`/home?${params.toString()}`, { cache: 'no-store' });
    const homeJson = homeRes.ok ? await homeRes.json() : null;
    const homeData: HomeData | null = homeJson?.data || null;

    return {
      homeData,
      newsData: homeData?.articles || [],
      dynamicPosts: homeData?.dynamic_posts || [],
    };
  } catch {
    return { homeData: null, newsData: [], dynamicPosts: [] };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const config = await getPublicSiteConfig(300);
  const siteSlogan = config?.basic?.site_slogan || 'APKScc';
  const seoDescription = config?.seo?.description || 'APKScc - 安卓游戏与应用下载平台';
  const siteName = config?.basic?.site_name || 'APKScc';
  const shareImage = config?.basic?.share_image || '';
  const keywords = (config?.seo?.keywords || 'APKScc')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);

  return {
    title: { absolute: siteSlogan },
    description: seoDescription,
    keywords,
    alternates: { canonical: '/' },
    openGraph: {
      title: siteSlogan,
      description: seoDescription,
      url: absoluteUrl('/'),
      siteName: siteName,
      images: shareImage ? [shareImage] : [],
      type: 'website',
      locale: 'zh_CN',
    },
    twitter: {
      card: 'summary_large_image',
      title: siteSlogan,
      description: seoDescription,
      images: shareImage ? [shareImage] : [],
    },
  };
}

export default async function HomePage() {
  const { homeData, newsData, dynamicPosts } = await getHomeAndNewsData();

  if (!homeData) {
    return <div className="text-center py-10">无法加载首页数据，请稍后重试。</div>;
  }

  const albums = homeData.albums || [];
  const announcements = homeData.announcements;
  const bannerItems = homeData.banner || [];

  const newsItems: NewsArticle[] = (newsData || []).map((a: ApiArticle) => ({
    id: a._id || a.gid || '',
    title: a.name,
    content: a.content || '',
    excerpt: a.summary,
    imageUrl: a.image_cover,
    category: a.tags?.[0] || '资讯',
    date: formatDate(a.release_at),
    author: a.author || '匿名',
    tags: a.tags || [],
    dataAiHint: `news ${a.name}`,
  }));

  const homeJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'APKScc',
    url: absoluteUrl('/'),
    potentialAction: {
      '@type': 'SearchAction',
      target: `${absoluteUrl('/app')}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <div className="space-y-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <section className="fade-in" style={{ animationDelay: '0.1s' }}>
        <GameCarousel bannerItems={bannerItems} />
      </section>

      {announcements && (
        <section className="fade-in" style={{ animationDelay: '0.2s' }}>
          <GameAnnouncements announcements={announcements} position="home" />
        </section>
      )}

      {albums.map((album, albumIndex) => {
        const games: Game[] = album.games.map(transformApiGameToGame);
        if (games.length === 0) return null;

        const animationDelay = 0.3 + albumIndex * 0.3;

        let sectionContent: React.ReactNode;
        let sectionHeaderProps: {
          title: string;
          iconClassName?: string;
          icon: typeof Flame;
          moreHref: string;
        };

        if (album.style === 'Box') {
          sectionHeaderProps = {
            title: album.title || '热门推荐',
            icon: Flame,
            iconClassName: 'text-primary',
            moreHref: '/app?sort=popular',
          };
          sectionContent = (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
              {games.map((game, index) => (
                <GameCard
                  key={game.id}
                  game={game}
                  className="fade-in"
                  style={{ animationDelay: `${animationDelay + 0.1 + index * 0.05}s` }}
                />
              ))}
            </div>
          );
        } else if (album.style === 'Grid') {
          sectionHeaderProps = {
            title: album.title || '新游速递',
            icon: Zap,
            iconClassName: 'text-accent',
            moreHref: '/app?sort=new',
          };
          sectionContent = (
            <div className="flex overflow-x-auto space-x-0.5 py-2 -mx-1 px-1 cursor-grab select-none">
              {games.map((game, index) => (
                <NewReleaseGameCard
                  key={game.id}
                  game={game}
                  className="fade-in flex-shrink-0"
                  style={{ animationDelay: `${animationDelay + 0.1 + index * 0.05}s` }}
                />
              ))}
            </div>
          );
        } else if (album.style === 'Pre') {
          sectionHeaderProps = {
            title: album.title || '预约专区',
            icon: Gift,
            iconClassName: 'text-green-500',
            moreHref: '/app?status=preregistration',
          };
          sectionContent = (
            <div className="flex overflow-x-auto space-x-0.5 py-2 -mx-1 px-1 cursor-grab select-none">
              {games.map((game, index) => (
                <PreregistrationGameCard
                  key={game.id}
                  game={game}
                  className="fade-in flex-shrink-0"
                  style={{ animationDelay: `${animationDelay + 0.1 + index * 0.05}s` }}
                />
              ))}
            </div>
          );
        } else if (album.style === 'List') {
          sectionHeaderProps = {
            title: album.title || '效率工具',
            icon: AppWindow,
            iconClassName: 'text-primary',
            moreHref: '/app',
          };
          sectionContent = (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {games.map((game, index) => (
                <Link
                  key={game.id}
                  href={`/app/${game.pkg || game.id}`}
                  className="fade-in group flex items-center gap-3 rounded-sm border-2 border-border bg-card p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary"
                  style={{ animationDelay: `${animationDelay + 0.1 + index * 0.04}s` }}
                >
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-sm border border-border bg-muted">
                    <Image
                      src={game.imageUrl || 'https://placehold.co/120x120.png'}
                      alt={game.title}
                      fill
                      className="object-cover"
                      data-ai-hint={game.dataAiHint || 'tool icon'}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-1 text-sm font-semibold group-hover:text-primary">{game.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {game.shortDescription || game.description || '暂无描述'}
                    </p>
                  </div>
                  {typeof game.rating === 'number' && game.rating > 0 && (
                    <div className="flex items-center gap-1 text-xs font-semibold text-foreground/70">
                      <ThumbsUp className="h-3.5 w-3.5" />
                      {game.rating.toFixed(1)}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          );
        } else {
          return null;
        }

        return (
          <React.Fragment key={album._id}>
            <Separator className="my-8 bg-border/50" />
            <section className="fade-in" style={{ animationDelay: `${animationDelay}s` }}>
              <SectionHeader {...sectionHeaderProps} />
              {sectionContent}
            </section>
          </React.Fragment>
        );
      })}

      {dynamicPosts.length > 0 && (
        <>
          <Separator className="my-8 bg-border/50" />
          <section className="fade-in" style={{ animationDelay: `${0.35 + albums.length * 0.25}s` }}>
            <SectionHeader title="社区动态" icon={MessageCircle} iconClassName="text-primary" moreHref="/community" />
            <HomeDynamicPosts posts={dynamicPosts} />
          </section>
        </>
      )}

      {newsItems.length > 0 && (
        <>
          <Separator className="my-8 bg-border/50" />
          <section className="fade-in" style={{ animationDelay: `${0.45 + albums.length * 0.3}s` }}>
            <SectionHeader title="游戏资讯" icon={Newspaper} iconClassName="text-primary/80" moreHref="/news" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {newsItems.map((article, index) => (
                <div
                  key={article.id}
                  className="relative rounded-lg shadow-sm border hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col sm:flex-row fade-in"
                  style={{ animationDelay: `${0.55 + albums.length * 0.3 + index * 0.1}s` }}
                >
                  {article.imageUrl && (
                    <>
                      <div className="absolute inset-0">
                        <Image
                          src={article.imageUrl}
                          alt=""
                          fill
                          className="object-cover scale-110 blur-xl opacity-35"
                          aria-hidden="true"
                        />
                      </div>
                      <div className="absolute inset-0 bg-background/55 backdrop-blur-[2px]" />
                    </>
                  )}

                  <div className="relative z-10 w-full sm:w-1/3 aspect-[16/9] flex-shrink-0 overflow-hidden">
                    <Image
                      src={article.imageUrl || 'https://placehold.co/600x400.png'}
                      alt={article.title}
                      fill
                      className="object-cover"
                      data-ai-hint={article.dataAiHint || 'news image'}
                    />
                  </div>
                  <div className="relative z-10 p-4 flex-grow flex flex-col justify-between min-w-0 bg-card/72 backdrop-blur-sm">
                    <div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-2">
                        <span className="flex items-center">
                          <CalendarDays className="w-3 h-3 mr-1" />
                          {article.date}
                        </span>
                        <span className="flex items-center">
                          <UserCircle className="w-3 h-3 mr-1" />
                          {article.author}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold mb-2 text-foreground line-clamp-2 leading-tight hover:text-primary transition-colors">
                        <Link href={`/news/${article.id}`}>{article.title}</Link>
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 sm:line-clamp-3">{article.excerpt}</p>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Button variant="link" asChild className="p-0 h-auto text-xs text-primary font-medium hover:underline">
                        <Link href={`/news/${article.id}`}>阅读全文 →</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}



