
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
import { useState } from 'react';

const newsCategories = ['全部', '游戏攻略', '行业新闻', '最新动态', '深度评测', '活动预告'];
const ITEMS_PER_PAGE = 10; 

export default function NewsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  // const [activeCategory, setActiveCategory] = useState(newsCategories[0]); // For future filtering

  const totalArticles = MOCK_NEWS_ARTICLES.length;
  const totalPages = Math.ceil(totalArticles / ITEMS_PER_PAGE);
  
  let articlesToDisplay = MOCK_NEWS_ARTICLES; 
  
  const paginatedArticles = articlesToDisplay.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  let topFeaturedArticles: NewsArticle[] = [];
  let gridArticles: NewsArticle[] = [];

  if (currentPage === 1 && paginatedArticles.length > 0) {
    if (paginatedArticles.length >= 2) { // If 2 or more, take first 2 for top row
      topFeaturedArticles = paginatedArticles.slice(0, 2);
      gridArticles = paginatedArticles.slice(2);
    } else { // If only 1, it's a top featured article
      topFeaturedArticles = [paginatedArticles[0]];
      // gridArticles remains empty
    }
  } else { // For pages other than the first, all are grid articles
    gridArticles = paginatedArticles;
  }


  const renderArticleCard = (article: NewsArticle, layoutType: 'top-featured' | 'grid', priorityImage: boolean = false) => {
    const isTopFeatured = layoutType === 'top-featured';

    return (
      <Card
        key={article.id}
        className={cn(
          "flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300",
          isTopFeatured ? "h-full" : "" 
        )}
      >
        <CardHeader className="p-0">
          <Link 
            href={`/news/${article.id}`} 
            className={cn(
              "block relative group",
              isTopFeatured ? "aspect-[16/9]" : "aspect-video"
            )}
          >
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              data-ai-hint={article.dataAiHint || 'news image'}
              sizes={
                isTopFeatured 
                  ? "(max-width: 767px) 100vw, 50vw" // Assuming it might take up to 50% on desktop
                  : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              }
              priority={priorityImage}
            />
          </Link>
        </CardHeader>
        <CardContent className={cn("flex-grow flex flex-col p-4")}>
          <Link href={`/news/${article.id}`} className="block">
            <CardTitle className={cn(
              "font-semibold mb-1.5 hover:text-primary transition-colors",
              isTopFeatured ? "text-xl md:text-2xl line-clamp-2" : "text-lg md:text-xl line-clamp-2"
            )}>{article.title}</CardTitle>
          </Link>
          <CardDescription className={cn(
            "text-muted-foreground flex-grow",
            isTopFeatured ? "text-sm md:text-base line-clamp-3" : "text-sm line-clamp-3"
          )}>{article.excerpt || '暂无摘要'}</CardDescription>
        </CardContent>
        <CardFooter className={cn("border-t mt-auto p-4")}>
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
  };


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

      {topFeaturedArticles.length > 0 && (
        <section className="mb-6 md:mb-8">
          <div className={cn(
            "grid md:gap-6",
            topFeaturedArticles.length === 1 ? "md:grid-cols-1" : "md:grid-cols-2"
          )}>
            {topFeaturedArticles.map((article, index) =>
              renderArticleCard(article, 'top-featured', currentPage === 1 && index === 0)
            )}
          </div>
        </section>
      )}
      
      {gridArticles.length > 0 && (
         <div className={cn(
          "grid grid-cols-1 gap-6",
           "sm:grid-cols-2 md:grid-cols-3" // Standard grid for the rest
        )}>
          {gridArticles.map((article, index) => 
            renderArticleCard(article, 'grid', currentPage === 1 && topFeaturedArticles.length === 0 && index === 0)
          )}
        </div>
      )}

      {paginatedArticles.length === 0 && (
        <p className="text-center text-muted-foreground py-8">暂无资讯。</p>
      )}

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
    </div>
  );
}
