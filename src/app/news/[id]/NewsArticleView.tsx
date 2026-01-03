
'use client';

import type { NewsArticle } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, UserCircle, Tag, ThumbsUp, Eye, Share2, MessageCircle as CommentIcon, Link as LinkIcon, ArrowLeft, Star } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Separator } from '@/components/ui/separator';

const renderMarkdown = (text: string) => {
    if (!text) return { __html: '' };

    let html = text
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold my-3">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold my-4 border-b pb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold my-5 border-b pb-3">$1</h1>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img alt="$1" src="$2" class="rounded-lg my-4" />')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/```bash\n([\s\S]*?)```/gim, '<pre class="bg-muted p-3 rounded-md text-sm my-4 overflow-x-auto"><code class="language-bash">$1</code></pre>')
      .replace(/```([\s\S]*?)```/gim, '<pre class="bg-muted p-3 rounded-md text-sm my-4 overflow-x-auto"><code>$1</code></pre>')
      .replace(/`([^`]+)`/gim, '<code class="bg-muted px-1.5 py-1 rounded-sm text-sm">$1</code>')
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground">$1</blockquote>')
      .replace(/^---$/gim, '<hr class="my-6" />');

    // Process tables
    html = html.replace(/\|(.+)\|\n\|( *[-:]+ *\|)+([\s\S]*?)(?=\n\n|^\s*$)/g, (match, header, _, rows) => {
        const headers = header.split('|').map(h => h.trim()).filter(Boolean);
        let tableHtml = '<div class="overflow-x-auto my-4"><table class="w-full text-left border-collapse"><thead><tr>';
        headers.forEach(h => {
            tableHtml += `<th class="border p-2 bg-muted">${h}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';

        const rowLines = rows.trim().split('\n');
        rowLines.forEach(rowLine => {
            const cells = rowLine.split('|').map(c => c.trim()).slice(1, -1);
            if(cells.length === headers.length) {
                tableHtml += '<tr>';
                cells.forEach(cell => {
                    tableHtml += `<td class="border p-2">${cell}</td>`;
                });
                tableHtml += '</tr>';
            }
        });

        tableHtml += '</tbody></table></div>';
        return tableHtml;
    });

    const lines = html.split('\n').filter(line => line.trim() !== '');
    let finalHtml = '';
    let inList = false;

    lines.forEach(line => {
        if (line.trim().startsWith('* ')) {
            if (!inList) {
                finalHtml += '<ul class="list-disc list-inside my-2">';
                inList = true;
            }
            finalHtml += `<li>${line.substring(line.indexOf('* ') + 2)}</li>`;
        } else {
            if (inList) {
                finalHtml += '</ul>';
                inList = false;
            }
            // Avoid wrapping already converted HTML blocks in <p> tags
            if (!line.startsWith('<')) {
                finalHtml += `<p>${line}</p>`;
            } else {
                finalHtml += line;
            }
        }
    });

    if (inList) {
        finalHtml += '</ul>';
    }

    return { __html: finalHtml };
};


interface MockComment {
  id: string;
  username: string;
  avatarFallback: string;
  avatarUrl?: string;
  dataAiHint?: string;
  timestamp: string;
  text: string;
}

const initialMockComments: MockComment[] = [
  { id: 'c1', username: '资讯爱好者', avatarFallback: 'ZX', timestamp: '1 小时前', text: '这篇文章分析得很到位，学到了很多！' },
  { id: 'c2', username: '游戏小萌新', avatarFallback: 'XM', avatarUrl: 'https://placehold.co/40x40.png?text=XM', dataAiHint: "avatar user", timestamp: '3 小时前', text: '感谢分享，期待更多此类内容。' },
];

interface NewsArticleViewProps {
  article: NewsArticle;
}

