
import { MOCK_NEWS_ARTICLES } from '@/lib/constants';
import type { NewsArticle } from '@/types';
import NewsArticleView from './NewsArticleView';

// generateStaticParams is a server-side function
export async function generateStaticParams() {
  return MOCK_NEWS_ARTICLES.map((article) => ({
    id: article.id,
  }));
}

// This default export is for a Server Component page
export default function NewsArticlePage({ params }: { params: { id: string } }) {
  const article = MOCK_NEWS_ARTICLES.find(a => a.id === params.id);

  if (!article) {
    return <div className="text-center py-10">文章未找到</div>;
  }

  // Pass the server-fetched article data to the Client Component
  return <NewsArticleView article={article as NewsArticle} />;
}
