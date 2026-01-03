
import { MOCK_NEWS_ARTICLES } from '@/lib/constants';
import type { NewsArticle, ApiArticle } from '@/types';
import NewsArticleView from './NewsArticleView';
import { notFound } from 'next/navigation';


async function getNewsArticle(id: string): Promise<NewsArticle | null> {
    try {
        const res = await fetch(`https://api.us.apks.cc/news/details?param=${id}`, { cache: 'no-store' });
        if (!res.ok) return null;
        const json = await res.json();
        if (json.code !== 0 || !json.data) return null;
        
        const apiArticle: ApiArticle = json.data;

        return {
            id: apiArticle.gid || apiArticle._id,
            title: apiArticle.name,
            content: apiArticle.content || '',
            excerpt: apiArticle.summary,
            imageUrl: apiArticle.image_cover,
            category: apiArticle.tags?.[0] || '资讯',
            date: new Date(apiArticle.release_at).toLocaleDateString('zh-CN'),
            author: apiArticle.author || '匿名',
            tags: apiArticle.tags,
        };
    } catch (error) {
        console.error("Failed to fetch news article:", error);
        return null;
    }
}


// This default export is for a Server Component page
export default async function NewsArticlePage({ params }: { params: { id: string } }) {
  const { id } = params;

  if (!id) {
    notFound();
  }

  // First, try finding a mock article if you want to keep them as fallbacks
  const mockArticle = MOCK_NEWS_ARTICLES.find(a => a.id === id);

  // Then, fetch the live data
  const liveArticle = await getNewsArticle(id);

  const article = liveArticle || mockArticle;

  if (!article) {
    notFound();
  }

  // Pass the server-fetched article data to the Client Component
  return <NewsArticleView article={article as NewsArticle} />;
}
