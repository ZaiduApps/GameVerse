import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import {
  Apple,
  ChevronLeft,
  ChevronRight,
  Download,
  Flame,
  MessageCircle,
  Newspaper,
  QrCode,
  Sparkles,
  Smartphone,
  Rocket,
  Star,
  Zap,
  Wrench,
} from 'lucide-react';

import GameAnnouncements from '@/components/game-announcements';
import HomeHeroCarousel from '@/components/home/HomeHeroCarousel';
import HomeQuickSearchCard from '@/components/home/HomeQuickSearchCard';
import { getClientLandingAppData, type ClientLandingAppData } from '@/lib/client-landing';
import type { Announcement, ApiAlbum, ApiArticle, ApiBanner, ApiDynamicPost, ApiGame, HomeData } from '@/types';
import { trackedApiFetch } from '@/lib/api';
import { getPublicSiteConfig } from '@/lib/site-config';
import { absoluteUrl } from '@/lib/seo';

const FALLBACK_GAME_IMAGE = 'https://placehold.co/640x640/png';
const FALLBACK_AVATAR = 'https://placehold.co/80x80/png';

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

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await trackedApiFetch(`/home?${query}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) {
        lastError = new Error(`home request failed: ${res.status} ${res.statusText}`);
        continue;
      }

      const json = await res.json();
      if (json?.code !== 0 || !json?.data) {
        lastError = new Error(`home api code invalid: ${String(json?.code ?? 'unknown')}`);
        continue;
      }

      return json.data as HomeData;
    } catch (error) {
      lastError = error;
    }
  }

  console.error('Failed to fetch /home after retries:', lastError);
  return null;
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

    const [homeData, clientLanding] = await Promise.all([
      fetchHomeDataWithRetry(params.toString(), {
        timeoutMs: 12000,
        retries: 1,
      }),
      getClientLandingAppData(120).catch(() => null),
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
  const { homeData, newsData, dynamicPosts, clientLanding } = await getHomeAndNewsData();

  if (!homeData) {
    return <div className="py-12 text-center text-muted-foreground">无法加载首页数据，请稍后重试。</div>;
  }

  const allAlbums = (Array.isArray(homeData.albums) ? [...homeData.albums] : []).filter(
    (album): album is ApiAlbum => Boolean(album && album._id),
  );
  const announcements = homeData.announcements;
  const bannerItems = (Array.isArray(homeData.banner) ? homeData.banner : []).filter(
    (banner): banner is ApiBanner => Boolean(banner && banner._id),
  );
  const safeNewsItems = (Array.isArray(newsData) ? newsData : []).filter(
    (item): item is ApiArticle => Boolean(item && (item._id || item.gid)),
  );
  const safeDynamicPosts = (Array.isArray(dynamicPosts) ? dynamicPosts : []).filter(
    (post): post is ApiDynamicPost => Boolean(post && post._id),
  );

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
    announcements?.popup?.[0] || announcements?.normal?.[0] || announcements?.marquee?.[0] || null;
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
    <div className="home-page space-y-8 pb-2 text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />

      <section className="flex flex-col gap-5 lg:h-[480px] lg:flex-row lg:gap-6">
        <div className="w-full lg:h-full lg:w-3/4">
          <HomeHeroCarousel bannerItems={bannerItems} compact className="h-full" />
        </div>
        <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:h-full lg:w-1/4 lg:grid-cols-1 lg:gap-6">
          <HomeQuickSearchCard />

          <section className="flex flex-col justify-between rounded-[22px] border-t-4 border-[#005e9f] bg-white p-5 shadow-[0_14px_28px_rgba(12,15,16,0.08)]">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-lg font-black text-[#2c2f30]">
                  <Smartphone className="h-4 w-4 text-[#005e9f]" />
                  ACBOX 客户端下载
                </h3>
                <span className="rounded-full bg-[#eff1f2] px-2 py-0.5 text-[10px] font-bold text-[#595c5d]">
                  {downloadVersion ? `v${downloadVersion}` : '最新版'}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-[#e0e3e4] bg-white p-1.5 shadow-sm">
                  {downloadQrCodeDataUrl ? (
                    <img src={downloadQrCodeDataUrl} alt="ACBOX 下载二维码" className="h-full w-full rounded-lg object-contain" />
                  ) : (
                    <QrCode className="h-9 w-9 text-[#757778]" />
                  )}
                </div>
                <div className="space-y-1.5">
                  <p className="flex items-center gap-1 text-xs font-bold text-[#005e9f]">
                    <Zap className="h-3.5 w-3.5" />
                    更流畅体验
                  </p>
                  <p className="flex items-center gap-1 text-xs font-bold text-[#755700]">
                    <Sparkles className="h-3.5 w-3.5" />
                    独家签到特权
                  </p>
                  {downloadSize && <p className="text-[11px] font-semibold text-[#595c5d]">安装包大小：{downloadSize}</p>}
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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#e0e3e4] py-2.5 text-sm font-bold text-[#2c2f30] transition-colors hover:bg-[#d1d5d7]"
                >
                  <Apple className="h-4 w-4" />
                  iOS 下载
                </a>
              ) : (
                <Link
                  href={iosDownloadHref}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#e0e3e4] py-2.5 text-sm font-bold text-[#2c2f30] transition-colors hover:bg-[#d1d5d7]"
                >
                  <Apple className="h-4 w-4" />
                  iOS 下载
                </Link>
              )}
            </div>
          </section>
        </div>
      </section>

      {announcements && <GameAnnouncements announcements={announcements} position="home" />}

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
                  <p className="mt-1 text-sm font-medium text-[#595c5d]">编辑精选必玩佳作</p>
                </div>
                <Link href="/app?sort=popular" className="text-sm font-bold text-[#005e9f] hover:underline">
                  查看全部
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5">
                {heavyweightGames.slice(0, 6).map((game) => (
                  <Link
                    key={game._id}
                    href={getGameHref(game)}
                    className="group relative mx-auto flex h-full w-full max-w-[220px] flex-col rounded-[24px] bg-white p-2.5 shadow-[0_8px_18px_rgba(12,15,16,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_24px_rgba(12,15,16,0.12)]"
                  >
                    {typeof game.star === 'number' && game.star > 0 && (
                      <div className="absolute right-3 top-3 z-20 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                        <Star className="h-3 w-3 fill-[#fdc003] text-[#fdc003]" />
                        {game.star.toFixed(1)}
                      </div>
                    )}
                    <div className="relative mb-2.5 h-28 w-full overflow-hidden rounded-2xl bg-[#e6e8ea]">
                      <Image
                        src={game.header_image || game.icon || FALLBACK_GAME_IMAGE}
                        alt={game.name}
                        fill
                        className="rounded-2xl object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        sizes="220px"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="min-w-0 flex-1 truncate text-sm font-black sm:text-base">{game.name}</h4>
                      {game.metadata?.region && (
                        <span className="inline-flex rounded-md bg-[#eff1f2] px-1.5 py-0.5 text-[10px] font-bold text-[#595c5d]">
                          {game.metadata.region}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-[#595c5d]">{game.summary || game.tags?.[0] || '精品推荐'}</p>
                    <span className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-[#b3d4ff] py-1.5 text-xs font-black text-[#004a7e] transition-colors group-hover:bg-[#005e9f] group-hover:text-white">
                      下载
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {recentAlbum && recentGames.length > 0 && (
            <section className="rounded-[26px] bg-[#eff1f2] p-5 sm:p-7">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-black tracking-tight">{recentAlbum.title || '最近更新'}</h3>
                <div className="hidden items-center gap-2 sm:flex">
                  <button className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#595c5d] shadow-sm">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#595c5d] shadow-sm">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recentGames.slice(0, 9).map((game) => (
                  <Link
                    key={game._id}
                    href={getGameHref(game)}
                    className="flex min-h-[72px] items-center gap-3 rounded-full bg-white px-2.5 py-2 shadow-sm transition-transform hover:-translate-y-0.5"
                  >
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-[#dadddf]">
                      <Image
                        src={game.icon || FALLBACK_GAME_IMAGE}
                        alt={game.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">{game.name}</p>
                      <span className="inline-flex rounded-full bg-[#f5f6f7] px-2 py-0.5 text-[10px] font-bold text-[#595c5d]">
                        {game.tags?.[0] || '版本更新'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {preregAlbum && preregGames.length > 0 && (
            <section>
              <h3 className="mb-5 text-xl font-black tracking-tight">{preregAlbum.title || '事前登录'}</h3>
              <div className="space-y-4">
                {preregGames.slice(0, 4).map((game, index) => (
                  <Link
                    key={game._id}
                    href={getGameHref(game)}
                    className="group flex flex-col gap-4 rounded-[22px] bg-[#eff1f2] p-4 transition-colors hover:bg-[#e6e8ea] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-[#dadddf]">
                        <Image
                          src={game.header_image || game.icon || FALLBACK_GAME_IMAGE}
                          alt={game.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-lg font-black">{game.name}</h4>
                        <p className="mt-1 line-clamp-1 text-sm font-medium text-[#595c5d]">{game.summary || '预约开启中'}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(game.tags || []).slice(0, 2).map((tag) => (
                            <span key={`${game._id}-${tag}`} className="rounded-md bg-[#dadddf] px-2 py-1 text-[10px] font-bold text-[#595c5d]">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-6 py-2 text-sm font-bold text-white transition-transform group-hover:scale-[1.03] ${
                        index % 2 === 0
                          ? 'bg-gradient-to-br from-[#b71211] to-[#ff7767]'
                          : 'bg-gradient-to-br from-[#005e9f] to-[#2d8fd3]'
                      }`}
                    >
                      预约
                    </span>
                  </Link>
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
                    {album.subtitle && <p className="mt-1 text-sm text-[#595c5d]">{album.subtitle}</p>}
                  </div>
                  <Link href="/app" className="text-sm font-bold text-[#005e9f] hover:underline">
                    查看更多
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {extraGames.slice(0, 6).map((game) => (
                    <Link
                      key={game._id}
                      href={getGameHref(game)}
                      className="rounded-2xl bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="relative mb-2.5 aspect-square overflow-hidden rounded-xl bg-[#e6e8ea]">
                        <Image
                          src={game.icon || FALLBACK_GAME_IMAGE}
                          alt={game.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 45vw, 160px"
                        />
                      </div>
                      <p className="line-clamp-1 text-sm font-black">{game.name}</p>
                      <p className="mt-1 line-clamp-1 text-xs text-[#595c5d]">{game.tags?.[0] || game.summary || '热门推荐'}</p>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}

          {safeDynamicPosts.length > 0 && (
            <section>
              <div className="mb-5 flex items-end justify-between">
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
              <div className="grid grid-cols-1 gap-4">
                {safeDynamicPosts.slice(0, 4).map((post) => (
                  <Link
                    key={post._id}
                    href={`/community/post/${post._id}`}
                    className="rounded-[22px] bg-[#eff1f2] p-4 shadow-sm transition-colors hover:bg-white"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="relative h-10 w-10 overflow-hidden rounded-full border border-[#ff7767]/30">
                        <Image
                          src={post.author_avatar || FALLBACK_AVATAR}
                          alt={post.author_name || '用户'}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black">{post.author_name || '匿名用户'}</p>
                        <p className="text-[11px] text-[#757778]">{formatRelativeTime(post.publish_at || post.last_commented_at)}</p>
                      </div>
                      {post.app_info?.name && (
                        <span className="rounded-full border border-[#b71211]/25 px-3 py-1 text-[10px] font-bold text-[#b71211]">
                          {post.app_info.name}
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-2 text-sm text-[#2c2f30]">{post.summary || post.title || '分享了一条社区动态'}</p>
                    {post.cover && (
                      <div className="relative mt-3 h-36 overflow-hidden rounded-xl">
                        <Image src={post.cover} alt={post.title || '动态封面'} fill className="object-cover" sizes="800px" />
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-5 text-xs font-bold text-[#595c5d]">
                      <span>点赞 {post.like_count || 0}</span>
                      <span>评论 {post.comment_count || 0}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {safeNewsItems.length > 0 && (
            <section>
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-xl font-black tracking-tight sm:text-2xl">
                    游戏资讯
                    <Newspaper className="h-5 w-5 text-[#b71211]" />
                  </h3>
                  <p className="mt-1 text-sm font-medium text-[#595c5d]">发现次元世界的精彩瞬间</p>
                </div>
                <Link href="/news" className="text-sm font-bold text-[#005e9f] hover:underline">
                  查看更多
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                {safeNewsItems.slice(0, 4).map((article, index) => {
                  const coverA = article.image_cover || FALLBACK_GAME_IMAGE;
                  const coverB =
                    safeNewsItems[index + 1]?.image_cover ||
                    bannerItems[index % Math.max(1, bannerItems.length)]?.url_image ||
                    coverA;
                  const articleHref = article._id || article.gid ? `/news/${article._id || article.gid}` : '/news';
                  return (
                    <article key={article._id || article.gid || index} className="overflow-hidden rounded-[22px] border border-[#e0e3e4] bg-white shadow-sm">
                      <div className="grid grid-cols-2 gap-1 p-1">
                        <div className="relative aspect-square overflow-hidden rounded-l-[18px]">
                          <Image src={coverA} alt={article.name} fill className="object-cover" sizes="420px" />
                        </div>
                        <div className="relative aspect-square overflow-hidden rounded-r-[18px]">
                          <Image src={coverB} alt="" fill className="object-cover" sizes="420px" />
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="mb-2 flex items-center gap-2 text-[11px] text-[#757778]">
                          <span>{article.author || '编辑部'}</span>
                          <span>·</span>
                          <span>{formatDate(article.release_at)}</span>
                        </div>
                        <h4 className="line-clamp-2 text-base font-black">{article.name}</h4>
                        <p className="mt-2 line-clamp-2 text-sm text-[#595c5d]">{article.summary || '点击查看资讯详情'}</p>
                        <div className="mt-3 flex items-center justify-between text-xs font-bold text-[#595c5d]">
                          <span>点赞 {article.like_counts || 0}</span>
                          <Link href={articleHref} className="text-[#005e9f] hover:underline">
                            查看详情
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-8 xl:col-span-4">
          {rankingAlbum && rankingGames.length > 0 && (
            <section className="rounded-[22px] bg-white p-5 shadow-[0_8px_24px_rgba(12,15,16,0.08)] sm:p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-black tracking-tight">{rankingAlbum.title || '热门游戏'}</h3>
                <div className="rounded-full bg-[#eff1f2] p-1 text-[10px] font-bold text-[#595c5d]">
                  <span className="rounded-full bg-white px-3 py-1">总榜</span>
                  <span className="px-3 py-1">新作</span>
                </div>
              </div>
              <div className="space-y-4">
                {rankingGames.slice(0, 8).map((game, index) => (
                  <Link key={game._id} href={getGameHref(game)} className="group flex items-center gap-3">
                    <span
                      className={`w-8 text-center text-xl font-black italic ${
                        index === 0 ? 'text-[#b71211]' : index === 1 ? 'text-[#b71211]/75' : index === 2 ? 'text-[#b71211]/55' : 'text-[#abadae]'
                      }`}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-[#eff1f2]">
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
                      <p className="truncate text-xs text-[#595c5d]">
                        {game.tags?.[0] || '热门'} · {typeof game.star === 'number' && game.star > 0 ? `${game.star.toFixed(1)}分` : '玩家推荐'}
                      </p>
                    </div>
                    {index < 3 && <Flame className="h-4 w-4 text-[#22c55e]" />}
                  </Link>
                ))}
              </div>
              <Link
                href="/rankings"
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#eff1f2] py-2 text-sm font-semibold text-[#595c5d] transition-colors hover:bg-[#e0e3e4]"
              >
                查看完整榜单
              </Link>
            </section>
          )}

          {toolsAlbum && toolGames.length > 0 && (
            <section className="rounded-[22px] bg-[#e6e8ea] p-5 sm:p-6">
              <h3 className="mb-5 flex items-center gap-2 text-lg font-black">
                {toolsAlbum.title || '效率工具'}
                <Wrench className="h-5 w-5 text-[#005e9f]" />
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {toolGames.slice(0, 6).map((game) => (
                  <Link
                    key={game._id}
                    href={getGameHref(game)}
                    className="rounded-2xl bg-white p-4 text-center shadow-sm transition-shadow hover:shadow-md"
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
                  </Link>
                ))}
              </div>
            </section>
          )}

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
        </aside>
      </div>
    </div>
  );
}
