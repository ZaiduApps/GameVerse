
'use client'; 

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MOCK_NEWS_ARTICLES } from '@/lib/constants';
import type { NewsArticle } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CalendarDays, UserCircle, Newspaper, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState } from 'react'; // For potential future filtering

const newsCategories = ['全部', '游戏攻略', '行业新闻', '最新动态', '深度评测', '活动预告'];
const ITEMS_PER_PAGE = 9; // Number of articles per page

export default function NewsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  // For now, we'll display a slice of all articles. Filtering would require more state.
  // const articlesToDisplay = MOCK_NEWS_ARTICLES; // Display all for now, pagination can be added

  const totalArticles = MOCK_NEWS_ARTICLES.length;
  const totalPages = Math.ceil(totalArticles / ITEMS_PER_PAGE);

  const articlesToDisplay = MOCK_NEWS_ARTICLES.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );


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
              variant={index === 0 ? "default" : "outline"} // Example active state for "全部"
              className="btn-interactive"
              onClick={() => alert(`切换到 ${category} 分类 (模拟)`)}
            >
              {category}
            </Button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articlesToDisplay.map((article, index) => {
          const isFirstArticleOnPage = index === 0 && currentPage === 1; // Highlight first article only on the first page
          return (
            <Card
              key={article.id}
              className={cn(
                "flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300 fade-in",
                isFirstArticleOnPage && "md:col-span-2 lg:col-span-2" // First article spans 2 columns on md and lg
              )}
              style={{ animationDelay: `${0.2 + index * 0.07}s` }}
            >
              <CardHeader className="p-0">
                <Link href={`/news/${article.id}`} className={cn(
                  "block relative",
                  isFirstArticleOnPage ? "aspect-[16/8] sm:aspect-[16/7] md:aspect-[16/7.5]" : "aspect-video" 
                )}>
                  <Image
                    src={article.imageUrl}
                    alt={article.title}
                    fill
                    className="object-cover"
                    data-ai-hint={article.dataAiHint || 'news image'}
                    sizes={isFirstArticleOnPage ? "(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
                    priority={isFirstArticleOnPage}
                  />
                </Link>
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <Badge variant="secondary" className="mb-2">{article.category}</Badge>
                <Link href={`/news/${article.id}`}>
                  <CardTitle className={cn(
                    "font-semibold mb-2 hover:text-primary transition-colors line-clamp-2",
                    isFirstArticleOnPage ? "text-xl md:text-2xl" : "text-lg md:text-xl"
                  )}>{article.title}</CardTitle>
                </Link>
                <CardDescription className={cn(
                  "text-muted-foreground",
                  isFirstArticleOnPage ? "text-sm md:text-base line-clamp-3 sm:line-clamp-4" : "text-sm line-clamp-3"
                )}>{article.excerpt || '暂无摘要'}</CardDescription>
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

      {totalPages > 1 && (
         <div className="flex justify-center items-center space-x-2 mt-10 fade-in" style={{ animationDelay: '1s' }}>
           <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentPage(p => Math.max(1, p-1))}
            disabled={currentPage === 1}
            className="btn-interactive"
           >
             上一页
           </Button>
           <span className="text-sm text-muted-foreground">
             第 {currentPage} 页 / 共 {totalPages} 页
           </span>
           <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}
            disabled={currentPage === totalPages}
            className="btn-interactive"
           >
             下一页
           </Button>
         </div>
      )}
      {articlesToDisplay.length === 0 && (
        <p className="text-center text-muted-foreground py-8">暂无资讯。</p>
      )}
    </div>
  );
}
