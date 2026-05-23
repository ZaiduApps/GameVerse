import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BarChartBig, Clock3, Flame, Star, TrendingUp } from 'lucide-react';

import { trackedApiFetch } from '@/lib/api';
import { absoluteUrl } from '@/lib/seo';
import { getPublicSiteConfig } from '@/lib/site-config';
import type { ApiGame } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type RankingsPayload = {
  code?: number;
  data?: {
    rating?: ApiGame[];
    downloads?: ApiGame[];
    latest?: ApiGame[];
    hot?: ApiGame[];
    updated_at?: string;
  };
};

type RankingRow = {
  id: string;
  pkg: string;
  title: string;
  imageUrl: string;
  category: string;
  rating?: number;
  downloads?: string;
  latestAt?: string;
  isHot?: boolean;
};

type RankingsData = {
  rating: RankingRow[];
  downloads: RankingRow[];
  latest: RankingRow[];
  hot: RankingRow[];
  updatedAt: string;
  tags: string[];
};

type RankType = '评分' | '下载量' | '更新时间' | '热门状态';
type RankingTab = 'rating' | 'downloads' | 'latest' | 'hot';

const FALLBACK_ICON = '/favicon.ico';

function parseDownloadScore(raw: string | undefined): number {
  const text = String(raw || '').trim();
  if (!text) return 0;

  const cleaned = text.replace(/,/g, '');
  const yiMatch = cleaned.match(/^([\d.]+)\s*亿$/u);
  if (yiMatch) return Number(yiMatch[1]) * 1e8;

  const wanMatch = cleaned.match(/^([\d.]+)\s*万$/u);
  if (wanMatch) return Number(wanMatch[1]) * 1e4;

  const plain = Number(cleaned.replace(/[^\d.]/g, ''));
  return Number.isFinite(plain) ? plain : 0;
}

function getGameHref(game: RankingRow): string {
  const target = String(game.pkg || game.id || '').trim();
  return target ? `/app/${encodeURIComponent(target)}` : '/app';
}

function toRow(game: ApiGame, index: number): RankingRow {
  const tags = Array.isArray(game.tags)
    ? game.tags.map((tag) => String(tag || '').trim()).filter(Boolean)
    : [];

  return {
    id: String(game._id || `ranking-${index}`),
    pkg: String(game.pkg || '').trim(),
    title: String(game.name || '未命名游戏').trim() || '未命名游戏',
    imageUrl: String(game.icon || '').trim() || FALLBACK_ICON,
    category: tags[0] || '游戏',
    rating: Number(game.star || 0),
    downloads: String(game.download_count_show || '').trim(),
    latestAt: String(game.latest_at || '').trim(),
    isHot: Boolean((game as any).is_hot),
  };
}

function dedupeRows(rows: RankingRow[]): RankingRow[] {
  const map = new Map<string, RankingRow>();
  for (const row of rows) {
    const key = String(row.pkg || row.id).trim();
    if (!key || map.has(key)) continue;
    map.set(key, row);
  }
  return Array.from(map.values());
}

function formatUpdatedTime(input: string): string {
  const text = String(input || '').trim();
  if (!text) return '未知';
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return '未知';
  return date.toLocaleString('zh-CN', { hour12: false });
}

function getRankTypeDesc(rankType: RankType): string {
  if (rankType === '评分') return '按站内评分排序，适合优先看口碑。';
  if (rankType === '下载量') return '按下载热度排序，快速看当前流行作品。';
  if (rankType === '更新时间') return '按最近更新时间排序，发现近期活跃内容。';
  return '按热门标识聚合，适合快速筛选站内重点游戏。';
}

function clampLimit(input: string | undefined, fallback = 10): number {
  const value = Number(input || fallback);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(50, Math.max(5, Math.floor(value)));
}

function normalizeTab(input: string | undefined): RankingTab {
  const value = String(input || '').trim();
  if (value === 'downloads' || value === 'latest' || value === 'hot') return value;
  return 'rating';
}

function buildRankingsHrefWithState(input: {
  tag?: string;
  limit?: number;
  tab?: RankingTab;
  showTags?: boolean;
}): string {
  const params = new URLSearchParams();
  const tag = String(input.tag || '').trim();
  const limit = Number(input.limit || 0);
  const tab = normalizeTab(input.tab);
  if (tag) params.set('tag', tag);
  if (Number.isFinite(limit) && limit > 0) params.set('limit', String(limit));
  if (tab !== 'rating') params.set('tab', tab);
  if (input.showTags) params.set('showTags', '1');
  const query = params.toString();
  return query ? `/rankings?${query}` : '/rankings';
}

