
'use client'; 

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { NewsArticle, ApiArticle } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CalendarDays, UserCircle, Newspaper, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';

const ITEMS_PER_PAGE = 20;

interface PaginationState {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

function transformApiArticle(apiArticle: ApiArticle): NewsArticle {
     return {
        id: apiArticle.gid || apiArticle._id,
        title: apiArticle.name,
        content: apiArticle.content || '',
        excerpt: apiArticle.summary,
        imageUrl: apiArticle.image_cover,
        category: apiArticle.tags?.[0] || '资讯',
        date: apiArticle.release_at ? new Date(apiArticle.release_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : '未知日期',
        author: apiArticle.author || '匿名',
        tags: apiArticle.tags,
        isTop: apiArticle.is_top,
        isRecommended: apiArticle.is_recommended,
        viewCount: apiArticle.view_counts,
        likeCount: apiArticle.like_counts,
        additionLinks: apiArticle.addition_links,
        dataAiHint: `news article ${apiArticle.name}`,
    };
}


export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState('');

  const fetchArticles = useCallback(async (page: number, query: string) => {
    setIsLoading(true);
    try {
      let res;
      let url = '';
      const options: RequestInit = {};

      if (query) {
        // Use the search endpoint when a query is present
        url = `/api/news/search?q=${encodeURIComponent(query)}&page=${page}&pageSize=${ITEMS_PER_PAGE}`;
      } else {
        // Use the list endpoint for general browsing
        url = `/api/news/list`;
        options.method = 'POST';
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify({
          page: page,
          pageSize: ITEMS_PER_PAGE,
        });
      }
      
      res = await fetch(url, options);

      if (res.ok) {
        const data = await res.json();
        if (data.code === 0 && data.data) {
          const transformedArticles = data.data.list.map(transformApiArticle);
          setArticles(transformedArticles);
          setPagination(data.data.pagination);
        } else {
          setArticles([]);
          setPagination(null);
        }
      } else {
        setArticles([]);
        setPagination(null);
      }
    } catch (error) {
      console.error("Failed to fetch articles:", error);
      setArticles([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles(currentPage, submittedSearchTerm);
  }, [currentPage, submittedSearchTerm, fetchArticles]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page for new search
    setSubmittedSearchTerm(searchTerm);
  }
  
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && (!pagination || newPage <= pagination.totalPages)) {
      setCurrentPage(newPage);
      window.scrollTo(0, 0); // Scroll to top on page change
    }
  };

  const renderArticleCard = (article: NewsArticle, priorityImage: boolean = false) => {
    // Ensure gid is used for the link
    const articleLink = `/news/${article.id}`;
    return (
      <Card
        key={article.id}
        className="flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300"
      >
        <CardHeader className="p-0">
          <Link 
            href={articleLink}
            className="block relative group aspect-video"
          >
            <Image
              src={article.imageUrl || 'https://placehold.co/600x400.png'} // Fallback image
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              data-ai-hint={article.dataAiHint || 'news image'}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={priorityImage}
            />
          </Link>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col p-4">
          <Link href={articleLink} className="block">
            <CardTitle className="font-semibold mb-1.5 hover:text-primary transition-colors text-lg md:text-xl line-clamp-2">{article.title}</CardTitle>
          </Link>
          <CardDescription className="text-muted-foreground flex-grow text-sm line-clamp-3">{article.excerpt || '暂无摘要'}</CardDescription>
        </CardContent>
        <CardFooter className="border-t mt-auto p-4">
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
        <form onSubmit={handleSearch} className="flex items-center gap-2 mb-8">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                    type="search" 
                    placeholder="搜索文章标题或摘要..." 
                    className="pl-10 h-11 text-base"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Button type="submit" size="lg" className="h-11 btn-interactive">搜索</Button>
        </form>
      </section>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
      ) : articles.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {articles.map((article, index) => 
              renderArticleCard(article, index < 4)
            )}
          </div>

          {pagination && pagination.totalPages > 1 && (
             <div className="flex justify-center items-center space-x-2 mt-10">
               <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn-interactive"
               >
                 上一页
               </Button>
               <span className="text-sm text-muted-foreground">
                 第 {currentPage} 页 / 共 {pagination.totalPages} 页
               </span>
               <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages || !pagination.hasMore}
                className="btn-interactive"
               >
                 下一页
               </Button>
             </div>
          )}
        </>
      ) : (
        <p className="text-center text-muted-foreground py-8">没有找到相关资讯。</p>
      )}
    </div>
  );
}
