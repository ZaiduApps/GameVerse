import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollText, Flame } from 'lucide-react';
import Link from 'next/link';
import { MOCK_COMMUNITY_POSTS } from '@/lib/constants';
import type { CommunityPost } from '@/types';

interface CommunityInfoPanelProps {
  posts?: CommunityPost[];
}

export default function CommunityInfoPanel({ posts }: CommunityInfoPanelProps) {
  const source = posts && posts.length > 0 ? posts : MOCK_COMMUNITY_POSTS;
  const hotPosts: CommunityPost[] = [...source].sort((a, b) => b.likesCount - a.likesCount).slice(0, 3);

  return (
    <Card className="sticky top-20 shadow-sm">
      <CardHeader className="px-4 pb-2 pt-3">
        <CardTitle className="flex items-center text-sm font-semibold">
          <Flame size={16} className="mr-2 text-red-500" />
          热门帖子
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 px-4 py-2 text-xs">
        {hotPosts.length > 0 ? (
          <ul className="space-y-1">
            {hotPosts.map((post, index) => (
              <li key={post.id}>
                <Link
                  href={`/community/post/${post.id}`}
                  className="block truncate text-foreground hover:text-primary hover:underline"
                  title={post.title || post.content.substring(0, 50)}
                >
                  <span
                    className={`mr-1 font-semibold ${
                      index === 0
                        ? 'text-red-500'
                        : index === 1
                          ? 'text-orange-500'
                          : index === 2
                            ? 'text-yellow-500'
                            : ''
                    }`}
                  >
                    {index + 1}.
                  </span>
                  {post.title || post.content.substring(0, 30) + (post.content.length > 30 ? '...' : '')}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">暂无热门帖子</p>
        )}
      </CardContent>

      <CardHeader className="mt-2 border-t px-4 pb-3 pt-4">
        <CardTitle className="flex items-center text-base font-semibold">
          <ScrollText size={18} className="mr-2 text-primary" />
          社区发布规范
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-4 text-xs text-muted-foreground">
        <p>1. 请文明发言，禁止辱骂、人身攻击和引战内容。</p>
        <p>2. 严禁发布违法违规、侵权盗版、诈骗引流信息。</p>
        <p>3. 发帖尽量补充关键信息，便于其他玩家快速理解与回复。</p>
        <p>4. 对于资源反馈、问题求助，建议附带机型、版本、复现步骤。</p>
        <p>
          联系我们：
          <a href="mailto:service@apks.cc" className="text-primary hover:underline">
            service@apks.cc
          </a>
        </p>
      </CardContent>
    </Card>
  );
}
