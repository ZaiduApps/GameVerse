'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Flame, Hash, ScrollText, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MOCK_COMMUNITY_POSTS } from '@/lib/constants';
import type { CommunityTopicItem } from '@/lib/community-api';
import type { CommunityPost } from '@/types';

interface CommunityInfoPanelProps {
  posts?: CommunityPost[];
  searchValue?: string;
  topics?: CommunityTopicItem[];
}

export default function CommunityInfoPanel({ posts, searchValue = '', topics = [] }: CommunityInfoPanelProps) {
  const [keyword, setKeyword] = useState(searchValue);
  const source = posts && posts.length > 0 ? posts : MOCK_COMMUNITY_POSTS;
  const hotPosts: CommunityPost[] = [...source]
    .sort((a, b) => Number(b.likesCount || 0) - Number(a.likesCount || 0))
    .slice(0, 5);

  return (
    <Card className="sticky top-24 shadow-sm">
      <CardHeader className="px-4 pb-2 pt-4">
        <CardTitle className="flex items-center text-sm font-semibold">
          <Search size={16} className="mr-2 text-primary" />
          搜一搜
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const q = keyword.trim();
            window.location.href = q ? `/community?q=${encodeURIComponent(q)}` : '/community';
          }}
        >
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="搜帖子、链接、话题"
            className="h-9"
          />
          <Button type="submit" size="sm" className="h-9 px-3" aria-label="搜索社区">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>

      {topics.length > 0 ? (
        <>
          <CardHeader className="border-t px-4 pb-2 pt-4">
            <CardTitle className="flex items-center text-sm font-semibold">
              <Hash size={16} className="mr-2 text-primary" />
              热门话题
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 px-4 pb-4">
            {topics.slice(0, 12).map((topic) => (
              <Link
                key={topic._id || topic.name}
                href={`/community?topicName=${encodeURIComponent(topic.name || topic.slug || topic._id)}`}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60"
              >
                <span className="min-w-0 truncate text-primary">#{topic.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {Number(topic.post_count || topic.heat_score || 0)}
                </span>
              </Link>
            ))}
          </CardContent>
        </>
      ) : null}

      <CardHeader className="border-t px-4 pb-2 pt-4">
        <CardTitle className="flex items-center text-sm font-semibold">
          <Flame size={16} className="mr-2 text-red-500" />
          热门帖子
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-4 text-xs">
        {hotPosts.length > 0 ? (
          <ul className="space-y-1.5">
            {hotPosts.map((post, index) => (
              <li key={post.id}>
                <Link
                  href={`/community/post/${post.id}`}
                  className="flex gap-2 rounded-md px-2 py-1.5 text-foreground hover:bg-muted/60 hover:text-primary"
                  title={post.title || post.content.substring(0, 50)}
                >
                  <span
                    className={
                      index === 0
                        ? 'font-semibold text-red-500'
                        : index === 1
                          ? 'font-semibold text-orange-500'
                          : index === 2
                            ? 'font-semibold text-yellow-500'
                            : 'font-semibold text-muted-foreground'
                    }
                  >
                    {index + 1}
                  </span>
                  <span className="line-clamp-2">
                    {post.title || post.content.substring(0, 44) + (post.content.length > 44 ? '...' : '')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">暂无热门帖子</p>
        )}
      </CardContent>

      <CardHeader className="border-t px-4 pb-3 pt-4">
        <CardTitle className="flex items-center text-sm font-semibold">
          <ScrollText size={16} className="mr-2 text-primary" />
          社区发布规范
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-4 text-xs text-muted-foreground">
        <p>1. 文明发言，尊重不同游戏体验。</p>
        <p>2. 反馈问题时补充机型、版本和复现步骤。</p>
        <p>3. 分享外链时说明来源和用途。</p>
      </CardContent>
    </Card>
  );
}
