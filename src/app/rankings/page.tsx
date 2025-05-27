
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MOCK_GAMES } from '@/lib/constants';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ArrowDownUp, BarChartBig, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


export default function RankingsPage() {
  const sortedByRating = [...MOCK_GAMES].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10);
  const sortedByDownloads = [...MOCK_GAMES] // Example, needs actual download numbers to sort properly
    .sort((a,b) => {
        const parseDownloads = (str: string | undefined) => {
            if (!str) return 0;
            const num = parseFloat(str.replace('亿', 'e8').replace('万', 'e4'));
            return isNaN(num) ? 0 : num;
        };
        return parseDownloads(b.downloads) - parseDownloads(a.downloads);
    }).slice(0,10);


  const renderTable = (games: typeof MOCK_GAMES, rankType: string) => (
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
          <TableRow key={game.id} className="hover:bg-muted/50 transition-colors">
            <TableCell className="font-medium">{index + 1}</TableCell>
            <TableCell>
              <Link href={`/games/${game.id}`} className="flex items-center gap-3 group">
                <Image 
                  src={game.imageUrl} 
                  alt={game.title} 
                  width={40} 
                  height={40} 
                  className="rounded-md object-cover"
                  data-ai-hint={game.dataAiHint} 
                />
                <span className="font-semibold group-hover:text-primary transition-colors">{game.title}</span>
              </Link>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <Badge variant="outline">{game.category}</Badge>
            </TableCell>
            <TableCell className="text-right">
              {rankType === '评分' && (
                <div className="flex items-center justify-end">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" /> {game.rating || 'N/A'}
                </div>
              )}
              {rankType === '下载量' && game.downloads}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );


  return (
    <div className="space-y-8 fade-in">
      <section className="bg-card p-6 rounded-lg shadow">
        <div className="flex items-center mb-4">
          <BarChartBig className="w-8 h-8 text-primary mr-3" />
          <h1 className="text-3xl font-bold text-primary">游戏排行榜</h1>
        </div>
        <p className="text-muted-foreground">查看最受欢迎和评分最高的游戏。</p>
      </section>

      <Tabs defaultValue="rating" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex mb-6">
          <TabsTrigger value="rating" className="btn-interactive"><Star size={16} className="mr-2"/>评分榜</TabsTrigger>
          <TabsTrigger value="downloads" className="btn-interactive"><TrendingUp size={16} className="mr-2"/>热门榜</TabsTrigger>
        </TabsList>
        <TabsContent value="rating">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="w-6 h-6 text-yellow-400 fill-yellow-400 mr-2" />
                评分排行榜
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderTable(sortedByRating, '评分')}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="downloads">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-6 h-6 text-red-500 mr-2" />
                热门下载榜
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderTable(sortedByDownloads, '下载量')}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
