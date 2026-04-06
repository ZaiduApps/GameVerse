import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MOCK_GAMES } from '@/lib/constants';
import Image from 'next/image';
import Link from 'next/link';
import { Star, BarChartBig, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
      <section className="rounded-lg bg-card p-6 shadow">
        <div className="mb-4 flex items-center">
          <BarChartBig className="mr-3 h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold text-primary">游戏排行榜</h1>
        </div>
        <p className="text-muted-foreground">查看热门与高评分游戏。</p>
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
    </div>
  );
}