async function getRankingsData(limit = 10, tag = ''): Promise<RankingsData> {
  const fallback: RankingsData = {
    rating: [],
    downloads: [],
    latest: [],
    hot: [],
    updatedAt: '',
    tags: [],
  };

  try {
    const params = new URLSearchParams({ limit: String(limit) });
    if (tag) {
      params.set('tag', tag);
    }
    const res = await trackedApiFetch(`/game/rankings?${params.toString()}`, {
      cache: 'force-cache',
      next: { revalidate: 900 },
    });
    if (!res.ok) return fallback;

    const json = (await res.json()) as RankingsPayload;
    if (Number(json?.code ?? -1) !== 0) return fallback;

    const ratingGames = Array.isArray(json?.data?.rating) ? json.data.rating : [];
    const downloadGames = Array.isArray(json?.data?.downloads) ? json.data.downloads : [];
    const latestGames = Array.isArray(json?.data?.latest) ? json.data.latest : [];
    const hotGames = Array.isArray(json?.data?.hot) ? json.data.hot : [];

    return {
      rating: dedupeRows(ratingGames.map(toRow))
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, limit),
      downloads: dedupeRows(downloadGames.map(toRow))
        .sort((a, b) => parseDownloadScore(b.downloads) - parseDownloadScore(a.downloads))
        .slice(0, limit),
      latest: dedupeRows(latestGames.map(toRow)).slice(0, limit),
      hot: dedupeRows(hotGames.map(toRow)).slice(0, limit),
      updatedAt: String(json?.data?.updated_at || '').trim(),
      tags: Array.from(
        new Set(
          [...ratingGames, ...downloadGames, ...latestGames, ...hotGames]
            .flatMap((row) => (Array.isArray(row?.tags) ? row.tags : []))
            .map((tag) => String(tag || '').trim())
            .filter(Boolean),
        ),
      ).slice(0, 16),
    };
  } catch {
    return fallback;
  }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; limit?: string; tab?: string; showTags?: string }>;
}): Promise<Metadata> {
  const config = await getPublicSiteConfig(300);
  const params = await searchParams;
  const activeTag = String(params?.tag || '').trim();
  const activeTab = normalizeTab(params?.tab);
  const hasParamPage = Boolean(
    activeTag ||
      String(params?.limit || '').trim() ||
      String(params?.tab || '').trim() ||
      String(params?.showTags || '').trim(),
  );
  const siteName = String(config?.basic?.site_name || 'APKScc').trim();
  const tabLabel =
    activeTab === 'downloads'
      ? '热度榜'
      : activeTab === 'latest'
      ? '更新榜'
      : activeTab === 'hot'
      ? '热门榜'
      : '评分榜';
  const title = activeTag
    ? `${siteName} ${activeTag} ${tabLabel}`
    : `${siteName} 热门安卓游戏排行榜`;
  const description = activeTag
    ? `查看 ${siteName} ${activeTag} 相关游戏${tabLabel}，快速筛选高评分、热门下载与近期更新作品。`
    : '查看 APKScc 热门安卓游戏排行榜，按评分与下载热度筛选热门作品，快速找到近期值得下载的游戏。';
  const shareImage = String(config?.basic?.share_image || '').trim();

  return {
    title: { absolute: title },
    description,
    robots: {
      index: !hasParamPage,
      follow: !hasParamPage,
      googleBot: {
        index: !hasParamPage,
        follow: !hasParamPage,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    alternates: {
      canonical: '/rankings',
      languages: {
        'zh-CN': '/rankings',
        'x-default': '/rankings',
      },
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl('/rankings'),
      siteName,
      type: 'website',
      locale: 'zh_CN',
      images: shareImage ? [shareImage] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: shareImage ? [shareImage] : [],
    },
  };
}

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; limit?: string; tab?: string; showTags?: string }>;
}) {
  const params = await searchParams;
  const activeTag = String(params?.tag || '').trim();
  const activeLimit = clampLimit(params?.limit, 10);
  const activeTab = normalizeTab(params?.tab);
  const showAllTags = String(params?.showTags || '') === '1';

  const rankingData = await getRankingsData(activeLimit, activeTag);
  const sortedByRating = rankingData.rating;
  const sortedByDownloads = rankingData.downloads;
  const sortedByLatest = rankingData.latest;
  const sortedByHot = rankingData.hot;
  const tagOptions = rankingData.tags;
  const visibleTags = showAllTags ? tagOptions : tagOptions.slice(0, 8);
  const updatedAtText = formatUpdatedTime(rankingData.updatedAt);

  const rankingsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'APKScc 热门安卓游戏排行榜',
    description: '按评分与下载热度整理的热门安卓游戏排行榜。',
    inLanguage: 'zh-CN',
    url: absoluteUrl('/rankings'),
    mainEntity: {
      '@type': 'ItemList',
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      numberOfItems: sortedByRating.length,
      itemListElement: sortedByRating.map((game, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(getGameHref(game)),
        name: game.title,
      })),
    },
  };

  const renderTable = (games: RankingRow[], rankType: RankType) => (
    <>
    <div className="md:hidden space-y-3">
      {games.map((game, index) => (
        <Link
          key={`${game.id}-mobile`}
          href={getGameHref(game)}
          className={`flex items-center gap-3 rounded-xl border p-3 transition-colors hover:border-primary/40 hover:bg-primary/5 ${index === 0 ? 'bg-primary/5 border-primary/30' : 'bg-card'}`}
        >
          <div className="w-7 text-center text-sm font-black text-primary">#{index + 1}</div>
          <Image
            src={game.imageUrl}
            alt={game.title}
            width={40}
            height={40}
            className="rounded-md object-cover"
            data-ai-hint={`game icon ${game.title}`}
          />
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 font-semibold text-foreground">{game.title}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="h-5 px-2">{game.category}</Badge>
              {rankType === '评分' ? <Badge variant="outline" className="h-5 px-2">评分 {game.rating || 'N/A'}</Badge> : null}
              {rankType === '下载量' ? <Badge variant="outline" className="h-5 px-2">下载 {game.downloads || '--'}</Badge> : null}
              {rankType === '更新时间' ? <Badge variant="outline" className="h-5 px-2">{formatUpdatedTime(game.latestAt || '')}</Badge> : null}
              {rankType === '热门状态' ? <Badge variant="outline" className="h-5 px-2">{game.isHot ? '热门' : '--'}</Badge> : null}
            </div>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
      ))}
      {games.length === 0 ? (
        <div className="rounded-xl border bg-card p-4 text-center text-sm text-muted-foreground">
          当前筛选暂无数据，
          <Link href="/rankings" className="ml-1 font-semibold text-primary hover:underline">
            回到默认榜单
          </Link>
        </div>
      ) : null}
    </div>
    <div className="hidden md:block">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">排名</TableHead>
          <TableHead>游戏名称</TableHead>
          <TableHead className="hidden md:table-cell">类型</TableHead>
          <TableHead className="text-right">{rankType}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {games[0] ? (
          <TableRow key={`${games[0].id}-top`} className="bg-primary/5">
            <TableCell className="font-black text-primary">#1</TableCell>
            <TableCell>
              <Link href={getGameHref(games[0])} className="group flex items-center gap-3">
                <Image
                  src={games[0].imageUrl}
                  alt={games[0].title}
                  width={40}
                  height={40}
                  className="rounded-md object-cover ring-2 ring-primary/20"
                  data-ai-hint={`game icon ${games[0].title}`}
                />
                <div className="min-w-0">
                  <p className="line-clamp-1 font-semibold transition-colors group-hover:text-primary">{games[0].title}</p>
                  <p className="text-xs text-muted-foreground">{getRankTypeDesc(rankType)}</p>
                </div>
              </Link>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <Badge variant="outline">{games[0].category}</Badge>
            </TableCell>
            <TableCell className="text-right">
              {rankType === '评分' ? (
                <div className="flex items-center justify-end">
                  <Star className="mr-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {games[0].rating || 'N/A'}
                </div>
              ) : rankType === '更新时间' ? (
                <span>{formatUpdatedTime(games[0].latestAt || '')}</span>
              ) : rankType === '热门状态' ? (
                games[0].isHot ? <span className="text-[#b71211]">热门</span> : '--'
              ) : (
                games[0].downloads || '--'
              )}
            </TableCell>
          </TableRow>
        ) : null}
        {games.slice(1).map((game, index) => (
          <TableRow key={game.id} className="transition-colors hover:bg-muted/50">
            <TableCell className="font-medium">{index + 2}</TableCell>
            <TableCell>
              <Link href={getGameHref(game)} className="group flex items-center gap-3">
                <Image
                  src={game.imageUrl}
                  alt={game.title}
                  width={40}
                  height={40}
                  className="rounded-md object-cover"
                  data-ai-hint={`game icon ${game.title}`}
                />
                <span className="font-semibold transition-colors group-hover:text-primary">{game.title}</span>
              </Link>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <Badge variant="outline">{game.category}</Badge>
            </TableCell>
            <TableCell className="text-right">
              {rankType === '评分' ? (
                <div className="flex items-center justify-end">
                  <Star className="mr-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {game.rating || 'N/A'}
                </div>
              ) : rankType === '更新时间' ? (
                <span>{formatUpdatedTime(game.latestAt || '')}</span>
              ) : rankType === '热门状态' ? (
                game.isHot ? <span className="text-[#b71211]">热门</span> : '--'
              ) : (
                game.downloads || '--'
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
    </>
  );

  return (
    <div className="fade-in space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(rankingsJsonLd) }} />
      <section className="rounded-lg bg-card p-6 shadow">
        <div className="mb-4 flex items-center">
          <BarChartBig className="mr-3 h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold text-primary">游戏排行榜</h1>
        </div>
        <p className="text-muted-foreground">查看热门与高评分游戏，了解本周受欢迎的安卓作品、下载趋势与代表玩法。</p>
        <div className="mt-4 grid gap-4 text-sm text-muted-foreground md:grid-cols-3">
          <div className="rounded-xl border bg-background/70 p-4">
            <p className="font-semibold text-foreground">榜单说明</p>
            <p className="mt-2">本页聚合近期热门安卓游戏，适合想快速筛选高热度与高口碑作品的用户。</p>
          </div>
          <div className="rounded-xl border bg-background/70 p-4">
            <p className="font-semibold text-foreground">排名逻辑</p>
            <p className="mt-2">评分榜优先参考站内评分，热度榜优先参考下载量展示数据，帮助你区分口碑与流行度。</p>
          </div>
          <div className="rounded-xl border bg-background/70 p-4">
            <p className="font-semibold text-foreground">更新时间</p>
            <p className="mt-2">榜单数据来自线上接口聚合，最近刷新时间：{updatedAtText}。</p>
          </div>
        </div>
        <div className="mt-5 rounded-xl border bg-background/70 p-4">
          <p className="text-sm font-semibold text-foreground">标签筛选（复用现有接口）</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={buildRankingsHrefWithState({ limit: activeLimit, tab: activeTab, showTags: showAllTags })}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                !activeTag
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              全部
            </Link>
            {visibleTags.map((tag) => {
              const href = buildRankingsHrefWithState({ tag, limit: activeLimit, tab: activeTab, showTags: showAllTags });
              const active = activeTag === tag;
              return (
                <Link
                  key={tag}
                  href={href}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    active
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  {tag}
                </Link>
              );
            })}
            {activeTag ? (
              <Link
                href={buildRankingsHrefWithState({ limit: activeLimit, tab: activeTab, showTags: showAllTags })}
                className="rounded-full border border-[#b71211]/40 bg-[#b71211]/5 px-3 py-1 text-xs font-semibold text-[#b71211]"
              >
                清空筛选
              </Link>
            ) : null}
            {tagOptions.length > 8 ? (
              <Link
                href={buildRankingsHrefWithState({ tag: activeTag, limit: activeLimit, tab: activeTab, showTags: !showAllTags })}
                className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-foreground"
              >
                {showAllTags ? '收起标签' : `展开更多 (${tagOptions.length})`}
              </Link>
            ) : null}
          </div>
          {activeTag ? (
            <p className="mt-3 text-xs text-muted-foreground">当前筛选：{activeTag}</p>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">当前筛选：全部标签</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {[10, 20, 30].map((size) => {
              const href = buildRankingsHrefWithState({ tag: activeTag, limit: size, tab: activeTab, showTags: showAllTags });
              const active = activeLimit === size;
              return (
                <Link
                  key={size}
                  href={href}
                  className={`rounded-full border px-3 py-1 font-semibold ${
                    active
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  每榜 {size} 条
                </Link>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            当前数据量：评分 {sortedByRating.length} / 下载 {sortedByDownloads.length} / 更新 {sortedByLatest.length} / 热门 {sortedByHot.length}
          </p>
        </div>
      </section>

      <section className="-mt-2">
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'rating', label: '评分榜' },
            { value: 'downloads', label: '热度榜' },
            { value: 'latest', label: '更新榜' },
            { value: 'hot', label: '热门榜' },
          ].map((item) => {
            const isActive = activeTab === item.value;
            return (
              <Link
                key={item.value}
                href={buildRankingsHrefWithState({ tag: activeTag, limit: activeLimit, tab: item.value as RankingTab, showTags: showAllTags })}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </section>

      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-2 md:grid-cols-4 md:w-full">
          <TabsTrigger value="rating" className="btn-interactive">
            <Star size={16} className="mr-2" />评分榜
          </TabsTrigger>
          <TabsTrigger value="downloads" className="btn-interactive">
            <TrendingUp size={16} className="mr-2" />热度榜
          </TabsTrigger>
          <TabsTrigger value="latest" className="btn-interactive">
            <Clock3 size={16} className="mr-2" />更新榜
          </TabsTrigger>
          <TabsTrigger value="hot" className="btn-interactive">
            <Flame size={16} className="mr-2" />热门榜
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rating">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="mr-2 h-5 w-5 fill-yellow-400 text-yellow-400" />
                评分排行榜
              </CardTitle>
              <p className="text-sm text-muted-foreground">优先展示评分较高的游戏，适合先看口碑。</p>
            </CardHeader>
            <CardContent>
              {sortedByRating.length > 0 ? (
                renderTable(sortedByRating, '评分')
              ) : (
                <p className="text-sm text-muted-foreground">
                  暂无可展示数据，
                  <Link href="/rankings" className="font-semibold text-primary hover:underline">
                    回到默认榜单
                  </Link>
                  。
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="downloads">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-red-500" />
                热门下载榜
              </CardTitle>
              <p className="text-sm text-muted-foreground">按下载热度排序，快速发现当前流行作品。</p>
            </CardHeader>
            <CardContent>
              {sortedByDownloads.length > 0 ? (
                renderTable(sortedByDownloads, '下载量')
              ) : (
                <p className="text-sm text-muted-foreground">
                  暂无可展示数据，
                  <Link href="/rankings" className="font-semibold text-primary hover:underline">
                    回到默认榜单
                  </Link>
                  。
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="latest">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock3 className="mr-2 h-5 w-5 text-[#005e9f]" />
                最近更新榜
              </CardTitle>
              <p className="text-sm text-muted-foreground">按最近更新时间排序，适合关注近期活跃更新。</p>
            </CardHeader>
            <CardContent>
              {sortedByLatest.length > 0 ? (
                renderTable(sortedByLatest, '更新时间')
              ) : (
                <p className="text-sm text-muted-foreground">
                  暂无可展示数据，
                  <Link href="/rankings" className="font-semibold text-primary hover:underline">
                    回到默认榜单
                  </Link>
                  。
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hot">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Flame className="mr-2 h-5 w-5 text-[#b71211]" />
                站内热门榜
              </CardTitle>
              <p className="text-sm text-muted-foreground">按热门标识聚合，快速查看站内重点游戏。</p>
            </CardHeader>
            <CardContent>
              {sortedByHot.length > 0 ? (
                renderTable(sortedByHot, '热门状态')
              ) : (
                <p className="text-sm text-muted-foreground">
                  暂无可展示数据，
                  <Link href="/rankings" className="font-semibold text-primary hover:underline">
                    回到默认榜单
                  </Link>
                  。
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>如何使用这份排行榜</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>如果你更看重玩法口碑，可以先看评分榜，再进入详情页核对标签、版本、文件大小与更新时间。</p>
            <p>如果你想快速找到当前受欢迎的作品，可以先看热度榜，再结合分类和简介判断是否适合自己。</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>编辑建议</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>榜单页适合做第一轮筛选，真正下载前仍建议进入详情页查看版本、截图、社区讨论和安装提示。</p>
            <p>如果你偏爱某一题材，可以优先关注榜单中的类型标签，再延伸浏览同类推荐和相关资讯内容。</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
