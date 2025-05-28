
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
const ITEMS_PER_PAGE = 10; // Adjusted to 10 to have more items for layout demo

export default function NewsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  // const [activeCategory, setActiveCategory] = useState(newsCategories[0]); // For future filtering

  const totalArticles = MOCK_NEWS_ARTICLES.length;
  const totalPages = Math.ceil(totalArticles / ITEMS_PER_PAGE);

  const articlesToDisplay = MOCK_NEWS_ARTICLES.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const isFirstPage = currentPage === 1;
  let prominentArticle: NewsArticle | null = null;
  let rightStackedArticles: NewsArticle[] = [];
  let gridArticles: NewsArticle[] = [...articlesToDisplay];

  if (isFirstPage && articlesToDisplay.length > 0) {
    prominentArticle = articlesToDisplay[0];
    if (articlesToDisplay.length >= 2) { // Need at least 2 for the right column to potentially have something
        rightStackedArticles = articlesToDisplay.slice(1, 3).filter(Boolean); // Take up to 2 articles for the right, ensure they exist
        gridArticles = articlesToDisplay.slice(1 + rightStackedArticles.length);
    } else { // Only 1 article on the first page
        gridArticles = [];
    }
  }


  const renderArticleCard = (article: NewsArticle, type: 'prominent' | 'stacked' | 'grid', priorityImage: boolean = false) => {
    const isProminent = type === 'prominent';
    const isStacked = type === 'stacked';

    return (
      <Card
        key={article.id}
        className={cn(
          "flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300",
          isProminent ? "h-full" : (isStacked ? "flex-1" : "") // flex-1 for stacked, h-full for prominent
        )}
      >
        <CardHeader className="p-0">
          <Link 
            href={`/news/${article.id}`} 
            className={cn(
              "block relative",
              isProminent ? "aspect-[16/8] sm:aspect-[16/7.5]" : "aspect-video"
            )}
          >
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover"
              data-ai-hint={article.dataAiHint || 'news image'}
              sizes={
                isProminent 
                  ? "(max-width: 767px) 100vw, (max-width: 1023px) 66vw, 800px" 
                  : isStacked
                  ? "(max-width: 767px) 100vw, (max-width: 1023px) 33vw, 300px"
                  : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              }
              priority={priorityImage}
            />
          </Link>
        </CardHeader>
        <CardContent className={cn("flex-grow", isStacked ? "p-3" : "p-4")}>
          <Badge variant="secondary" className="mb-2">{article.category}</Badge>
          <Link href={`/news/${article.id}`}>
            <CardTitle className={cn(
              "font-semibold mb-2 hover:text-primary transition-colors",
              isProminent ? "text-xl md:text-2xl line-clamp-3" : (isStacked ? "text-base line-clamp-2" : "text-lg md:text-xl line-clamp-2")
            )}>{article.title}</CardTitle>
          </Link>
          <CardDescription className={cn(
            "text-muted-foreground",
            isProminent ? "text-sm md:text-base line-clamp-3 sm:line-clamp-4" : (isStacked ? "text-xs line-clamp-3" : "text-sm line-clamp-3")
          )}>{article.excerpt || '暂无摘要'}</CardDescription>
        </CardContent>
        <CardFooter className={cn("border-t mt-auto", isStacked ? "p-3 text-xs" : "p-4")}>
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
              variant={index === 0 ? "default" : "outline"} // Example active state for "全部"
              className="btn-interactive"
              onClick={() => alert(`切换到 ${category} 分类 (模拟)`)}
            >
              {category}
            </Button>
          ))}
        </div>
      </section>

      {/* Special layout for the first page, prominent article and right stacked articles */}
      {isFirstPage && prominentArticle && (
        <section className="mb-6 md:mb-8">
          {/* Desktop layout */}
          <div className="hidden md:flex md:gap-4">
            <div className="md:w-2/3 lg:w-[60%]"> {/* Prominent article takes more space */}
              {renderArticleCard(prominentArticle, 'prominent', true)}
            </div>
            {rightStackedArticles.length > 0 && (
              <div className="md:w-1/3 lg:w-[40%] flex flex-col gap-4"> {/* Reduced gap between stacked cards */}
                {rightStackedArticles.map(article => renderArticleCard(article, 'stacked'))}
              </div>
            )}
          </div>
          {/* Mobile layout: Prominent article first, then others will be handled by the gridArticles section */}
          <div className="md:hidden">
            {renderArticleCard(prominentArticle, 'prominent', true)}
          </div>
        </section>
      )}
      
      {/* Regular grid for remaining articles */}
      {gridArticles.length > 0 && (
        <div className={cn(
          "grid grid-cols-1 gap-6",
          (isFirstPage && prominentArticle) ? "sm:grid-cols-2 lg:grid-cols-3 mt-6 md:mt-0" : "sm:grid-cols-2 md:grid-cols-3" 
          // Adjust grid if special layout was rendered
        )}>
          {gridArticles.map((article, index) => 
            renderArticleCard(article, 'grid', isFirstPage && !prominentArticle && index === 0)
          )}
        </div>
      )}

      {articlesToDisplay.length === 0 && !prominentArticle && (
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

