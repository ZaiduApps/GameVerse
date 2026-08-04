import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  Apple,
  Download,
  Flame,
  MessageCircle,
  QrCode,
  Sparkles,
  Smartphone,
  Rocket,
  Star,
  Zap,
  Wrench,
} from 'lucide-react';

import GameAnnouncements from '@/components/game-announcements';
import HomeDynamicPosts from '@/components/home/HomeDynamicPosts';
import HomeHeroCarousel from '@/components/home/HomeHeroCarousel';
import HomeNewsListReplica from '@/components/home/HomeNewsListReplica';
import HomeQuickSearchCard from '@/components/home/HomeQuickSearchCard';
import RecentUpdatesSection from '@/components/home/RecentUpdatesSection';
import { getAlbumHref } from '@/lib/albums';
import { getClientLandingAppData, type ClientLandingAppData } from '@/lib/client-landing';
import type { Announcement, ApiAlbum, ApiArticle, ApiBanner, ApiDynamicPost, ApiGame, HomeData } from '@/types';
import { trackedApiFetch } from '@/lib/api';
import { getPublicSiteConfig } from '@/lib/site-config';
import { absoluteUrl, getSiteShareImageUrl } from '@/lib/seo';

const FALLBACK_GAME_IMAGE = '/favicon.ico';
const FALLBACK_AVATAR = '/favicon.ico';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function toNumber(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '未知时间';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '未知时间';
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return '刚刚';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '刚刚';
  const diffMs = Date.now() - d.getTime();
  if (diffMs <= 0) return '刚刚';

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))}分钟前`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}小时前`;
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)}天前`;
  return formatDate(dateStr);
}

function getGameHref(game: ApiGame): string {
  const target = String(game.pkg || game._id || '').trim();
  if (!target) return '/app';
  return `/app/${encodeURIComponent(target)}`;
}

function isExternalUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function uniqueExternalUrls(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => String(value || '').trim())
        .filter((value) => /^https?:\/\//i.test(value)),
    ),
  );
}

function buildHomeSeoDescription(value?: string | null): string {
  const base = String(value || '').trim();
  if (!base) {
    return 'APKScc 提供热门安卓游戏、应用下载、排行榜、游戏资讯与玩家社区内容，帮助玩家发现安全、高速、实用的 APK 资源。';
  }
  if (Array.from(base).length >= 120) return base;
  return `${base} 覆盖排行榜、资讯与社区。`;
}

function isLowQualityDynamicText(value?: string | null): boolean {
  const normalized = String(value || '').trim();
  if (!normalized) return true;
  if (/测试|測試|开发中|開發中|smoke|demo|feedback|反馈/i.test(normalized)) return true;
  if (/^https?:\/\//i.test(normalized)) return true;
  if (/(.)\1{5,}/.test(normalized)) return true;
  return false;
}

function isSeoSafeDynamicPost(post: ApiDynamicPost): boolean {
  if (!post || !post._id) return false;
  if (isLowQualityDynamicText(post.author_name)) return false;
  if (isLowQualityDynamicText(post.title) && isLowQualityDynamicText(post.summary)) return false;
  if (/example\.com|placehold\.co/i.test(String(post.cover || '').trim())) return false;
  return true;
}

function normalizeAlbumGames(album: ApiAlbum | null | undefined): ApiGame[] {
  if (!album || !Array.isArray(album.games)) return [];
  return album.games.filter((game): game is ApiGame => Boolean(game && game._id));
}

function takeAlbum(albums: ApiAlbum[], matcher: (album: ApiAlbum) => boolean): ApiAlbum | null {
  const index = albums.findIndex(matcher);
  if (index < 0) return null;
  return albums.splice(index, 1)[0];
}

function matchByTitle(album: ApiAlbum, keywords: string[]): boolean {
  const title = (album.title || '').replace(/\s+/g, '');
  return keywords.some((keyword) => title.includes(keyword));
}

function clampText(value: string | null | undefined, maxChars: number): string {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  const chars = Array.from(normalized);
  if (chars.length <= maxChars) return normalized;
  return `${chars.slice(0, maxChars).join('')}...`;
}

function formatDeviceLabel(value: string | null | undefined): string {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  if (/android/i.test(normalized)) return 'Android';
  if (/ios|iphone|ipad/i.test(normalized)) return 'iOS';
  if (/pc|windows|win/i.test(normalized)) return 'PC';
  return normalized;
}

interface CombinedHomeData {
  homeData: HomeData | null;
  newsData: ApiArticle[];
  dynamicPosts: ApiDynamicPost[];
  clientLanding: ClientLandingAppData | null;
}

async function fetchHomeDataWithRetry(
  query: string,
  options?: {
    timeoutMs?: number;
    retries?: number;
  },
): Promise<HomeData | null> {
  const timeoutMs = Math.max(2000, Number(options?.timeoutMs || 12000));
  const retries = Math.max(0, Number(options?.retries || 1));
  let lastError: unknown = null;
  const requestPath = `/home?${query}`;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const attemptNo = attempt + 1;
    const startedAt = Date.now();
    try {
      const res = await trackedApiFetch(requestPath, {
        cache: 'no-store',
        signal: AbortSignal.timeout(timeoutMs),
      });
      const durationMs = Date.now() - startedAt;
      if (!res.ok) {
        const message = `home request failed: status=${res.status} statusText=${res.statusText} durationMs=${durationMs}`;
        lastError = new Error(message);
        console.error('[home-ssr] non-200 response', {
          requestPath,
          attempt: attemptNo,
          retries: retries + 1,
          status: res.status,
          statusText: res.statusText,
          durationMs,
        });
        continue;
      }

      const json = await res.json();
      if (json?.code !== 0 || !json?.data) {
        const code = String(json?.code ?? 'unknown');
        lastError = new Error(`home api code invalid: code=${code} durationMs=${durationMs}`);
        console.error('[home-ssr] invalid payload', {
          requestPath,
          attempt: attemptNo,
          retries: retries + 1,
          code,
          durationMs,
        });
        continue;
      }

      if (attemptNo > 1) {
        console.warn('[home-ssr] recovered after retry', {
          requestPath,
          attempt: attemptNo,
          retries: retries + 1,
          durationMs,
        });
      }
      return json.data as HomeData;
    } catch (error) {
      lastError = error;
      const durationMs = Date.now() - startedAt;
      const errorName =
        typeof error === 'object' && error && 'name' in error
          ? String((error as { name?: unknown }).name || 'UnknownError')
          : 'UnknownError';
      const errorMessage =
        error instanceof Error ? error.message : String(error || 'unknown');
      const isTimeout =
        errorName.includes('Timeout') ||
        /timeout/i.test(errorMessage);
      console.error('[home-ssr] request exception', {
        requestPath,
        attempt: attemptNo,
        retries: retries + 1,
        durationMs,
        errorType: isTimeout ? 'timeout' : 'exception',
        errorName,
        errorMessage,
      });
    }
  }

  console.error('[home-ssr] failed after retries', {
    requestPath,
    retries: retries + 1,
    timeoutMs,
    lastErrorMessage:
      lastError instanceof Error ? lastError.message : String(lastError || 'unknown'),
  });
  return null;
}

async function getHomeAndNewsData(): Promise<CombinedHomeData> {
  try {
    const dynamicCount = Math.min(20, Math.max(1, toNumber(process.env.HOME_DYNAMIC_COUNT, 8)));
    const newsCount = Math.min(12, Math.max(1, toNumber(process.env.HOME_NEWS_COUNT, 6)));
    const platform = process.env.NEXT_PUBLIC_CLIENT_PLATFORM || process.env.CLIENT_PLATFORM || 'web';
    const region = process.env.NEXT_PUBLIC_CLIENT_REGION || process.env.CLIENT_REGION || '';
    const clientVersion = process.env.NEXT_PUBLIC_CLIENT_VERSION || process.env.CLIENT_VERSION || '';

    const params = new URLSearchParams();
    params.set('dynamic_count', String(dynamicCount));
    params.set('news_count', String(newsCount));
    if (platform) params.set('platform', platform);
    if (region) params.set('region', region);
    if (clientVersion) params.set('client_version', clientVersion);

    const [homeData, clientLanding] = await Promise.all([
      fetchHomeDataWithRetry(params.toString(), {
        timeoutMs: 12000,
        retries: 1,
      }),
      getClientLandingAppData('no-store').catch(() => null),
    ]);
    const safeArticles = Array.isArray(homeData?.articles) ? homeData.articles : [];
    const safeDynamicPosts = Array.isArray(homeData?.dynamic_posts) ? homeData.dynamic_posts : [];

    return {
      homeData,
      newsData: safeArticles,
      dynamicPosts: safeDynamicPosts,
      clientLanding,
    };
  } catch {
    return { homeData: null, newsData: [], dynamicPosts: [], clientLanding: null };
  }
}

async function buildDownloadQrCodeDataUrl(downloadUrl: string): Promise<string> {
  const url = String(downloadUrl || '').trim();
  if (!url) return '';
  try {
    const qrcode = await import('qrcode');
    return await qrcode.toDataURL(url, {
      width: 180,
      margin: 1,
      color: {
        dark: '#0c0f10',
        light: '#ffffff',
      },
    });
  } catch {
    return '';
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const config = await getPublicSiteConfig(300);
  const siteSlogan = config?.basic?.site_slogan || 'APKScc';
  const seoDescription = buildHomeSeoDescription(config?.seo?.description);
  const siteName = config?.basic?.site_name || 'APKScc';
  const shareImage = getSiteShareImageUrl(config?.basic?.share_image);
  const keywords = (config?.seo?.keywords || 'APKScc')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);

  return {
    title: { absolute: siteSlogan },
    description: seoDescription,
    keywords,
    alternates: {
      canonical: '/',
      languages: {
        'zh-CN': '/',
        'x-default': '/',
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      title: siteSlogan,
      description: seoDescription,
      url: absoluteUrl('/'),
      siteName: siteName,
      images: [{ url: shareImage, width: 1200, height: 630, alt: siteName }],
      type: 'website',
      locale: 'zh_CN',
    },
    twitter: {
      card: 'summary_large_image',
      title: siteSlogan,
      description: seoDescription,
      images: [shareImage],
    },
  };
}

export default async function HomePage() {
  const { homeData, newsData, dynamicPosts, clientLanding } = await getHomeAndNewsData();

  if (!homeData) {
    return <div className="py-12 text-center text-muted-foreground">无法加载首页数据，请稍后重试。</div>;
  }

  const allAlbums = (Array.isArray(homeData.albums) ? [...homeData.albums] : []).filter(
    (album): album is ApiAlbum => Boolean(album && album._id),
  );
  const bannerItems = (Array.isArray(homeData.banner) ? homeData.banner : []).filter(
    (banner): banner is ApiBanner => Boolean(banner && banner._id),
  );
  const safeNewsItems = (Array.isArray(newsData) ? newsData : []).filter(
    (item): item is ApiArticle => Boolean(item && (item._id || item.gid)),
  );
  const safeDynamicPosts = (Array.isArray(dynamicPosts) ? dynamicPosts : [])
    .filter(
      (post): post is ApiDynamicPost => Boolean(post && post._id && isSeoSafeDynamicPost(post)),
    )
    .sort((a, b) => {
      const timeA = Date.parse(String(a.publish_at || a.last_commented_at || ''));
      const timeB = Date.parse(String(b.publish_at || b.last_commented_at || ''));
      const valueA = Number.isFinite(timeA) ? timeA : -1;
      const valueB = Number.isFinite(timeB) ? timeB : -1;
      return valueB - valueA;
    });

  const heavyweightAlbum =
    takeAlbum(allAlbums, (album) => matchByTitle(album, ['重磅推荐'])) ??
    takeAlbum(allAlbums, (album) => album.style === 'Grid');
  const rankingAlbum =
    takeAlbum(allAlbums, (album) => matchByTitle(album, ['热门游戏', '热门排行', '排行榜'])) ??
    takeAlbum(allAlbums, (album) => album.style === 'Box');
  const recentAlbum =
    takeAlbum(allAlbums, (album) => matchByTitle(album, ['最近更新', '更新'])) ??
    takeAlbum(allAlbums, (album) => album.style === 'Grid');
  const preregAlbum =
    takeAlbum(allAlbums, (album) => matchByTitle(album, ['事前登录', '预约'])) ??
    takeAlbum(allAlbums, (album) => album.style === 'Pre');
  const toolsAlbum =
    takeAlbum(allAlbums, (album) => matchByTitle(album, ['效率工具', '工具'])) ??
    takeAlbum(allAlbums, (album) => album.style === 'List');

  const heavyweightGames = normalizeAlbumGames(heavyweightAlbum);
  const rankingGames = normalizeAlbumGames(rankingAlbum);
  const recentGames = normalizeAlbumGames(recentAlbum);
  const preregGames = normalizeAlbumGames(preregAlbum);
  const toolGames = normalizeAlbumGames(toolsAlbum);

  const promoAnnouncement: Announcement | null =
    homeData.announcements?.popup?.[0] || homeData.announcements?.normal?.[0] || homeData.announcements?.marquee?.[0] || null;
  const promoHref = String(promoAnnouncement?.link?.url || '').trim() || '/submit-resource';
  const promoIsExternal = isExternalUrl(promoHref);
  const androidDownloadHref = String(clientLanding?.client?.download_url || '').trim() || '/download/app';
  const androidDownloadIsExternal = isExternalUrl(androidDownloadHref);
  const iosDownloadHref =
    String(process.env.NEXT_PUBLIC_IOS_DOWNLOAD_URL || process.env.IOS_DOWNLOAD_URL || '').trim() || '/download/app';
  const iosDownloadIsExternal = isExternalUrl(iosDownloadHref);
  const downloadVersion = String(clientLanding?.client?.latest_version || '').trim();
  const downloadSize = String(clientLanding?.client?.file_size_text || '').trim();
  const qrCodeTarget = absoluteUrl(androidDownloadHref);
  const downloadQrCodeDataUrl = await buildDownloadQrCodeDataUrl(qrCodeTarget);
  const siteConfig = await getPublicSiteConfig(300);
  const siteName = siteConfig?.basic?.site_name || 'APKScc';
  const siteDescription = buildHomeSeoDescription(siteConfig?.seo?.description);
  const logoUrl = siteConfig?.basic?.logo_url ? absoluteUrl(siteConfig.basic.logo_url) : '';
  const shareImage = getSiteShareImageUrl(siteConfig?.basic?.share_image);
  const sameAs = uniqueExternalUrls([
    ...(siteConfig?.friend_links || []).map((item) => item.url),
    process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK_URL,
    process.env.NEXT_PUBLIC_SOCIAL_X_URL,
    process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE_URL,
    process.env.NEXT_PUBLIC_SOCIAL_DISCORD_URL,
  ]);

  const homeJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: siteName,
        url: absoluteUrl('/'),
        description: siteDescription,
        logo: logoUrl || undefined,
        image: shareImage,
        sameAs: sameAs.length > 0 ? sameAs : undefined,
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          url: absoluteUrl('/contact'),
          availableLanguage: ['zh-CN'],
        },
      },
      {
        '@type': 'WebSite',
        name: siteName,
        url: absoluteUrl('/'),
        description: siteDescription,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${absoluteUrl('/app')}?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  const shouldShowPromoCard = Boolean(promoAnnouncement && String(promoAnnouncement?.content || '').trim());

  return (
    <div className="home-page space-y-8 pb-2 text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />
      <h1 className="sr-only">APKScc 安卓游戏与应用下载平台</h1>

      <section className="flex flex-col gap-5 lg:h-[480px] lg:flex-row lg:gap-6">
        <div className="w-full lg:h-full lg:w-3/4">
          <HomeHeroCarousel bannerItems={bannerItems} compact className="h-full" />
        </div>
        <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:h-full lg:w-1/4 lg:grid-cols-1 lg:gap-6">
          <HomeQuickSearchCard />

          <section className="flex flex-col justify-between rounded-[22px] border-t-4 border-[#005e9f] bg-white p-5 shadow-[0_14px_28px_rgba(12,15,16,0.08)] dark:border-[#2d8fd3] dark:bg-[#111824] dark:shadow-[0_14px_28px_rgba(0,0,0,0.4)]">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-lg font-black text-[#2c2f30] dark:text-[#edf2fb]">
                  <Smartphone className="h-4 w-4 text-[#005e9f] dark:text-[#7fc1ff]" />
                  ACBOX 客户端下载
                </h3>
                <span className="rounded-full bg-[#eff1f2] px-2 py-0.5 text-[10px] font-bold text-[#595c5d] dark:bg-[#223043] dark:text-[#9ca6b8]">
                  {downloadVersion ? `v${downloadVersion}` : '最新版'}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-[#e0e3e4] bg-white p-1.5 shadow-sm dark:border-[#2a3442] dark:bg-[#0f1723]">
                  {downloadQrCodeDataUrl ? (
                    <img src={downloadQrCodeDataUrl} alt="ACBOX 下载二维码" className="h-full w-full rounded-lg object-contain" />
                  ) : (
                    <QrCode className="h-9 w-9 text-[#757778] dark:text-[#9ca6b8]" />
                  )}
                </div>
                <div className="space-y-1.5">
                  <p className="flex items-center gap-1 text-xs font-bold text-[#005e9f] dark:text-[#7fc1ff]">
                    <Zap className="h-3.5 w-3.5" />
                    更流畅体验
                  </p>
                  <p className="flex items-center gap-1 text-xs font-bold text-[#755700] dark:text-[#f4c97a]">
                    <Sparkles className="h-3.5 w-3.5" />
                    独家签到特权
                  </p>
                  {downloadSize && <p className="text-[11px] font-semibold text-[#595c5d] dark:text-[#9ca6b8]">安装包大小：{downloadSize}</p>}
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2.5">
              {androidDownloadIsExternal ? (
                <a
                  href={androidDownloadHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#005e9f] py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#004a7e]"
                >
                  <Download className="h-4 w-4" />
                  Android 下载
                </a>
              ) : (
                <Link
                  href={androidDownloadHref}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#005e9f] py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#004a7e]"
                >
                  <Download className="h-4 w-4" />
                  Android 下载
                </Link>
              )}
              {iosDownloadIsExternal ? (
                <a
                  href={iosDownloadHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#e0e3e4] py-2.5 text-sm font-bold text-[#2c2f30] transition-colors hover:bg-[#d1d5d7] dark:bg-[#223043] dark:text-[#edf2fb] dark:hover:bg-[#2a3b52]"
                >
                  <Apple className="h-4 w-4" />
                  iOS 下载
                </a>
              ) : (
                <Link
                  href={iosDownloadHref}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#e0e3e4] py-2.5 text-sm font-bold text-[#2c2f30] transition-colors hover:bg-[#d1d5d7] dark:bg-[#223043] dark:text-[#edf2fb] dark:hover:bg-[#2a3b52]"
                >
                  <Apple className="h-4 w-4" />
                  iOS 下载
                </Link>
              )}
            </div>
          </section>
        </div>
      </section>

      {homeData.announcements ? <GameAnnouncements announcements={homeData.announcements} position="home" /> : null}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12 xl:gap-10">
        <div className="space-y-8 xl:col-span-8">
          {heavyweightAlbum && heavyweightGames.length > 0 && (
            <section>
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-xl font-black tracking-tight sm:text-2xl">
                    {heavyweightAlbum.title || '重磅推荐'}
                    <Star className="h-5 w-5 fill-[#b71211] text-[#b71211]" />
                  </h3>
                  <p className="mt-1 text-sm font-medium text-[#595c5d] dark:text-[#9ca6b8]">编辑精选必玩佳作</p>
                </div>
                <Link href={getAlbumHref(heavyweightAlbum)} className="text-sm font-bold text-[#005e9f] hover:underline">
                  查看全部
                  <span className="sr-only">{heavyweightAlbum.title || '重磅推荐'}</span>
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-3.5">
                {heavyweightGames.map((game) => (
                  <article
                    key={game._id}
                    className="group relative flex h-full w-full flex-col rounded-[18px] bg-white p-2 shadow-[0_8px_18px_rgba(12,15,16,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_24px_rgba(12,15,16,0.12)] dark:bg-[#111824] dark:shadow-[0_8px_18px_rgba(0,0,0,0.35)] dark:hover:shadow-[0_14px_24px_rgba(0,0,0,0.45)]"
                  >
                    {typeof game.star === 'number' && game.star > 0 && (
                      <div className="absolute right-2 top-2 z-20 inline-flex items-center gap-1 rounded-full bg-black/65 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                        <Star className="h-3 w-3 fill-[#fdc003] text-[#fdc003]" />
                        {game.star.toFixed(1)}
                      </div>
                    )}
                    <div className="relative mb-2 h-32 w-full overflow-hidden rounded-xl bg-[#e6e8ea] dark:bg-[#1a2433]">
                      <Image
                        src={game.header_image || game.icon || FALLBACK_GAME_IMAGE}
                        alt={game.name}
                        fill
                        className="rounded-xl object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        sizes="(max-width: 767px) 50vw, 25vw"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="min-w-0 flex-1 truncate text-sm font-black">{game.name}</h4>
                      {game.metadata?.region && (
                        <span className="inline-flex rounded-md bg-[#eff1f2] px-1 py-0.5 text-[10px] font-bold text-[#595c5d] dark:bg-[#223043] dark:text-[#9ca6b8]">
                          {game.metadata.region}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-1 text-[11px] text-[#595c5d] dark:text-[#9ca6b8]">{game.summary || game.tags?.[0] || '精品推荐'}</p>
                    <span className="mt-1.5 inline-flex w-full items-center justify-center rounded-full bg-[#b3d4ff] py-1 text-[11px] font-black text-[#004a7e] transition-colors group-hover:bg-[#005e9f] group-hover:text-white">
                      下载
                    </span>
                    <Link
                      href={getGameHref(game)}
                      className="absolute inset-0 z-30 rounded-[18px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005e9f]"
                      aria-label={`查看${game.name}详情`}
                    >
                      <span className="sr-only">查看{game.name}详情</span>
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          )}

          {recentAlbum && recentGames.length > 0 && (
            <RecentUpdatesSection
              title={recentAlbum.title || '最近更新'}
              games={recentGames}
              fallbackImage={FALLBACK_GAME_IMAGE}
              viewAllHref={getAlbumHref(recentAlbum)}
            />
          )}

          {preregAlbum && preregGames.length > 0 && (
            <section>
              <div className="mb-5 flex items-end justify-between gap-3">
                <h3 className="text-xl font-black tracking-tight">{preregAlbum.title || '事前登录'}</h3>
                <Link href={getAlbumHref(preregAlbum)} className="text-sm font-bold text-[#005e9f] hover:underline">
                  查看全部
                  <span className="sr-only">{preregAlbum.title || '事前登录'}</span>
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {preregGames.slice(0, 4).map((game, index) => (
                  (() => {
                    const region = String(game.metadata?.region || '').trim();
                    const score = typeof game.star === 'number' ? game.star : Number(game.star || 0);
                    const hasScore = Number.isFinite(score) && score > 0;
                    const deviceLabels = Array.from(
                      new Set((Array.isArray(game.metadata?.deviceList) ? game.metadata.deviceList : []).map((item) => formatDeviceLabel(item)).filter(Boolean)),
                    ).slice(0, 2);
                    const hasMetrics = hasScore || deviceLabels.length > 0;

                    return (
                  <article
                    key={game._id}
                    className="group relative flex h-full flex-col justify-between gap-4 rounded-[22px] bg-[#eff1f2] p-4 transition-colors hover:bg-[#e6e8ea] dark:bg-[#162132] dark:hover:bg-[#1c2b40] sm:h-full sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-[#dadddf] dark:bg-[#223043]">
                        <Image
                          src={game.icon || FALLBACK_GAME_IMAGE}
                          alt={game.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="min-w-0 flex-1 truncate text-lg font-black" title={game.name}>{clampText(game.name, 16)}</h4>
                          {region && (
                            <span className="inline-flex shrink-0 rounded-md bg-[#dadddf] px-1.5 py-0.5 text-[10px] font-bold text-[#595c5d] dark:bg-[#2a3b52] dark:text-[#9ca6b8]">
                              {region}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 line-clamp-1 text-sm font-medium text-[#595c5d] dark:text-[#9ca6b8]">{game.summary || '预约开启中'}</p>
                        {hasMetrics && (
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-[#595c5d] dark:text-[#9ca6b8]">
                            {hasScore && (
                              <span className="inline-flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 fill-[#fdc003] text-[#fdc003]" />
                                {score.toFixed(1)}
                              </span>
                            )}
                            {deviceLabels.length > 0 && (
                              <span className="inline-flex items-center gap-1">
                                <Smartphone className="h-3.5 w-3.5 text-[#005e9f]" />
                                {deviceLabels.join(' / ')}
                              </span>
                            )}
                          </div>
                        )}
                        {(game.tags || []).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(game.tags || []).slice(0, 3).map((tag) => (
                            <span key={`${game._id}-${tag}`} className="rounded-md bg-[#dadddf] px-2 py-1 text-[10px] font-bold text-[#595c5d] dark:bg-[#2a3b52] dark:text-[#9ca6b8]">
                              {tag}
                            </span>
                          ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <span
                      className={`inline-flex shrink-0 whitespace-nowrap items-center justify-center rounded-full px-6 py-2 text-sm font-bold leading-none text-white transition-transform group-hover:scale-[1.03] ${
                        index % 2 === 0
                          ? 'bg-gradient-to-br from-[#b71211] to-[#ff7767]'
                          : 'bg-gradient-to-br from-[#005e9f] to-[#2d8fd3]'
                      }`}
                    >
                      预约
                    </span>
                    <Link
                      href={getGameHref(game)}
                      className="absolute inset-0 z-30 rounded-[22px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005e9f]"
                      aria-label={`查看${game.name}预约详情`}
                    >
                      <span className="sr-only">查看{game.name}预约详情</span>
                    </Link>
                  </article>
                    );
                  })()
                ))}
              </div>
            </section>
          )}

          {allAlbums.map((album) => {
            const extraGames = normalizeAlbumGames(album);
            if (extraGames.length === 0) return null;

            return (
              <section key={`extra-${album._id}`}>
                <div className="mb-5 flex items-end justify-between">
                  <div>
                    <h3 className="text-xl font-black tracking-tight">{album.title || '推荐专辑'}</h3>
                    {album.subtitle && <p className="mt-1 text-sm text-[#595c5d] dark:text-[#9ca6b8]">{album.subtitle}</p>}
                  </div>
                  <Link href={getAlbumHref(album)} className="text-sm font-bold text-[#005e9f] hover:underline">
                    查看全部
                    <span className="sr-only">{album.title || '推荐专辑'}</span>
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {extraGames.slice(0, 6).map((game) => (
                    <article
                      key={game._id}
                      className="relative rounded-2xl bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-[#111824] dark:shadow-[0_6px_14px_rgba(0,0,0,0.35)]"
                    >
                      <div className="relative mb-2.5 aspect-square overflow-hidden rounded-xl bg-[#e6e8ea] dark:bg-[#1a2433]">
                        <Image
                          src={game.icon || FALLBACK_GAME_IMAGE}
                          alt={game.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 45vw, 160px"
                        />
                      </div>
                      <p className="line-clamp-1 text-sm font-black">{game.name}</p>
                      <p className="mt-1 line-clamp-1 text-xs text-[#595c5d] dark:text-[#9ca6b8]">{game.tags?.[0] || game.summary || '热门推荐'}</p>
                      <Link
                        href={getGameHref(game)}
                        className="absolute inset-0 z-30 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005e9f]"
                        aria-label={`查看${game.name}详情`}
                      >
                        <span className="sr-only">查看{game.name}详情</span>
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}

          {safeDynamicPosts.length > 0 && (
            <section className="rounded-[22px] border border-[#e0e3e4] bg-white p-4 shadow-[0_8px_22px_rgba(12,15,16,0.06)] sm:p-5">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-xl font-black tracking-tight sm:text-2xl">
                    社区动态
                    <MessageCircle className="h-5 w-5 text-[#b71211]" />
                  </h3>
                  <p className="mt-1 text-sm font-medium text-[#595c5d]">来自次元住民的实时分享</p>
                </div>
                <Link href="/community" className="text-sm font-bold text-[#005e9f] hover:underline">
                  去社区
                </Link>
              </div>
              <HomeDynamicPosts posts={safeDynamicPosts.slice(0, 8)} />
            </section>
          )}

        </div>

        <aside className="space-y-8 xl:col-span-4">
          {rankingAlbum && rankingGames.length > 0 && (
            <section className="rounded-[22px] bg-white p-5 shadow-[0_8px_24px_rgba(12,15,16,0.08)] dark:bg-[#111824] dark:shadow-[0_8px_24px_rgba(0,0,0,0.4)] sm:p-6">
              <div className="mb-6 flex items-start justify-between gap-3">
                <h3 className="text-xl font-black tracking-tight">{rankingAlbum.title || '热门游戏'}</h3>
                <div className="flex flex-col items-end gap-2">
                  <Link href={getAlbumHref(rankingAlbum)} className="text-sm font-bold text-[#005e9f] hover:underline">
                    查看全部
                    <span className="sr-only">{rankingAlbum.title || '热门游戏'}</span>
                  </Link>
                  <div className="rounded-full bg-[#eff1f2] p-1 text-[10px] font-bold text-[#595c5d] dark:bg-[#223043] dark:text-[#9ca6b8]">
                    <span className="rounded-full bg-white px-3 py-1 dark:bg-[#111824]">总榜</span>
                    <span className="px-3 py-1">新作</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {rankingGames.slice(0, 8).map((game, index) => (
                  <article key={game._id} className="group relative flex items-center gap-3">
                    <span
                      className={`w-8 text-center text-xl font-black italic ${
                        index === 0 ? 'text-[#b71211]' : index === 1 ? 'text-[#b71211]/75' : index === 2 ? 'text-[#b71211]/55' : 'text-[#abadae]'
                      }`}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-[#eff1f2] dark:bg-[#223043]">
                      <Image
                        src={game.icon || FALLBACK_GAME_IMAGE}
                        alt={game.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black group-hover:text-[#b71211]">{game.name}</p>
                      <p className="truncate text-xs text-[#595c5d] dark:text-[#9ca6b8]">
                        {game.tags?.[0] || '热门'} · {typeof game.star === 'number' && game.star > 0 ? `${game.star.toFixed(1)}分` : '玩家推荐'}
                      </p>
                    </div>
                    {index < 3 && <Flame className="h-4 w-4 text-[#22c55e]" />}
                    <Link
                      href={getGameHref(game)}
                      className="absolute inset-0 z-30 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005e9f]"
                      aria-label={`查看${game.name}详情`}
                    >
                      <span className="sr-only">查看{game.name}详情</span>
                    </Link>
                  </article>
                ))}
              </div>
              <Link
                href="/rankings"
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#eff1f2] py-2 text-sm font-semibold text-[#595c5d] transition-colors hover:bg-[#e0e3e4] dark:bg-[#223043] dark:text-[#9ca6b8] dark:hover:bg-[#2a3b52]"
              >
                查看完整榜单
              </Link>
            </section>
          )}

          {toolsAlbum && toolGames.length > 0 && (
            <section className="rounded-[22px] bg-[#e6e8ea] p-5 sm:p-6">
              <div className="mb-5 flex items-end justify-between gap-3">
                <h3 className="flex items-center gap-2 text-lg font-black">
                  {toolsAlbum.title || '效率工具'}
                  <Wrench className="h-5 w-5 text-[#005e9f]" />
                </h3>
                <Link href={getAlbumHref(toolsAlbum)} className="text-sm font-bold text-[#005e9f] hover:underline">
                  查看全部
                  <span className="sr-only">{toolsAlbum.title || '效率工具'}</span>
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {toolGames.slice(0, 6).map((game) => (
                  <article
                    key={game._id}
                    className="relative rounded-2xl bg-white p-4 text-center shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="relative mx-auto mb-2.5 h-12 w-12 overflow-hidden rounded-full bg-[#eff1f2]">
                      <Image
                        src={game.icon || FALLBACK_GAME_IMAGE}
                        alt={game.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <p className="line-clamp-1 text-sm font-black">{game.name}</p>
                    <Link
                      href={getGameHref(game)}
                      className="absolute inset-0 z-30 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005e9f]"
                      aria-label={`查看${game.name}详情`}
                    >
                      <span className="sr-only">查看{game.name}详情</span>
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          )}

          {shouldShowPromoCard ? (
          <section className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#b71211] to-[#ff7767] p-6 text-white">
            <div className="relative z-10">
              <h3 className="text-xl font-black leading-tight">
                {promoAnnouncement?.title || '加入 ACBOX'}
                <br />
                开发者计划
              </h3>
              <p className="mt-2 text-sm text-white/85">
                {promoAnnouncement?.summary || promoAnnouncement?.content || '让你的作品被更多玩家看见。'}
              </p>
              {promoIsExternal ? (
                <a
                  href={promoHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center rounded-full bg-white px-5 py-2 text-sm font-black text-[#b71211] transition-transform hover:scale-[1.03]"
                >
                  立即申请
                </a>
              ) : (
                <Link
                  href={promoHref}
                  className="mt-5 inline-flex items-center rounded-full bg-white px-5 py-2 text-sm font-black text-[#b71211] transition-transform hover:scale-[1.03]"
                >
                  立即申请
                </Link>
              )}
            </div>
            <Rocket className="absolute -bottom-4 -right-4 h-28 w-28 text-white/25" />
          </section>
          ) : null}
        </aside>
      </div>

      {safeNewsItems.length > 0 && (
        <HomeNewsListReplica
          title="社区动态"
          subtitle="发现次元世界的玩家讨论与一线反馈"
          moreHref="/community"
          articles={safeNewsItems}
          fallbackImage={FALLBACK_GAME_IMAGE}
        />
      )}
    </div>
  );
}
