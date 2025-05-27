
import { MOCK_GAMES } from '@/lib/constants';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Download, Users, Tag, CalendarDays, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export async function generateStaticParams() {
  return MOCK_GAMES.map((game) => ({
    id: game.id,
  }));
}

export default function GameDetailPage({ params }: { params: { id: string } }) {
  const game = MOCK_GAMES.find(g => g.id === params.id);

  if (!game) {
    return <div className="text-center py-10">游戏未找到</div>;
  }

  return (
    <div className="space-y-8 fade-in">
      <Card className="overflow-hidden shadow-xl">
        <CardHeader className="p-0 relative aspect-[16/9] md:aspect-[16/7]">
          <Image
            src={game.imageUrl}
            alt={game.title}
            fill
            priority
            className="object-cover"
            data-ai-hint={game.dataAiHint}
            sizes="(max-width: 768px) 100vw, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 md:p-8 flex flex-col justify-end">
            <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg">{game.title}</h1>
            <p className="text-lg text-gray-200 mt-2 hidden md:block drop-shadow-md">{game.developer}</p>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-lg">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 mr-1.5" />
                <span className="font-semibold">{game.rating || 'N/A'}</span>
                <span className="text-sm text-muted-foreground ml-1">(评分)</span>
              </div>
              <div className="flex items-center text-lg">
                <Download className="w-5 h-5 text-primary mr-1.5" />
                <span className="font-semibold">{game.downloads || 'N/A'}</span>
                <span className="text-sm text-muted-foreground ml-1">(下载)</span>
              </div>
            </div>
            <Button size="lg" className="w-full md:w-auto btn-interactive">
              <Download className="mr-2 h-5 w-5" />
              获取游戏
            </Button>
          </div>
          
          <Separator className="my-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-sm">
            <div className="space-y-2">
              <div className="flex items-center"><Users className="w-4 h-4 mr-2 text-muted-foreground" /><strong>开发商:</strong> <span className="ml-1">{game.developer || '未知'}</span></div>
              <div className="flex items-center"><Tag className="w-4 h-4 mr-2 text-muted-foreground" /><strong>类型:</strong> <span className="ml-1">{game.category}</span></div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center"><CalendarDays className="w-4 h-4 mr-2 text-muted-foreground" /><strong>发布日期:</strong> <span className="ml-1">{game.releaseDate || '未知'}</span></div>
              <div className="flex items-center"><Info className="w-4 h-4 mr-2 text-muted-foreground" /><strong>版本:</strong> <span className="ml-1">{game.version || 'N/A'}</span> / <strong>大小:</strong> <span className="ml-1">{game.size || 'N/A'}</span></div>
            </div>
          </div>
          
          {game.tags && game.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">标签:</h3>
              <div className="flex flex-wrap gap-2">
                {game.tags.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          <h2 className="text-xl font-semibold mt-8 mb-3">游戏介绍</h2>
          <p className="text-foreground/80 leading-relaxed whitespace-pre-line">{game.description}</p>
          
          {/* Placeholder for screenshots */}
          <h2 className="text-xl font-semibold mt-8 mb-3">游戏截图</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="aspect-video bg-muted rounded-md overflow-hidden">
                <Image src={`https://placehold.co/300x169.png`} alt={`截图 ${i}`} width={300} height={169} className="w-full h-full object-cover" data-ai-hint="gameplay screenshot" />
              </div>
            ))}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
