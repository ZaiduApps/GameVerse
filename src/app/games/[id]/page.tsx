
import { MOCK_GAMES } from '@/lib/constants';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Download, Users, Tag, CalendarDays, Info, HardDrive, Tags as TagsIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import GameDownloadDialog from '@/components/game-download-dialog';

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
        <CardHeader className="p-0 relative aspect-[16/7] sm:aspect-[2/1] md:aspect-[16/6]">
          <Image
            src={game.imageUrl}
            alt={`${game.title} banner`}
            fill
            priority
            className="object-cover"
            data-ai-hint={game.dataAiHint}
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 1200px"
          />
        </CardHeader>
        <CardContent className="p-4 md:p-6 space-y-6">
          {/* Top Info Block: Icon, Title/Dev, Download Button */}
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <Image
              src={game.imageUrl} // Using main image as icon source
              alt={`${game.title} icon`}
              width={88} // Larger icon: 88px
              height={88}
              className="rounded-xl object-cover flex-shrink-0 border shadow-md"
              data-ai-hint={game.dataAiHint ? `${game.dataAiHint} icon` : "game icon"}
            />
            <div className="flex-grow">
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{game.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">{game.developer}</p>
            </div>
            <div className="w-full sm:w-auto flex-shrink-0 pt-2 sm:pt-0">
              <GameDownloadDialog />
            </div>
          </div>

          {/* Detailed Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-sm pt-2">
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-2" />
              <div>
                <p className="text-muted-foreground text-xs">评分</p>
                <p className="font-semibold">{game.rating || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Download className="w-4 h-4 text-primary mr-2" />
               <div>
                <p className="text-muted-foreground text-xs">下载量</p>
                <p className="font-semibold">{game.downloads || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Tag className="w-4 h-4 text-blue-500 mr-2" />
              <div>
                <p className="text-muted-foreground text-xs">类型</p>
                <p className="font-semibold">{game.category}</p>
              </div>
            </div>
            <div className="flex items-center">
              <CalendarDays className="w-4 h-4 text-green-500 mr-2" />
              <div>
                <p className="text-muted-foreground text-xs">发布日期</p>
                <p className="font-semibold">{game.releaseDate || '未知'}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Info className="w-4 h-4 text-purple-500 mr-2" />
              <div>
                <p className="text-muted-foreground text-xs">版本</p>
                <p className="font-semibold">{game.version || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center">
              <HardDrive className="w-4 h-4 text-orange-500 mr-2" />
              <div>
                <p className="text-muted-foreground text-xs">大小</p>
                <p className="font-semibold">{game.size || 'N/A'}</p>
              </div>
            </div>
          </div>
          
          {/* Tags Section */}
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
            <p className="text-foreground/80 leading-relaxed whitespace-pre-line">{game.description}</p>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mt-6 mb-3">游戏截图</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="aspect-video bg-muted rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow">
                  <Image 
                    src={`https://placehold.co/300x169.png`} 
                    alt={`游戏截图 ${i}`} 
                    width={300} 
                    height={169} 
                    className="w-full h-full object-cover" 
                    data-ai-hint="gameplay screenshot" 
                  />
                </div>
              ))}
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
