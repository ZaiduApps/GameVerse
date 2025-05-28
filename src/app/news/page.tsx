
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MOCK_GAMES } from '@/lib/constants'; // Using for variety, replace with actual news
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CalendarDays, UserCircle, Newspaper, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  dataAiHint?: string;
  category: string;
  date: string;
  author: string;
  tags?: string[];
}

const mockNews: NewsArticle[] = MOCK_GAMES.slice(0, 7).map((game, index) => ({ // Increased to 7 for better layout demo
  id: `news-${game.id}-${index}`, // Unique IDs
  title: `${game.title} ${index === 0 ? '深度独家解析与未来展望' : index === 1 ? '最新动态与攻略分享' : `相关资讯 #${index}`}`,
  excerpt: `探索 ${game.title} 的最新更新内容，包括新角色、活动以及深度游戏技巧，助您成为游戏高手！${game.shortDescription} 这是第${index+1}条相关模拟新闻，提供更多细节。`,
  imageUrl: game.imageUrl,
  dataAiHint: game.dataAiHint,
  category: index % 3 === 0 ? '深度评测' : index % 3 === 1 ? '游戏攻略' : '行业新闻',
  date: `2024年${7 - (index % 7)}月${Math.min(28,15 + index)}日`,
  author: '游戏宇宙编辑部',
  tags: game.tags ? [...game.tags, (index === 0 ? '独家' : '常规')] : ['资讯']
}));

const newsCategories = ['全部', '游戏攻略', '行业新闻', '最新动态', '深度评测', '活动预告'];

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

      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Tag className="w-5 h-5 text-primary mr-2" />
          资讯分类
        </h2>
        <div className="flex flex-wrap gap-2 mb-8">
          {newsCategories.map((category, index) => (
            <Button 
              key={category} 
              variant={index === 0 ? "default" : "outline"} 
              className="btn-interactive"
              onClick={() => alert(`切换到 ${category} 分类 (模拟)`)}
            >
              {category}
            </Button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockNews.map((article, index) => {
          const isFirstArticle = index === 0;
          return (
            <Card 
              key={article.id} 
              className={cn(
                "flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300 fade-in",
                isFirstArticle && "md:col-span-2 lg:col-span-2" // First article spans 2 columns on md and lg
              )}
              style={{ animationDelay: `${0.2 + index * 0.07}s` }}
            >
              <CardHeader className="p-0">
                <Link href={`/news/${article.id}`} className={cn(
                  "block relative",
                  isFirstArticle ? "aspect-[16/8] sm:aspect-[16/7] md:aspect-[16/7.5]" : "aspect-video" // Taller aspect ratio for first image
                )}>
                  <Image 
                    src={article.imageUrl} 
                    alt={article.title} 
                    fill
                    className="object-cover"
                    data-ai-hint={article.dataAiHint}
                    sizes={isFirstArticle ? "(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
                    priority={isFirstArticle}
                  />
                </Link>
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <Badge variant="secondary" className="mb-2">{article.category}</Badge>
                <Link href={`/news/${article.id}`}>
                  <CardTitle className={cn(
                    "font-semibold mb-2 hover:text-primary transition-colors line-clamp-2",
                    isFirstArticle ? "text-xl md:text-2xl" : "text-lg md:text-xl"
                  )}>{article.title}</CardTitle>
                </Link>
                <CardDescription className={cn(
                  "text-muted-foreground",
                  isFirstArticle ? "text-sm md:text-base line-clamp-3 sm:line-clamp-4" : "text-sm line-clamp-3"
                )}>{article.excerpt}</CardDescription>
              </CardContent>
              <CardFooter className="p-4 border-t mt-auto">
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
          );
        })}
      </div>
      
      {mockNews.length > 6 && ( // Show load more if there are more than initially loaded
         <div className="text-center mt-10 fade-in" style={{ animationDelay: '1s' }}>
           <Button variant="outline" size="lg" className="btn-interactive">加载更多资讯</Button>
         </div>
      )}
    </div>
  );
}
