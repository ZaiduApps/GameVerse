
import { MOCK_GAMES } from '@/lib/constants'; // Using for variety, replace with actual news
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, UserCircle, Tag } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  dataAiHint?: string;
  category: string;
  date: string;
  author: string;
  tags?: string[];
}

// Create mock news articles based on MOCK_GAMES for consistent data structure
const mockNewsArticles: NewsArticle[] = MOCK_GAMES.map((game, index) => ({
  id: `news-${game.id}`,
  title: `${game.title} 最新动态与攻略分享`,
  content: `这篇关于《${game.title}》的文章深入探讨了其最新更新、社区热点以及一些高级游戏技巧。\n\n${game.description}\n\n更多详细内容，包括最新的角色介绍、活动预告以及玩家社区的精彩讨论，都将在这里为您呈现。我们致力于提供最全面、最及时的游戏资讯，帮助您更好地享受《${game.title}》带来的乐趣。\n\n敬请期待后续的独家报道和深度评测！`,
  imageUrl: game.imageUrl,
  dataAiHint: game.dataAiHint,
  category: index % 2 === 0 ? '游戏攻略' : '行业新闻',
  date: `2024年${7 - index}月${15 + index}日`,
  author: '游戏宇宙编辑部',
  tags: game.tags ? [...game.tags, (index % 3 === 0 ? '热门' : '深度分析')] : ['资讯'],
}));


export async function generateStaticParams() {
  return mockNewsArticles.map((article) => ({
    id: article.id,
  }));
}

export default function NewsArticlePage({ params }: { params: { id: string } }) {
  const article = mockNewsArticles.find(a => a.id === params.id);

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
                  <Link key={tag} href={`/tags/${tag.toLowerCase()}`}>
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
