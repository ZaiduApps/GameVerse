
import { MOCK_GAMES } from '@/lib/constants';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Download, Users, Tag, CalendarDays, Info, HardDrive, Tags as TagsIcon, AlertTriangle, Megaphone, Newspaper as NewsIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import GameDownloadDialog from '@/components/game-download-dialog';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export async function generateStaticParams() {
  return MOCK_GAMES.map((game) => ({
    id: game.id,
  }));
}

// Re-define NewsArticle interface and mock data generation locally for this page
// (Ideally, this would be centralized if used in more places or becomes complex)
interface NewsArticle {
  id: string;
  title: string;
  content: string; 
  imageUrl: string;
  dataAiHint?: string;
  category: string;
  date: string;
  author: string;
  tags?: string[];
}

// This mock data generation mirrors the one in src/app/news/[id]/page.tsx
// to ensure compatibility with news detail page links and structure.
const localMockNewsArticles: NewsArticle[] = MOCK_GAMES.map((g, index) => ({
  id: `news-${g.id}`, // This ID structure matches what the news detail page expects
  title: `${g.title} 最新动态与攻略分享`,
  content: `这篇关于《${g.title}》的文章深入探讨了其最新更新、社区热点以及一些高级游戏技巧。\n\n${g.description}\n\n更多详细内容，包括最新的角色介绍、活动预告以及玩家社区的精彩讨论，都将在这里为您呈现。我们致力于提供最全面、最及时的游戏资讯，帮助您更好地享受《${g.title}》带来的乐趣。\n\n敬请期待后续的独家报道和深度评测！`,
  imageUrl: g.imageUrl, // Using game's image for related news consistency
  dataAiHint: g.dataAiHint ? `${g.dataAiHint} news` : "news article",
  category: index % 2 === 0 ? '游戏攻略' : '行业新闻',
  date: `2024年${Math.max(1, 7 - index)}月${Math.min(28, 15 + index)}日`, // Ensure valid dates
  author: '游戏宇宙编辑部',
  tags: g.tags ? [...g.tags, (index % 3 === 0 ? '热门' : '深度分析')] : ['资讯'],
}));


export default function GameDetailPage({ params }: { params: { id: string } }) {
  const game = MOCK_GAMES.find(g => g.id === params.id);

  if (!game) {
    return <div className="text-center py-10">游戏未找到</div>;
  }

  // Filter relevant news for the current game
  const gameSpecificNews = localMockNewsArticles.filter(article => 
    article.id === `news-${game.id}` || article.title.includes(game.title) 
  ).slice(0, 3); // Show up to 3 related news items

  // Function to generate excerpt from content
  const createExcerpt = (text: string, maxLength: number = 100): string => {
    const firstParagraph = text.split('\n\n')[0];
    if (firstParagraph.length <= maxLength) return firstParagraph;
    // Try to cut at a sentence ending if possible, otherwise at a word
    let cutPoint = firstParagraph.lastIndexOf('。', maxLength);
    if (cutPoint === -1) cutPoint = firstParagraph.lastIndexOf('！', maxLength);
    if (cutPoint === -1) cutPoint = firstParagraph.lastIndexOf('？', maxLength);
    if (cutPoint === -1) cutPoint = firstParagraph.lastIndexOf(' ', maxLength);
    
    if (cutPoint === -1 || cutPoint < maxLength / 2) { // if no good cut point or too short
        return firstParagraph.substring(0, maxLength) + '...';
    }
    return firstParagraph.substring(0, cutPoint + 1) + '...';
  };

  return (
    <div className="space-y-8 fade-in">
      {/* Site-wide Announcement */}
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

      {/* Marquee Section (Static Placeholder) */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center">
            <Megaphone className="w-5 h-5 text-accent mr-3 flex-shrink-0" />
            <p className="text-xs md:text-sm text-foreground/80">
              <span className="font-semibold text-accent">跑马灯位置：</span> 热门活动《夏季嘉年华》火热进行中！ | 《${game.title}》新版本 V${game.version || '1.0.0'} 现已上线，快来体验！
            </p>
          </div>
        </CardContent>
      </Card>
      
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
              width={88} 
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

          {/* Game-specific News Section */}
          {gameSpecificNews.length > 0 && (
            <div className="pt-6 mt-6 border-t">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <NewsIcon className="w-5 h-5 text-primary mr-2" />
                《{game.title}》相关资讯
              </h2>
              <div className="space-y-4">
                {gameSpecificNews.map(newsItem => (
                  <Card key={newsItem.id} className="hover:shadow-lg transition-shadow duration-200 ease-in-out">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row gap-x-4 gap-y-3">
                        <Link href={`/news/${newsItem.id}`} className="block sm:w-32 flex-shrink-0">
                          <div className="relative w-full aspect-video sm:aspect-square rounded-md overflow-hidden bg-muted">
                            <Image 
                              src={newsItem.imageUrl} 
                              alt={newsItem.title} 
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              data-ai-hint={newsItem.dataAiHint || 'news article image'}
                              sizes="(max-width: 640px) 100vw, 128px"
                            />
                          </div>
                        </Link>
                        <div className="flex-grow">
                          <Badge variant="outline" className="text-xs mb-1">{newsItem.category}</Badge>
                          <h3 className="text-base md:text-lg font-semibold mb-1 text-foreground hover:text-primary transition-colors">
                            <Link href={`/news/${newsItem.id}`}>{newsItem.title}</Link>
                          </h3>
                          <p className="text-xs text-muted-foreground mb-2">{newsItem.date} - {newsItem.author}</p>
                          <p className="text-sm text-foreground/80 mb-3 line-clamp-2">
                            {createExcerpt(newsItem.content, 80)}
                          </p>
                          <Button asChild variant="link" size="sm" className="p-0 h-auto text-primary hover:underline font-medium">
                            <Link href={`/news/${newsItem.id}`}>阅读全文 &rarr;</Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}

