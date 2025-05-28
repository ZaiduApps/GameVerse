
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollText, Flame } from 'lucide-react'; // Using Flame for hot posts
import Link from 'next/link';
import { MOCK_COMMUNITY_POSTS } from '@/lib/constants';
import type { CommunityPost } from '@/types';

export default function CommunityInfoPanel() {
  const hotPosts: CommunityPost[] = [...MOCK_COMMUNITY_POSTS]
    .sort((a, b) => b.likesCount - a.likesCount)
    .slice(0, 3); // Display top 3 hot posts

  return (
    <Card className="sticky top-20 shadow-sm">
      {/* Hot Posts Section */}
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-semibold flex items-center">
          <Flame size={16} className="mr-2 text-red-500" />
          热门帖子
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-2 text-xs space-y-1.5">
        {hotPosts.length > 0 ? (
          <ul className="space-y-1">
            {hotPosts.map((post, index) => (
              <li key={post.id}>
                <Link 
                  href={`/community/post/${post.id}`} // Updated link
                  className="block text-foreground hover:text-primary hover:underline truncate"
                  title={post.title || post.content.substring(0, 50)}
                >
                  <span className={`font-semibold mr-1 ${index < 3 ? (index === 0 ? 'text-red-500' : index === 1 ? 'text-orange-500' : 'text-yellow-500') : ''}`}>
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

      {/* Existing Rules Section */}
      <CardHeader className="pb-3 pt-4 px-4 border-t mt-2">
        <CardTitle className="text-base font-semibold flex items-center">
          <ScrollText size={18} className="mr-2 text-primary" />
          游戏综合区发帖/讨论规范
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 text-xs text-muted-foreground space-y-2">
        <p>深井是一款提供海量游戏先锋资讯、专业游戏攻略、定制游戏百科/工具、玩家社区一站式游戏服务应用。</p>
        <p>深井隐私政策及儿童个人信息保护规则</p>
        <p>联系我们: <a href="mailto:deepwellgame@163.com" className="text-primary hover:underline">deepwellgame@163.com</a></p>
        <p>网易公司版权所有 ©1997-2024</p>
        <p>浙ICP备15005366号-3</p>
        <p>推荐: UU加速器 UU远程 章鱼云手机</p>
        <p>涉企侵权举报专区: <a href="#" className="text-primary hover:underline">点击举报</a></p>
      </CardContent>
    </Card>
  );
}
