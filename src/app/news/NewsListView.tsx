
'use client'; 

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { NewsArticle, ApiArticle } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CalendarDays, UserCircle, Newspaper, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { trackedApiFetch } from '@/lib/api';

const ITEMS_PER_PAGE = 20;

interface ContentNewsItem {
  _id?: string;
  gid?: string;
  title?: string;
  summary?: string;
  content?: string;
  cover?: string;
  publish_at?: string;
  source?: string;
  author_name?: string;
  tags?: string[];
  is_top?: boolean;
  is_recommended?: boolean;
  view_count?: number;
  like_count?: number;
}

function toApiArticle(item: ContentNewsItem): ApiArticle {
  return {
    _id: String(item._id || '').trim(),
    gid: String(item.gid || '').trim() || undefined,
    name: String(item.title || '').trim(),
    summary: String(item.summary || '').trim(),
    content: String(item.content || '').trim(),
    image_cover: String(item.cover || '').trim(),
    release_at: String(item.publish_at || '').trim(),
    source: String(item.source || '').trim(),
    author: String(item.author_name || '').trim(),
    tags: Array.isArray(item.tags) ? item.tags.map((tag) => String(tag || '').trim()).filter(Boolean) : [],
    is_top: Boolean(item.is_top),
    is_recommended: Boolean(item.is_recommended),
    view_counts: Number(item.view_count || 0),
    like_counts: Number(item.like_count || 0),
    addition_links: [],
    status: 1,
    is_deleted: false,
  };
}

function sanitizeImageUrl(input?: string): string {
  const value = String(input || '').trim();
  if (!value) return '';
  if (/example\.com|placehold\.co/i.test(value)) return '';
  return value;
}

