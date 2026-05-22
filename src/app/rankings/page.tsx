import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MOCK_GAMES } from '@/lib/constants';
import Image from 'next/image';
import Link from 'next/link';
import { Star, BarChartBig, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { absoluteUrl } from '@/lib/seo';
import { getPublicSiteConfig } from '@/lib/site-config';

export async function generateMetadata(): Promise<Metadata> {
  const config = await getPublicSiteConfig(300);
  const siteName = String(config?.basic?.site_name || 'APKScc').trim();
  const title = `${siteName} 热门安卓游戏排行榜`;
  const description = '查看 APKScc 热门安卓游戏排行榜，按评分与下载热度筛选热门作品，快速找到近期值得下载的游戏。';
  const shareImage = String(config?.basic?.share_image || '').trim();

  return {
    title: { absolute: title },
    description,
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

export default function RankingsPage() {
  const sortedByRating = [...MOCK_GAMES]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 10);

  const sortedByDownloads = [...MOCK_GAMES]
    .sort((a, b) => {
      const parseDownloads = (str: string | undefined) => {
        if (!str) return 0;
        const normalized = str.replace('亿', 'e8').replace('万', 'e4').replace(/,/g, '');
        const num = parseFloat(normalized);
        return Number.isNaN(num) ? 0 : num;
      };
      return parseDownloads(b.downloads) - parseDownloads(a.downloads);
    })
    .slice(0, 10);

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
        url: absoluteUrl(`/app/${encodeURIComponent(game.pkg || game.id)}`),
        name: game.title,
      })),
    },
  };

  const renderTable = (games: typeof MOCK_GAMES, rankType: '评分' | '下载量') => (
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
        {games.map((game, index) => (
          <TableRow key={game.id} className="transition-colors hover:bg-muted/50">
            <TableCell className="font-medium">{index + 1}</TableCell>
            <TableCell>
              <Link href={`/app/${game.pkg || game.id}`} className="group flex items-center gap-3">
                <Image
                  src={game.imageUrl}
                  alt={game.title}
                  width={40}
                  height={40}
                  className="rounded-md object-cover"
                  data-ai-hint={game.dataAiHint}
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
              ) : (
                game.downloads || '--'
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
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
            <p className="mt-2">榜单内容基于当前内置样本整理，建议结合详情页中的版本与更新时间继续判断是否值得下载。</p>
          </div>
        </div>
      </section>

      <Tabs defaultValue="rating" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-2 md:inline-flex md:w-auto">
          <TabsTrigger value="rating" className="btn-interactive">
            <Star size={16} className="mr-2" />评分榜
          </TabsTrigger>
          <TabsTrigger value="downloads" className="btn-interactive">
            <TrendingUp size={16} className="mr-2" />热度榜
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rating">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="mr-2 h-5 w-5 fill-yellow-400 text-yellow-400" />
                评分排行榜
              </CardTitle>
            </CardHeader>
            <CardContent>{renderTable(sortedByRating, '评分')}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="downloads">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-red-500" />
                热门下载榜
              </CardTitle>
            </CardHeader>
            <CardContent>{renderTable(sortedByDownloads, '下载量')}</CardContent>
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
