
import { MOCK_NEWS_ARTICLES } from '@/lib/constants';
import type { NewsArticle } from '@/types';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card'; // Removed CardTitle as it's not used
import { CalendarDays, UserCircle, Tag } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

export async function generateStaticParams() {
  // Generate params from the global list of news articles
  return MOCK_NEWS_ARTICLES.map((article) => ({
    id: article.id,
  }));
}

export default function NewsArticlePage({ params }: { params: { id: string } }) {
  // Find the article from the global list
  const article = MOCK_NEWS_ARTICLES.find(a => a.id === params.id);

  if (!article) {
    return <div className="text-center py-10">文章未找到</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 fade-in">
      <Card className="overflow-hidden shadow-xl">
        <CardHeader className="p-0 relative aspect-video">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            priority
            className="object-cover"
            data-ai-hint={article.dataAiHint}
            sizes="(max-width: 768px) 100vw, 800px"
          />
           <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <Badge variant="outline" className="mb-3">{article.category}</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{article.title}</h1>
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground mb-6">
            <div className="flex items-center">
              <CalendarDays size={16} className="mr-1.5" />
              <span>发布于 {article.date}</span>
            </div>
            <div className="flex items-center">
              <UserCircle size={16} className="mr-1.5" />
              <span>作者：{article.author}</span>
            </div>
          </div>

          <Separator className="my-6" />

          <article className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none text-foreground/90 leading-relaxed whitespace-pre-line">
            {article.content.split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </article>
          
          {article.tags && article.tags.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center">
                <Tag size={16} className="mr-2" />
                相关标签:
              </h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map(tag => (
                  <Link key={tag} href={`/news?tag=${encodeURIComponent(tag.toLowerCase())}`}>
                    <Badge variant="secondary" className="hover:bg-primary/20 transition-colors cursor-pointer">{tag}</Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