interface PaginationState {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

function transformApiArticle(apiArticle: ApiArticle): NewsArticle {
     return {
        id: apiArticle._id || apiArticle.gid || '',
        title: apiArticle.name,
        content: apiArticle.content || '',
        excerpt: apiArticle.summary,
        imageUrl: sanitizeImageUrl(apiArticle.image_cover),
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


interface NewsPageProps {
  initialArticles?: ApiArticle[];
  initialPagination?: PaginationState | null;
  initialSearchTerm?: string;
}

export default function NewsPage({ initialArticles = [], initialPagination = null, initialSearchTerm = '' }: NewsPageProps) {
  const initialMappedArticles = initialArticles.map(transformApiArticle);
  const [articles, setArticles] = useState<NewsArticle[]>(initialMappedArticles);
  const [pagination, setPagination] = useState<PaginationState | null>(initialPagination);
  const [currentPage, setCurrentPage] = useState(initialPagination?.page || 1);
  const [isLoading, setIsLoading] = useState(initialMappedArticles.length === 0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [submittedSearchTerm, setSubmittedSearchTerm] = useState(initialSearchTerm);
  const shouldSkipInitialFetch = useRef(initialMappedArticles.length > 0 && currentPage === 1 && !initialSearchTerm);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const lastAutoLoadAtRef = useRef(0);

  useEffect(() => {
    setSearchTerm(initialSearchTerm);
    setSubmittedSearchTerm(initialSearchTerm);
    setCurrentPage(1);
  }, [initialSearchTerm]);

  const fetchArticles = useCallback(async (page: number, query: string, append: boolean) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    try {
      if (query) {
        const params = new URLSearchParams({
          q: query,
          page: String(page),
          pageSize: String(ITEMS_PER_PAGE),
          post_type: 'news',
          sort: 'latest',
          view: 'card',
        });
        const res = await trackedApiFetch(`/content/feed?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.code === 0 && data.data && Array.isArray(data.data.list)) {
            const transformedArticles = (data.data.list as ContentNewsItem[])
              .map((item) => transformApiArticle(toApiArticle(item)));
            setArticles((prev) => append ? [...prev, ...transformedArticles] : transformedArticles);
            setPagination({
              total: data.data.total || transformedArticles.length,
              page: data.data.page || page,
              pageSize: data.data.pageSize || ITEMS_PER_PAGE,
              totalPages:
                data.data.totalPages ||
                Math.max(1, Math.ceil((data.data.total || 0) / ITEMS_PER_PAGE)),
              hasMore: Boolean(data.data.hasMore),
            });
          } else {
            setArticles([]);
            setPagination(null);
          }
        } else {
          setArticles([]);
          setPagination(null);
        }
      } else {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(ITEMS_PER_PAGE),
        post_type: 'news',
        sort: 'latest',
        view: 'card',
      });
      const res = await trackedApiFetch(`/content/feed?${params.toString()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data?.code === 0 && data?.data && Array.isArray(data.data.list)) {
            const rawArticles = data.data.list as ContentNewsItem[];
            const transformedArticles = rawArticles.map((item) => transformApiArticle(toApiArticle(item)));
            setArticles((prev) => append ? [...prev, ...transformedArticles] : transformedArticles);
            const total = Math.max(Number(data.data.total || transformedArticles.length), transformedArticles.length);
            const pageSize = Math.max(1, Number(data.data.pageSize || ITEMS_PER_PAGE));
            const current = Math.max(1, Number(data.data.page || page));
            const totalPages = Math.max(1, Number(data.data.totalPages || Math.ceil(total / pageSize)));
            setPagination({
              total,
              page: current,
              pageSize,
              totalPages,
              hasMore: typeof data.data.hasMore === 'boolean' ? data.data.hasMore : current < totalPages,
            });
          } else {
            setArticles([]);
            setPagination(null);
          }
        } else {
          setArticles([]);
          setPagination(null);
        }
      }
    } catch (error) {
      console.error("Failed to fetch articles:", error);
      if (!append) {
        setArticles([]);
        setPagination(null);
      }
    } finally {
      if (append) {
        setIsLoadingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (shouldSkipInitialFetch.current && currentPage === 1 && !submittedSearchTerm) {
      shouldSkipInitialFetch.current = false;
      return;
    }
    fetchArticles(currentPage, submittedSearchTerm, currentPage > 1);
  }, [currentPage, submittedSearchTerm, fetchArticles]);

  useEffect(() => {
    if (!loadMoreRef.current) return;
    if (isLoading || isLoadingMore) return;
    if (!pagination?.hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        const now = Date.now();
        if (now - lastAutoLoadAtRef.current < 500) return;
        lastAutoLoadAtRef.current = now;
        setCurrentPage((prev) => {
          const next = prev + 1;
          if (pagination && next > pagination.totalPages) return prev;
          return next;
        });
      },
      { rootMargin: '240px 0px' },
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [isLoading, isLoadingMore, pagination]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setArticles([]);
    setPagination(null);
    setCurrentPage(1); // Reset to first page for new search
    setSubmittedSearchTerm(searchTerm);
  }
  
  const handleLoadMore = () => {
    if (isLoading || isLoadingMore || !pagination?.hasMore) return;
    const nextPage = currentPage + 1;
    if (pagination && nextPage > pagination.totalPages) return;
    setCurrentPage(nextPage);
  };

  const renderArticleCard = (article: NewsArticle, priorityImage: boolean = false) => {
    const articleLink = article.id ? `/community/post/${article.id}` : '/community';
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
               src={article.imageUrl || '/favicon.ico'}
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
            <CardTitle className="mb-1.5 line-clamp-2 text-base font-semibold hover:text-primary transition-colors md:text-lg">{article.title}</CardTitle>
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
          <Newspaper className="mr-3 h-7 w-7 text-primary" />
          <h2 className="text-xl font-bold text-primary">社区动态</h2>
        </div>
        <p className="text-muted-foreground">获取最新社区帖子、更新与深度讨论内容。</p>
      </section>

      <section>
        <form onSubmit={handleSearch} className="flex items-center gap-2 mb-8">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                    type="search" 
                    aria-label="搜索文章标题或摘要"
                    placeholder="搜索文章标题或摘要..." 
                    className="h-10 pl-10 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Button type="submit" size="default" className="h-10 btn-interactive">搜索</Button>
        </form>
      </section>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      ) : articles.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {articles.map((article, index) => 
              renderArticleCard(article, index < 4)
            )}
          </div>

          {pagination ? (
            <div className="mt-10 flex flex-col items-center gap-3">
              <span className="text-sm text-muted-foreground">
                已加载 {articles.length} / {pagination.total} 条
              </span>
              {pagination.hasMore ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="btn-interactive"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      加载中...
                    </>
                  ) : '加载更多'}
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">已显示全部资讯</span>
              )}
              <div ref={loadMoreRef} className="h-2 w-full" />
            </div>
          ) : null}
        </>
      ) : (
            <p className="text-center text-muted-foreground py-8">没有找到相关社区帖子。</p>
      )}
    </div>
  );
}

