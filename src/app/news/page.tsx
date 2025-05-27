
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MOCK_GAMES } from '@/lib/constants'; // Using for variety, replace with actual news
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CalendarDays, UserCircle, Newspaper } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  dataAiHint?: string;
  category: string;
  date: string;
  author: string;
}

const mockNews: NewsArticle[] = MOCK_GAMES.slice(0,6).map((game, index) => ({
  id: `news-${game.id}`,
  title: `${game.title} 最新动态与攻略分享`,
  excerpt: `探索 ${game.title} 的最新更新内容，包括新角色、活动以及深度游戏技巧，助您成为游戏高手！${game.shortDescription}`,
  imageUrl: game.imageUrl,
  dataAiHint: game.dataAiHint,
  category: index % 2 === 0 ? '游戏攻略' : '行业新闻',
  date: `2024年${7 - index}月${15 + index}日`,
  author: '游戏宇宙编辑部'
}));


export default function NewsPage() {
  return (
    <div className="space-y-8 fade-in">
      <section className="bg-card p-6 rounded-lg shadow">
        <div className="flex items-center mb-4">
         <Newspaper className="w-8 h-8 text-primary mr-3" />
          <h1 className="text-3xl font-bold text-primary">游戏资讯</h1>
        </div>
        <p className="text-muted-foreground">获取最新的游戏新闻、更新和深度分析。</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockNews.map((article, index) => (
          <Card key={article.id} className="flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300 fade-in" style={{ animationDelay: `${0.2 + index * 0.1}s` }}>
            <CardHeader className="p-0">
              <Link href={`/news/${article.id}`} className="block relative aspect-video">
                <Image 
                  src={article.imageUrl} 
                  alt={article.title} 
                  fill
                  className="object-cover"
                  data-ai-hint={article.dataAiHint}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </Link>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
              <Badge variant="secondary" className="mb-2">{article.category}</Badge>
              <Link href={`/news/${article.id}`}>
                <CardTitle className="text-xl font-semibold mb-2 hover:text-primary transition-colors line-clamp-2">{article.title}</CardTitle>
              </Link>
              <CardDescription className="text-sm text-muted-foreground line-clamp-3">{article.excerpt}</CardDescription>
            </CardContent>
            <CardFooter className="p-4 border-t">
              <div className="flex justify-between items-center w-full text-xs text-muted-foreground">
                <div className="flex items-center">
                  <CalendarDays size={14} className="mr-1.5" />
                  <span>{article.date}</span>
                </div>
                <div className="flex items-center">
                  <UserCircle size={14} className="mr-1.5" />
                  <span>{article.author}</span>
                </div>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="text-center mt-10 fade-in" style={{ animationDelay: '1s' }}>
        <Button variant="outline" size="lg" className="btn-interactive">加载更多资讯</Button>
      </div>
    </div>
  );
}

