
import { MOCK_NEWS_ARTICLES } from '@/lib/constants';
import type { NewsArticle, ApiArticle } from '@/types';
import NewsArticleView from './NewsArticleView';
import { notFound } from 'next/navigation';


async function getNewsArticle(id: string): Promise<NewsArticle | null> {
    try {
        const res = await fetch(`https://api.us.apks.cc/news/details?param=${id}`, { 
          method: 'POST', // The user specified POST, but details are usually GET. Using POST as requested for the details. Let's assume the API expects a POST for details.
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: id }),
          cache: 'no-store' 
        });

        if (!res.ok) {
           console.error(`Failed to fetch news article, status: ${res.status}`);
           return null;
        }
        
        const json = await res.json();
        
        // The user's example response has the article inside a `list` array
        if (json.code !== 0 || !json.data || !json.data.list || json.data.list.length === 0) {
            // Let's try to see if the data is directly in `data` for a details endpoint
            if (json.code === 0 && json.data) {
                 const apiArticle: ApiArticle = json.data;
                 return transformApiArticle(apiArticle);
            }
            console.error('API response for news article is invalid:', json);
            return null;
        }
        
        const apiArticle: ApiArticle = json.data.list[0];
        return transformApiArticle(apiArticle);

    } catch (error) {
        console.error("Failed to fetch news article:", error);
        return null;
    }
}

function transformApiArticle(apiArticle: ApiArticle): NewsArticle {
     return {
        id: apiArticle.gid || apiArticle._id,
        title: apiArticle.name,
        content: apiArticle.content || '',
        excerpt: apiArticle.summary,
        imageUrl: apiArticle.image_cover,
        category: apiArticle.tags?.[0] || '资讯',
        date: new Date(apiArticle.release_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
        author: apiArticle.author || '匿名',
        tags: apiArticle.tags,
        isTop: apiArticle.is_top,
        isRecommended: apiArticle.is_recommended,
        viewCount: apiArticle.view_counts,
        likeCount: apiArticle.like_counts,
        additionLinks: apiArticle.addition_links,
    };
}


// This default export is for a Server Component page
export default async function NewsArticlePage({ params }: { params: { id: string } }) {
  const { id } = params;

  if (!id) {
    notFound();
  }

  // Fetch the live data
  const liveArticle = await getNewsArticle(id);

  // Fallback to mock data if API fails
  const article = liveArticle || MOCK_NEWS_ARTICLES.find(a => a.id === id);

  if (!article) {
    notFound();
  }

  // Pass the server-fetched article data to the Client Component
  return <NewsArticleView article={article as NewsArticle} />;
}