export default function NewsArticleView({ article }: NewsArticleViewProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Use optional chaining and nullish coalescing for counts
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(article.likeCount ?? 0); 
  const [viewCount, setViewCount] = useState(article.viewCount ?? 0); 
  
  const [mockComments, setMockComments] = useState<MockComment[]>(initialMockComments);
  const [newComment, setNewComment] = useState('');
  
  useEffect(() => {
    // Increment view count on client side for immediate feedback, if desired
    // This would typically be an API call
    setViewCount(prev => prev + 1);
  }, [article.id]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prevCount => isLiked ? prevCount - 1 : prevCount + 1);
    toast({
        title: isLiked ? "已取消点赞" : "点赞成功！",
        description: isLiked ? "期待您下一次的点赞。" : "感谢您的支持！",
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "链接已复制",
      description: "快去分享给你的朋友吧！",
    });
  };

  const handleCommentSubmit = () => {
    if (newComment.trim() === '') return;
    const newCommentObj: MockComment = {
      id: `c${mockComments.length + 1}`,
      username: '当前用户',
      avatarFallback: '我',
      avatarUrl: 'https://placehold.co/40x40.png?text=ME',
      dataAiHint: "avatar user",
      timestamp: '刚刚',
      text: newComment,
    };
    setMockComments(prevComments => [newCommentObj, ...prevComments]);
    setNewComment('');
    toast({ title: "评论成功", description: "您的评论已发布。" });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 fade-in py-8">
       <Button variant="outline" size="sm" onClick={() => router.back()} className="self-start btn-interactive">
        <ArrowLeft size={16} className="mr-2" />
        返回
      </Button>

      <Card className="shadow-xl">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="outline">{article.category}</Badge>
              {article.isTop && <Badge variant="destructive" className="animate-pulse">置顶</Badge>}
              {article.isRecommended && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-300/50"><Star size={12} className="mr-1.5" />推荐</Badge>}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{article.title}</h1>
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground mb-3">
            <div className="flex items-center">
              <CalendarDays size={16} className="mr-1.5" />
              <span>发布于 {article.date}</span>
            </div>
            <div className="flex items-center">
              <UserCircle size={16} className="mr-1.5" />
              <span>作者：{article.author}</span>
            </div>
          </div>

          <div className="flex items-center space-x-6 py-3 my-4 border-y">
            <Button variant="ghost" size="sm" onClick={handleLike} className="flex items-center text-muted-foreground hover:text-primary btn-interactive">
              <ThumbsUp size={18} className={`mr-2 ${isLiked ? 'fill-primary text-primary' : ''}`} />
              {likeCount > 0 ? likeCount : '点赞'}
            </Button>
            <div className="flex items-center text-muted-foreground">
              <Eye size={18} className="mr-2" />
              {viewCount > 0 ? `${viewCount} 次浏览` : '正在获取...'}
            </div>
            <Button variant="ghost" size="sm" onClick={handleShare} className="flex items-center text-muted-foreground hover:text-primary btn-interactive ml-auto">
              <Share2 size={18} className="mr-2" />
              分享
            </Button>
          </div>

          <article 
             className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none text-foreground/90 leading-relaxed"
             dangerouslySetInnerHTML={renderMarkdown(article.content)}
          />
          
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
      
      {article.additionLinks && article.additionLinks.length > 0 && (
        <Card className="shadow-lg">
           <CardHeader>
             <CardTitle className="flex items-center text-lg">
               <LinkIcon size={20} className="mr-2 text-primary" />
                快捷入口
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-2">
             {article.additionLinks.map((link, index) => (
               <Button key={index} variant="outline" asChild className="w-full justify-start btn-interactive">
                 <a href={link} target="_blank" rel="noopener noreferrer">
                   <LinkIcon size={16} className="mr-2 text-muted-foreground" /> {link}
                 </a>
               </Button>
             ))}
           </CardContent>
        </Card>
      )}


      {/* Comments Section */}
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CommentIcon size={24} className="mr-2 text-primary" />
            玩家评论 ({mockComments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Comment Input Area */}
          <div className="flex items-start space-x-3">
            <Avatar className="mt-1">
              <AvatarImage src="https://placehold.co/40x40.png?text=ME" alt="当前用户" data-ai-hint="avatar user" />
              <AvatarFallback>我</AvatarFallback>
            </Avatar>
            <div className="flex-grow space-y-2">
              <Textarea
                placeholder="发表你的看法..."
                rows={3}
                className="text-sm"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <div className="flex justify-end">
                <Button onClick={handleCommentSubmit} className="btn-interactive">发表评论</Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Display Existing Comments */}
          <div className="space-y-4">
            {mockComments.map((comment) => (
              <Card key={comment.id} className="shadow-sm bg-muted/30 border-0">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Avatar>
                      {comment.avatarUrl ? (
                         <AvatarImage src={comment.avatarUrl} alt={comment.username} data-ai-hint={comment.dataAiHint || "avatar user"} />
                      ) : (
                         <AvatarImage src={`https://placehold.co/40x40.png?text=${comment.avatarFallback}`} alt={comment.username} data-ai-hint="avatar user" />
                      )}
                      <AvatarFallback>{comment.avatarFallback}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-foreground">{comment.username}</span>
                        <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                      </div>
                      <p className="text-sm text-foreground/90 whitespace-pre-line">{comment.text}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {mockComments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">暂无评论，快来发表第一条评论吧！</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
